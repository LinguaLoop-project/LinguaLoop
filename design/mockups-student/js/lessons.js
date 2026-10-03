/* Thư viện bài học: danh sách theo chủ đề (lessons.html), một chủ đề (topic.html), chi tiết bài (lesson.html) (S-10, S-11) */
'use strict';
function lcard(L, mode = 'all') {
  const mb = (m, ic, label) => { const p = m === 'dictation' ? L.d : L.s;
    return `<button class="lmode ${mode !== 'all' ? 'single' : ''}" data-start="${m}" data-lesson="${L.slug}" aria-label="${label}: ${esc(L.title)}${p != null ? ', đã làm ' + p + '%' : ''}" title="${p != null ? 'Đã làm ' + p + '%' : 'Chưa học'}">${icon(ic)}${label}${p === 100 ? '<i class="ph-fill ph-check-circle ok" aria-label="đã xong"></i>' : ''}${p != null ? `<span class="pbar ${p === 100 ? 'full' : ''}" style="width:${p}%"></span>` : ''}</button>`; };
  return `<article class="card lift lcard" data-lesson="${L.slug}" tabindex="0" aria-label="Bài ${esc(L.title)}">${thumb(L)}
    <div class="lbody"><h3 class="ltitle">${esc(L.title)}</h3><div class="lvi">${esc(L.vi)}</div>
      <div class="lmodes">${mode !== 'shadowing' ? mb('dictation', 'headphones', 'Nghe chép') : ''}${mode !== 'dictation' ? mb('shadowing', 'microphone', 'Shadowing') : ''}</div></div></article>`;
}
function ccard(L, mode) {
  const m = mode !== 'all' ? mode : L.d != null && L.d < 100 ? 'dictation' : 'shadowing', p = (m === 'dictation' ? L.d : L.s) || 0;
  return `<article class="card lift ccard" data-lesson="${L.slug}" tabindex="0" aria-label="Tiếp tục ${esc(L.title)}">${thumb(L, false)}
    <div class="meta"><b class="ltitle" style="font-size:15px">${esc(L.title)}</b><span class="small muted">${m === 'dictation' ? 'Nghe chép' : 'Shadowing'} · câu ${Math.round(L.n * p / 100)}/${L.n}</span><div class="bar thin"><i style="width:${p}%"></i></div></div>
    <button class="icon-btn" data-start="${m}" data-lesson="${L.slug}" aria-label="Tiếp tục ${esc(L.title)}">${icon('play', 1)}</button></article>`;
}
function filterLessons(list, f) {
  const q = (f.q || '').trim().toLowerCase();
  const r = list.filter(L => (f.level === 'all' || LV[f.level].includes(L.cefr)) && (!f.free || !L.pro) && (!q || (L.title + ' ' + L.vi).toLowerCase().includes(q)));
  const by = { pop: (a, b) => b.views - a.views, new: (a, b) => a.age - b.age, short: (a, b) => durSec(a.dur) - durSec(b.dur) }[f.sort || 'pop'];
  return r.sort(by);
}
const LF = { q: '', level: 'all', sort: 'pop', free: false, mode: 'all' };
function renderLessons() {
  const m = LF.mode;
  const [over, title, sub] = { all: ['Thư viện bài học', 'Bài học', 'Nghe chép và shadowing trên video, audio thật'],
    dictation: ['Luyện nghe', 'Nghe chép', 'Chọn bài, nghe từng câu rồi gõ lại. Hệ thống chấm từng từ và chỉ ra loại lỗi'],
    shadowing: ['Luyện nói', 'Shadowing', 'Chọn bài, nghe mẫu rồi đọc theo. AI chấm phát âm tới từng âm vị'] }[m];
  $('#lsOver').textContent = over; $('#lsTitle').textContent = title;
  $('#lsSub').textContent = `${sub} · ${fmtNum(TOPICS.reduce((a, t) => a + t.total, 0))} bài · ${TOPICS.length} chủ đề`;
  $('#lsTopics').innerHTML = TOPICS.map(t => `<button class="chip lift" data-go="topic" data-id="${t.slug}">${icon(t.icon)}${t.name}<small>${t.total}</small></button>`).join('');
  const fr = $('#lsFree'); fr.classList.toggle('on', LF.free); fr.setAttribute('aria-pressed', LF.free);
  const prog = (L) => m === 'dictation' ? L.d : m === 'shadowing' ? L.s : null;
  let html = '';
  if (LF.q.trim() || LF.level !== 'all' || LF.free) {
    const r = filterLessons(LESSONS, LF);
    html = secHead('funnel', 'Kết quả', `${r.length} bài`, `<button class="btn text sm" data-act="lsReset">${icon('x')}Xoá bộ lọc</button>`)
      + (r.length ? `<div class="l-grid">${r.map(L => lcard(L, m)).join('')}</div>` : emptyState('Không có bài nào khớp', 'Thử bỏ bớt điều kiện hoặc tìm bằng từ khác.', `<button class="btn ghost" data-act="lsReset">Xoá bộ lọc</button>`));
  } else {
    const cont = LESSONS.filter(L => { if (m === 'all') return started(L) && !isDone(L); const p = prog(L); return p != null && p < 100; });
    if (cont.length) html += secHead('play-circle', 'Tiếp tục học', null) + `<div class="cont-grid rv">${cont.slice(0, 3).map(L => ccard(L, m)).join('')}</div>`;
    const rec = LESSONS.filter(L => ['B1'].includes(L.cefr) && !started(L) && !L.pro).sort((a, b) => b.views - a.views).slice(0, 4);
    html += secHead('sparkle', 'Hợp trình độ B1 của bạn', null, `<span class="small muted hide-m">Gợi ý từ bài kiểm tra trình độ</span>`) + `<div class="l-row rv">${rec.map(L => lcard(L, m)).join('')}</div>`;
    TOPICS.forEach(t => {
      const ls = filterLessons(LESSONS.filter(L => L.topic === t.slug), LF).slice(0, 4); if (!ls.length) return;
      html += secHead(t.icon, t.name, `${t.total} bài`, `<button class="btn ghost sm" data-go="topic" data-id="${t.slug}">Xem tất cả<i class="ph ph-arrow-right arr" aria-hidden="true"></i></button>`)
        + `<div class="l-row rv">${ls.map(L => lcard(L, m)).join('')}</div>`;
    });
  }
  $('#lsBody').innerHTML = html;
  if (Shell.page === 'lessons') reveal($('#lsBody'));
}

