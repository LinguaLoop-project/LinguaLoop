/* Nghe chép: căn chỉnh từ (edit distance), phân loại lỗi theo loại từ (S-12, S-13) */
'use strict';
const D = { i: 0, replays: 0, rate: +ME.rate || .8, scores: [], checked: false };
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
function gradeDictation(sentence, typed) {
  const disp = sentence.split(/\s+/), exp = disp.map(w => norm(w)[0] || ''), act = norm(typed);
  const res = align(exp, act).map(op => {
    if (op.e == null) return { outcome: 'inserted', actual: op.a };
    const e = exp[op.e], cls = wordClass(e, disp[op.e], op.e), base = { disp: disp[op.e], expected: e, cls };
    if (op.a == null) return { ...base, outcome: 'omitted' };
    if (op.a === e) return { ...base, outcome: 'correct' };
    const suffixDrop = cls === 'inflected' && e.startsWith(op.a);
    const close = lev(e, op.a) <= Math.max(1, Math.floor(e.length / 3));
    return { ...base, actual: op.a, outcome: suffixDrop || !close || cls === 'function' ? 'substituted' : 'misspelled' };
  });
  const correct = res.filter(r => r.outcome === 'correct').length, ins = res.filter(r => r.outcome === 'inserted').length;
  return { res, score: Math.round(100 * correct / (exp.length + ins)) };
}
function renderDictList() {
  $('#dList').innerHTML = DICT_SENTENCES.map((_, k) => { const sc = D.scores[k];
    const ic = sc == null ? (k === D.i ? icon('headphones', 1) : icon('circle-dashed')) : icon(sc >= 80 ? 'check-circle' : sc >= 60 ? 'warning-circle' : 'x-circle', 1);
    return `<div class="dlist-it ${k === D.i ? 'cur' : ''} ${sc == null ? '' : scoreTone(sc)}" style="${sc == null ? '' : 'color:var(--tone)'}">${ic}<span style="color:var(--text)">Câu ${k + 1}</span><span class="sc small ${sc == null ? 'muted' : ''}">${sc == null ? (k === D.i ? 'Đang làm' : 'Chưa làm') : sc + ' điểm'}</span></div>`; }).join('');
}
function renderDictation() {
  $('#dCount').textContent = `Câu ${D.i + 1}/${DICT_SENTENCES.length}`;
  $('#dReplays').textContent = D.replays;
  $('#dDots').innerHTML = DICT_SENTENCES.map((_, k) => { const sc = D.scores[k]; return `<i class="${k === D.i ? 'cur' : sc == null ? '' : sc >= 80 ? 'g' : sc >= 60 ? 'm' : 'b'}"></i>`; }).join('');
  const inp = $('#dInput'); inp.value = ''; inp.placeholder = 'Gõ những gì bạn nghe được…'; inp.disabled = false;
  $('#dResult').style.display = 'none'; D.checked = false; $('#dCard').classList.remove('ok-hit', 'bad-hit');
  renderDictList(); vpRender('d');
  loopiSay('listening', 'Nghe kỹ từng câu, không cần nghe đúng một lần là được ngay.', 'dLoopi');
}
function dictPlay() {
  const s = DICT_SENTENCES[D.i]; D.replays++; $('#dReplays').textContent = D.replays;
  const b = $('#dPlay'); b.classList.add('playing'); b.innerHTML = icon('pause', 1);
  speak(s.t, { rate: D.rate, lang: 'en-US' }); vpRun('d', s.t.split(' ').length * 420 / D.rate);
  setTimeout(() => { b.classList.remove('playing'); b.innerHTML = icon('play', 1); }, s.t.split(' ').length * 420 / D.rate);
  $('#dInput').focus();
}
function dictCheck() {
  const typed = $('#dInput').value.trim(); if (!typed) { toast('Gõ câu bạn nghe được trước nhé', null, 'keyboard'); return; }
  const s = DICT_SENTENCES[D.i], { res, score } = gradeDictation(s.t, typed); D.scores[D.i] = score; D.checked = true;
  const counts = {}; res.forEach(r => { if (r.outcome !== 'correct' && r.outcome !== 'inserted') { const k = r.cls + '_' + r.outcome; counts[k] = (counts[k] || 0) + 1; } });
  const tokHtml = res.map((r, k) => {
    const d = `style="animation-delay:${k * 35}ms" tabindex="0"`;
    if (r.outcome === 'correct') return `<span class="tok correct" style="animation-delay:${k * 35}ms">${esc(r.disp)}</span>`;
    if (r.outcome === 'inserted') return `<span class="tok inserted" ${d}>${esc(r.actual)}<span class="tip-pop">Thừa từ</span></span>`;
    const label = CAT_NAME[r.cls + '_' + r.outcome] || 'Sai';
    if (r.outcome === 'omitted') return `<span class="tok omitted" ${d}>${esc(r.disp)}<span class="tip-pop">${label}</span></span>`;
    if (r.outcome === 'substituted') return `<span class="tok substituted" ${d}><s>${esc(r.actual)}</s>${esc(r.disp)}<span class="tip-pop">${label} · bạn gõ “${esc(r.actual)}”</span></span>`;
    return `<span class="tok misspelled" ${d}>${esc(r.disp)}<span class="tip-pop">${label} · bạn gõ “${esc(r.actual)}”</span></span>`;
  }).join(' ');
  const chips = Object.entries(counts).map(([k, v]) => `<span class="chip ${OUTCOME_TONE[k.split('_')[1]]}">${CAT_NAME[k]} ×${v}</span>`).join('');
  const last = D.i === DICT_SENTENCES.length - 1;
  const [dMood, dMsg] = score >= 80 ? ['happy', 'Tai bạn bắt tốt lắm! Sang câu tiếp nhé.']
    : score >= 60 ? ['idle', 'Gần đúng rồi. Nghe lại để ý mấy từ tô màu.']
    : ['sad', 'Câu này khó thật. Thử tốc độ 0.6× rồi làm lại nhé, không sao đâu.'];
  const box = $('#dResult'); box.style.display = '';
  box.innerHTML = `<div style="height:1px;background:var(--border);margin-bottom:24px"></div>
    <div class="row" style="gap:24px;align-items:flex-start">
      <div class="ring" id="dRing"></div>
      <div class="grow col g8"><div class="diff">${tokHtml}</div>
        ${chips ? `<div class="row w">${chips}</div>` : `<div><span class="chip t-ok">${icon('check-circle', 1)}Chính xác tuyệt đối!</span></div>`}
        <div class="m-say">${mascot(dMood, 56)}<span>${dMsg}</span></div>
        <details class="small muted" style="margin-top:4px"><summary>Dịch nghĩa</summary><p style="margin-top:6px">${s.vi}</p></details>
      </div></div>
    <div class="legend" style="margin:20px 0"><span><i class="sw t-ok solid"></i>Đúng</span><span><i class="sw dash"></i>Bỏ sót</span><span><i class="sw t-warn"></i>Nhầm từ</span><span><i class="sw t-info"></i>Sai chính tả</span><span><i class="sw t-acc solid"></i>Thừa</span><span>· Rê chuột hoặc Tab vào từ để xem loại lỗi</span></div>
    <div class="row w"><button class="btn ghost sm" data-act="dRetry">${icon('arrow-counter-clockwise')}Làm lại</button><button class="btn ghost sm" data-act="dReplay">${icon('speaker-high')}Nghe lại</button>
      <span class="grow"></span><span class="small muted hide-m"><kbd>Enter</kbd></span>
      <button class="btn primary" data-act="dNext">${last ? `${icon('check')}Hoàn thành` : `Câu tiếp<i class="ph ph-arrow-right arr" aria-hidden="true"></i>`}</button></div>`;
  ring($('#dRing'), score, { size: 96, stroke: 9, label: 'điểm' });
  loopiSay(dMood, dMsg, 'dLoopi');
  $('#dInput').disabled = true;
  const card = $('#dCard'); card.classList.remove('ok-hit', 'bad-hit'); void card.offsetWidth;
  if (score >= 80) { card.classList.add('ok-hit'); ting(); xpFly($('#dRing'), score === 100 ? 15 : 10); }
  else if (score < 60) { card.classList.add('bad-hit'); setTimeout(() => toast('Đã thêm câu này vào “Câu cần ôn lại”', null, 'push-pin'), 900); }
  renderDictList(); vpRender('d');
}
function dictNext() {
  if (D.i < DICT_SENTENCES.length - 1) { D.i++; D.replays = 0; renderDictation(); if (ME.autoNext) setTimeout(dictPlay, 250); }
  else { const avg = Math.round(D.scores.reduce((a, b) => a + b, 0) / D.scores.length); toast(`Xong bài · điểm trung bình ${avg}`, null, 'check-circle'); D.i = 0; D.scores = []; D.replays = 0; renderDictation(); completeTask('dict'); }
}

