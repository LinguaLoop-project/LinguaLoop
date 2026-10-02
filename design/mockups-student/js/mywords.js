/* Từ & câu đã lưu: từ (user_saved_words), câu cần ôn (user_sentence_review), ghi chú (sentence_notes) */
'use strict';
// word, cefr, ipa, nghĩa, nguồn (dictionary | lesson | manual), bài học nguồn, trạng thái, lần ôn tới, lưu lúc
const MYWORDS = [
  ['latte', 'B1', '/ˈlɑːteɪ/', 'cà phê latte', 'lesson', 'ordering-coffee', 'learning', 'Hôm nay', 'Hôm qua'],
  ['oat milk', 'B1', '/ˈəʊt mɪlk/', 'sữa yến mạch', 'lesson', 'ordering-coffee', 'new', 'Hôm nay', 'Hôm qua'],
  ['boarding pass', 'A2', '/ˈbɔːdɪŋ pɑːs/', 'thẻ lên máy bay', 'lesson', 'airport-checkin', 'new', 'Hôm nay', 'Hôm qua'],
  ['schedule', 'B1', '/ˈʃedjuːl/', 'lịch trình, thời gian biểu', 'lesson', 'airport-checkin', 'learning', 'Hôm nay', '2 ngày trước'],
  ['delay', 'B1', '/dɪˈleɪ/', 'trì hoãn, làm chậm', 'lesson', 'airport-checkin', 'learning', 'Hôm nay', '2 ngày trước'],
  ['present', 'B1', '/ˈpreznt/', 'có mặt, hiện diện', 'dictionary', null, 'reviewing', '2 ngày nữa', '3 ngày trước'],
  ['negotiate', 'B2', '/nɪˈɡəʊʃieɪt/', 'đàm phán, thương lượng', 'manual', null, 'learning', 'Hôm nay', '4 ngày trước'],
  ['reliable', 'B1', '/rɪˈlaɪəbl/', 'đáng tin cậy', 'dictionary', null, 'learning', 'Hôm nay', '5 ngày trước'],
  ['although', 'B1', '/ɔːlˈðəʊ/', 'mặc dù', 'dictionary', null, 'reviewing', 'Hôm nay', '5 ngày trước'],
  ['fair and square', 'B2', '/ˌfeər ən ˈskweə/', 'công bằng, đàng hoàng', 'lesson', 'fair-and-square', 'reviewing', '3 ngày nữa', '1 tuần trước'],
  ['through', 'A2', '/θruː/', 'xuyên qua, thông qua', 'lesson', 'talking-about-job', 'reviewing', '4 ngày nữa', '1 tuần trước'],
  ['resilient', 'C1', '/rɪˈzɪliənt/', 'kiên cường, mau phục hồi', 'manual', null, 'new', 'Ngày mai', '1 tuần trước'],
  ['borrow', 'A2', '/ˈbɒrəʊ/', 'mượn', 'dictionary', null, 'mastered', '24 ngày nữa', '3 tuần trước'],
  ['thin', 'A2', '/θɪn/', 'mỏng, gầy', 'lesson', 'letter-to-mom', 'mastered', '1 tháng nữa', '1 tháng trước'],
  ['go', 'A1', '/ɡəʊ/', 'đi', 'dictionary', null, 'mastered', '2 tháng nữa', '2 tháng trước'],
].map(([w, cefr, ipa, vi, src, from, st, next, ago]) => ({ w, cefr, ipa, vi, src, from, st, next, ago }));
// user_sentence_review: câu, bài, chế độ, lý do, điểm lần cuối, thêm lúc
const REVIEW_SENTS = [
  ["That'll be five dollars and twenty cents.", 'ordering-coffee', 'dictation', 'low_score', 48, 'Hôm nay'],
  ["I think this is the third time I've been here.", 'airport-checkin', 'shadowing', 'many_mistakes', 63, 'Hôm nay'],
  ['Could I get that to go?', 'ordering-coffee', 'dictation', 'replayed_often', 80, 'Hôm qua'],
  ['The flight to Da Nang has been delayed.', 'airport-checkin', 'dictation', 'low_score', 52, '3 ngày trước'],
  ['Would you like a window or an aisle seat?', 'airport-checkin', 'shadowing', 'manual', 71, '4 ngày trước'],
].map(([s, l, mode, why, score, at]) => ({ s, l, mode, why, score, at }));
const REASON = { low_score: ['Điểm thấp', 't-bad'], many_mistakes: ['Nhiều lỗi', 't-bad'], replayed_often: ['Nghe lại nhiều lần', 't-warn'], manual: ['Tự đánh dấu', 't-pri'] };
const ST = { new: ['Mới', 't-mut'], learning: ['Đang học', 't-warn'], reviewing: ['Đang ôn', 't-info'], mastered: ['Đã thuộc', 't-ok'] };
const MW = { tab: 'words', q: '', src: 'all', st: 'all', sel: new Set() };
function mwSync() { // từ lưu từ màn Tra từ cũng xuất hiện ở đây
  [...saved].map(k => k.split('#')[0]).forEach(w => { if (DICT[w] && !MYWORDS.some(x => x.w === w)) MYWORDS.unshift({ w, cefr: DICT[w].cefr, ipa: DICT[w].uk, vi: firstVi(w), src: 'dictionary', from: null, st: 'new', next: 'Hôm nay', ago: 'Vừa xong' }); });
}
function mwFiltered() {
  const q = MW.q.trim().toLowerCase();
  return MYWORDS.filter(x => (MW.src === 'all' || x.src === MW.src)
    && (MW.st === 'all' || (MW.st === 'due' ? x.next === 'Hôm nay' : MW.st === 'mastered' ? x.st === 'mastered' : x.st !== 'mastered'))
    && (!q || (x.w + ' ' + x.vi).toLowerCase().includes(q)));
}
function renderMyWords() {
  mwSync();
  $$('#mwTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === MW.tab));
  $('#mwCntW').textContent = MYWORDS.length; $('#mwCntS').textContent = REVIEW_SENTS.length; $('#mwCntN').textContent = NOTES.length;
  const box = $('#mwBody');
  if (MW.tab === 'words') {
    const dueN = MYWORDS.filter(x => x.next === 'Hôm nay').length, cnt = (f) => MYWORDS.filter(f).length;
    box.innerHTML = `
      <div class="mw-stats rv">${obj('torus', '--s:60px;top:-30px;right:-14px;--d:-3s', 'm-hide')}
        <div class="card mw-stat t-pri"><span class="lbl">${icon('bookmark-simple', 1)}Đã lưu</span><span class="big-num">${MYWORDS.length}</span><span class="small muted">từ và cụm từ</span></div>
        <div class="card mw-stat t-bad"><span class="lbl">${icon('clock-countdown', 1)}Đến hạn hôm nay</span><span class="big-num">${dueN}</span><button class="btn primary sm" data-act="reviewDue" style="align-self:flex-start">Ôn ngay<i class="ph ph-arrow-right arr" aria-hidden="true"></i></button></div>
        <div class="card mw-stat t-warn"><span class="lbl">${icon('lightning', 1)}Đang học</span><span class="big-num">${cnt(x => x.st !== 'mastered')}</span><span class="small muted">mới, đang học, đang ôn</span></div>
        <div class="card mw-stat t-ok"><span class="lbl">${icon('seal-check', 1)}Đã thuộc</span><span class="big-num">${cnt(x => x.st === 'mastered')}</span><span class="small muted">khoảng ôn trên 3 tuần</span></div>
      </div>
      <div class="toolbar rv">
        <div class="search-sm grow"><i class="ph ph-magnifying-glass"></i><input id="mwSearch" placeholder="Tìm trong từ đã lưu…" autocomplete="off" aria-label="Tìm từ đã lưu" value="${esc(MW.q)}"></div>
        <div class="seg" id="mwSrc" role="group" aria-label="Nguồn">${[['all', 'Mọi nguồn'], ['dictionary', 'Từ điển'], ['lesson', 'Bài học'], ['manual', 'Tự thêm']].map(([v, l]) => `<button data-v="${v}" class="${MW.src === v ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="seg" id="mwSt" role="group" aria-label="Trạng thái">${[['all', 'Tất cả'], ['due', 'Đến hạn'], ['learning', 'Đang học'], ['mastered', 'Đã thuộc']].map(([v, l]) => `<button data-v="${v}" class="${MW.st === v ? 'on' : ''}">${l}</button>`).join('')}</div>
        <button class="btn ghost" data-act="addWord">${icon('plus')}Thêm từ</button>
      </div>
      <div class="card wlist rv" id="mwList" style="padding:8px 0"></div>
      <div class="bulk glass" id="mwBulk"><b id="mwSelN"></b><span class="grow"></span>
        <button class="btn primary sm" data-act="mwReview">${icon('cards')}Ôn các từ đã chọn</button><button class="btn ghost sm" data-act="mwToDeck">${icon('stack')}Thêm vào bộ</button><button class="btn ghost sm" data-act="mwUnsave">${icon('trash')}Bỏ lưu</button><button class="icon-btn" data-act="mwClear" aria-label="Bỏ chọn tất cả">${icon('x')}</button></div>`;
    renderWordList();
  } else if (MW.tab === 'sents') {
    box.innerHTML = `
      <div class="tipbox rv" style="margin-bottom:20px">${icon('info')}<span>Câu tự vào danh sách khi bạn được dưới 60 điểm, sai nhiều hoặc nghe lại từ 4 lần trở lên. Luyện lại đạt từ 80 điểm là câu tự rời danh sách.</span></div>
      <div class="row between w rv" style="margin-bottom:12px"><span class="small muted">${REVIEW_SENTS.length} câu đang chờ · ưu tiên câu điểm thấp</span><button class="btn primary" data-start="dictation" data-lesson="ordering-coffee">${icon('play', 1)}Luyện lần lượt</button></div>
      <div class="card rv" style="padding:4px 0">${REVIEW_SENTS.map((x, i) => { const L = lessonOf(x.l), [rn, rt] = REASON[x.why]; return `
        <div class="srow"><div class="col g8"><span class="q">“${esc(x.s)}”</span>
          <div class="row w g8"><span class="chip">${icon(x.mode === 'dictation' ? 'headphones' : 'microphone')}${x.mode === 'dictation' ? 'Nghe chép' : 'Shadowing'}</span><span class="chip ${rt}">${rn}</span><span class="badge ${scoreTone(x.score)}">Lần cuối ${x.score} điểm</span>
            <button class="crumb" style="margin:0" data-go="lesson" data-id="${L.slug}">${icon('play-circle')}${esc(L.title)}</button><span class="small muted">· ${x.at}</span></div></div>
          <div class="row g8"><button class="icon-btn" data-say="${esc(x.s)}" data-lang="en-US" aria-label="Nghe câu">${icon('speaker-high')}</button><button class="btn ghost sm" data-resolve="${i}">${icon('check')}Đã ổn</button><button class="btn primary sm" data-start="${x.mode}" data-lesson="${L.slug}">Luyện lại</button></div></div>`; }).join('') || emptyState('Không còn câu nào cần ôn', 'Làm tốt lắm! Câu điểm thấp sẽ tự xuất hiện ở đây.')}</div>`;
  } else {
    box.innerHTML = `<div class="row between w rv" style="margin-bottom:16px"><span class="small muted">Ghi chú gắn với từng câu. Trong lúc luyện, bấm <kbd>N</kbd> để thêm.</span></div>
      <div class="dgrid rv">${NOTES.map(n => { const L = lessonOf(n.l); return `<div class="card note-card col g12"><q class="small muted" style="font-style:italic">“${esc(n.s)}”</q><p>${n.t}</p>
        <div class="row between"><button class="crumb" style="margin:0" data-go="lesson" data-id="${L.slug}">${icon('play-circle')}${esc(L.title)}</button><span class="small muted">${n.at}</span></div>
        <div class="row g8"><button class="icon-btn" data-act="addNote" aria-label="Sửa ghi chú">${icon('pencil-simple')}</button><button class="icon-btn" data-act="delNote" aria-label="Xoá ghi chú">${icon('trash')}</button></div></div>`; }).join('')}</div>`;
  }
  if (Shell.page === 'mywords') reveal(box);
  requestAnimationFrame(segAll);
}
function renderWordList() {
  const r = mwFiltered(), allSel = r.length && r.every(x => MW.sel.has(x.w)), someSel = r.some(x => MW.sel.has(x.w));
  const src = (x) => x.src === 'lesson' ? `${icon('play-circle')}<span>${esc(lessonOf(x.from).title)}</span>` : x.src === 'manual' ? `${icon('pencil-simple')}<span>Tự thêm</span>` : `${icon('book-open-text')}<span>Từ điển</span>`;
  $('#mwList').innerHTML = !r.length ? emptyState('Không có từ nào khớp', 'Đổi bộ lọc, hoặc tra từ mới rồi bấm lưu.', `<button class="btn ghost" data-go="vocab">Tra từ</button>`) : `
    <div class="wrow whead"><div class="c-cb"><button class="cbox" role="checkbox" aria-checked="${allSel ? 'true' : someSel ? 'mixed' : 'false'}" data-cb="*" aria-label="Chọn tất cả"><span>${allSel ? icon('check', 1) : someSel ? icon('minus', 1) : ''}</span></button></div><div>Từ</div><div>Nghĩa</div><div class="c-src">Nguồn</div><div>Trạng thái</div><div></div></div>
    ${r.map(x => { const sel = MW.sel.has(x.w), [sn, stn] = ST[x.st]; return `<div class="wrow ${sel ? 'sel' : ''}">
      <div class="c-cb"><button class="cbox" role="checkbox" aria-checked="${sel}" data-cb="${esc(x.w)}" aria-label="Chọn ${esc(x.w)}"><span>${sel ? icon('check', 1) : ''}</span></button></div>
      <div class="c-word w"><b>${esc(x.w)}</b><span class="badge cefr ${x.cefr}">${x.cefr}</span><span class="ipa small muted">${x.ipa}</span></div>
      <div class="c-mean">${esc(x.vi)}</div>
      <div class="c-src"><div class="src">${src(x)}</div><div class="small muted" style="margin:2px 0 0 26px">Lưu ${x.ago.toLowerCase()}</div></div>
      <div class="c-st"><span class="badge ${stn}">${sn}</span><span class="small ${x.next === 'Hôm nay' ? '' : 'muted'}" style="${x.next === 'Hôm nay' ? 'color:var(--danger);font-weight:600' : ''}">${x.next === 'Hôm nay' ? 'Đến hạn ôn' : 'Ôn ' + x.next}</span></div>
      <div class="c-act acts"><button class="icon-btn" data-say="${esc(x.w)}" aria-label="Nghe ${esc(x.w)}">${icon('speaker-high')}</button><button class="icon-btn" data-open="${esc(x.w)}" aria-label="Xem chi tiết ${esc(x.w)}">${icon('arrow-square-out')}</button></div></div>`; }).join('')}`;
  const b = $('#mwBulk'); b.classList.toggle('on', MW.sel.size > 0); $('#mwSelN').textContent = `Đã chọn ${MW.sel.size} từ`;
}
function mwUnsave(words) {
  const removed = MYWORDS.filter(x => words.includes(x.w));
  removed.forEach(x => { MYWORDS.splice(MYWORDS.indexOf(x), 1); [...saved].filter(k => k.startsWith(x.w + '#')).forEach(k => saved.delete(k)); });
  store.set('ll3-saved', [...saved]); MW.sel.clear(); renderMyWords(); syncSaves();
  toast(`Đã bỏ lưu ${removed.length} từ`, { label: 'Hoàn tác', fn: () => { MYWORDS.push(...removed); renderMyWords(); } }, 'trash');
}


Object.assign(ACT, {
  addWord() { toast('Thêm từ thủ công: nhập từ, nghĩa, ví dụ (source = manual)', null, 'plus'); },
  mwReview() {
    toast(`Ôn ${MW.sel.size} từ đã chọn`, null, 'cards'); MW.sel.clear();
    sess.set('vc', { go: 'mywords', label: 'Từ & câu đã lưu', badge: 'Từ đã chọn', over: 'Ôn tập', title: 'Ôn các từ đã chọn' });
    go('vocab', { tab: 'review', ctx: 1 });
  },
  mwToDeck() { toast(`Đã thêm ${MW.sel.size} từ vào “Từ gặp trong bài học”`, null, 'stack'); MW.sel.clear(); renderWordList(); },
  mwUnsave() { mwUnsave([...MW.sel]); }, mwClear() { MW.sel.clear(); renderWordList(); },
});

Shell.click((t) => {
  const mwt = t.closest('#mwTabs button'); if (mwt) { segPick(mwt); MW.tab = mwt.dataset.t; MW.sel.clear(); renderMyWords(); return true; }
  const mwf = t.closest('#mwSrc button, #mwSt button'); if (mwf) { segPick(mwf); MW[mwf.closest('#mwSrc') ? 'src' : 'st'] = mwf.dataset.v; renderWordList(); return true; }
  const cb = t.closest('[data-cb]'); if (cb) { const w = cb.dataset.cb, r = mwFiltered();
    if (w === '*') { const all = r.every(x => MW.sel.has(x.w)); r.forEach(x => all ? MW.sel.delete(x.w) : MW.sel.add(x.w)); } else MW.sel.has(w) ? MW.sel.delete(w) : MW.sel.add(w);
    renderWordList(); return true; }
  const opn = t.closest('[data-open]'); if (opn) { const w = opn.dataset.open; if (DICT[w]) go('vocab', { tab: 'lookup', word: w }); else toast(`“${w}” chưa có trong từ điển mẫu`, null, 'info'); return true; }
  const rsv = t.closest('[data-resolve]'); if (rsv) { const x = REVIEW_SENTS.splice(+rsv.dataset.resolve, 1)[0]; renderMyWords(); toast('Đã đánh dấu câu là ổn', { label: 'Hoàn tác', fn: () => { REVIEW_SENTS.push(x); renderMyWords(); } }, 'check'); return true; }
});
document.addEventListener('input', e => { if (e.target.id === 'mwSearch') { MW.q = e.target.value; renderWordList(); } });

(function boot() {
  const tab = qs().get('tab'); if (tab) MW.tab = tab;
  renderMyWords();
})();
