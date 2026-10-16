/* Nghe chép v2.1: ba mức (Easy/Normal/Hard), danh sách câu bên phải, video YouTube thật, chấm từng từ.
 * Quyết định D1–D21 ở docs/ux/UX-REDESIGN-INTERVIEW.md. Chỉ là mockup: tiến độ lưu localStorage, không gọi API. */
'use strict';
const P2_BLOCK = p2Gate('#v-dictation');

/* ── Chấm điểm ─────────────────────────────────────────────── */
const norm = s => s.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9'\s-]/g, ' ').split(/\s+/).filter(Boolean);
function wordClass(tok, disp, idx) {
  if (/^\d+$/.test(tok) || NUMBER_WORDS.has(tok)) return 'number';
  if (idx > 0 && /^[A-Z]/.test(disp) && tok !== 'i' && !tok.startsWith("i'")) return 'proper';
  if (FUNCTION_WORDS.has(tok)) return 'function';
  if (tok.length > 3 && /(ed|ing|s)$/.test(tok)) return 'inflected';
  return 'content';
}
function align(exp, act) {
  const n = exp.length, m = act.length, C = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) C[i][0] = i; for (let j = 0; j <= m; j++) C[0][j] = j;
  const sub = (a, b) => a === b ? 0 : lev(a, b) <= Math.max(1, Math.floor(a.length / 3)) || b.startsWith(a.slice(0, 3)) ? .6 : 1.2;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) C[i][j] = Math.min(C[i - 1][j] + 1, C[i][j - 1] + 1, C[i - 1][j - 1] + sub(exp[i - 1], act[j - 1]));
  const ops = []; let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && C[i][j] === C[i - 1][j - 1] + sub(exp[i - 1], act[j - 1])) { ops.push({ e: i - 1, a: act[j - 1] }); i--; j--; }
    else if (i > 0 && C[i][j] === C[i - 1][j] + 1) { ops.push({ e: i - 1, a: null }); i--; }
    else { ops.push({ e: null, a: act[j - 1] }); j--; }
  }
  return ops.reverse();
}
/* Một từ: đúng / sai chính tả (gần đúng) / nhầm (xa hoặc từ chức năng) / bỏ sót */
function wordOutcome(e, a, cls) {
  if (a == null || a === '') return 'omitted';
  if (a === e) return 'correct';
  const suffixDrop = cls === 'inflected' && e.startsWith(a);
  const close = lev(e, a) <= Math.max(1, Math.floor(e.length / 3));
  return suffixDrop || !close || cls === 'function' ? 'substituted' : 'misspelled';
}
/* Normal / Hard: căn chỉnh cả câu. opened = tập chỉ số từ đã mở (tính là sai) */
function gradeFull(sentence, typed, opened) {
  const disp = sentence.split(/\s+/), exp = disp.map(w => norm(w)[0] || ''), act = norm(typed);
  const tokens = align(exp, act).map(op => {
    if (op.e == null) return { outcome: 'inserted', actual: op.a };
    const e = exp[op.e], cls = wordClass(e, disp[op.e], op.e), base = { idx: op.e, disp: disp[op.e], cls };
    const o = wordOutcome(e, op.a, cls);
    if (opened.has(op.e)) return { ...base, outcome: 'revealed', actual: op.a || undefined };
    return { ...base, outcome: o, actual: o === 'omitted' ? undefined : op.a };
  });
  const correct = tokens.filter(t => t.outcome === 'correct').length, ins = tokens.filter(t => t.outcome === 'inserted').length;
  return { tokens, score: Math.round(100 * correct / (exp.length + ins)) };
}
/* Easy: chỉ chấm các ô trống; từ hiện sẵn giữ nguyên */
function gradeBlanks(sentence, blanks, values, opened) {
  const disp = sentence.split(/\s+/), set = new Set(blanks);
  const tokens = disp.map((d, i) => {
    if (!set.has(i)) return { idx: i, disp: d, outcome: 'given' };
    const e = norm(d)[0] || '', a = norm(values[i] || '')[0] || '', cls = wordClass(e, d, i);
    if (opened.has(i)) return { idx: i, disp: d, cls, outcome: 'revealed', actual: a || undefined };
    const o = wordOutcome(e, a, cls);
    return { idx: i, disp: d, cls, outcome: o, actual: o === 'omitted' ? undefined : a };
  });
  const right = tokens.filter(t => t.outcome === 'correct').length;
  return { tokens, score: Math.round(100 * right / blanks.length) };
}
/* Easy: chọn tối đa 3 từ nội dung làm ô trống (~40% câu), rải đều theo vị trí */
function pickBlanks(sentence) {
  const disp = sentence.split(/\s+/), cand = [];
  disp.forEach((d, i) => { const t = norm(d)[0] || ''; if (t && wordClass(t, d, i) !== 'function') cand.push({ i, len: t.length }); });
  const pool = cand.length ? cand : disp.map((d, i) => ({ i, len: d.length }));
  const want = Math.max(1, Math.min(3, Math.round(disp.length * .4)));
  return pool.sort((a, b) => b.len - a.len).slice(0, want).map(x => x.i).sort((a, b) => a - b);
}

