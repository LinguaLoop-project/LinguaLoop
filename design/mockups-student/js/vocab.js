/* Từ vựng: Bộ từ (decks.js), Tra từ, Ôn thẻ (flashcard SM-2), Trắc nghiệm (S-02 → S-09) */
'use strict';
let vSel = 0, vEntryWord = null, vPos = null;
function setVocabTab(t) {
  $$('#vTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); segMove($('#vTabs'));
  const panes = { decks: '#vDecks', lookup: '#vLookup', review: '#vReview', quiz: '#vQuiz' };
  Object.entries(panes).forEach(([k, s]) => { const el = $(s); el.style.display = k === t ? '' : 'none'; if (k === t) { el.classList.remove('fade'); void el.offsetWidth; el.classList.add('fade'); } });
  if (t === 'decks') renderDecks(); if (t === 'review') fcStart(); if (t === 'quiz') qzStart(); if (t === 'lookup') setTimeout(() => $('#vSearch').focus({ preventScroll: true }), 50);
}
function vSearch(q) {
  q = q.trim().toLowerCase(); const box = $('#vSugg');
  if (q.length < 1) { box.style.display = 'none'; return []; }
  const words = Object.keys(DICT), hits = [];
  words.filter(w => w.startsWith(q)).forEach(w => hits.push({ w }));
  Object.entries(FORM_INDEX).filter(([f]) => f.startsWith(q)).forEach(([f, w]) => hits.push({ w, form: f }));
  words.filter(w => !w.startsWith(q) && lev(q, w.slice(0, q.length + 1)) <= 1 && q.length > 2).forEach(w => hits.push({ w, fuzzy: true }));
  const list = hits.slice(0, 8); vSel = 0;
  box.innerHTML = list.length ? list.map((x, i) => `<button class="${i === 0 ? 'hl' : ''}" data-word="${x.w}"><b>${x.form || x.w}</b>${x.form ? `<span class="small muted">→ ${x.w}</span>` : ''}<span class="badge cefr ${DICT[x.w].cefr}">${DICT[x.w].cefr}</span><span class="small muted grow">${firstVi(x.w)}</span>${x.fuzzy ? '<span class="small muted">gần đúng</span>' : ''}</button>`).join('')
    : `<div style="padding:12px 14px" class="small muted row between">Không tìm thấy “${esc(q)}”. <button class="btn text sm" data-act="reportMissing">Báo thiếu từ</button></div>`;
  box.style.display = ''; return list;
}
function renderMem(w) {
  const el = $('#vMem'); if (!el) return; const [pct, next, reps] = DICT[w].mem || [0, '—', 0], on = isSaved(w);
  el.innerHTML = `<div class="overline">Độ nhớ của từ này</div><div class="row" style="gap:20px"><div class="ring" id="memRing"></div>
    <div class="col g4">${on ? `<b>Ôn lần tới: ${next}</b><span class="small muted">Đã ôn ${reps} lần · càng nhớ lâu, khoảng ôn càng giãn ra</span>`
      : `<b>Chưa lưu từ này</b><span class="small muted">Lưu để bắt đầu theo dõi độ nhớ</span><div><button class="btn ghost sm" data-save="${w}#all">${icon('bookmark-simple')}Lưu từ</button></div>`}</div></div>`;
  ring($('#memRing'), on ? pct : 0, { size: 96, stroke: 9, color: 'url(#gRing)', label: 'độ nhớ' });
}
function vOpen(w, pos) {
  vEntryWord = w; const d = DICT[w]; vPos = pos || Object.keys(d.pos)[0]; $('#vSugg').style.display = 'none'; $('#vSearch').value = w;
  const ipa = (d.ipaByPos && d.ipaByPos[vPos]) || [d.uk, d.us];
  const wholeKey = w + '#all';
  const chipsOf = (arr) => arr.map(x => DICT[x] ? `<button class="chip" data-word="${x}">${x}</button>` : `<span class="chip">${esc(x)}</span>`).join('');
  $('#vEntry').innerHTML = `<div class="g-vocab">
    <div class="entry-wrap">
      ${obj('torus', '--s:64px;top:-40px;right:-28px;--dur:9s', 'learn')}
      <article class="card has-img entry-main">
        <div class="entry-head">
          ${vimg(w)}
          <div class="col g12">
            <div class="row between" style="align-items:flex-start">
              <div class="row w" style="align-items:baseline;gap:12px;flex:1"><h2 class="display-lg text-gradient word-display">${w}</h2><span class="badge cefr ${d.cefr}">${d.cefr}</span></div>
              <div class="row g8"><button class="save" data-save="${wholeKey}" aria-label="Lưu cả từ">${icon('bookmark-simple', 1)}</button><button class="icon-btn" data-act="report" aria-label="Báo lỗi nội dung">${icon('flag')}</button></div>
            </div>
            <div><div class="seg" id="posSeg" role="tablist" aria-label="Loại từ">${Object.keys(d.pos).map(p => `<button class="${p === vPos ? 'on' : ''}" data-pos="${p}">${p}</button>`).join('')}</div></div>
            <div class="row w">${aud(w, 'UK', { lang: 'en-GB', ipa: ipa[0] })}${aud(w, 'US', { lang: 'en-US', ipa: ipa[1] })}</div>
            ${ipa[0] !== ipa[1] ? `<span class="small muted row g8">${icon('lightning', 1)}UK và US đọc khác nhau</span>` : ''}
          </div>
        </div>
        <div style="margin-top:24px">${d.pos[vPos].map(([vi, en, ex, exvi], k) => { const key = `${w}#${vPos}#${k + 1}`; return `
          <div class="sense"><div class="n">${k + 1}</div>
            <div class="col g4"><span class="vi">${vi}</span><span class="small muted">${en}</span>
              <span class="row g8" style="margin-top:4px"><i>“${ex}”</i><button class="icon-btn sm" data-say="${esc(ex)}" aria-label="Nghe câu ví dụ">${icon('speaker-high')}</button></span><span class="small muted">${exvi}</span></div>
            <button class="save" data-save="${key}" aria-label="Lưu nghĩa này">${icon('bookmark-simple', 1)}</button></div>`; }).join('')}</div>
        ${d.forms && d.forms[vPos] ? `<div class="overline" style="margin-top:8px">Biến thể</div><div class="row w">${d.forms[vPos].map(f => `<span class="chip lift">${f}</span>`).join('')}</div>` : ''}
      </article>
    </div>
    <aside class="col g24">
      <div class="card"><div class="overline">Họ từ</div>
        ${d.family && d.family.length ? d.family.map(([f, p]) => `<div class="fam"><b>${f}</b><span class="small muted">${p}</span></div>`).join('') : '<p class="small muted">Chưa có dữ liệu họ từ.</p>'}</div>
      <div class="card"><div class="overline">Collocation</div><div class="row w">${(d.coll || []).map(c => `<span class="chip lift">${esc(c)}</span>`).join('') || '<span class="small muted">Chưa có dữ liệu.</span>'}</div>
        ${d.syn && d.syn.length ? `<div class="overline" style="margin-top:16px">Đồng nghĩa</div><div class="row w">${chipsOf(d.syn)}</div>` : ''}
        ${d.ant && d.ant.length ? `<div class="overline" style="margin-top:16px">Trái nghĩa</div><div class="row w">${chipsOf(d.ant)}</div>` : ''}</div>
      <div class="card" id="vMem"></div>
      <div class="card"><div class="overline">Xuất hiện trong bài học</div>
        ${d.inLessons ? d.inLessons.map(([s, l, ic]) => `<div class="lesson" data-go="dictation"><div class="thumb">${icon(ic, 0).replace('class="ph ', 'class="ph-duotone ')}</div><div class="grow"><i class="small">“${esc(s)}”</i><div class="small muted">${l}</div></div><i class="ph ph-arrow-right muted" aria-hidden="true"></i></div>`).join('')
          : '<p class="small muted">Chưa có bài học nào dùng từ này.</p>'}</div>
    </aside></div>`;
  syncSaves();
  requestAnimationFrame(() => segMove($('#posSeg')));
}
// Flashcard + SM-2 (sm2, ivl nằm trong shell.js)
const FC_WORDS = ['reliable', 'through', 'borrow', 'although', 'schedule', 'delay', 'latte', 'thin'];
let FC = null;
function fcStart() {
  FC = { q: FC_WORDS.map((w, i) => ({ w, ef: 2.5, interval: i % 3 === 0 ? 6 : 1, reps: i % 3 === 0 ? 2 : 1 })), done: 0, right: 0, total: FC_WORDS.length, flipped: false };
  fcRender();
}
function fcSide() {
  const todayDone = 48 + FC.done;
  $('#vReviewSide').innerHTML = `
    <div class="card"><div class="overline">Hôm nay</div><div class="row" style="gap:20px"><div class="ring" id="fcDay"></div>
      <div class="col g4"><b>${todayDone}/100 thẻ</b><span class="small muted">Mục tiêu ôn mỗi ngày</span></div></div></div>
    <div class="card"><div class="overline">Phiên này</div>
      <div class="stat"><span class="muted">Còn lại</span><b>${FC.q.length}</b></div>
      <div class="stat"><span class="muted">Nhớ ngay lần đầu</span><b style="color:var(--success)">${FC.right}</b></div>
      <div class="stat"><span class="muted">Ôn lại trong phiên</span><b style="color:var(--danger)">${FC.q.filter(c => c.again).length}</b></div></div>
    <div class="card"><div class="overline">Cách chấm</div><div class="col g8 small">
      <div class="row between"><span><b style="color:var(--danger)">Quên</b> · gặp lại sau 10 phút</span><kbd>1</kbd></div>
      <div class="row between"><span><b style="color:var(--warning)">Khó</b> · nhớ nhưng chật vật</span><kbd>2</kbd></div>
      <div class="row between"><span><b style="color:var(--success)">Được</b> · nhớ bình thường</span><kbd>3</kbd></div>
      <div class="row between"><span><b style="color:var(--info)">Dễ</b> · nhớ ngay, giãn khoảng ôn</span><kbd>4</kbd></div></div></div>`;
  ring($('#fcDay'), todayDone, { size: 88, stroke: 8, color: 'url(#gRing)', label: '%' });
}
function fcRender() {
  const box = $('#vReviewInner');
  if (!FC.q.length) {
    box.innerHTML = `<div class="card card-highlight" style="text-align:center;padding:40px">${mascot('celebrate', 120).replace('class="mascot', 'style="margin:0 auto" class="mascot')}<div class="ring" id="fcRing" style="margin-top:8px"></div><h2 style="margin-top:16px">Xong phiên ôn</h2>
      <p class="muted" style="margin:6px 0 20px">Nhớ ${FC.right}/${FC.total} thẻ ngay lần đầu · Lần ôn tới: 5 thẻ vào ngày mai</p>
      <div class="row w" style="justify-content:center">${VC ? `<button class="btn ghost" data-go="${VC.go}"${VC.id ? ` data-id="${VC.id}"` : ''}>${icon('arrow-left')}Về ${esc(VC.label)}</button>` : ''}<button class="btn ghost" data-act="fcAgain">Ôn lại</button><button class="btn primary" data-act="fcDone">${icon('check')}Hoàn thành</button></div></div>`;
    ring($('#fcRing'), Math.round(FC.right / FC.total * 100), { size: 120, color: 'url(#gRing)', label: '% nhớ' }); confetti(); fcSide(); return;
  }
  const c = FC.q[0], d = DICT[c.w], [vi, , ex, exvi] = Object.values(d.pos)[0][0];
  box.innerHTML = `<div class="row" style="margin-bottom:16px"><div class="bar grow"><i style="width:${FC.done / (FC.done + FC.q.length) * 100}%"></i></div><b class="small">${FC.done}/${FC.done + FC.q.length}</b></div>
    <div class="entry-wrap">${obj('star', '--s:52px;top:-24px;right:-14px', 'learn')}
    <div class="fc-wrap"><div class="fc" id="fc" tabindex="0" role="button" aria-label="Thẻ ${c.w}, bấm để lật">
      <div class="face has-img"><span class="badge t-pri">${VC ? esc(VC.badge) : 'Ôn tập · 3000 Oxford'}</span>${vimg(c.w, 'sm')}<div class="display-lg text-gradient">${c.w}</div>${aud(c.w, `<span class="ipa">${d.uk}</span>`)}<span class="small muted">Chạm thẻ hoặc <kbd>Space</kbd> để lật</span></div>
      <div class="face back"><span class="badge">${Object.keys(d.pos)[0]}</span><div class="h1">${vi}</div><p><i>“${ex}”</i></p><p class="small muted">${exvi}</p></div>
    </div></div></div>
    <div class="grades" id="grades" style="visibility:${FC.flipped ? 'visible' : 'hidden'}">
      <button class="t-bad" data-q="1">Quên<small>${ivl(c, 1)}</small></button><button class="t-warn" data-q="3">Khó<small>${ivl(c, 3)}</small></button>
      <button class="t-ok" data-q="4">Được<small>${ivl(c, 4)}</small></button><button class="t-info" data-q="5">Dễ<small>${ivl(c, 5)}</small></button></div>`;
  fcSide();
}
function fcFlip() { const f = $('#fc'); if (!f) return; FC.flipped = !FC.flipped; f.classList.toggle('flip', FC.flipped); $('#grades').style.visibility = 'visible'; }
function fcGrade(q) {
  if (!FC.flipped) return fcFlip();
  const c = FC.q.shift(), n = sm2(c, q), f = $('#fc'); f.classList.add(q < 3 ? 'out-l' : 'out-r');
  if (q < 3) FC.q.push({ ...c, ...n, again: true }); else { FC.done++; if (!c.again) FC.right++; }
  FC.flipped = false; setTimeout(fcRender, 300);
}
// Quiz
let QZ = null;
function qzStart() { const pool = Object.keys(DICT); QZ = { items: ['reliable', 'borrow', 'although', 'delay', 'schedule'].map(w => ({ w, opts: shuffle([w, ...shuffle(pool.filter(x => x !== w)).slice(0, 3)]) })), i: 0, right: 0, answered: false, last: null }; qzRender(); }
function qzSide() {
  const st = QZ.i >= QZ.items.length && QZ.right >= 4 ? 'celebrate' : QZ.last === true ? 'happy' : QZ.last === false ? 'sad' : 'idle';
  const msg = QZ.last === true ? 'Chuẩn luôn! Giữ phong độ nhé.' : QZ.last === false ? 'Không sao, sai để nhớ lâu hơn. Đọc ví dụ rồi đi tiếp nhé.' : 'Chọn nghĩa đúng nhất. Dùng phím 1–4 cho nhanh.';
  $('#vQuizSide').innerHTML = `<div class="card mascot-card">${mascot(st, 96)}<p class="small">${msg}</p></div>
    <div class="card"><div class="overline">Kết quả</div>
      <div class="stat"><span class="muted">Đúng</span><b style="color:var(--success)">${QZ.right}</b></div>
      <div class="stat"><span class="muted">Sai</span><b style="color:var(--danger)">${Math.min(QZ.i + (QZ.answered ? 1 : 0), QZ.items.length) - QZ.right}</b></div>
      <div class="stat"><span class="muted">XP phiên này</span><b style="color:var(--warning)">${QZ.right * 10}</b></div></div>`;
}
function qzRender() {
  const box = $('#vQuizInner');
  if (QZ.i >= QZ.items.length) {
    box.innerHTML = `<div class="card card-highlight" style="text-align:center;padding:40px"><div class="ring" id="qzRing"></div><h2 style="margin-top:16px">${QZ.right}/${QZ.items.length} câu đúng</h2><button class="btn primary" style="margin-top:20px" data-act="qzAgain">${icon('arrow-counter-clockwise')}Làm lại</button></div>`;
    ring($('#qzRing'), QZ.right / QZ.items.length * 100, { size: 120, color: 'url(#gRing)', label: '%' }); if (QZ.right >= 4) confetti(); QZ.last = QZ.right >= 4 ? true : null; qzSide(); return;
  }
  const it = QZ.items[QZ.i], d = DICT[it.w];
  box.innerHTML = `<div class="row" style="margin-bottom:16px"><div class="bar grow"><i style="width:${QZ.i / QZ.items.length * 100}%"></i></div><b class="small">${QZ.i + 1}/${QZ.items.length}</b></div>
    <div class="card has-img" style="padding:28px"><div class="row" style="gap:24px">${vimg(it.w, 'sm')}<div><div class="overline">Chọn nghĩa đúng</div><div class="display-lg text-gradient">${it.w}</div><div style="margin-top:12px">${aud(it.w, `<span class="ipa">${d.uk}</span>`)}</div></div></div></div>
    <div class="col g8" style="margin-top:16px">${it.opts.map((o, k) => `<button class="opt" data-opt="${o}"><kbd>${k + 1}</kbd>${firstVi(o)}</button>`).join('')}</div>
    <div id="qzFb" style="margin-top:12px"></div>`;
  QZ.answered = false; qzSide();
}
function qzAnswer(o) {
  if (QZ.answered) return; QZ.answered = true; const it = QZ.items[QZ.i], ok = o === it.w; if (ok) QZ.right++;
  QZ.last = ok;
  $$('.opt').forEach(b => {
    if (b.dataset.opt === it.w) { b.classList.add('right'); b.insertAdjacentHTML('beforeend', '<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'); }
    else if (b.dataset.opt === o) b.classList.add('wrong');
  });
  if (ok) { ting(); xpFly($('.opt.right'), 10); }
  const [, , ex, exvi] = Object.values(DICT[it.w].pos)[0][0];
  $('#qzFb').innerHTML = `<div class="fb ${ok ? 't-ok' : 't-bad'}">${icon(ok ? 'check-circle' : 'x-circle', 1)}<div class="grow small"><b>${ok ? 'Chính xác!' : 'Chưa đúng'}</b> “${ex}” — ${exvi}</div><button class="btn ${ok ? 'ghost' : 'primary'} sm" data-act="qzNext">Tiếp <kbd style="margin-left:4px">Enter</kbd></button></div>`;
  qzSide();
}

// Ngữ cảnh: nhớ đang học từ đâu (bộ từ, từ đã lưu) để có nút quay lại
let VC = null;
function vCtx() {
  const c = $('#vCrumb'); c.hidden = !VC;
  if (VC) { c.dataset.go = VC.go; if (VC.id) c.dataset.id = VC.id; else delete c.dataset.id; $('span', c).textContent = VC.label; }
  $('#vOver').textContent = VC ? VC.over : 'Từ vựng';
  $('#vTitle').textContent = VC ? VC.title : 'Học theo bộ, tra, ôn đúng lúc';
}

Object.assign(ACT, {
  report() { toast('Mở form báo lỗi nội dung', null, 'flag'); }, reportMissing() { toast('Đã ghi nhận từ còn thiếu', null, 'check'); },
  fcAgain: fcStart, fcDone() { completeTask('srs'); }, qzNext() { QZ.i++; QZ.last = null; qzRender(); }, qzAgain: qzStart,
});

Shell.hooks.syncSaves = () => { if (vEntryWord) renderMem(vEntryWord); };

Shell.click((t) => {
  const vt = t.closest('#vTabs button'); if (vt) { if (VC && vt.dataset.t !== 'review') { VC = null; vCtx(); } setVocabTab(vt.dataset.t); return true; }
  const wr = t.closest('[data-word]'); if (wr) { vOpen(wr.dataset.word); if (wr.closest('#vEntry')) $('#vEntry').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); return true; }
  const pos = t.closest('[data-pos]'); if (pos) { vOpen(vEntryWord, pos.dataset.pos); return true; }
  if (t.closest('#fc')) { fcFlip(); return true; }
  const gq = t.closest('[data-q]'); if (gq) { fcGrade(+gq.dataset.q); return true; }
  const op = t.closest('[data-opt]'); if (op) { qzAnswer(op.dataset.opt); return true; }
  if (!t.closest('.search-xl') && !t.closest('#vSugg')) $('#vSugg').style.display = 'none';
});
Shell.key((e) => {
  if ((e.key === 'Enter' || e.code === 'Space') && document.activeElement?.id === 'fc') { e.preventDefault(); fcFlip(); return true; }
});
Shell.key((e) => {
  if ($('#vReview').style.display !== 'none') {
    if (e.code === 'Space') { e.preventDefault(); fcFlip(); } const m = { 1: 1, 2: 3, 3: 4, 4: 5 }[e.key]; if (m && FC.flipped) fcGrade(m);
  }
  if ($('#vQuiz').style.display !== 'none') {
    const k = +e.key; if (k >= 1 && k <= 4) { const b = $$('.opt')[k - 1]; if (b) qzAnswer(b.dataset.opt); } if (e.key === 'Enter' && QZ.answered) ACT.qzNext();
  }
}, 'late');
$('#vSearch').addEventListener('input', e => vSearch(e.target.value));
$('#vSearch').addEventListener('keydown', e => {
  const btns = $$('#vSugg button[data-word]'); if (!btns.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); vSel = (vSel + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length; btns.forEach((b, i) => b.classList.toggle('hl', i === vSel)); }
  if (e.key === 'Enter') { e.preventDefault(); vOpen(btns[vSel].dataset.word); }
});

(function boot() {
  const q = qs();
  VC = q.get('ctx') ? sess.get('vc', null) : null; vCtx();
  $('#dueBadge').textContent = due;
  renderDecks(); vOpen('present'); $('#vSugg').style.display = 'none';
  if (q.get('tab')) setVocabTab(q.get('tab'));
  if (q.get('word')) vOpen(q.get('word'));
})();
