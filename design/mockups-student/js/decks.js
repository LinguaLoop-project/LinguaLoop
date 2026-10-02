/* Bộ từ vựng: danh sách bộ (tab Bộ từ ở vocab.html) và chi tiết một bộ (deck.html) (S-05, S-06) */
'use strict';
const DF = { tag: 'all', q: '' };
const dIcon = (d, cls = 'dicon') => `<div class="${cls}"><svg viewBox="0 0 200 200" aria-hidden="true"><use href="#o-orb"/></svg>${duo(d.ic)}</div>`;
function stBar(d) {
  const [m, r, l] = d.st || [0, 0, 0], pc = (x) => (x / d.cards * 100).toFixed(1);
  return `<div class="stbar" role="img" aria-label="Đã thuộc ${m}, đang ôn ${r}, đang học ${l} trên ${d.cards} thẻ"><i class="s-mastered" style="width:${pc(m)}%"></i><i class="s-reviewing" style="width:${pc(r)}%"></i><i class="s-learning" style="width:${pc(l)}%"></i></div>`;
}
function dcard(d) {
  const [m, r, l] = d.st || [0, 0, 0];
  return `<article class="card lift dcard" data-go="deck" data-id="${d.slug}" tabindex="0" aria-label="Bộ ${esc(d.name)}">
    <div class="dhead">${dIcon(d)}<div class="grow"><h3>${esc(d.name)}</h3><div class="small muted">${esc(d.vi)}</div></div></div>
    <div class="row w g8">${d.cefr ? `<span class="badge cefr ${d.cefr}">${d.cefr}</span>` : ''}${d.pro ? `<span class="badge pro">${icon('crown-simple', 1)}PRO</span>` : ''}<span class="small muted">${fmtNum(d.cards)} thẻ · ${d.groups} bài</span></div>
    ${d.st ? `<div>${stBar(d)}<div class="row between small" style="margin-top:6px"><span class="muted">Đã thuộc ${m}/${fmtNum(d.cards)}</span><span class="muted">${Math.round((m + r + l) / d.cards * 100)}% đã học</span></div></div>` : '<div class="small muted">Chưa học bộ này</div>'}
    <button class="btn ${d.st ? 'primary' : 'ghost'} sm" style="margin-top:auto" data-go="deck" data-id="${d.slug}">${d.st ? 'Tiếp tục' : 'Xem bộ từ'}<i class="ph ph-arrow-right arr" aria-hidden="true"></i></button></article>`;
}
function renderDecks() {
  const box = $('#vDecks');
  if (!box.dataset.ready) {
    const all = DECKS.concat(MY_DECKS).filter(d => d.st), sum = (k) => all.reduce((a, d) => a + d.st[k], 0);
    box.innerHTML = `
      <div class="sum-wrap rv">${obj('star', '--s:56px;top:-26px;right:-12px;--d:-2s', 'm-hide')}
        <div class="card glass sum-card">
          <div class="t-bad"><span class="lbl">${icon('clock-countdown', 1)}Đến hạn ôn hôm nay</span><span class="big-num count" id="dkDue">${due}</span><button class="btn primary sm" data-act="reviewDue" style="align-self:flex-start">Ôn ngay<i class="ph ph-arrow-right arr" aria-hidden="true"></i></button></div>
          <div class="t-warn"><span class="lbl">${icon('lightning', 1)}Đang học</span><span class="big-num">${sum(2)}</span><span class="small muted">thẻ ở ${all.length} bộ</span></div>
          <div class="t-info"><span class="lbl">${icon('arrows-clockwise', 1)}Đang ôn</span><span class="big-num">${sum(1)}</span><span class="small muted">khoảng ôn đang giãn dần</span></div>
          <div class="t-ok"><span class="lbl">${icon('seal-check', 1)}Đã thuộc</span><span class="big-num">${sum(0)}</span><span class="small muted">từ nhớ lâu dài</span></div>
        </div></div>
      ${secHead('lightning', 'Đang học', `${all.length} bộ`)}<div class="l-row rv">${all.slice(0, 4).map(dcard).join('')}</div>
      <div class="sec-head rv"><h2><span class="sec-ic">${duo('stack')}</span>Khám phá bộ từ</h2></div>
      <div class="toolbar rv"><div class="search-sm grow"><i class="ph ph-magnifying-glass"></i><input id="dkSearch" placeholder="Tìm bộ từ: Oxford, TOEIC, IELTS…" autocomplete="off" aria-label="Tìm bộ từ"></div></div>
      <div class="chips-row rv" id="dkTags"></div>
      <div id="dkList"></div>`;
    box.dataset.ready = 1;
    if (Shell.page === 'vocab') reveal(box);
  }
  $('#dkTags').innerHTML = ['all', ...DECK_TAGS].map(t => `<button class="chip lift ${DF.tag === t ? 'on' : ''}" data-dtag="${t}">${t === 'all' ? 'Tất cả' : '#' + t}</button>`).join('');
  const q = DF.q.trim().toLowerCase();
  const match = (d) => (DF.tag === 'all' || d.tags.includes(DF.tag)) && (!q || (d.name + ' ' + d.vi).toLowerCase().includes(q));
  let html = '';
  if (DF.tag !== 'all' || q) {
    const r = DECKS.filter(match);
    html = r.length ? `<div class="dgrid">${r.map(dcard).join('')}</div>` : emptyState('Không tìm thấy bộ từ', 'Thử tag khác hoặc từ khoá ngắn hơn.');
  } else {
    DECK_CATS.forEach(([c, name, ic]) => { const r = DECKS.filter(d => d.cat === c);
      html += `<div class="sec-head"><h2 style="font-size:20px"><span class="sec-ic">${duo(ic)}</span>${name} <small>${r.length} bộ</small></h2></div><div class="dgrid">${r.map(dcard).join('')}</div>`; });
    html += `<div class="sec-head"><h2 style="font-size:20px"><span class="sec-ic">${duo('user-circle')}</span>Bộ của tôi <small>${MY_DECKS.length} bộ</small></h2></div>
      <div class="dgrid">${MY_DECKS.map(dcard).join('')}<button class="card dcard dnew" data-act="newDeck">${icon('plus-circle')}<b>Tạo bộ từ mới</b><span class="small">Gom từ đã lưu hoặc tự nhập thẻ</span></button></div>`;
  }
  $('#dkList').innerHTML = html;
}
function renderDeck(slug) {
  setCurDeck((deckOf(slug) || DECKS[0]).slug);
  const d = deckOf(slug) || DECKS[0], [m, r, l] = d.st || [0, 0, 0], nw = d.cards - m - r - l, per = Math.round(d.cards / d.groups);
  const doneG = Math.floor((m + r) / per), lock = d.pro && !isPro(), cat = (DECK_CATS.find(c => c[0] === d.cat) || [0, 'Bộ của tôi'])[1];
  const s0 = Math.max(0, Math.min(doneG - 2, d.groups - 8)); // hiện quanh bài đang học
  const rows = Array.from({ length: Math.min(d.groups, 8) }, (_, k) => { const i = k + s0;
    const cls = lock && i >= 2 ? 'locked' : i < doneG ? 'done' : i === doneG && d.st ? 'cur' : '';
    const p = i < doneG ? 100 : i === doneG && d.st ? 40 : 0;
    return `<div class="grp-row ${cls}"><span class="gn">${cls === 'done' ? icon('check', 1) : cls === 'locked' ? icon('lock-simple', 1) : i + 1}</span>
      <div><b>Bài ${i + 1} · ${GROUP_NAMES[i % GROUP_NAMES.length]}</b><div class="small muted">${per} thẻ${cls === 'done' ? ' · đã thuộc hết' : cls === 'cur' ? ' · còn ' + Math.round(per * .6) + ' thẻ mới' : ''}</div></div>
      <div class="gp"><div class="bar thin ${cls === 'done' ? 't-ok' : ''}"><i style="width:${p}%"></i></div></div>
      ${cls === 'locked' ? `<button class="btn ghost sm" data-act="togglePro">${icon('crown-simple', 1)}Pro</button>` : `<button class="btn ${cls === 'cur' ? 'primary' : 'ghost'} sm" data-act="learnNew" data-g="${i}">${cls === 'done' ? 'Ôn lại' : cls === 'cur' ? 'Học tiếp' : 'Học'}</button>`}</div>`; }).join('');
  const sample = ['present', 'reliable', 'borrow', 'schedule', 'although', 'delay', 'through', 'thin'];
  $('#dkBody').innerHTML = `
    <div class="crumbs rv"><button data-go="vocab">Từ vựng</button>${icon('caret-right')}<button data-go="vocab">${cat}</button>${icon('caret-right')}<span>${esc(d.name)}</span></div>
    <div class="card glass rv" style="padding:28px;margin-bottom:24px">
      <div class="tp-hero" style="margin:0">${dIcon(d, 'tp-ic')}
        <div class="grow"><div class="overline">${cat}</div><h1>${esc(d.name)}</h1><p class="muted">${esc(d.vi)}</p>
          <div class="row w g8" style="margin-top:12px">${d.cefr ? `<span class="badge cefr ${d.cefr}">${d.cefr}</span>` : ''}${d.pro ? `<span class="badge pro">${icon('crown-simple', 1)}PRO</span>` : ''}<span class="small muted">${fmtNum(d.cards)} thẻ · ${d.groups} bài · khoảng ${per} thẻ mỗi bài</span>${d.tags.map(t => `<span class="chip">#${t}</span>`).join('')}</div></div>
        <div class="col g12" style="min-width:280px;flex:1;max-width:380px">
          ${stBar(d)}
          <div class="st-legend"><span class="t-ok"><i></i>Đã thuộc <b>${m}</b></span><span class="t-info"><i></i>Đang ôn <b>${r}</b></span><span class="t-warn"><i></i>Đang học <b>${l}</b></span><span class="t-mut"><i></i>Mới <b>${fmtNum(nw)}</b></span></div>
          <div class="row w">${lock ? `<button class="btn primary" data-act="togglePro">${icon('crown-simple', 1)}Mở khoá với Pro</button>` : `<button class="btn primary" data-act="learnNew">${icon('play', 1)}Học từ mới</button>`}${d.st ? `<button class="btn ghost" data-act="reviewDue">${icon('arrows-clockwise')}Ôn ${Math.min(due, 12)} thẻ đến hạn</button>` : ''}</div>
        </div></div></div>
    <div class="g-learn">
      <div class="card rv"><div class="row between" style="margin-bottom:8px"><h3>Các bài trong bộ</h3><span class="small muted">${doneG}/${d.groups} bài đã xong</span></div>${rows}
        ${d.groups > 8 ? `<div class="row between" style="margin-top:12px"><span class="small muted">Đang hiện bài ${s0 + 1}–${s0 + Math.min(d.groups, 8)} / ${d.groups}</span><button class="btn text sm" data-act="tpMore">Xem tất cả bài${icon('caret-down')}</button></div>` : ''}</div>
      <aside class="col g24">
        <div class="card rv"><div class="overline">Một số từ trong bộ</div>
          <table class="wtab"><thead><tr><th>Từ</th><th>Nghĩa</th><th><span class="sr-only">Nghe</span></th></tr></thead><tbody>
          ${sample.map(w => `<tr><td><b>${w}</b><div class="ipa small muted">${DICT[w].uk}</div></td><td class="small">${firstVi(w)}</td><td style="text-align:right"><button class="icon-btn sm" data-say="${w}" aria-label="Nghe ${w}">${icon('speaker-high')}</button></td></tr>`).join('')}</tbody></table></div>
        <div class="card rv"><div class="overline">Cách học bộ này</div><ul class="tips small">
          <li>Mỗi lượt học một bài khoảng ${per} thẻ mới: xem ảnh, nghe, đoán nghĩa.</li>
          <li>Thẻ quay lại đúng lúc bạn sắp quên (SM-2). Nhớ càng tốt, khoảng ôn càng giãn.</li>
          <li>Xong bài, làm trắc nghiệm nhanh để kiểm tra.</li></ul></div>
      </aside>
    </div>`;
}


Object.assign(ACT, {
  newDeck() { toast('Tạo bộ mới: đặt tên, chọn từ đã lưu hoặc nhập thẻ', null, 'plus-circle'); },
  // Bấm vào một bài trong bộ → màn học riêng của bài đó (5 cách học)
  learnNew(b) {
    const d = deckOf(curDeck) || DECKS[0]; let g = b && b.dataset.g != null ? +b.dataset.g : null;
    if (g == null) { const [m, r] = d.st || [0, 0], per = Math.round(d.cards / d.groups); g = Math.floor((m + r) / per); }
    go('group', { id: d.slug, g });
  },
});

Shell.click((t) => {
  const dtg = t.closest('[data-dtag]'); if (dtg) { DF.tag = dtg.dataset.dtag; renderDecks(); return true; }
});
document.addEventListener('input', e => { if (e.target.id === 'dkSearch') { DF.q = e.target.value; renderDecks(); } });

if (Shell.page === 'deck') {
  renderDeck(qs().get('id') || 'oxford-a1');
  reveal($('#v-deck'));
}
