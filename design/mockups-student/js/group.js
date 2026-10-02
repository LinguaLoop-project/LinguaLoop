/* Học một bài trong bộ từ: 5 cách học (Đoán, Flashcard, Trắc nghiệm, Trắc nghiệm đảo, Lặp lại) */
'use strict';
const GRP_WORDS = ['reliable', 'through', 'borrow', 'although', 'schedule', 'delay', 'latte', 'thin', 'present', 'go'];
const GRP_MODES = [['guess', 'chat-teardrop-dots', 'Đoán'], ['flash', 'cards', 'Flashcard'], ['quiz', 'list-checks', 'Trắc nghiệm'], ['quizrev', 'arrows-left-right', 'Trắc nghiệm đảo'], ['repeat', 'speaker-high', 'Lặp lại']];
const GRP_MODE_NAME = { guess: 'Đoán nghĩa', flash: 'Flashcard', quiz: 'Trắc nghiệm', quizrev: 'Trắc nghiệm đảo', repeat: 'Lặp lại' };
const GS = { deck: null, gi: 0, mode: sess.get('grpmode', 'guess'), pool: [], items: [], fc: [], i: 0, right: 0, answered: false, flipped: false };
function renderGroup(slug, gi) {
  const d = deckOf(slug) || DECKS[0]; setCurDeck(d.slug);
  const [m, r] = d.st || [0, 0], per = Math.round(d.cards / d.groups), doneG = Math.floor((m + r) / per);
  gi = Math.max(0, Math.min(gi == null ? doneG : gi, d.groups - 1));
  const lock = d.pro && !isPro(), newMode = GS.deck !== d.slug || GS.gi !== gi;
  GS.deck = d.slug; GS.gi = gi;
  $('#grpHead').innerHTML = `<div class="crumbs rv"><button data-go="vocab">Từ vựng</button>${icon('caret-right')}<button data-go="deck" data-id="${d.slug}">${esc(d.name)}</button>${icon('caret-right')}<span>Bài ${gi + 1}</span></div>
    <div class="row between w" style="margin:8px 0 20px;gap:16px">
      <div><div class="overline">${esc(d.name)}</div><h1>Bài ${gi + 1} · ${esc(GROUP_NAMES[gi % GROUP_NAMES.length])}</h1></div>
      <div class="seg" id="grpModeSeg" role="group" aria-label="Cách học">${GRP_MODES.map(([k, ic, l]) => `<button data-grpmode="${k}" class="${GS.mode === k ? 'on' : ''}">${icon(ic)}<span class="hide-m">${l}</span></button>`).join('')}</div>
    </div>`;
  const winSize = Math.min(d.groups, 12), s0 = Math.max(0, Math.min(gi - Math.floor(winSize / 2), d.groups - winSize));
  $('#grpSide').innerHTML = `<div class="overline" style="padding:4px 12px 8px">Danh sách bài${d.groups > winSize ? ` · ${s0 + 1}–${s0 + winSize}/${d.groups}` : ''}</div>` + Array.from({ length: winSize }, (_, k) => { const i = s0 + k;
    const cls = lock && i >= 2 ? 'locked' : i < doneG ? 'done' : i === gi ? 'cur' : '';
    return `<button class="grp-nav-it ${cls}" data-go="group" data-id="${d.slug}" data-g="${i}" ${cls === 'cur' ? 'aria-current="page"' : ''}>${icon(cls === 'done' ? 'check-circle' : cls === 'locked' ? 'lock-simple' : 'circle', cls === 'done' || cls === 'cur')}<span>Bài ${i + 1} · ${esc(GROUP_NAMES[i % GROUP_NAMES.length])}</span></button>`;
  }).join('');
  requestAnimationFrame(() => segMove($('#grpModeSeg')));
  if (newMode) grpStart(); else grpRender();
  reveal($('#v-group'));
}
function grpStart() {
  GS.pool = GRP_WORDS.slice(); GS.i = 0; GS.right = 0; GS.answered = false; GS.flipped = false;
  if (GS.mode === 'flash') GS.fc = GS.pool.map((w, i) => ({ w, ef: 2.5, interval: i % 3 === 0 ? 6 : 1, reps: i % 3 === 0 ? 2 : 1 }));
  else if (GS.mode !== 'repeat') GS.items = shuffle(GS.pool).map(w => ({ w, opts: shuffle([w, ...shuffle(GS.pool.filter(x => x !== w)).slice(0, 3)]) }));
  grpRender();
}
function grpRender() { if (GS.mode === 'flash') grpRenderFlash(); else if (GS.mode === 'repeat') grpRenderRepeat(); else grpRenderChoice(); }
function grpDoneScreen(scoreLine) {
  const d = deckOf(GS.deck) || DECKS[0], hasNext = GS.gi < d.groups - 1;
  return `<div class="grp-stage grp-done card card-highlight" style="text-align:center;padding:40px">${mascot('celebrate', 120).replace('class="mascot', 'style="margin:0 auto" class="mascot')}
    <h2 style="margin-top:16px">Tuyệt vời!</h2>
    <p class="muted" style="margin:6px 0 4px">Bạn đã xong ${esc(GRP_MODE_NAME[GS.mode])} cho Bài ${GS.gi + 1}</p>
    <p class="small muted" style="margin-bottom:20px">${scoreLine}</p>
    <div class="row w" style="justify-content:center">
      <button class="btn ghost" data-act="grpWords">${icon('list-bullets')}Xem từ vựng</button>
      <button class="btn ghost" data-act="grpRestart">${icon('arrow-counter-clockwise')}Học lại từ đầu</button>
      ${hasNext ? `<button class="btn primary" data-act="grpNextGroup">Bài tiếp theo<i class="ph ph-arrow-right arr" aria-hidden="true"></i></button>` : `<button class="btn primary" data-go="deck" data-id="${d.slug}">${icon('check')}Về bộ từ</button>`}
    </div></div>`;
}
// Đoán / Trắc nghiệm / Trắc nghiệm đảo — dùng chung UI chọn 1 trong 4 đáp án
function grpRenderChoice() {
  if (GS.i >= GS.items.length) { $('#grpMain').innerHTML = grpDoneScreen(`${GS.right}/${GS.items.length} câu đúng`); if (GS.right >= Math.ceil(GS.items.length * .6)) confetti(); return; }
  const reverse = GS.mode === 'quizrev', hideWord = GS.mode === 'guess', it = GS.items[GS.i], d = DICT[it.w];
  const prompt = reverse
    ? `<div class="card" style="padding:28px;text-align:center"><div class="overline">Chọn từ đúng</div><div class="h1" style="margin-top:8px">${esc(firstVi(it.w))}</div></div>`
    : `<div class="card has-img" style="padding:28px"><div class="row" style="gap:24px">${vimg(it.w, 'sm')}<div><div class="overline">${hideWord ? 'Nghe rồi chọn nghĩa đúng' : 'Chọn nghĩa đúng'}</div>${hideWord ? '' : `<div class="display-lg text-gradient">${it.w}</div>`}<div style="margin-top:12px">${aud(it.w, hideWord ? 'Nghe từ' : `<span class="ipa">${d.uk}</span>`)}</div></div></div></div>`;
  $('#grpMain').innerHTML = `<div class="grp-stage"><div class="row" style="margin-bottom:16px"><div class="bar grow"><i style="width:${GS.i / GS.items.length * 100}%"></i></div><b class="small">${GS.i + 1}/${GS.items.length}</b></div>
    ${prompt}
    <div class="col g8" style="margin-top:16px">${it.opts.map((o, k) => `<button class="opt" data-gopt="${o}"><kbd>${k + 1}</kbd>${reverse ? esc(o) : esc(firstVi(o))}</button>`).join('')}</div>
    <div id="grpFb" style="margin-top:12px"></div></div>`;
  GS.answered = false;
}
function grpAnswer(o) {
  if (GS.answered) return; GS.answered = true;
  const it = GS.items[GS.i], ok = o === it.w; if (ok) GS.right++;
  $$('#grpMain .opt').forEach(b => {
    if (b.dataset.gopt === it.w) { b.classList.add('right'); b.insertAdjacentHTML('beforeend', '<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'); }
    else if (b.dataset.gopt === o) b.classList.add('wrong');
  });
  if (ok) { ting(); xpFly($('#grpMain .opt.right'), 10); }
  const [, , ex, exvi] = Object.values(DICT[it.w].pos)[0][0];
  $('#grpFb').innerHTML = `<div class="fb ${ok ? 't-ok' : 't-bad'}">${icon(ok ? 'check-circle' : 'x-circle', 1)}<div class="grow small"><b>${ok ? 'Chính xác!' : 'Chưa đúng'}</b> “${ex}” — ${exvi}</div><button class="btn ${ok ? 'ghost' : 'primary'} sm" data-act="grpNext">Tiếp <kbd style="margin-left:4px">Enter</kbd></button></div>`;
}
function grpNext() { GS.i++; grpRenderChoice(); }
// Flashcard — lật thẻ, chấm theo SM-2 (dùng chung sm2()/ivl() với Ôn thẻ)
function grpRenderFlash() {
  if (!GS.fc.length) { $('#grpMain').innerHTML = grpDoneScreen(`Nhớ ${GS.right}/${GS.pool.length} thẻ ngay lần đầu`); confetti(); return; }
  const c = GS.fc[0], d = DICT[c.w], [vi, , ex, exvi] = Object.values(d.pos)[0][0], done = GS.pool.length - GS.fc.length;
  $('#grpMain').innerHTML = `<div class="grp-stage"><div class="row" style="margin-bottom:16px"><div class="bar grow"><i style="width:${done / GS.pool.length * 100}%"></i></div><b class="small">${done}/${GS.pool.length}</b></div>
    <div class="entry-wrap">${obj('star', '--s:52px;top:-24px;right:-14px', 'learn')}
    <div class="fc-wrap"><div class="fc" id="grpFc" tabindex="0" role="button" aria-label="Thẻ ${c.w}, bấm để lật">
      <div class="face has-img"><span class="badge t-pri">Bài ${GS.gi + 1} · ${esc(GROUP_NAMES[GS.gi % GROUP_NAMES.length])}</span>${vimg(c.w, 'sm')}<div class="display-lg text-gradient">${c.w}</div>${aud(c.w, `<span class="ipa">${d.uk}</span>`)}<span class="small muted">Chạm thẻ hoặc <kbd>Space</kbd> để lật</span></div>
      <div class="face back"><span class="badge">${Object.keys(d.pos)[0]}</span><div class="h1">${vi}</div><p><i>“${ex}”</i></p><p class="small muted">${exvi}</p></div>
    </div></div></div>
    <div class="grades" id="grpGrades" style="visibility:${GS.flipped ? 'visible' : 'hidden'}">
      <button class="t-bad" data-gq="1">Quên<small>${ivl(c, 1)}</small></button><button class="t-warn" data-gq="3">Khó<small>${ivl(c, 3)}</small></button>
      <button class="t-ok" data-gq="4">Được<small>${ivl(c, 4)}</small></button><button class="t-info" data-gq="5">Dễ<small>${ivl(c, 5)}</small></button></div></div>`;
}
function grpFlip() { const f = $('#grpFc'); if (!f) return; GS.flipped = !GS.flipped; f.classList.toggle('flip', GS.flipped); $('#grpGrades').style.visibility = 'visible'; }
function grpGrade(q) {
  if (!GS.flipped) return grpFlip();
  const c = GS.fc.shift(), n = sm2(c, q), f = $('#grpFc'); f.classList.add(q < 3 ? 'out-l' : 'out-r');
  if (q < 3) GS.fc.push({ ...c, ...n, again: true }); else if (!c.again) GS.right++;
  GS.flipped = false; setTimeout(grpRenderFlash, 300);
}
// Lặp lại — nghe rồi đọc theo, không chấm điểm, chỉ đánh dấu đã luyện
function grpRenderRepeat() {
  if (GS.i >= GS.pool.length) { $('#grpMain').innerHTML = grpDoneScreen(`Đã lặp lại ${GS.pool.length}/${GS.pool.length} từ`); confetti(); return; }
  const w = GS.pool[GS.i], d = DICT[w];
  $('#grpMain').innerHTML = `<div class="grp-stage"><div class="row" style="margin-bottom:16px"><div class="bar grow"><i style="width:${GS.i / GS.pool.length * 100}%"></i></div><b class="small">${GS.i + 1}/${GS.pool.length}</b></div>
    <div class="card has-img" style="padding:40px;text-align:center">${vimg(w)}<div class="display-lg text-gradient" style="margin-top:16px">${w}</div>
      <div style="margin-top:8px">${aud(w, `<span class="ipa">${d.uk}</span>`)}</div>
      <p class="muted" style="margin-top:12px">${esc(firstVi(w))}</p>
      <button class="btn primary lg" style="margin-top:24px" data-act="grpRepeatNext"><i class="ph-fill ph-microphone"></i>Đã đọc theo, tiếp theo</button></div></div>`;
}
function grpWords() {
  $('#grpMain').innerHTML = `<div class="grp-stage card rv"><div class="row between"><h3>Từ vựng Bài ${GS.gi + 1}</h3><button class="btn ghost sm" data-act="grpBack">${icon('arrow-left')}Quay lại</button></div>
    <table class="wtab" style="margin-top:12px"><thead><tr><th>Từ</th><th>Nghĩa</th><th><span class="sr-only">Nghe</span></th></tr></thead><tbody>
    ${GS.pool.map(w => `<tr><td><b>${w}</b><div class="ipa small muted">${DICT[w].uk}</div></td><td class="small">${firstVi(w)}</td><td style="text-align:right"><button class="icon-btn sm" data-say="${w}" aria-label="Nghe ${w}">${icon('speaker-high')}</button></td></tr>`).join('')}
    </tbody></table></div>`;
}

