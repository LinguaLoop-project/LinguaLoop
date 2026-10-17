/* Shadowing v2.1: hai tab Xem/Luyện, IPA từng từ, mic 4 trạng thái, điểm mô phỏng theo câu, so sánh giọng.
 * Quyết định S1–S17 ở docs/ux/UX-REDESIGN-INTERVIEW.md. Mockup: điểm do hàm mô phỏng sinh ra (bản thật: Azure Pronunciation Assessment). */
'use strict';
const P2_BLOCK = p2Gate('#v-shadowing');

/* ── IPA (Mỹ, giản lược) cho các từ trong bài mẫu; từ lạ thì thử DICT, không có thì để trống ── */
const IPA_WORDS = {
  'if': 'ɪf', 'things': 'θɪŋz', "don't": 'doʊnt', 'work': 'wɝk', 'out': 'aʊt', 'you': 'ju', 'can': 'kæn', 'always': 'ˈɔlweɪz', 'come': 'kʌm', 'home': 'hoʊm',
  'and': 'ænd', 'back': 'bæk', 'a': 'ə', 'failure': 'ˈfeɪljɚ', 'wow': 'waʊ', 'look': 'lʊk', 'at': 'æt', 'this': 'ðɪs', 'city': 'ˈsɪti', "i'm": 'aɪm', 'kiki': 'ˈkiki',
  'witch': 'wɪtʃ', 'do': 'du', 'think': 'θɪŋk', 'deliver': 'dɪˈlɪvɚ', 'by': 'baɪ', 'tonight': 'təˈnaɪt', 'cool': 'kul', "what's": 'wʌts', 'wrong': 'rɔŋ', 'with': 'wɪð',
  'me': 'mi', 'i': 'aɪ', 'meet': 'mit', 'lot': 'lɑt', 'of': 'əv', 'people': 'ˈpipəl', 'first': 'fɝst', 'everything': 'ˈɛvriθɪŋ', 'seems': 'simz', 'to': 'tu', 'be': 'bi',
  'going': 'ˈgoʊɪŋ', 'okay': 'oʊˈkeɪ', 'but': 'bʌt', 'then': 'ðɛn', 'start': 'stɑrt', 'feeling': 'ˈfilɪŋ', 'like': 'laɪk', 'such': 'sʌtʃ', 'an': 'æn', 'outsider': 'ˌaʊtˈsaɪdɚ',
  'we': 'wi', 'fly': 'flaɪ', 'our': 'aʊr', 'spirit': 'ˈspɪrɪt', 'that': 'ðæt', 'same': 'seɪm', 'is': 'ɪz', 'makes': 'meɪks', 'paint': 'peɪnt', 'your': 'jɔr', 'friend': 'frɛnd',
  'bake': 'beɪk', 'each': 'itʃ', 'need': 'nid', 'find': 'faɪnd', 'own': 'oʊn', 'inspiration': 'ˌɪnspəˈreɪʃən', 'the': 'ðə', 'for': 'fɔr', 'in': 'ɪn', 'it': 'ɪt', 'have': 'hæv',
  "i'd": 'aɪd', 'would': 'wʊd', 'please': 'pliz', 'large': 'lɑrdʒ', 'iced': 'aɪst', 'latte': 'ˈlɑteɪ', 'oat': 'oʊt', 'milk': 'mɪlk', 'get': 'gɛt', 'go': 'goʊ', 'five': 'faɪv',
  'dollars': 'ˈdɑlɚz', 'twenty': 'ˈtwɛnti', 'cents': 'sɛnts', "that'll": 'ðætəl', 'size': 'saɪz', 'name': 'neɪm', 'here': 'hɪr', 'there': 'ðɛr', 'flight': 'flaɪt', 'passport': 'ˈpæspɔrt',
  'third': 'θɝd', 'time': 'taɪm', "i've": 'aɪv', 'been': 'bɪn', 'will': 'wɪl', 'what': 'wʌt', 'seat': 'sit', 'window': 'ˈwɪndoʊ', 'much': 'mʌtʃ', 'how': 'haʊ',
};
const wordKey = (w) => (w.toLowerCase().replace(/[’]/g, "'").match(/[a-z0-9']+/) || [''])[0];
const ipaOf = (w) => { const k = wordKey(w); if (IPA_WORDS[k]) return IPA_WORDS[k]; const d = DICT[k]; return d && d.us ? d.us.replace(/\//g, '') : ''; };
/* Tách âm vị thô từ chuỗi IPA */
function phonemes(ipa) {
  const s = ipa.replace(/[ˈˌ.]/g, ''), out = [], two = ['aɪ', 'aʊ', 'eɪ', 'oʊ', 'ɔɪ', 'tʃ', 'dʒ'];
  for (let i = 0; i < s.length;) {
    const d = s.slice(i, i + 2);
    if (two.includes(d)) { out.push(d); i += 2; continue; }
    let seg = s[i]; i++;
    if (s[i] === 'ː') { seg += 'ː'; i++; }
    out.push(seg);
  }
  return out;
}
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const toneOf = (v) => v >= 80 ? 'good' : v >= 60 ? 'mid' : 'bad';
const SUBS = { 'θ': 't', 'ð': 'd', 'v': '—', 'r': 'w' };

/* Điểm mô phỏng: cố định theo nội dung câu, tăng nhẹ theo số lần đọc */
function simulate(text, attempt) {
  const words = text.split(/\s+/);
  const ws = words.map((w) => {
    const key = wordKey(w), ipa = ipaOf(w);
    let base = 62 + (hash(key + text.length) % 34);
    if (/th/.test(key)) base -= 32;
    if (/v$/.test(key)) base -= 34;
    if (/^r/.test(key)) base -= 6;
    if (FUNCTION_WORDS.has(key)) base += 6;
    base = clamp(base + Math.min(12, (attempt - 1) * 5), 12, 99);
    const ph = phonemes(ipa).map((sym, k) => {
      let sc = clamp(base + (hash(key + k) % 13) - 6, 8, 99), sub = null;
      if ((sym === 'θ' || sym === 'ð') && /th/.test(key)) { sc = clamp(base - 6, 8, 52); sub = SUBS[sym]; }
      else if (sym === 'v' && /v$/.test(key)) { sc = clamp(base + 8, 8, 40); sub = '—'; }
      else if (sym === 'r' && /^r/.test(key) && base < 70) { sc = clamp(base - 2, 8, 60); sub = SUBS.r; }
      return [sym, sc, sc < 60 ? sub : null];
    });
    const avg = ph.length ? Math.round(ph.reduce((a, p) => a + p[1], 0) / ph.length) : base;
    return { w, ipa, score: ph.length ? Math.round((avg + base) / 2) : base, ph };
  });
  const total = Math.round(ws.reduce((a, x) => a + x.score, 0) / ws.length);
  return { total, words: ws, acc: clamp(total - 3, 0, 100), flu: clamp(total + 6 - (hash(text) % 9), 0, 100),
    comp: Math.round(100 * ws.filter(x => x.score >= 30).length / ws.length), pros: clamp(total - 5 + (hash(text + 'p') % 7), 0, 100) };
}

const RATES = [.5, .75, 1];
const maskText = (t) => t.replace(/[A-Za-z0-9']/g, '*');

function shMain() {
  const slug = qs().get('lesson') || curLesson.shadowing, L = lessonOf(slug) || LESSONS[0];
  setCurLesson('shadowing', L.slug);
  const sents = sentsOf(L.slug), N = sents.length, yt = YT_LESSONS[L.slug] || null;
  const KEY = 'll2-sh-' + L.slug;
  const SET = Object.assign({ rate: .75, ipa: true, vi: true, subs: false, hideVideo: false }, store.get('ll2-sh-settings', {}));
  if (!RATES.includes(SET.rate)) SET.rate = .75;
  const saved = store.get(KEY, null);
  const S = { i: 0, recs: {}, tab: 'practice', cur: 0, quota: P2_ST === 'quota' ? 0 : P2_ST === 'new' ? 5 : 3, rec: false, busy: false, playing: false,
    word: null, lastBlob: null, restored: false };
  if (saved && saved.recs) { S.recs = saved.recs; S.i = Math.min(saved.i || 0, N - 1); S.restored = Object.keys(S.recs).length > 0; }
  S.cur = S.i;
  const persist = () => store.set(KEY, { i: S.i, recs: S.recs });
  const saveSet = () => store.set('ll2-sh-settings', SET);
  const doneCount = () => Object.keys(S.recs).length;
  const ytDur = () => durSec(L.dur) || 60;
  const fmtClock = (x) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${(x % 60).toFixed(1).padStart(4, '0')}`;
  const wordsOf = (k) => sents[k].t.split(/\s+/);
  const isFree = () => !document.body.classList.contains('pro');

  /* ── Phát mẫu (YouTube thật hoặc giọng mô phỏng) ── */
  let player = null, ytReady = false, ytFail = P2_ST === 'audio', tick = 0, ttsT = 0, rafId = 0, stream = null, recorder = null, recTimer = 0, mineAudio = null;
  function loadYT() {
    if (!yt || ytFail) return;
    const make = () => {
      try {
        player = new YT.Player('sYT', { videoId: yt.id, playerVars: { controls: 0, disablekb: 1, rel: 0, playsinline: 1, modestbranding: 1, fs: 0, origin: location.origin },
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
    const b = $('#shPlay'); if (b) { b.classList.toggle('playing', on); b.innerHTML = icon(on ? 'pause' : 'play', 1); refreshIcons(); }
    const m = $('#sMedia'); if (m) m.classList.toggle('is-playing', on);
    if (!on) $$('.shw.lit').forEach(e => e.classList.remove('lit'));
  }
  function stopPlay() {
    clearInterval(tick); clearTimeout(ttsT);
    if (player && ytReady) { try { player.pauseVideo(); } catch (_) {} }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (mineAudio) { mineAudio.pause(); mineAudio = null; }
    if (S.playing) setPlaying(false);
  }
  /* Làm sáng từ theo tiến độ câu (xấp xỉ theo độ dài từ) */
  function lightWords(frac) {
    const ws = wordsOf(S.i), tot = ws.reduce((a, w) => a + w.length + 1, 0); let acc = 0, idx = ws.length - 1;
    for (let k = 0; k < ws.length; k++) { acc += (ws[k].length + 1) / tot; if (frac <= acc) { idx = k; break; } }
    $$('.shw').forEach((e, k) => e.classList.toggle('lit', k === idx));
  }
  function playModel(k = S.i, cb) {
    const g = sents[k]; if (!g) return;
    if (S.playing) { stopPlay(); return; }
    setPlaying(true);
    const done = () => { stopPlay(); if (cb) cb(); };
    if (player && ytReady && !ytFail) {
      try {
        player.setPlaybackRate(SET.rate); player.seekTo(g.s, true); player.playVideo();
        const t0 = performance.now();
        tick = setInterval(() => {
          let t = 0; try { t = player.getCurrentTime(); } catch (_) {}
          const el = $('#sNow'); if (el) el.textContent = fmtClock(t);
          const hd = $('#sHead'); if (hd) hd.style.left = clamp(t / ytDur() * 100, 0, 100) + '%';
          lightWords(clamp((t - g.s) / Math.max(.5, g.e - g.s), 0, 1));
          if (t >= g.e - .05 || (performance.now() - t0 > 1500 && t < g.s - 1)) done();
        }, 90);
      } catch (_) { ytFail = true; stopPlay(); renderMedia(); }
      return;
    }
    const ms = g.t.split(/\s+/).length * 420 / SET.rate, t0 = performance.now();
    speak(g.t, { rate: Math.min(1.1, SET.rate + .15), lang: 'en-US' });
    tick = setInterval(() => lightWords(clamp((performance.now() - t0) / ms, 0, 1)), 90);
    ttsT = setTimeout(done, ms);
  }
  /* Tab Xem: phát liền mạch, làm sáng câu đang nói trong danh sách */
  function syncWatchBtn() { const b = $('#shWatchBtn'); if (b) { b.innerHTML = `${icon(S.playing ? 'pause' : 'play', 1)}${S.playing ? 'Dừng' : 'Xem từ câu ' + (S.cur + 1)}`; refreshIcons(); } }
  function watchAll() {
    if (S.playing) { stopPlay(); syncWatchBtn(); return; }
    setPlaying(true);
    if (player && ytReady && !ytFail) {
      try {
        player.setPlaybackRate(1); player.seekTo(sents[S.cur].s, true); player.playVideo();
        tick = setInterval(() => {
          let t = 0; try { t = player.getCurrentTime(); } catch (_) {}
          let k = sents.findIndex(g => t >= g.s && t < g.e); if (k < 0) k = S.cur;
          if (k !== S.cur) { S.cur = k; renderList(); const c = $('#sListScroll .cur'); if (c) c.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); updateWatchCap(); syncWatchBtn(); }
          const el = $('#sNow'); if (el) el.textContent = fmtClock(t);
          const hd = $('#sHead'); if (hd) hd.style.left = clamp(t / ytDur() * 100, 0, 100) + '%';
          if (t >= sents[N - 1].e) { stopPlay(); syncWatchBtn(); }
        }, 120);
      } catch (_) { stopPlay(); }
      syncWatchBtn(); return;
    }
    let k = S.cur;                      // không có video: đọc lần lượt từng câu bằng giọng mô phỏng
    const step = () => {
      if (!S.playing || k >= N) { stopPlay(); syncWatchBtn(); return; }
      S.cur = k; renderList(); updateWatchCap(); syncWatchBtn();
      speak(sents[k].t, { rate: 1, lang: 'en-US' });
      ttsT = setTimeout(() => { k++; step(); }, sents[k].t.split(/\s+/).length * 380 + 500);
    };
    step();
  }
  function updateWatchCap() { const c = $('#sWatchCap'); if (c) c.textContent = sents[S.cur].t; }

  /* ── Ghi âm và chấm (mô phỏng) ── */
  function note(kind) {
    const o = $('#shNote'); if (o) o.remove();
    if (!kind) return;
    const html = kind === 'mic'
      ? `<div class="mic-denied" id="shNote" role="alert">${mascot('encourage', 64)}<div><b>Chưa dùng được micro</b><p class="small muted">Trình duyệt đang chặn quyền micro của LinguaLoop.</p>
          <ol><li>Bấm biểu tượng ổ khoá cạnh địa chỉ trang.</li><li>Chọn “Micro” → “Cho phép”, rồi tải lại trang.</li></ol>
          <div class="row w" style="margin-top:12px"><button class="btn ghost sm" data-act="shMicRetry">${icon('rotate-cw')}Thử lại</button><button class="btn text sm" data-act="shListen">Nghe mẫu trước, ghi âm sau</button></div></div></div>`
      : `<div class="quota-out" id="shNote" role="status">${icon('timer-off')}<div class="grow"><b>Hết 5 lượt chấm hôm nay</b><p class="small muted">Lượt mới mở lại lúc 00:00. Bạn vẫn ghi âm để tự nghe lại và so sánh, chỉ chưa chấm điểm.</p></div><div class="row w g8"><button class="btn ghost sm" data-act="shNextS">Câu tiếp</button><button class="btn primary sm" data-act="togglePro">${icon('crown')}Mở với Pro</button></div></div>`;
    const host = $('#shActions'); if (host) host.insertAdjacentHTML('afterend', html); refreshIcons();
  }
  function setMic(state) {   // idle | rec | busy
    const m = $('#shMic'); if (!m) return;
    m.classList.toggle('rec', state === 'rec'); m.classList.toggle('busy', state === 'busy');
    m.innerHTML = icon(state === 'busy' ? 'loader-circle' : state === 'rec' ? 'square' : 'mic', 1);
    const lb = $('#shMicLb'); if (lb) lb.textContent = state === 'rec' ? 'Đang ghi… bấm để dừng' : state === 'busy' ? 'Đang chấm phát âm…' : (S.recs[S.i] ? 'Đọc lại' : 'Bấm để đọc');
    const wv = $('#shWave'); if (wv) wv.hidden = state !== 'rec';
    refreshIcons();
  }
  async function toggleRec() {
    if (S.tab !== 'practice') return;
    if (S.rec) return stopRec();
    if (S.busy) return;
    note();
    if (P2_ST === 'mic') { note('mic'); return; }
    stopPlay();
    S.rec = true; setMic('rec');
    const color = cssVar('--danger'), levels = [], cv = $('#shWave');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)(), src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
      const buf = new Uint8Array(an.fftSize), chunks = [];
      recorder = new MediaRecorder(stream); recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => { S.lastBlob = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' })); ctx.close(); updateMine(); };
      recorder.start();
      (function loop() { an.getByteTimeDomainData(buf); let sum = 0; for (const v of buf) sum += ((v - 128) / 128) ** 2; levels.push(Math.min(1, Math.sqrt(sum / buf.length) * 5)); if (cv) drawWave(cv, levels, color); rafId = requestAnimationFrame(loop); })();
    } catch (err) {
      if (err && err.name === 'NotAllowedError') { S.rec = false; setMic('idle'); note('mic'); return; }
      recorder = null; let t = 0;   // không có micro: mô phỏng
      (function loop() { t++; levels.push(.15 + Math.abs(Math.sin(t / 7)) * .5 * Math.random() + .1); if (cv) drawWave(cv, levels, color); rafId = requestAnimationFrame(loop); })();
      toast('Không truy cập được micro → đang mô phỏng ghi âm', null, 'microphone-slash');
    }
    const g = sents[S.i], limit = clamp((g.e - g.s) * 2, 4, 20) * 1000;
    recTimer = setTimeout(() => { if (S.rec) stopRec(); }, limit);
  }
  function stopRec() {
    clearTimeout(recTimer); cancelAnimationFrame(rafId);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    if (stream) stream.getTracks().forEach(t => t.stop());
    S.rec = false; S.busy = true; setMic('busy');
    if (isFree() && S.quota <= 0) { S.busy = false; setMic('idle'); note('quota'); return; }
    setTimeout(() => {
      S.busy = false;
      if (isFree()) S.quota--;
      const r = S.recs[S.i] || { best: 0, n: 0 };
      const res = simulate(sents[S.i].t, r.n + 1);
      r.n++; r.last = { total: res.total, acc: res.acc, flu: res.flu, comp: res.comp, pros: res.pros, words: res.words.map(x => ({ w: x.w, ipa: x.ipa, score: x.score, ph: x.ph })) };
      r.best = Math.max(r.best, res.total); S.recs[S.i] = r; S.word = null; persist();
      renderWork(); renderList(); renderMedia();
      const rs = $('.sh-res'); if (rs) rs.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
      const card = $('#sWork'); card.classList.remove('ok-hit', 'bad-hit'); void card.offsetWidth;
      if (res.total >= 80) { card.classList.add('ok-hit'); ting(); } else if (res.total < 60) card.classList.add('bad-hit');
    }, 1000);
  }
  function updateMine() { const b = $('#shMine'); if (b) b.disabled = !S.lastBlob; const c = $('#shCmp'); if (c) c.disabled = !S.lastBlob && !S.recs[S.i]; }
  function playMine(cb) {
    if (S.lastBlob) { mineAudio = new Audio(S.lastBlob); mineAudio.onended = () => { mineAudio = null; if (cb) cb(); }; mineAudio.play(); return; }
    toast('Chưa có bản ghi thật (đang mô phỏng micro)', null, 'microphone-slash'); if (cb) cb();
  }
  function compare() {
    if (!S.recs[S.i] && !S.lastBlob) { toast('Hãy đọc câu này một lần trước nhé', null, 'mic'); return; }
    toast('So sánh: nghe mẫu, rồi đến giọng bạn', null, 'arrow-left-right');
    playModel(S.i, () => setTimeout(() => playMine(), 250));
  }

  /* ── Điều hướng câu / tab ── */
  function begin(k) {
    stopPlay();
    if (S.rec) { clearTimeout(recTimer); cancelAnimationFrame(rafId); if (stream) stream.getTracks().forEach(t => t.stop()); S.rec = false; }
    S.i = k; S.cur = k; S.word = null; S.busy = false; S.lastBlob = null;
    persist(); renderAll();
  }
  function setTab(tab) {
    if (tab === S.tab) return;
    stopPlay(); S.tab = tab;
    if (tab === 'practice') { S.i = S.cur; S.word = null; S.lastBlob = null; }   // S12: luyện ở câu đang phát
    else S.cur = S.i;
    $$('#sTab button').forEach(b => { b.classList.toggle('on', b.dataset.tab === tab); b.setAttribute('aria-pressed', b.dataset.tab === tab); }); segMove($('#sTab'));
    persist(); renderAll();
  }
  const firstUndoneAfter = (k) => { for (let j = k + 1; j < N; j++) if (!S.recs[j]) return j; for (let j = 0; j < k; j++) if (!S.recs[j]) return j; return -1; };
  function next() { const j = firstUndoneAfter(S.i); if (j >= 0) begin(j); else if (S.i < N - 1) begin(S.i + 1); else finishAll(); }

  /* ── Giao diện ── */
  const scoreCls = (v) => `sc-${toneOf(v)}`;
  function renderMedia() {
    const box = $('#sMedia'), hidden = SET.hideVideo, showVid = yt && !ytFail;
    const tag = showVid ? `${icon('youtube', 1)}YouTube · ${yt.channel}` : `${icon('audio-lines')}Bài nghe`;
    const bar = `<div class="dc-media-bar"><span class="tag-glass">${tag}</span>
      <span class="dc-time small"><b id="sNow">${fmtClock(sents[S.cur].s)}</b><span class="muted"> / ${fmtT(ytDur())}</span></span>
      <div class="dc-track" role="group" aria-label="Các câu trong bài">${sents.map((g, i) => `<button class="dc-seg${i === S.cur ? ' cur' : ''}${S.recs[i] ? ' done' : ''}" style="left:${(g.s / ytDur() * 100).toFixed(2)}%;width:${Math.max(1.2, (g.e - g.s) / ytDur() * 100).toFixed(2)}%" data-go-s="${i}" aria-label="Câu ${i + 1}"${i === S.cur ? ' aria-current="true"' : ''}></button>`).join('')}<span class="dc-head-t" id="sHead" style="left:${(sents[S.cur].s / ytDur() * 100).toFixed(2)}%"></span></div>
      ${showVid ? `<button class="btn ghost sm" data-act="shHideVideo" aria-pressed="${hidden}">${icon(hidden ? 'video' : 'ear')}${hidden ? 'Hiện video' : 'Ẩn video'}</button>` : ''}</div>`;
    const fail = yt && ytFail ? `<div class="dc-fail" role="status">${icon('video-off')}<div><b>Không tải được video</b><p class="small muted">Bạn vẫn luyện được: câu mẫu sẽ được đọc bằng giọng mô phỏng.</p></div><button class="btn ghost sm" data-act="shRetryVideo">${icon('rotate-cw')}Tải lại</button></div>` : '';
    const cap = SET.subs && S.tab === 'watch' ? `<p class="sh-cap" id="sWatchCap">${esc(sents[S.cur].t)}</p>` : '';
    const keep = $('#sYT') && showVid ? $('#sVideoBox') : null;
    if (keep) { keep.classList.toggle('off', hidden); $('.dc-media-bar', box).outerHTML = bar; const oc = $('#sWatchCap'); if (oc) oc.remove(); if (cap) box.insertAdjacentHTML('beforeend', cap); }
    else {
      box.innerHTML = `${bar}${showVid ? `<div class="dc-video${hidden ? ' off' : ''}" id="sVideoBox"><div id="sYT"></div></div>` : ''}${fail}${cap}`;
      if (showVid && !ytFail) { if (player && ytReady) { try { player.destroy(); } catch (_) {} } player = null; ytReady = false; loadYT(); }
    }
    refreshIcons();
  }
  function wordsHtml() {
    const rec = S.recs[S.i], last = rec && rec.last;
    return `<div class="shw-row" id="shWords">${wordsOf(S.i).map((w, k) => {
      const sc = last ? last.words[k] : null, ip = ipaOf(w);
      return `<button class="shw${sc ? ' ' + scoreCls(sc.score) : ''}${S.word === k ? ' sel' : ''}" data-wi="${k}" aria-label="${esc(w)}${sc ? ', ' + sc.score + ' điểm' : ''}">
        <span class="w">${esc(w)}</span>${SET.ipa && ip ? `<span class="ipa">/${esc(ip)}/</span>` : ''}</button>`;
    }).join('')}</div>`;
  }
  function wordPopHtml() {
    const rec = S.recs[S.i], wd = rec && rec.last && rec.last.words[S.word]; if (!wd) return '';
    const bad = wd.ph.find(p => p[1] < 60), detail = bad && PH_DETAIL[bad[0]];
    const tip = detail ? detail.tip : wd.score >= 80 ? 'Từ này đọc tốt. Giữ nhịp và trọng âm như câu mẫu.' : 'Nghe lại từ này rồi đọc chậm từng âm, sau đó nối vào câu.';
    const key = wd.w.toLowerCase().replace(/[^a-z']/g, '');
    return `<div class="sh-pop" id="shPop" role="dialog" aria-label="Chi tiết từ ${esc(wd.w)}">
      <div class="row between"><div class="row g8" style="align-items:baseline"><b class="h3">${esc(wd.w)}</b><span class="ipa muted">${wd.ipa ? '/' + esc(wd.ipa) + '/' : ''}</span></div>
        <div class="row g8"><span class="badge ${wd.score >= 80 ? 't-ok' : wd.score >= 60 ? 't-warn' : 't-bad'}">${wd.score}</span><button class="btn icon ghost sm" data-act="shClosePop" aria-label="Đóng">${icon('x')}</button></div></div>
      <div class="phons">${wd.ph.map(([s, v, pr]) => `<div class="phon ${v >= 80 ? 't-ok' : v >= 60 ? 't-warn' : 't-bad'}"><div class="s">${esc(s)}</div><div class="small">${v}${pr ? ' · ' + (pr === '—' ? 'rụng' : 'bạn đọc /' + pr + '/') : ''}</div></div>`).join('')}</div>
      <div class="tipbox">${icon('lightbulb')}<span>${tip}</span></div>
      <div class="row w">${aud(key || wd.w, 'Nghe mẫu từ', { lang: 'en-US' })}<button class="btn ghost sm" data-act="shMineWord">${icon('play')}Giọng tôi</button>
        <button class="save" data-save="${esc(key)}#all" aria-label="Lưu từ">${icon('bookmark', 1)}</button></div>
      ${bad ? `<div class="lockbox free-only" style="max-width:340px"><div class="blur"><div class="video-ph">${icon('play-circle', 1)}</div></div><div class="ov"><span class="badge pro">${icon('crown', 1)}PRO</span><b class="small">Video khẩu hình âm /${esc(bad[0])}/</b><button class="btn primary sm" data-act="togglePro">Mở với Pro</button></div></div>
        <div class="pro-only sh-mouth">${icon('video', 1)}<span class="small">Video khẩu hình âm /${esc(bad[0])}/ (xem thử)</span></div>` : ''}</div>`;
  }
  function resultHtml() {
    const rec = S.recs[S.i], last = rec.last, tone = toneOf(last.total);
    const bad = last.words.filter(w => w.score < 75);
    const counts = {};
    last.words.forEach(w => w.ph.forEach(p => { if (p[1] < 60) { const k = p[2] === '—' ? 'Rụng âm cuối' : p[2] ? 'Thay âm /' + p[0] + '/ bằng âm khác' : 'Âm /' + p[0] + '/ chưa chuẩn'; counts[k] = (counts[k] || 0) + 1; } }));
    const chips = Object.entries(counts).slice(0, 3).map(([k, v]) => `<span class="chip t-bad">${k} ×${v}</span>`).join('');
    // Lời nhắn dựa trên từ tệ nhất, không chỉ điểm trung bình: câu 83 điểm mà có từ 54 thì không được khen "tốt lắm"
    const weak = last.words.filter(w => w.score < 60).sort((a, b) => a.score - b.score);
    const nm = ws => ws.slice(0, 2).map(w => `“${esc(w.w.replace(/[^\w']/g, ''))}”`).join(', ');
    const [mood, msg] = weak.length
      ? (last.total >= 60
        ? ['sad', `Gần được rồi, nhưng ${nm(weak)} còn lệch. Bấm từ tô đỏ để xem âm nào, rồi đọc lại.`]
        : ['sad', `Câu này khó. Nghe mẫu chậm, chú ý ${nm(weak)}, rồi thử lại, không sao đâu.`])
      : bad.length ? ['idle', `Khá ổn, còn ${bad.length} từ chưa chắc: ${nm(bad)}. Đọc thêm một lần nhé.`]
      : last.total >= 80 ? ['happy', 'Phát âm tốt lắm! Sang câu tiếp nhé.']
      : ['idle', 'Khá ổn, đọc thêm một lần để chắc hơn.'];
    const lastOne = firstUndoneAfter(S.i) < 0 && S.i === N - 1;
    return `<div class="sh-res" aria-live="polite">
      <div class="dc-res-top"><div class="dc-score ${tone}"><b>${last.total}</b><span class="small">điểm</span></div>
        <div class="grow col g8"><div class="row w g8"><span class="chip t-info" title="Điểm do hàm mô phỏng sinh ra, chưa phải chấm thật">Điểm mô phỏng</span><span class="chip">Cao nhất ${rec.best}</span><span class="chip">Đã đọc ${rec.n} lần</span></div>
          ${chips ? `<div class="row w">${chips}</div>` : `<div><span class="chip t-ok">${icon('check-circle', 1)}Không có âm nào dưới 60</span></div>`}
          <p class="small muted">Bấm vào từ tô màu để xem âm nào lệch.</p></div></div>
      <div class="m-say">${mascot(mood, 48, 'react')}<span>${msg}</span></div>
      ${wordPopHtml()}
      <div class="dc-actions"><button class="btn ghost sm" data-act="shListen">${icon('volume-2')}Nghe mẫu</button><button class="btn ghost sm" data-act="shDetail">${icon('list-checks')}Xem chi tiết</button>
        <span class="grow"></span><button class="btn primary" data-act="shNext">${lastOne ? icon('check') + 'Hoàn thành' : 'Câu tiếp' + icon('arrow-right', 'ic arr')}</button></div></div>`;
  }
  function controlsHtml() {
    const rec = S.recs[S.i];
    return `<div class="dc-meta"><b>Câu ${S.i + 1}/${N}</b><span class="small muted">${rec ? `Đã đọc ${rec.n} lần` : 'Chưa đọc'}</span><span class="grow"></span>
        ${isFree() ? `<span class="chip ${S.quota <= 0 ? 't-bad' : ''}" id="shQuota" title="Gói Free: 5 lượt chấm mỗi ngày">${icon('zap')}Còn ${S.quota}/5 lượt chấm</span>` : `<span class="chip t-ok">${icon('crown', 1)}Không giới hạn</span>`}</div>
      <div class="dc-ctrl" role="toolbar" aria-label="Điều khiển phát">
        <button class="btn icon ghost" data-act="shPrev" aria-label="Câu trước (Alt+←)" ${S.i === 0 ? 'disabled' : ''}>${icon('chevron-left')}</button>
        <button class="btn icon ghost" data-act="shListen" aria-label="Nghe lại mẫu (Ctrl)">${icon('rotate-ccw')}</button>
        <button class="dc-play" id="shPlay" data-act="shPlay" aria-label="Nghe mẫu (Ctrl)">${icon('play', 1)}</button>
        <button class="btn icon ghost" data-act="shNextS" aria-label="Câu sau (Alt+→)" ${S.i === N - 1 ? 'disabled' : ''}>${icon('chevron-right')}</button>
        <span class="dc-sep"></span>
        <div class="seg" id="sRate" role="group" aria-label="Tốc độ phát">${RATES.map(r => `<button data-r="${r}" class="${r === SET.rate ? 'on' : ''}" aria-pressed="${r === SET.rate}">${r}×</button>`).join('')}</div>
        <span class="grow"></span>
        <div class="sh-actions" id="shActions">
          <button class="btn ghost" id="shMine" data-act="shMine" ${S.lastBlob ? '' : 'disabled'}>${icon('play')}Giọng tôi</button>
          <button class="btn ghost" id="shCmp" data-act="shCompare" ${rec || S.lastBlob ? '' : 'disabled'}>${icon('arrow-left-right')}So sánh</button>
          <div class="sh-micwrap"><button class="mic" id="shMic" data-act="shMic" aria-label="Ghi âm (phím Space)">${icon('mic', 1)}</button><span class="small muted" id="shMicLb">${rec ? 'Đọc lại' : 'Bấm để đọc'}</span></div>
        </div>
      </div>`;
  }
  function practiceHtml() {
    const g = sents[S.i], rec = S.recs[S.i];
    return `${controlsHtml()}
      ${wordsHtml()}
      ${SET.vi && g.vi ? `<p class="small muted sh-vi">${esc(g.vi)}</p>` : ''}
      <canvas class="wave" id="shWave" hidden></canvas>
      ${rec && rec.last ? resultHtml() : ''}`;
  }
  function watchHtml() {
    return `<div class="sh-watch"><div class="dc-meta"><b>Chế độ Xem</b><span class="small muted">Xem cả bài liền mạch; danh sách câu bên phải sáng theo lời nói.</span></div>
      <div class="sh-watch-actions"><button class="btn primary lg" id="shWatchBtn" data-act="shWatch">${icon('play', 1)}Xem từ câu ${S.cur + 1}</button>
        <button class="btn ghost lg" data-act="shToPractice">${icon('mic')}Luyện câu này</button></div>
      ${SET.subs ? '' : '<p class="small muted">Phụ đề đang tắt. Bật trong ⚙ nếu bạn cần.</p>'}</div>`;
  }
  function renderWork() {
    $('#sWork').innerHTML = S.tab === 'watch' ? watchHtml() : practiceHtml();
    if (S.tab === 'practice') { segMove($('#sRate')); setMic(S.rec ? 'rec' : S.busy ? 'busy' : 'idle'); if (S.playing) setPlaying(true); }
    syncSaves(); refreshIcons();
  }
  function renderList() {
    const done = doneCount(), pct = Math.round(done / N * 100), curIdx = S.tab === 'watch' ? S.cur : S.i;
    const items = sents.map((g, i) => {
      const r = S.recs[i], cur = i === curIdx, tone = r ? toneOf(r.best) : '';
      const head = `<span class="dl-n">#${i + 1}</span>${r ? `<span class="badge ${tone === 'good' ? 't-ok' : tone === 'mid' ? 't-warn' : 't-bad'}">${r.best}</span><span class="chip sm">${r.n} lần</span>${r.best >= 80 ? icon('check-circle', 1) : ''}` : cur ? `<span class="small dl-doing">${S.tab === 'watch' ? 'Đang xem' : 'Đang luyện'}</span>` : ''}`;
      const show = r || S.tab === 'watch';
      return `<button class="dl-it${cur ? ' cur' : ''}${r ? ' done' : ''}" data-go-s="${i}"${cur ? ' aria-current="true"' : ''}><span class="dl-head">${head}</span>
        <span class="dl-t">${esc(show ? g.t : maskText(g.t))}</span>${SET.vi && g.vi && show ? `<span class="dl-vi">${esc(g.vi)}</span>` : ''}</button>`;
    }).join('');
    $('#sListCard').innerHTML = `<div class="dl-top"><div class="overline">Bản chép</div><span class="chip">${done}/${N} · ${pct}%</span></div><div class="bar"><i style="width:${pct}%"></i></div>
      <div class="dl-scroll" id="sListScroll">${items}</div>
      <div class="dl-foot small muted">${done ? `<button class="btn text sm" data-act="shReset">${icon('rotate-ccw')}Làm lại cả bài</button>` : ''}<span>Âm hay sai: <b style="color:var(--danger)">/θ/</b> · <b>/v/ cuối từ</b></span></div>`;
    refreshIcons();
  }
  function renderPops() {
    $('#sSetPop').innerHTML = `<div class="dc-pop-h">Cài đặt</div>
      <label class="dc-set"><span><b>Hiện IPA dưới từng từ</b><span class="small muted">Phiên âm Mỹ, giúp biết từ đọc thế nào</span></span><input type="checkbox" data-set="ipa" ${SET.ipa ? 'checked' : ''}></label>
      <label class="dc-set"><span><b>Hiện bản dịch tiếng Việt</b><span class="small muted">Dưới câu và trong danh sách</span></span><input type="checkbox" data-set="vi" ${SET.vi ? 'checked' : ''}></label>
      <label class="dc-set"><span><b>Phụ đề khi xem</b><span class="small muted">Chỉ ở tab Xem; mặc định tắt cho gọn</span></span><input type="checkbox" data-set="subs" ${SET.subs ? 'checked' : ''}></label>`;
    $('#sKeyPop').innerHTML = `<div class="dc-pop-h">Phím tắt</div>
      ${[['Ghi âm / dừng', '<kbd>Space</kbd>'], ['Nghe mẫu', '<kbd>Ctrl</kbd> (nhả ra)'], ['Giọng tôi', '<kbd>R</kbd>'], ['So sánh', '<kbd>C</kbd>'], ['Câu trước / sau', '<kbd>Alt</kbd>+<kbd>←</kbd> <kbd>→</kbd>'], ['Tab Xem / Luyện', '<kbd>Alt</kbd>+<kbd>W</kbd> · <kbd>Alt</kbd>+<kbd>P</kbd>']]
        .map(([a, b]) => `<div class="row between small"><span class="muted">${a}</span><span>${b}</span></div>`).join('')}`;
  }
  function renderAll() {
    $('#v-shadowing').dataset.tab = S.tab;
    $('#sOver').textContent = `Shadowing · ${L.cefr}`;
    renderMedia(); renderWork(); renderList();
  }
  function detailSheet() {
    const rec = S.recs[S.i]; if (!rec || !rec.last) return;
    const l = rec.last, bad = l.words.filter(w => w.score < 75).sort((a, b) => a.score - b.score);
    const ringBox = (k, label) => `<div style="text-align:center"><div class="ring" id="sr-${k}"></div><div class="small" style="margin-top:6px;font-weight:600">${label}</div></div>`;
    $('#shTitle').textContent = `Chi tiết câu ${S.i + 1}`;
    $('#shBody').innerHTML = `<div class="row w" style="gap:12px;justify-content:space-between">${ringBox('t', 'Tổng')}${ringBox('a', 'Chính xác')}${ringBox('f', 'Trôi chảy')}${ringBox('c', 'Đầy đủ')}${ringBox('p', 'Ngữ điệu')}</div>
      <div class="chip t-info">Điểm mô phỏng · bản thật chấm bằng Azure</div>
      <h3 class="h3">Từ cần sửa (${bad.length})</h3>
      ${bad.length ? bad.map(w => `<div class="card" style="padding:14px"><div class="row between"><b style="font-size:18px">${esc(w.w)}</b><span class="badge ${w.score >= 60 ? 't-warn' : 't-bad'}">${w.score}</span></div>
        <div class="phons" style="margin-top:8px">${w.ph.map(([s, v, pr]) => `<div class="phon ${v >= 80 ? 't-ok' : v >= 60 ? 't-warn' : 't-bad'}"><div class="s">${esc(s)}</div><div class="small">${v}${pr ? ' · ' + (pr === '—' ? 'rụng' : '→ /' + pr + '/') : ''}</div></div>`).join('')}</div></div>`).join('') : '<p class="small muted">Không có từ nào dưới 75 điểm.</p>'}
      <div class="card card-highlight"><div class="row between"><h3 class="row g8">${icon('sparkle', 1)}Nhận xét AI</h3><span class="badge pro">PRO</span></div>
        <div class="lockbox" style="margin-top:12px"><div class="blur">${SHADOW.ai.map(([a, b]) => `<p class="small" style="margin-bottom:10px"><b>${a}:</b> ${b}</p>`).join('')}</div>
          <div class="ov free-only"><b>Nhận xét riêng cho từng lần bạn đọc</b><button class="btn primary sm" data-act="togglePro">Mở với Pro</button></div></div></div>`;
    $('#sheet').classList.add('on'); $('#scrim').classList.add('on');
    [['t', l.total, 72], ['a', l.acc, 56], ['f', l.flu, 56], ['c', l.comp, 56], ['p', l.pros, 56]].forEach(([k, v, size]) => ring($('#sr-' + k), v, { size, stroke: 8 }));
    refreshIcons();
  }

  /* ── Hoàn thành bài ── */
  function finishAll() {
    stopPlay();
    const best = sents.map((_, k) => (S.recs[k] ? S.recs[k].best : 0)), avg = Math.round(best.reduce((a, b) => a + b, 0) / N);
    const weak = best.map((v, k) => [k, v]).filter(([, v]) => v < 80);
    const phCount = {}; Object.values(S.recs).forEach(r => r.last && r.last.words.forEach(w => w.ph.forEach(p => { if (p[1] < 60) phCount[p[0]] = (phCount[p[0]] || 0) + 1; })));
    const top = Object.entries(phCount).sort((a, b) => b[1] - a[1])[0];
    const [mood, msg] = avg >= 80 ? ['celebrate', 'Phát âm bài này rất tốt!'] : avg >= 60 ? ['correct', 'Khá ổn. Đọc lại các câu dưới 80 điểm cho chắc hơn.'] : ['encourage', 'Bài này đang khó. Nghe mẫu chậm rồi luyện từng câu nhé.'];
    S.tab = 'practice';
    $('#sWork').classList.remove('ok-hit', 'bad-hit');
    $('#sWork').innerHTML = `<div class="p2-done" role="status">${mascot(mood, 120)}<h2 class="h2">Xong bài “${esc(L.title)}”</h2><p class="muted">${msg}</p>
      <div class="ring" id="shFinRing"></div>
      <div class="stats"><div><b>${N - weak.length}/${N}</b><span class="small muted">câu từ 80 điểm</span></div><div><b>${Math.max(...best)}</b><span class="small muted">điểm cao nhất</span></div>
        ${top ? `<div><b>/${esc(top[0])}/</b><span class="small muted">âm cần luyện (${top[1]} lần)</span></div>` : ''}</div>
      ${weak.length ? `<p class="small muted">Nên đọc lại: ${weak.map(([k]) => 'câu ' + (k + 1)).join(', ')}</p>` : ''}
      <div class="row w" style="justify-content:center;margin-top:12px">
        ${top ? `<button class="btn ghost" data-go="weakness">${icon('target')}Luyện âm /${esc(top[0])}/ ở Điểm yếu</button>` : ''}
        <button class="btn ghost" data-act="shReset">${icon('rotate-ccw')}Làm lại bài</button>
        <button class="btn ghost" data-act="shToDictation">${icon('headphones')}Luyện Nghe chép bài này</button>
        <button class="btn primary" data-act="shFinish">${icon('check')}Hoàn thành</button></div></div>`;
    ring($('#shFinRing'), avg, { size: 120, stroke: 10, label: 'điểm TB' });
    if (avg >= 80) { ting(); confetti(); }
    refreshIcons();
  }

  /* ── Sự kiện ── */
  const ctrl = { down: false, other: false };
  Object.assign(ACT, {
    shPlay() { playModel(); }, shListen() { stopPlay(); setTimeout(() => playModel(), 30); },
    shPrev() { if (S.i > 0) begin(S.i - 1); }, shNextS() { if (S.i < N - 1) begin(S.i + 1); },
    shMic: toggleRec, shMine() { stopPlay(); playMine(); }, shCompare: compare,
    shMicRetry() { note(); if (P2_ST === 'mic') { toast('Hãy cho phép micro trong cài đặt trình duyệt rồi tải lại trang', null, 'microphone'); note('mic'); } else toggleRec(); },
    shNext: next, shDetail: detailSheet,
    shClosePop() { S.word = null; renderWork(); },
    shMineWord() { playMine(); },
    shWatch: watchAll,
    shToPractice() { setTab('practice'); },
    shHideVideo() { SET.hideVideo = !SET.hideVideo; saveSet(); renderMedia(); },
    shRetryVideo() { ytFail = false; ytReady = false; player = null; $('#sMedia').innerHTML = ''; renderMedia(); },
    shReset() { S.recs = {}; S.lastBlob = null; persist(); begin(0); },
    shToDictation() { go('dictation', { lesson: L.slug }); },
    shFinish() { completeTask('drill'); if (!state.focus) go('lesson', { l: L.slug }); },
    dcPop(btn) {
      const pop = $('#' + btn.dataset.pop), open = pop.hidden;
      $$('.dc-pop').forEach(p => { p.hidden = true; }); $$('.dc-pop-wrap > button').forEach(b => b.setAttribute('aria-expanded', 'false'));
      if (open) { pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
    },
  });
  Shell.click((t) => {
    const tb = t.closest('#sTab button'); if (tb) { setTab(tb.dataset.tab); return true; }
    const r = t.closest('#sRate button'); if (r) { SET.rate = +r.dataset.r; saveSet(); segPick(r); if (S.playing) stopPlay(); return true; }
    const gs = t.closest('[data-go-s]');
    if (gs) {
      const k = +gs.dataset.goS;
      if (S.tab === 'watch') { S.cur = k; stopPlay(); renderList(); renderMedia(); renderWork(); if (player && ytReady) { try { player.seekTo(sents[k].s, true); } catch (_) {} } }
      else if (k !== S.i) begin(k);
      return true;
    }
    const w = t.closest('.shw[data-wi]');
    if (w) {
      const rec = S.recs[S.i];
      if (rec && rec.last) { S.word = S.word === +w.dataset.wi ? null : +w.dataset.wi; renderWork(); const p = $('#shPop'); if (p) p.scrollIntoView({ block: 'nearest' }); }
      else toast('Hãy đọc câu này trước để xem điểm từng từ', null, 'mic');
      return true;
    }
    if (!t.closest('.dc-pop-wrap')) $$('.dc-pop').forEach(p => { p.hidden = true; });
  });
  document.addEventListener('change', (e) => {
    const c = e.target.closest ? e.target.closest('[data-set]') : null; if (!c) return;
    SET[c.dataset.set] = c.checked; saveSet(); renderWork(); renderList(); renderMedia();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Control') { ctrl.down = true; ctrl.other = false; return; }
    if (ctrl.down) ctrl.other = true;
    const typing = ['TEXTAREA', 'INPUT', 'SELECT'].includes(document.activeElement && document.activeElement.tagName);
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); if (S.i > 0) begin(S.i - 1); return; }
    if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); if (S.i < N - 1) begin(S.i + 1); return; }
    if (e.altKey && (e.key === 'w' || e.key === 'W')) { e.preventDefault(); setTab('watch'); return; }
    if (e.altKey && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); setTab('practice'); return; }
    if (e.key === 'Escape') { $$('.dc-pop').forEach(p => { p.hidden = true; }); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey || S.tab !== 'practice' || $('#sWork .p2-done')) return;
    if (e.code === 'Space' && !(document.activeElement && document.activeElement.tagName === 'BUTTON')) { e.preventDefault(); toggleRec(); return; }
    if (e.key === 'r' || e.key === 'R') { stopPlay(); playMine(); return; }
    if (e.key === 'c' || e.key === 'C') compare();
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Control') { if (ctrl.down && !ctrl.other && S.tab === 'practice' && !$('#sWork .p2-done')) playModel(); ctrl.down = false; }
  });
  window.addEventListener('ll:pro', () => { if (S.tab === 'practice' && !S.rec && !$('#sWork .p2-done')) renderWork(); });
  window.addEventListener('beforeunload', () => stopPlay());

  /* ── Khởi động ── */
  $('#sCrumb').dataset.id = L.slug; $('#sCrumb').querySelector('span').textContent = L.title;
  $$('#sTab button').forEach(b => { b.classList.toggle('on', b.dataset.tab === S.tab); b.setAttribute('aria-pressed', b.dataset.tab === S.tab); });
  renderPops(); renderAll();
  requestAnimationFrame(() => segMove($('#sTab')));
  $('#sCoach').innerHTML = p2Coach('shadowing', 'Lần đầu luyện shadowing? Ba bước:', ['Bấm ▶ (hoặc nhả phím <kbd>Ctrl</kbd>) để nghe câu mẫu.', 'Bấm micro (hoặc <kbd>Space</kbd>) và đọc theo nhịp; mic tự dừng sau khi hết thời gian.', 'Bấm vào từ tô màu để xem âm nào lệch; dùng “So sánh” để tự nghe ra chỗ khác.']);
  if (S.restored) toast(`Tiếp tục từ câu ${S.i + 1} · đã đọc ${doneCount()}/${N}`, null, 'history');
  if (P2_ST === 'quota') note('quota');
  if (P2_ST === 'audio' && !yt) $('#sMedia').insertAdjacentHTML('afterbegin', `<div class="dc-fail" role="alert">${icon('volume-x')}<div><b>Không phát được âm thanh</b><p class="small muted">Trình duyệt đang chặn tiếng hoặc bài chưa tải xong.</p></div><button class="btn ghost sm" data-act="retry">${icon('rotate-cw')}Thử lại</button></div>`);
  refreshIcons();
}

if (!P2_BLOCK) shMain();
statePicker([['normal', 'Bình thường'], ['new', 'Người mới'], ['mic', 'Chưa cấp quyền micro'], ['quota', 'Hết lượt chấm'], ['loading', 'Đang tải'], ['error', 'Lỗi máy chủ'], ['network', 'Mất mạng'], ['audio', 'Không phát được tiếng'], ['notfound', 'Không tìm thấy bài']]);
refreshIcons();