const TF = { level: 'all', state: 'all' };
let curTopic = 'daily';
function renderTopic(slug) {
  const t = topicOf(slug) || TOPICS[0]; curTopic = t.slug;
  const all = LESSONS.filter(L => L.topic === t.slug), doneN = all.filter(isDone).length + Math.round(t.total * .06);
  $('#tpHead').innerHTML = `<div class="crumbs"><button data-go="lessons">Bài học</button>${icon('caret-right')}<span>${t.name}</span></div>
    <div class="tp-hero"><div class="tp-ic"><svg viewBox="0 0 200 200" aria-hidden="true"><use href="#o-orb"/></svg>${duo(t.icon)}</div>
      <div class="grow"><div class="overline">Chủ đề · ${t.en}</div><h1>${t.name}</h1><p class="muted">${t.desc}</p></div>
      <div class="card tight" style="min-width:240px"><div class="row between small"><span class="muted">Bạn đã hoàn thành</span><b>${doneN}/${t.total} bài</b></div><div class="bar" style="margin-top:10px"><i style="width:${doneN / t.total * 100}%"></i></div></div></div>`;
  let r = filterLessons(all, { level: TF.level, sort: 'pop' });
  if (TF.state !== 'all') r = r.filter(L => stateOf(L) === TF.state);
  $('#tpCount').textContent = `Đang hiện ${r.length} / ${t.total} bài`;
  $('#tpGrid').innerHTML = r.length ? r.map(L => lcard(L)).join('') : `<div style="grid-column:1/-1">${emptyState('Chưa có bài nào ở mục này', 'Đổi trình độ hoặc trạng thái để xem thêm bài.')}</div>`;
  $('#tpMore').innerHTML = TF.level === 'all' && TF.state === 'all' ? `<button class="btn ghost" data-act="tpMore">Xem thêm ${t.total - all.length} bài<i class="ph ph-caret-down" aria-hidden="true"></i></button>` : '';
}
function renderLesson(slug) {
  const L = lessonOf(slug) || LESSONS[0], t = topicOf(L.topic), pro = isPro();
  const sents = SENT_BANK[L.slug] || SENT_GENERIC, dDone = Math.round(L.n * (L.d || 0) / 100);
  const lock = L.pro && !pro;
  const modeCard = (m) => {
    const p = m === 'dictation' ? L.d : L.s, n = p != null ? Math.round(L.n * p / 100) : 0;
    return `<div class="card lift mode-card" data-start="${m}" data-lesson="${L.slug}">
      <div class="row between"><div class="mode-ic">${icon(m === 'dictation' ? 'headphones' : 'microphone', 1)}</div>${p === 100 ? `<span class="badge t-ok">${icon('check', 1)}Đã xong</span>` : p != null ? '<span class="badge t-pri">Đang học</span>' : ''}</div>
      <div><h3>${m === 'dictation' ? 'Nghe chép' : 'Shadowing'}</h3><p class="small muted">${m === 'dictation' ? 'Nghe từng câu rồi gõ lại. Chấm từng từ, gắn nhãn loại lỗi.' : 'Nghe mẫu rồi đọc theo. AI chấm phát âm tới từng âm vị.'}</p></div>
      <div><div class="row between small"><span class="muted">${n}/${L.n} câu</span><span class="muted">${p != null ? 'Điểm TB ' + (m === 'dictation' ? 76 : 71) : 'Chưa bắt đầu'}</span></div><div class="bar thin" style="margin-top:6px"><i style="width:${p || 0}%"></i></div></div>
      <button class="btn ${p == null || p < 100 ? 'primary' : 'ghost'}" data-start="${m}" data-lesson="${L.slug}">${lock ? icon('crown-simple', 1) + 'Mở với Pro' : (p == null ? 'Bắt đầu' : p < 100 ? 'Tiếp tục' : 'Luyện lại') + '<i class="ph ph-arrow-right arr" aria-hidden="true"></i>'}</button></div>`;
  };
  const words = LESSON_WORDS[L.topic] || ['reliable', 'although', 'thin'];
  const notes = NOTES.filter(n => n.l === L.slug);
  const rel = LESSONS.filter(x => x.topic === L.topic && x.slug !== L.slug).slice(0, 3);
  $('#lsnBody').innerHTML = `
    <div class="crumbs rv"><button data-go="lessons">Bài học</button>${icon('caret-right')}<button data-go="topic" data-id="${t.slug}">${t.name}</button>${icon('caret-right')}<span>${esc(L.title)}</span></div>
    <div class="g-vocab">
      <div class="col g24">
        <div class="ld-media rv">${thumb(L)}<button class="play-big" data-say="${esc(sents[0])}" data-lang="en-US" aria-label="Nghe thử câu đầu">${icon('play', 1)}</button></div>
        <div class="rv">
          <h1>${esc(L.title)}</h1><p class="muted" style="margin-top:4px">${esc(L.vi)}</p>
          <div class="meta-row" style="margin-top:12px"><span class="badge cefr ${L.cefr}">${L.cefr}</span>${L.pro ? `<span class="badge pro">${icon('crown-simple', 1)}PRO</span>` : ''}
            <span>${L.src === 'youtube' ? icon('youtube-logo') + 'YouTube' : icon('waveform') + 'Audio'}</span><span>${icon('clock')}${L.dur}</span><span>${icon('list-numbers')}${L.n} câu</span><span>${icon('headphones')}${fmtNum(L.views)} lượt học</span><span>${icon('calendar-blank')}Thêm ${L.age} ngày trước</span></div>
          <p style="margin-top:12px">Bài thuộc chủ đề <b>${t.name.toLowerCase()}</b>, dài ${L.dur}, cắt sẵn ${L.n} câu kèm mốc thời gian. Chọn một chế độ để luyện; tiến độ mỗi chế độ được lưu riêng.</p>
        </div>
        <div class="mode-grid rv">${modeCard('dictation')}${modeCard('shadowing')}</div>
        <div class="card rv">
          <div class="row between w"><h3>Các câu trong bài <span class="muted small">(${L.n})</span></h3><button class="btn ghost sm" data-act="toggleTx" aria-pressed="false">${icon('eye')}<span>Hiện transcript</span></button></div>
          <p class="small muted" style="margin:4px 0 8px">Transcript ẩn sẵn để không lộ đáp án khi nghe chép.</p>
          <div class="masked" id="sentList">${sents.map((s, i) => { const sc = i < dDone ? SCORES[i % SCORES.length] : null;
            return `<div class="sent"><span class="n">${i + 1}</span><span class="tx">${esc(s)}</span><span class="st">${sc != null ? `<span class="badge ${scoreTone(sc)}">${sc}</span>` : i === dDone && L.d != null ? `<span class="badge t-pri">Đang ở câu này</span>` : ''}${fmtT(i * 4 + 1)}<button class="icon-btn sm" data-say="${esc(s)}" data-lang="en-US" aria-label="Nghe câu ${i + 1}">${icon('speaker-high')}</button></span></div>`; }).join('')}</div>
          ${L.n > sents.length ? `<p class="small muted" style="margin-top:8px">… và ${L.n - sents.length} câu nữa</p>` : ''}
        </div>
      </div>
      <aside class="col g24">
        <div class="card rv"><div class="overline">Tiến độ của bạn</div>
          <div class="row" style="gap:20px"><div class="ring" id="lsnRing"></div><div class="col g8 small" style="flex:1">
            <div class="row between"><span class="muted row g8">${icon('headphones')}Nghe chép</span><b>${L.d != null ? L.d + '%' : '—'}</b></div>
            <div class="row between"><span class="muted row g8">${icon('microphone')}Shadowing</span><b>${L.s != null ? L.s + '%' : '—'}</b></div>
            <div class="row between"><span class="muted row g8">${icon('clock')}Thời gian học</span><b>${started(L) ? '18 phút' : '—'}</b></div></div></div></div>
        <div class="card rv"><div class="row between"><div class="overline" style="margin:0">Từ vựng trong bài</div><button class="btn text sm" data-act="saveAll">Lưu tất cả</button></div>
          ${words.map(w => `<div class="fam"><div class="row g8"><button class="icon-btn sm" data-say="${w}" aria-label="Nghe ${w}">${icon('speaker-high')}</button><div><b>${w}</b> <span class="badge cefr ${DICT[w].cefr}">${DICT[w].cefr}</span><div class="small muted">${firstVi(w)}</div></div></div><button class="save" data-save="${w}#all" aria-label="Lưu từ ${w}">${icon('bookmark-simple', 1)}</button></div>`).join('')}</div>
        <div class="card rv"><div class="row between"><div class="overline" style="margin:0">Ghi chú của tôi</div><button class="btn text sm" data-act="addNote">${icon('plus')}Thêm</button></div>
          ${notes.length ? notes.map(n => `<div class="note" style="margin-top:12px"><q>${esc(n.s)}</q><span class="small">${n.t}</span></div>`).join('') : '<p class="small muted" style="margin-top:8px">Chưa có ghi chú. Trong lúc luyện, bấm <kbd>N</kbd> để ghi chú cho câu đang học.</p>'}</div>
        <div class="card rv"><div class="overline">Bài cùng chủ đề</div>
          ${rel.map(x => `<div class="rel" data-lesson="${x.slug}" tabindex="0">${thumb(x, false)}<div class="grow"><b class="ltitle" style="font-size:14px">${esc(x.title)}</b><div class="small muted">${x.cefr} · ${x.dur}</div></div></div>`).join('')}
          <button class="btn text sm" style="margin-top:8px" data-go="topic" data-id="${t.slug}">Xem cả chủ đề<i class="ph ph-arrow-right arr" aria-hidden="true"></i></button></div>
      </aside>
    </div>`;
  const overall = Math.round(((L.d || 0) + (L.s || 0)) / 2);
  ring($('#lsnRing'), overall, { size: 88, stroke: 8, color: 'url(#gRing)', label: '%' });
  syncSaves();
}
// Bấm Nghe chép / Shadowing: bài Pro cần gói Pro, còn lại mở màn luyện với bài đã chọn
function startMode(m, slug) {
  const L = lessonOf(slug);
  if (L && L.pro && !isPro()) { toast('Bài này dành cho gói Pro', { label: 'Dùng thử Pro', fn: () => ACT.togglePro() }, 'crown-simple'); return; }
  go(m, { lesson: slug });
}

