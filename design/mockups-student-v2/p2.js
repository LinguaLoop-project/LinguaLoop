/* LinguaLoop v2 — p2.js: trạng thái dùng chung cho Nghe chép, Shadowing, Từ vựng.
 * Nạp TRƯỚC js/dictation.js, js/shadowing.js, js/vocab.js. Xem docs/ux/STATES.md.
 * ?state= normal | new | loading | error | network | notfound | (riêng trang) audio | mic | quota | done
 */
'use strict';
const P2_ST = new URLSearchParams(location.search).get('state') || 'normal';

/* Khung xương cho vùng học (nghe chép, shadowing) */
const p2Skel = () => `<div class="g-learn" aria-busy="true" aria-label="Đang tải bài">
  <div class="card learn-card col g16">${skel('100%', 8)}${skel('100%', 200, 'var(--radius-lg)')}${skel('100%', 72, 'var(--radius-xl)')}${skel('100%', 120, 'var(--radius-lg)')}</div>
  <div class="col g24"><div class="card col g12">${skel('60%', 16)}${skel('100%', 56, 'var(--radius-md)')}</div>
    <div class="card col g12">${skel('40%', 14)}${skel('100%', 44)}${skel('100%', 44)}${skel('100%', 44)}</div></div></div>`;

/* Khung xương cho tab Bộ từ: cùng hình với thẻ bộ từ thật */
const p2DeckSkel = () => `<div class="col g24" aria-busy="true" aria-label="Đang tải bộ từ">${skel('100%', 120, 'var(--radius-lg)')}${skel('180px', 28)}
  <div class="l-row">${Array.from({ length: 4 }, () => `<div class="card col g12">
    <div class="row g12">${skel('48px', 48, 'var(--radius-md)')}<div class="grow col g8">${skel('80%', 16)}${skel('55%', 12)}</div></div>
    ${skel('100%', 8)}${skel('100%', 40, 'var(--radius-md)')}</div>`).join('')}</div></div>`;

/* Chặn trang học khi đang tải/lỗi/không có bài: trả về true nếu đã vẽ trạng thái thay cho nội dung */
function p2Gate(viewSel, { id } = {}) {
  const view = $(viewSel); if (!view) return false;
  const host = view.querySelector('.g-learn, .dc-grid'); if (!host) return false;
  const slug = qs().get('lesson');
  const missing = slug && !lessonOf(slug);
  let html = null;
  if (P2_ST === 'loading') html = p2Skel();
  else if (P2_ST === 'error' || P2_ST === 'network') html = errorState(P2_ST === 'network' ? 'network' : 'server', { back: ['Về thư viện bài học', 'lessons'] });
  else if (P2_ST === 'notfound' || missing) html = errorState('notfound', { retry: false });
  if (!html) return false;
  host.outerHTML = `<div id="p2Body">${html}</div>`;
  const sr = $('#sResult'); if (sr) sr.style.display = 'none';
  refreshIcons();
  return true;
}
Object.assign(ACT, {
  retry() { const b = $('#p2Body'); if (b) b.innerHTML = p2Skel(); else { const d = $('#vDecks'); if (d) d.innerHTML = p2DeckSkel(); }
    setTimeout(() => { const q = new URLSearchParams(location.search); q.delete('state'); toast('Đã tải xong', null, 'circle-check'); location.search = q.toString(); }, 900); },
});

/* Thẻ hướng dẫn cho lần đầu (có thể đóng, nhớ ở localStorage) */
function p2Coach(key, title, steps) {
  if (P2_ST !== 'new' && store.get('ll2-coach-' + key, false)) return '';
  return `<div class="coach" id="coach-${key}">${mascot('hello', 72)}
    <div><b>${title}</b><ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol></div>
    <button class="btn ghost sm" data-act="coachClose" data-key="${key}">Đã hiểu</button></div>`;
}
Object.assign(ACT, {
  coachClose(e) { store.set('ll2-coach-' + e.dataset.key, true); const c = $('#coach-' + e.dataset.key); if (c) c.remove(); },
});
