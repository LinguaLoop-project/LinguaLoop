/* Trang Hôm nay: kế hoạch 15 phút, chuỗi ngày học, điểm yếu tuần này, trình độ (S-01, S-19) */
'use strict';
function heroWords() {
  const t = $('#heroTitle'); const words = t.dataset.text || t.textContent; t.dataset.text = words;
  t.innerHTML = words.split(' ').map((w, i) => `<span class="w" style="animation-delay:${120 + i * 80}ms">${esc(w)}</span>`).join(' ');
}
function renderToday() {
  const total = PLAN.reduce((a, t) => a + t.min, 0), doneMin = PLAN.filter(t => state.done.has(t.id)).reduce((a, t) => a + t.min, 0);
  ring($('#heroRing'), doneMin, { size: 148, stroke: 12, max: total, color: 'url(#gRing)', label: `/ ${total} phút` });
  const allDone = state.done.size === PLAN.length;
  $('#heroMascot').innerHTML = `<div class="bubble">${allDone ? 'Xong hết rồi! Mai mình gặp lại nhé.' : state.done.size ? 'Tốt lắm! Còn ' + (PLAN.length - state.done.size) + ' việc nữa thôi.' : 'Chào Minh Anh! Hôm nay mình sửa âm /θ/ nhé.'}</div>${mascot(allDone ? 'celebrate' : 'hello', 136, 1)}`;
  $('#planMeta').textContent = `${state.done.size}/${PLAN.length} việc`;
  const nextIdx = PLAN.findIndex(t => !state.done.has(t.id));
  $('#taskList').innerHTML = PLAN.map((t, i) => { const done = state.done.has(t.id); return `
    <div class="task ${done ? 'done' : ''} ${i === nextIdx ? 'next' : ''}">
      <div class="dot">${done ? icon('check-circle', 1) : icon(t.icon, i === nextIdx)}</div>
      <div><div class="t-title">${esc(t.title)}</div><div class="why">${icon('lightbulb')}${esc(t.why)} · ${t.min} phút</div></div>
      <button class="btn ${i === nextIdx ? 'primary' : 'ghost'} sm" data-task="${t.id}">${done ? 'Làm lại' : 'Bắt đầu'}${done ? '' : '<i class="ph ph-arrow-right arr" aria-hidden="true"></i>'}</button>
    </div>`; }).join('');
  if (nextIdx === -1) $('#taskList').insertAdjacentHTML('beforeend', `<div class="tipbox" style="margin-top:8px">${icon('confetti')}<span>Xong kế hoạch hôm nay! Muốn học thêm? Thử <b>Kiểm tra trình độ</b> hoặc ôn thêm thẻ.</span></div>`);
  const days = ['T3', 'T4', 'T5', 'T6', 'T7', 'CN', 'T2'], on = [0, 0, 1, 1, 1, 1, state.done.size > 0 ? 1 : 0];
  $('#streakDays').innerHTML = days.map((d, i) => `<div class="${on[i] ? 'on' : ''} ${i === 6 ? 'today' : ''}"><b>${on[i] ? icon('fire', 1) : ''}</b>${d}</div>`).join('');
  const streak = state.done.size > 0 ? 5 : 4;
  $('#streakNum').textContent = streak; $('#streakBig').textContent = streak;
  $('#streakHint').textContent = state.done.size > 0 ? 'Hôm nay đã giữ chuỗi. Mai quay lại nhé!' : 'Xong 1 việc bất kỳ hôm nay để lên 5 ngày.';
  $('#weakMini').innerHTML = [['/θ/ think', 42, 't-bad'], ['/ð/ this', 35, 't-bad'], ['Từ chức năng', 31, 't-bad']].map(([n, r, c]) =>
    `<div><div class="row between small" style="margin-bottom:6px"><b class="ipa">${n}</b><span class="badge ${c}">${r}% lỗi</span></div><div class="bar ${c}"><i style="width:${r}%"></i></div></div>`).join('');
}
Object.assign(ACT, {
  duration() { const opts = [10, 15, 20, 30]; state.dur = opts[(opts.indexOf(state.dur) + 1) % opts.length]; store.set('ll3-dur', state.dur); $('#durLbl').textContent = state.dur + ' phút'; const t = $('#heroTitle'); t.dataset.text = `Kế hoạch ${state.dur} phút`; heroWords(); toast(`Kế hoạch hôm nay được tạo lại cho ${state.dur} phút`, null, 'timer'); },
});

(function boot() {
  $('#v-today h1').textContent = 'Chào ' + ME.name;
  $('#durLbl').textContent = state.dur + ' phút';
  $('#heroTitle').dataset.text = `Kế hoạch ${state.dur} phút`;
  renderToday(); heroWords();
})();