Object.assign(ACT, {
  ytCreate() { if (!isPro()) { toast('Tạo bài từ YouTube là tính năng Pro', { label: 'Dùng thử Pro', fn: () => ACT.togglePro() }, 'crown-simple'); return; } toast('AI đang tách câu và ước lượng trình độ… Bài sẽ chờ duyệt trước khi công khai', null, 'magic-wand'); },
  lsReset() { Object.assign(LF, { q: '', level: 'all', sort: 'pop', free: false }); $('#lsSearch').value = ''; $$('#lsLevel button, #lsSort button').forEach(b => b.classList.toggle('on', b.dataset.v === 'all' || b.dataset.v === 'pop')); segAll(); renderLessons(); },
  tpMore() { toast('Tải thêm bài (phân trang 24 bài mỗi lần)', null, 'arrow-down'); },
  toggleTx(b) { const on = $('#sentList').classList.toggle('masked'); b.setAttribute('aria-pressed', !on); b.innerHTML = on ? `${icon('eye')}<span>Hiện transcript</span>` : `${icon('eye-slash')}<span>Ẩn transcript</span>`; },
  saveAll() { $$('#lsnBody .save[data-save]').filter(b => !b.classList.contains('on')).forEach(b => b.click()); },
  addNote() { toast('Mở ô ghi chú cho câu đang chọn', null, 'note-pencil'); }, delNote() { toast('Đã xoá ghi chú', { label: 'Hoàn tác', fn: () => {} }, 'trash'); },
});