Object.assign(ACT, {
  grpNext, grpRepeatNext() { GS.i++; grpRenderRepeat(); }, grpWords, grpBack: grpRender,
  grpRestart() { grpStart(); }, grpNextGroup() { go('group', { id: GS.deck, g: GS.gi + 1 }); },
});

Shell.click((t) => {
  const gm = t.closest('#grpModeSeg [data-grpmode]'); if (gm) { GS.mode = gm.dataset.grpmode; sess.set('grpmode', GS.mode); $$('#grpModeSeg button').forEach(b => b.classList.toggle('on', b === gm)); segMove($('#grpModeSeg')); grpStart(); return true; }
  if (t.closest('#grpFc')) { grpFlip(); return true; }
  const ggq = t.closest('[data-gq]'); if (ggq) { grpGrade(+ggq.dataset.gq); return true; }
  const gop = t.closest('[data-gopt]'); if (gop) { grpAnswer(gop.dataset.gopt); return true; }
});
Shell.key((e) => {
  if ((e.key === 'Enter' || e.code === 'Space') && document.activeElement?.id === 'grpFc') { e.preventDefault(); grpFlip(); return true; }
});
Shell.key((e) => {
  if (GS.mode === 'flash') { if (e.code === 'Space') { e.preventDefault(); grpFlip(); } const m = { 1: 1, 2: 3, 3: 4, 4: 5 }[e.key]; if (m && GS.flipped) grpGrade(m); }
  else if (GS.mode !== 'repeat') { const k = +e.key; if (k >= 1 && k <= 4) { const b = $$('#grpMain .opt')[k - 1]; if (b) grpAnswer(b.dataset.gopt); } if (e.key === 'Enter' && GS.answered) grpNext(); }
  else if (e.key === 'Enter') { ACT.grpRepeatNext(); }
}, 'late');

(function boot() {
  const q = qs();
  renderGroup(q.get('id') || 'oxford-a1', q.get('g') != null ? +q.get('g') : undefined);
})();