Object.assign(ACT, {
  dRetry() { D.scores[D.i] = undefined; renderDictation(); $('#dInput').focus(); }, dReplay: dictPlay, dNext: dictNext,
});

// Bài đang luyện: lấy từ ?lesson= hoặc bài gần nhất, cập nhật breadcrumb và trình độ
function applyLesson() {
  const slug = qs().get('lesson') || curLesson.dictation, L = lessonOf(slug);
  if (!L) return;
  if (curLesson.dictation !== slug) { setCurLesson('dictation', slug); D.i = 0; D.scores = []; D.replays = 0; }
  const c = $('#dCrumb'); c.dataset.id = slug; c.querySelector('span').textContent = L.title;
  $('#v-dictation .overline').textContent = `Nghe chép · ${L.cefr}`;
}

Shell.click((t) => {
  const sp = t.closest('#dSpeed button'); if (sp) { D.rate = +sp.dataset.r; segPick(sp); return true; }
});
Shell.key((e, typing) => {
  if (e.key === 'Control' && !e.repeat) { dictPlay(); return true; }
  if (e.key === 'Enter' && !e.shiftKey && (typing || D.checked)) { e.preventDefault(); D.checked ? dictNext() : dictCheck(); return true; }
}, 'early');
$('#dPlay').addEventListener('click', dictPlay);
$('#dHint').addEventListener('click', () => { const s = DICT_SENTENCES[D.i].t; $('#dInput').placeholder = s.split(' ').map(w => w[0] + w.slice(1).replace(/[a-z]/gi, '_')).join(' '); $('#dInput').focus(); });

applyLesson();
$$('#dSpeed button').forEach(x => x.classList.toggle('on', +x.dataset.r === D.rate));
renderDictation();
