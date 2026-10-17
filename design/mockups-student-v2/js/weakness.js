/* Trang Điểm yếu: bản đồ 44 âm vị, lỗi nghe chép theo loại từ (S-20) */
'use strict';
let phSel = 'θ';
function heat(r) { return r == null ? 'na' : r > 30 ? 't-bad' : r >= 15 ? 't-warn' : 't-ok'; }
function renderWeakness() {
  const cell = p => `<button class="phn ${heat(p.rate)} ${p.s === phSel ? 'sel' : ''}" data-ph="${p.s}" aria-label="Âm /${p.s}/ như trong ${p.ex}, ${p.rate == null ? 'chưa đủ dữ liệu' : p.rate + '% lỗi'}">${p.s}<small>${p.rate == null ? '—' : p.rate + '%'}</small></button>`;
  $('#gridV').innerHTML = PH.filter(p => p.kind !== 'consonant').map(cell).join('');
  $('#gridC').innerHTML = PH.filter(p => p.kind === 'consonant').map(cell).join('');
  $('#dictStats').innerHTML = DICT_STATS.map(d => `<div>
      <div class="row between small"><b>${d.name}</b><span class="badge ${d.rate > 20 ? 't-bad' : ''}">${d.rate}% lỗi</span></div>
      <div class="bar stack" style="margin:8px 0 4px"><i style="width:${d.o}%;background:var(--danger)"></i><i style="width:${d.s}%;background:var(--warning)"></i><i style="width:${d.m}%;background:var(--info)"></i></div>
      <div class="small muted">Gần nhất: ${d.ex}</div></div>`).join('');
  renderPhPanel();
}
function renderPhPanel() {
  const p = PH.find(x => x.s === phSel), d = PH_DETAIL[phSel];
  const trend = d ? d.trend : null;
  const spark = trend ? (() => { const mx = Math.max(...trend) + 5, mn = Math.min(...trend) - 5;
      const pts = trend.map((v, i) => `${i * (300 / (trend.length - 1))},${56 - (v - mn) / (mx - mn) * 50}`).join(' ');
      return `<svg class="spark" viewBox="0 0 300 60" preserveAspectRatio="none" aria-label="Tỉ lệ lỗi giảm từ ${trend[0]}% xuống ${trend[trend.length - 1]}%"><polyline points="${pts}" fill="none" stroke="var(--danger)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`; })() : '';
  $('#phPanel').innerHTML = `
    <div class="row between"><div class="ipa display-lg">/${p.s}/</div><span class="badge ${heat(p.rate) === 'na' ? '' : heat(p.rate)}">${p.rate == null ? 'Chưa đủ dữ liệu' : p.rate + '% lỗi'}</span></div>
    <div class="row w" style="margin:12px 0 16px">${aud(p.ex, p.ex)}${d ? `<span class="small muted">${d.n} lần sai</span>` : ''}</div>
    ${p.rate == null ? `<p class="small muted">Bạn mới luyện âm này dưới 5 lần. Luyện thêm vài câu có “${p.ex}” để có thống kê.</p>` : `
      ${p.prod ? `<div class="tipbox" style="margin-bottom:12px">${icon('ear')}<span>Bạn thường đọc thành <b class="ipa">${p.prod === '—' ? 'rụng âm (bỏ hẳn)' : '/' + p.prod + '/'}</b></span></div>` : ''}
      ${d ? `<p class="small">${d.tip}</p>
        <div style="margin-top:16px"><div class="overline">Xu hướng 8 tuần · đang giảm</div>
          <div class="lockbox"><div class="blur">${spark}</div><div class="ov free-only"><span class="badge pro">${icon('crown-simple', 1)}PRO</span></div></div></div>
        <div class="overline" style="margin-top:16px">Cặp âm để luyện</div><div class="row w">${d.pairs.map(x => `<button class="chip" data-say="${esc(x.replace(' – ', ', '))}">${icon('speaker-high')}${x}</button>`).join('')}</div>` : ''}
      <button class="btn primary" style="width:100%;margin-top:20px" data-go="shadowing">${icon('target')}Luyện ngay</button>`}`;
}

Shell.click((t) => {
  const ph = t.closest('[data-ph]'); if (ph) { phSel = ph.dataset.ph; $$('.phn').forEach(x => x.classList.toggle('sel', x === ph)); renderPhPanel(); if (innerWidth < 1024) $('#phPanel').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); return true; }
  const seg = t.closest('#wkRange button'); if (seg) { segPick(seg); return true; }
});

renderWeakness();