const LEVEL_NAME = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
const LEVEL_HELP = { easy: 'Điền các từ còn thiếu', normal: 'Gõ cả câu, ô từ cho biết độ dài', hard: 'Gõ cả câu, không biết số từ' };
const RATES = [.5, .75, 1];
const toneOf = (v) => v >= 80 ? 'good' : v >= 60 ? 'mid' : 'bad';
const maskText = (t) => t.replace(/[A-Za-z0-9']/g, '*');

function dcMain() {
  const slug = qs().get('lesson') || curLesson.dictation, L = lessonOf(slug) || LESSONS[0];
  setCurLesson('dictation', L.slug);
  const sents = sentsOf(L.slug), N = sents.length, yt = YT_LESSONS[L.slug] || null;
  const KEY = 'll2-dict-' + L.slug;
  const SET = Object.assign({ level: 'normal', rate: .75, autoNext: false, vi: true, hideVideo: false }, store.get('ll2-dict-settings', {}));
  if (!RATES.includes(SET.rate)) SET.rate = .75;
  const saved = store.get(KEY, null);
  const S = { i: 0, recs: {}, mode: 'work', replays: 0, typed: '', vals: {}, opened: new Set(), blanks: [], level: SET.level, playing: false, restored: false, fresh: false };
  if (saved && saved.recs) { S.recs = saved.recs; S.i = Math.min(saved.i || 0, N - 1); S.restored = Object.keys(S.recs).length > 0; }
  const persist = () => store.set(KEY, { i: S.i, recs: S.recs });
  const saveSet = () => store.set('ll2-dict-settings', SET);
  const doneCount = () => Object.keys(S.recs).length;
  const ytDur = () => durSec(L.dur) || 60;
  const fmtClock = (x) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${(x % 60).toFixed(1).padStart(4, '0')}`;

  /* ── Phát âm thanh: YouTube thật nếu có, không thì giọng đọc mô phỏng ── */
  let player = null, ytReady = false, ytFail = P2_ST === 'audio', tick = 0, ttsT = 0;
  function loadYT() {
    if (!yt || ytFail) return;
    const make = () => {
      try {
        player = new YT.Player('dYT', { videoId: yt.id, playerVars: { controls: 0, disablekb: 1, rel: 0, playsinline: 1, modestbranding: 1, fs: 0, origin: location.origin },
          events: { onReady: () => { ytReady = true; }, onError: () => { ytFail = true; renderMedia(); } } });
      } catch (_) { ytFail = true; renderMedia(); }
    };
    if (window.YT && YT.Player) { make(); return; }
    window.onYouTubeIframeAPIReady = make;
    const sc = document.createElement('script'); sc.src = 'https://www.youtube.com/iframe_api'; sc.onerror = () => { ytFail = true; renderMedia(); };
    document.head.appendChild(sc);
    setTimeout(() => { if (!ytReady && !ytFail) { ytFail = true; renderMedia(); } }, 9000);
  }
  function setPlaying(on) {
    S.playing = on;
    const b = $('#dPlay'); if (b) { b.classList.toggle('playing', on); b.innerHTML = icon(on ? 'pause' : 'play', 1); refreshIcons(); }
    const m = $('#dMedia'); if (m) m.classList.toggle('is-playing', on);
  }
  function stopPlay() {
    clearInterval(tick); clearTimeout(ttsT);
    if (player && ytReady) { try { player.pauseVideo(); } catch (_) {} }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (S.playing) setPlaying(false);
  }
  function play(k = S.i) {
    const g = sents[k]; if (!g) return;
    if (S.playing) { stopPlay(); return; }
    if (k === S.i && S.mode === 'work') { S.replays++; const r = $('#dReplays'); if (r) r.textContent = S.replays; }
    setPlaying(true);
    if (player && ytReady && !ytFail) {
      try {
        player.setPlaybackRate(SET.rate); player.seekTo(g.s, true); player.playVideo();
        const t0 = performance.now();
        tick = setInterval(() => {
          let t = 0; try { t = player.getCurrentTime(); } catch (_) {}
          const el = $('#dNow'); if (el) el.textContent = fmtClock(t);
          const hd = $('#dHead'); if (hd) hd.style.left = Math.min(100, Math.max(0, t / ytDur() * 100)) + '%';
          if (t >= g.e - .05 || (performance.now() - t0 > 1500 && t < g.s - 1)) stopPlay();
        }, 90);
      } catch (_) { ytFail = true; stopPlay(); renderMedia(); }
      return;
    }
    const ms = g.t.split(/\s+/).length * 420 / SET.rate;
    speak(g.t, { rate: Math.min(1.1, SET.rate + .15), lang: 'en-US' });
    ttsT = setTimeout(() => setPlaying(false), ms);
  }

  /* ── Câu hiện tại ── */
  function begin(k) {
    stopPlay();
    S.i = k; S.replays = 0; S.typed = ''; S.vals = {}; S.opened = new Set();
    S.level = SET.level; S.blanks = S.level === 'easy' ? pickBlanks(sents[k].t) : [];
    S.mode = S.recs[k] ? 'review' : 'work';
    persist(); renderAll();
    if (S.mode === 'work' && SET.autoNext && S.fresh) setTimeout(() => play(), 300);
    S.fresh = false;
  }
  function firstUndoneAfter(k) {
    for (let j = k + 1; j < N; j++) if (!S.recs[j]) return j;
    for (let j = 0; j < k; j++) if (!S.recs[j]) return j;
    return -1;
  }
  function check(force) {
    if (S.mode !== 'work') return;
    const g = sents[S.i];
    let res;
    if (S.level === 'easy') {
      const any = S.blanks.some(i => (S.vals[i] || '').trim()) || S.opened.size;
      if (!any && !force) { toast('Điền ít nhất một từ còn thiếu nhé', null, 'keyboard'); return; }
      res = gradeBlanks(g.t, S.blanks, S.vals, S.opened);
    } else {
      if (!S.typed.trim() && !force && !S.opened.size) { toast('Gõ câu bạn nghe được trước nhé', null, 'keyboard'); return; }
      res = gradeFull(g.t, S.typed, S.opened);
    }
    commit(res, { level: S.level, typed: S.typed, shown: false });
  }
  function showAll() {
    if (S.mode !== 'work') return;
    const g = sents[S.i], disp = g.t.split(/\s+/);
    const tokens = disp.map((d, i) => ({ idx: i, disp: d, cls: wordClass(norm(d)[0] || '', d, i), outcome: 'revealed' }));
    commit({ tokens, score: 0 }, { level: S.level, typed: S.typed, shown: true });
  }
  function commit(res, extra) {
    const counts = {};
    res.tokens.forEach(t => { if (['omitted', 'substituted', 'misspelled'].includes(t.outcome) && t.cls) { const k = t.cls + '_' + t.outcome; counts[k] = (counts[k] || 0) + 1; } });
    S.recs[S.i] = { score: res.score, tokens: res.tokens, counts, ...extra };
    S.mode = 'review'; persist();
    renderWork(); renderList(); renderMedia();
    const card = $('#dWork'); card.classList.remove('ok-hit', 'bad-hit'); void card.offsetWidth;
    if (res.score >= 80) { card.classList.add('ok-hit'); ting(); } else if (res.score < 60) card.classList.add('bad-hit');
    const cur = $('#dListScroll .cur'); if (cur) cur.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  }
  function next() {
    const j = firstUndoneAfter(S.i);
    if (j < 0) { if (doneCount() >= N) finishAll(); return; }
    S.fresh = true; begin(j);
  }
  function prev() { if (S.i > 0) begin(S.i - 1); else toast('Đây là câu đầu tiên', null, 'arrow-up'); }
  function redo() { delete S.recs[S.i]; persist(); S.fresh = false; begin(S.i); }
  function setLevel(lv) {
    if (!LEVEL_NAME[lv] || lv === SET.level) return;
    SET.level = lv; saveSet();
    $$('#dLevel button').forEach(b => { b.classList.toggle('on', b.dataset.lv === lv); b.setAttribute('aria-pressed', b.dataset.lv === lv); }); segMove($('#dLevel'));
    const untouched = S.mode === 'work' && !S.typed.trim() && !S.blanks.some(i => (S.vals[i] || '').trim()) && !S.opened.size;
    if (untouched) { S.level = lv; S.blanks = lv === 'easy' ? pickBlanks(sents[S.i].t) : []; renderWork(); toast(`Mức ${LEVEL_NAME[lv]}`, null, 'sliders-horizontal'); }
    else toast(`Mức ${LEVEL_NAME[lv]} sẽ áp dụng từ câu tiếp theo`, null, 'sliders-horizontal');
  }

  /* ── Giao diện ── */
  const tokHtml = (tokens) => tokens.map((t, k) => {
    const d = `style="animation-delay:${Math.min(k, 24) * 30}ms"`;
    if (t.outcome === 'given') return `<span class="tok given">${esc(t.disp)}</span>`;
    if (t.outcome === 'correct') return `<span class="tok correct" ${d}>${esc(t.disp)}</span>`;
    if (t.outcome === 'inserted') return `<span class="tok inserted" ${d} tabindex="0">${esc(t.actual)}<span class="tip-pop">Thừa từ</span></span>`;
    if (t.outcome === 'revealed') return `<span class="tok revealed" ${d}>${esc(t.disp)}</span>`;
    const label = CAT_NAME[t.cls + '_' + t.outcome] || 'Sai';
    const tip = `<span class="tip-pop">${label}${t.actual ? ` · bạn gõ “${esc(t.actual)}”` : ''}</span>`;
    if (t.outcome === 'substituted') return `<span class="tok substituted" ${d} tabindex="0">${t.actual ? `<s>${esc(t.actual)}</s>` : ''}${esc(t.disp)}${tip}</span>`;
    return `<span class="tok ${t.outcome}" ${d} tabindex="0">${esc(t.disp)}${tip}</span>`;
  }).join(' ');

  function renderMedia() {
    const box = $('#dMedia'), hidden = SET.hideVideo, showVid = yt && !ytFail;
    const tag = showVid ? `${icon('youtube', 1)}YouTube · ${yt.channel}` : `${icon('audio-lines')}Bài nghe`;
    const hello = store.get('ll2-coach-dictation', false) && !store.get('ll2-dict-hello-' + L.slug, false) && P2_ST !== 'audio';
    const keep = $('#dYT') && showVid ? $('#dVideoBox') : null;
    const bar = `<div class="dc-media-bar">
      <span class="tag-glass">${tag}</span>
      <span class="dc-time small"><b id="dNow">${fmtClock(sents[S.i].s)}</b><span class="muted"> / ${fmtT(ytDur())}</span></span>
      <div class="dc-track" role="group" aria-label="Các câu trong bài">${sents.map((g, i) => `<button class="dc-seg${i === S.i ? ' cur' : ''}${S.recs[i] ? ' done' : ''}" style="left:${(g.s / ytDur() * 100).toFixed(2)}%;width:${Math.max(1.2, (g.e - g.s) / ytDur() * 100).toFixed(2)}%" data-go-s="${i}" aria-label="Câu ${i + 1}"${i === S.i ? ' aria-current="true"' : ''}></button>`).join('')}<span class="dc-head-t" id="dHead" style="left:${(sents[S.i].s / ytDur() * 100).toFixed(2)}%"></span></div>
      ${showVid ? `<button class="btn ghost sm" data-act="dcHideVideo" aria-pressed="${hidden}">${icon(hidden ? 'video' : 'ear')}${hidden ? 'Hiện video' : 'Ẩn video'}</button>` : ''}
    </div>`;
    const fail = yt && ytFail ? `<div class="dc-fail" role="status">${icon('video-off')}<div><b>Không tải được video</b><p class="small muted">Bạn vẫn làm bài được: câu sẽ được đọc bằng giọng mô phỏng.</p></div><button class="btn ghost sm" data-act="dcRetryVideo">${icon('rotate-cw')}Tải lại</button></div>` : '';
    if (keep) {   // giữ nguyên iframe đang chạy, chỉ vẽ lại thanh điều khiển
      keep.classList.toggle('off', hidden);
      $('.dc-media-bar', box).outerHTML = bar;
    } else {
      box.innerHTML = `${bar}${showVid ? `<div class="dc-video${hidden ? ' off' : ''}" id="dVideoBox"><div id="dYT"></div></div>` : ''}${fail}`;
      if (showVid && !ytFail) { if (player && ytReady) { try { player.destroy(); } catch (_) {} } player = null; ytReady = false; loadYT(); }
    }
    if (hello) { store.set('ll2-dict-hello-' + L.slug, true); setTimeout(() => notice(`${mascot('hello', 40)}<span>Nghe cả câu rồi gõ lại nhé!</span>`), 500); }
    refreshIcons();
  }

  const slotHtml = () => {
    const disp = sents[S.i].t.split(/\s+/), typed = norm(S.typed);
    return disp.map((d, k) => {
      const w = norm(d)[0] || d, len = w.length, op = S.opened.has(k), tk = typed[k];
      const shown = op ? esc(w) : tk ? esc(tk) : '*'.repeat(len);
      return `<span class="slot-w"><button class="eye${op ? ' on' : ''}" data-eye="${k}" aria-label="Mở từ ${k + 1} (tính là sai)" aria-pressed="${op}" tabindex="-1">${icon(op ? 'eye' : 'eye-off')}</button>
        <span class="slot${op ? ' opened' : tk ? ' typed' : ''}" style="min-width:${Math.max(2.4, len * .62 + 1.2).toFixed(1)}em">${shown}</span></span>`;
    }).join('');
  };
  const clozeHtml = () => {
    const disp = sents[S.i].t.split(/\s+/), set = new Set(S.blanks);
    return disp.map((d, k) => {
      if (!set.has(k)) return `<span class="cw">${esc(d)}</span>`;
      const e = norm(d)[0] || d, op = S.opened.has(k);
      const trail = (d.match(/[^A-Za-z0-9']+$/) || [''])[0], lead = (d.match(/^[^A-Za-z0-9']+/) || [''])[0];
      return `<span class="blank-w">${esc(lead)}<span class="blank-c"><button class="eye${op ? ' on' : ''}" data-eye="${k}" aria-label="Mở từ (tính là sai)" aria-pressed="${op}" tabindex="-1">${icon(op ? 'eye' : 'eye-off')}</button>
        <input class="blank${op ? ' opened' : ''}" data-b="${k}" value="${esc(op ? e : (S.vals[k] || ''))}" ${op ? 'readonly' : ''} style="width:${Math.max(3.2, e.length * .66 + 1.6).toFixed(1)}em" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Từ còn thiếu, ${e.length} chữ cái"></span>${esc(trail)}</span>`;
    }).join(' ');
  };

  function controlsHtml() {
    const lv = S.mode === 'review' ? (S.recs[S.i] || {}).level || S.level : S.level;
    return `<div class="dc-meta"><b>Câu ${S.i + 1}/${N}</b><span class="small muted">Đã nghe <b id="dReplays">${S.replays}</b> lần</span><span class="grow"></span>
      <span class="chip lv-${lv}">${LEVEL_NAME[lv]}</span><span class="small muted dc-help">${LEVEL_HELP[lv]}</span></div>
    <div class="dc-ctrl" role="toolbar" aria-label="Điều khiển phát">
      <button class="btn icon ghost" data-act="dcPrev" aria-label="Câu trước (Alt+←)" ${S.i === 0 ? 'disabled' : ''}>${icon('chevron-left')}</button>
      <button class="btn icon ghost" data-act="dcReplay" aria-label="Phát lại (Ctrl)">${icon('rotate-ccw')}</button>
      <button class="dc-play" id="dPlay" data-act="dcPlay" aria-label="Phát câu (Ctrl)">${icon('play', 1)}</button>
      <button class="btn icon ghost" data-act="dcNextS" aria-label="Câu sau (Alt+→)" ${S.i === N - 1 ? 'disabled' : ''}>${icon('chevron-right')}</button>
      <span class="dc-sep"></span>
      <div class="seg" id="dRate" role="group" aria-label="Tốc độ phát">${RATES.map(r => `<button data-r="${r}" class="${r === SET.rate ? 'on' : ''}" aria-pressed="${r === SET.rate}">${r}×</button>`).join('')}</div>
    </div>`;
  }
  function inputHtml() {
    const lv = S.level;
    let inp;
    if (lv === 'easy') inp = `<div class="dc-cloze" id="dCloze">${clozeHtml()}</div>`;
    else inp = `<label class="sr-only" for="dInput">Câu bạn nghe được</label><textarea id="dInput" class="dc-input" placeholder="Gõ những gì bạn nghe được…" spellcheck="false" rows="3">${esc(S.typed)}</textarea>
      ${lv === 'normal' ? `<div class="dc-slots" id="dSlots">${slotHtml()}</div><p class="small muted dc-slot-note">Mở một từ (biểu tượng mắt) là tính từ đó sai.</p>` : ''}`;
    return `${inp}
      <div class="dc-actions"><span class="small muted"><kbd>Enter</kbd> kiểm tra</span><span class="grow"></span>
        <button class="btn text sm" data-act="dcShowAll">${icon('eye')}Hiện cả câu (0 điểm)</button>
        <button class="btn primary" data-act="dcCheck">Kiểm tra</button></div>`;
  }
  function resultHtml() {
    const rec = S.recs[S.i], g = sents[S.i];
    const [mood, msg] = rec.shown ? ['encourage', 'Không sao, nghe lại rồi làm tiếp nhé.']
      : rec.score >= 80 ? ['happy', 'Tai bạn bắt tốt lắm!'] : rec.score >= 60 ? ['idle', 'Gần đúng rồi. Nghe lại để ý mấy từ tô màu.'] : ['sad', 'Câu này khó thật. Thử tốc độ chậm hơn rồi làm lại nhé.'];
    const chips = Object.entries(rec.counts || {}).map(([k, v]) => `<span class="chip ${OUTCOME_TONE[k.split('_')[1]]}">${CAT_NAME[k]} ×${v}</span>`).join('');
    const perfect = !chips && rec.score === 100;
    const lastUndone = firstUndoneAfter(S.i) < 0;
    return `<div class="dc-result" aria-live="polite">
      <div class="dc-res-top"><div class="dc-score ${toneOf(rec.score)}"><b>${rec.score}</b><span class="small">điểm</span></div>
        <div class="grow col g8"><div class="row w g8"><span class="chip lv-${rec.level}">${LEVEL_NAME[rec.level]}</span>${rec.shown ? '<span class="chip t-warn">Đã hiện cả câu</span>' : ''}</div>
          <div class="diff">${tokHtml(rec.tokens)}</div>
          ${chips ? `<div class="row w">${chips}</div>` : perfect ? `<div><span class="chip t-ok">${icon('check-circle', 1)}Chính xác tuyệt đối!</span></div>` : ''}
          <div class="legend"><span><i class="sw t-ok solid"></i>Đúng</span><span><i class="sw dash"></i>Bỏ sót</span><span><i class="sw t-warn"></i>Nhầm từ</span><span><i class="sw t-info"></i>Sai chính tả</span><span><i class="sw t-acc solid"></i>Thừa</span><span><i class="sw reveal"></i>Đã mở</span></div>
        </div></div>
      <div class="m-say">${mascot(mood, 48, 'react')}<span>${msg}</span></div>
      ${SET.vi && g.vi ? `<details class="small" open><summary class="muted">Dịch nghĩa</summary><p style="margin-top:6px">${esc(g.vi)}</p></details>` : ''}
      <div class="dc-actions"><button class="btn ghost sm" data-act="dcRedo">${icon('rotate-ccw')}Làm lại câu</button>
        <button class="btn ghost sm" data-act="dcReplay">${icon('volume-2')}Nghe lại</button><span class="grow"></span>
        <button class="btn primary" data-act="dcNext">${lastUndone ? `${icon('check')}Hoàn thành` : `Câu tiếp${icon('arrow-right', 'ic arr')}`}</button></div></div>`;
  }
  function renderWork() {
    $('#dWork').innerHTML = controlsHtml() + (S.mode === 'review' ? resultHtml() : inputHtml());
    segMove($('#dRate')); refreshIcons();
    if (S.playing) setPlaying(true);
    if (S.mode === 'work') requestAnimationFrame(focusInput);
  }
  function focusInput() {
    const el = S.level === 'easy' ? $('.blank:not([readonly])') : $('#dInput');
    if (el && S.mode === 'work') el.focus({ preventScroll: true });
  }
  function renderList() {
    const done = doneCount(), pct = Math.round(done / N * 100);
    const items = sents.map((g, i) => {
      const r = S.recs[i], cur = i === S.i, tone = r ? toneOf(r.score) : '';
      const head = `<span class="dl-n">#${i + 1}</span>${r ? `<span class="badge ${tone === 'good' ? 't-ok' : tone === 'mid' ? 't-warn' : 't-bad'}">${r.score}</span><span class="chip lv-${r.level} sm">${LEVEL_NAME[r.level]}</span>` : cur ? '<span class="small dl-doing">Đang làm</span>' : ''}`;
      return `<button class="dl-it${cur ? ' cur' : ''}${r ? ' done' : ''}" data-go-s="${i}"${cur ? ' aria-current="true"' : ''}>
        <span class="dl-head">${head}</span><span class="dl-t">${esc(r ? g.t : maskText(g.t))}</span></button>`;
    }).join('');
    $('#dListCard').innerHTML = `<div class="dl-top"><div class="overline">Bản chép</div><span class="chip">${done}/${N} · ${pct}%</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="dl-scroll" id="dListScroll">${items}</div>
      <div class="dl-foot small muted">${done ? `<button class="btn text sm" data-act="dcReset">${icon('rotate-ccw')}Làm lại cả bài</button>` : ''}
        <span><b style="color:var(--danger)">31%</b> lỗi 30 ngày · hay <b>bỏ sót từ chức năng</b></span></div>`;
    refreshIcons();
  }
  function renderPops() {
    $('#dSetPop').innerHTML = `<div class="dc-pop-h">Cài đặt</div>
      <label class="dc-set"><span><b>Tự phát câu tiếp theo</b><span class="small muted">Tắt: chờ bạn đọc kết quả rồi bấm phát</span></span><input type="checkbox" data-set="autoNext" ${SET.autoNext ? 'checked' : ''}></label>
      <label class="dc-set"><span><b>Hiện bản dịch tiếng Việt</b><span class="small muted">Sau khi chấm, trong mục Dịch nghĩa</span></span><input type="checkbox" data-set="vi" ${SET.vi ? 'checked' : ''}></label>`;
    $('#dKeyPop').innerHTML = `<div class="dc-pop-h">Phím tắt</div>
      ${[['Phát / phát lại', '<kbd>Ctrl</kbd> (nhả ra)'], ['Kiểm tra · câu tiếp', '<kbd>Enter</kbd>'], ['Xuống dòng', '<kbd>Shift</kbd>+<kbd>Enter</kbd>'], ['Câu trước / sau', '<kbd>Alt</kbd>+<kbd>←</kbd> <kbd>→</kbd>'],
        ['Mức Easy / Normal / Hard', '<kbd>Alt</kbd>+<kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd>'], ['Easy: ô kế · ô trước', '<kbd>Space</kbd> · <kbd>Backspace</kbd>']].map(([a, b]) => `<div class="row between small"><span class="muted">${a}</span><span>${b}</span></div>`).join('')}`;
  }
  function renderAll() {
    $('#dOver').textContent = `Nghe chép · ${L.cefr}`;
    renderMedia(); renderWork(); renderList();
  }

  /* ── Hoàn thành bài ── */
  function finishAll() {
    stopPlay();
    const sc = sents.map((_, k) => (S.recs[k] ? S.recs[k].score : 0)), avg = Math.round(sc.reduce((a, b) => a + b, 0) / N);
    const weak = sc.map((v, k) => [k, v]).filter(([, v]) => v < 80);
    const [mood, msg] = avg >= 80 ? ['celebrate', 'Bài này bạn làm rất tốt!'] : avg >= 60 ? ['correct', 'Khá ổn. Làm lại các câu dưới 80 điểm để bài chắc hơn.']
      : ['encourage', 'Bài này đang khó với bạn. Thử mức Easy hoặc tốc độ chậm hơn nhé.'];
    const harder = avg >= 90 && SET.level !== 'hard', nextLv = SET.level === 'easy' ? 'normal' : 'hard';
    $('#dWork').classList.remove('ok-hit', 'bad-hit');
    $('#dWork').innerHTML = `<div class="p2-done" role="status">${mascot(mood, 120)}
      <h2 class="h2">Xong bài “${esc(L.title)}”</h2><p class="muted">${msg}</p>
      <div class="ring" id="dFinRing"></div>
      <div class="stats"><div><b>${N - weak.length}/${N}</b><span class="small muted">câu từ 80 điểm</span></div><div><b>${Math.max(...sc)}</b><span class="small muted">điểm cao nhất</span></div></div>
      ${weak.length ? `<p class="small muted">Nên làm lại: ${weak.map(([k]) => 'câu ' + (k + 1)).join(', ')}</p>` : ''}
      <div class="row w" style="justify-content:center;margin-top:12px">
        ${harder ? `<button class="btn ghost" data-act="dcHarder" data-lv="${nextLv}">${icon('trending-up')}Thử mức ${LEVEL_NAME[nextLv]}</button>` : ''}
        <button class="btn ghost" data-act="dcReset">${icon('rotate-ccw')}Làm lại bài</button>
        <button class="btn ghost" data-act="dcToShadow">${icon('mic')}Luyện Shadowing bài này</button>
        <button class="btn primary" data-act="dcFinish">${icon('check')}Hoàn thành</button></div></div>`;
    ring($('#dFinRing'), avg, { size: 120, stroke: 10, label: 'điểm TB' });
    if (avg >= 80) { ting(); confetti(); }
    refreshIcons();
  }

  /* ── Sự kiện ── */
  const ctrl = { down: false, other: false };
  Object.assign(ACT, {
    dcPlay() { play(); }, dcReplay() { stopPlay(); setTimeout(() => play(), 30); },
    dcPrev: prev, dcNextS() { if (S.i < N - 1) begin(S.i + 1); },
    dcCheck() { check(); }, dcShowAll: showAll, dcNext: next, dcRedo: redo,
    dcHideVideo() { SET.hideVideo = !SET.hideVideo; saveSet(); renderMedia(); },
    dcRetryVideo() { ytFail = false; ytReady = false; player = null; $('#dMedia').innerHTML = ''; renderMedia(); },
    dcPop(btn) {
      const pop = $('#' + btn.dataset.pop), open = pop.hidden;
      $$('.dc-pop').forEach(p => { p.hidden = true; }); $$('.dc-pop-wrap > button').forEach(b => b.setAttribute('aria-expanded', 'false'));
      if (open) { pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
    },
    dcReset() { S.recs = {}; persist(); S.fresh = false; begin(0); },
    dcHarder(btn) { setLevel(btn.dataset.lv); ACT.dcReset(); },
    dcToShadow() { go('shadowing', { lesson: L.slug }); },
    dcFinish() { completeTask('dict'); if (!state.focus) go('lesson', { l: L.slug }); },
  });
  Shell.click((t) => {
    const lv = t.closest('#dLevel button'); if (lv) { setLevel(lv.dataset.lv); return true; }
    const r = t.closest('#dRate button'); if (r) { SET.rate = +r.dataset.r; saveSet(); segPick(r); if (S.playing) stopPlay(); return true; }
    const gs = t.closest('[data-go-s]'); if (gs) { const k = +gs.dataset.goS; if (k !== S.i) begin(k); return true; }
    const eye = t.closest('[data-eye]');
    if (eye && S.mode === 'work') {
      const k = +eye.dataset.eye; S.opened.has(k) ? S.opened.delete(k) : S.opened.add(k);
      if (S.level === 'normal') { $('#dSlots').innerHTML = slotHtml(); refreshIcons(); }
      else { $$('.blank').forEach(b => { if (!b.readOnly) S.vals[b.dataset.b] = b.value; }); renderWork(); }
      setTimeout(focusInput, 0);
      return true;
    }
    if (!t.closest('.dc-pop-wrap')) $$('.dc-pop').forEach(p => { p.hidden = true; });
  });
  document.addEventListener('change', (e) => {
    const c = e.target.closest ? e.target.closest('[data-set]') : null; if (!c) return;
    SET[c.dataset.set] = c.checked; saveSet(); if (c.dataset.set === 'vi' && S.mode === 'review') renderWork();
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'dInput') { S.typed = e.target.value; const s = $('#dSlots'); if (s) { s.innerHTML = slotHtml(); refreshIcons(); } }
    else if (e.target.classList && e.target.classList.contains('blank')) S.vals[e.target.dataset.b] = e.target.value;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Control') { ctrl.down = true; ctrl.other = false; return; }
    if (ctrl.down) ctrl.other = true;
    const typing = ['TEXTAREA', 'INPUT'].includes(document.activeElement && document.activeElement.tagName);
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); prev(); return; }
    if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); if (S.i < N - 1) begin(S.i + 1); return; }
    if (e.altKey && ['1', '2', '3'].includes(e.key)) { e.preventDefault(); setLevel(['easy', 'normal', 'hard'][+e.key - 1]); return; }
    if (e.key === 'Escape') { $$('.dc-pop').forEach(p => { p.hidden = true; }); return; }
    const b = e.target.classList && e.target.classList.contains('blank') ? e.target : null;
    if (b) {
      const all = $$('.blank:not([readonly])'), at = all.indexOf(b);
      if (e.key === ' ') { e.preventDefault(); (all[at + 1] || b).focus(); return; }
      if (e.key === 'Backspace' && !b.value) { e.preventDefault(); (all[at - 1] || b).focus(); return; }
      if (e.key === 'Enter') { e.preventDefault(); check(); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'dInput') { e.preventDefault(); check(); return; }
    if (e.key === 'Enter' && !e.shiftKey && S.mode === 'review' && !typing && !(document.activeElement && document.activeElement.tagName === 'BUTTON')) { e.preventDefault(); next(); }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Control') { if (ctrl.down && !ctrl.other && !$('#dWork .p2-done')) play(); ctrl.down = false; }
  });
  window.addEventListener('beforeunload', () => stopPlay());

  /* ── Khởi động ── */
  $('#dCrumb').dataset.id = L.slug; $('#dCrumb').querySelector('span').textContent = L.title;
  $$('#dLevel button').forEach(b => { b.classList.toggle('on', b.dataset.lv === SET.level); b.setAttribute('aria-pressed', b.dataset.lv === SET.level); });
  renderPops();
  S.level = SET.level; S.blanks = S.level === 'easy' ? pickBlanks(sents[S.i].t) : [];
  S.mode = S.recs[S.i] ? 'review' : 'work';
  renderAll();
  requestAnimationFrame(() => segMove($('#dLevel')));
  $('#dCoach').innerHTML = p2Coach('dictation', 'Lần đầu nghe chép? Ba bước:', ['Bấm ▶ (hoặc nhả phím <kbd>Ctrl</kbd>) và nghe cả câu.', 'Gõ lại những gì nghe được rồi nhấn <kbd>Enter</kbd>. Chọn mức Easy / Normal / Hard ở góc phải.', 'Xem từ nào đúng, thiếu, nhầm; bấm bất kỳ câu nào ở danh sách bên phải để làm hoặc xem lại.']);
  if (S.restored) toast(`Tiếp tục từ câu ${S.i + 1} · đã làm ${doneCount()}/${N}`, null, 'history');
  if (P2_ST === 'audio') { $('#dMedia').insertAdjacentHTML('afterbegin', `<div class="dc-fail" role="alert">${icon('volume-x')}<div><b>Không phát được âm thanh</b><p class="small muted">Trình duyệt đang chặn tiếng hoặc bài chưa tải xong. Bạn vẫn làm bài được bằng cách đọc gợi ý ở ô từ.</p></div><button class="btn ghost sm" data-act="retry">${icon('rotate-cw')}Thử lại</button></div>`); }
}

if (!P2_BLOCK) dcMain();
statePicker([['normal', 'Bình thường'], ['new', 'Người mới'], ['loading', 'Đang tải'], ['error', 'Lỗi máy chủ'], ['network', 'Mất mạng'], ['audio', 'Không phát được tiếng'], ['notfound', 'Không tìm thấy bài']]);
refreshIcons();