Shell.click((t) => {
  const stt = t.closest('[data-start]'); if (stt) { closeAll(); startMode(stt.dataset.start, stt.dataset.lesson); return true; }
  const lsg = t.closest('#lsLevel button, #lsSort button'); if (lsg) { segPick(lsg); LF[lsg.closest('#lsLevel') ? 'level' : 'sort'] = lsg.dataset.v; renderLessons(); return true; }
  if (t.closest('#lsFree')) { LF.free = !LF.free; renderLessons(); return true; }
  const tsg = t.closest('#tpLevel button, #tpState button'); if (tsg) { segPick(tsg); TF[tsg.closest('#tpLevel') ? 'level' : 'state'] = tsg.dataset.v; renderTopic(curTopic); return true; }
  const lsn = t.closest('[data-lesson]'); if (lsn) { go('lesson', { id: lsn.dataset.lesson }); return true; }
});

(function boot() {
  const id = qs().get('id');
  if (Shell.page === 'lessons') {
    LF.mode = id || 'all'; renderLessons();
    $('#lsSearch').addEventListener('input', e => { LF.q = e.target.value; renderLessons(); });
  } else if (Shell.page === 'topic') { renderTopic(id); reveal($('#v-topic')); }
  else if (Shell.page === 'lesson') { renderLesson(id || 'ordering-coffee'); reveal($('#v-lesson')); }
})();
