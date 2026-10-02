/* Shadowing: nghe mẫu karaoke, ghi âm thật (MediaRecorder), kết quả chấm từng từ và âm vị (S-14, S-15) */
'use strict';
const S = { step: 1, levels: [], rec: null, stream: null, blobUrl: null, raf: 0, quota: 3, timers: [] };
function sSteps() { $$('#sSteps span').forEach(sp => { const n = +sp.dataset.s; sp.className = n < S.step ? 'done' : n === S.step ? 'on' : ''; sp.querySelector('b').innerHTML = n < S.step ? icon('check') : n; }); }
function sRenderText(mode) {
  $('#sText').innerHTML = SHADOW.words.map((w, i) => {
    let c = 'k'; if (mode === 'result') { const v = SHADOW.scores[i]; c += v >= 80 ? ' good' : v >= 60 ? ' midw' : ' badw'; } else if (mode === 'done') c += ' done';
    return `<span class="${c}" data-wi="${i}">${esc(w)}</span>`; }).join(' ');
}
function sIdle() { S.levels = []; drawWave($('#sWave'), Array(200).fill(.05), cssVar('--text-subtle')); }
function sListen() {
  S.timers.forEach(clearTimeout); S.timers = [];
  speak(SHADOW.text, { rate: .85, lang: 'en-GB' }); sRenderText(); vpRun('s', 150 + SHADOW.words.length * 360 + 200);
  const per = 360; SHADOW.words.forEach((_, i) => S.timers.push(setTimeout(() => $$('#sText .k').forEach((el, k) => { el.classList.toggle('lit', k === i); el.classList.toggle('done', k < i); }), 150 + i * per)));
  S.timers.push(setTimeout(() => { sRenderText('done'); if (S.step === 1) { S.step = 2; sSteps(); } $('#sStatus').innerHTML = 'Giờ tới lượt bạn: nhấn micro hoặc <kbd>Space</kbd> và đọc theo'; }, 150 + SHADOW.words.length * per + 200));
}
async function sMic() {
  const mic = $('#sMic');
  if (mic.classList.contains('rec')) return sStop();
  if (S.step === 1) { S.step = 2; sSteps(); }
  loopiSay('speaking', 'Mình đang nghe bạn đọc…');
  mic.classList.add('rec'); mic.innerHTML = icon('stop', 1); mic.setAttribute('aria-label', 'Dừng ghi âm'); $('#sStatus').textContent = 'Đang ghi… nhấn lần nữa để dừng';
  const color = cssVar('--danger');
  try {
    S.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new (window.AudioContext || window.webkitAudioContext)(), src = ctx.createMediaStreamSource(S.stream), an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
    const buf = new Uint8Array(an.fftSize), chunks = [];
    S.rec = new MediaRecorder(S.stream); S.rec.ondataavailable = e => chunks.push(e.data);
    S.rec.onstop = () => { S.blobUrl = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' })); ctx.close(); };
    S.rec.start();
    (function loop() { an.getByteTimeDomainData(buf); let sum = 0; for (const v of buf) sum += ((v - 128) / 128) ** 2; S.levels.push(Math.min(1, Math.sqrt(sum / buf.length) * 5)); drawWave($('#sWave'), S.levels, color); S.raf = requestAnimationFrame(loop); })();
  } catch (_) { // không có micro (vd mở file://) → mô phỏng
    S.rec = null; let t = 0;
    (function loop() { t++; S.levels.push(.15 + Math.abs(Math.sin(t / 7)) * .5 * Math.random() + .1); drawWave($('#sWave'), S.levels, color); S.raf = requestAnimationFrame(loop); })();
    toast('Không truy cập được micro → đang mô phỏng ghi âm', null, 'microphone-slash');
  }
  S.timers.push(setTimeout(() => { if ($('#sMic').classList.contains('rec')) sStop(); }, 7000));
}
function sStop() {
  cancelAnimationFrame(S.raf);
  if (S.rec && S.rec.state !== 'inactive') S.rec.stop(); if (S.stream) S.stream.getTracks().forEach(t => t.stop());
  const mic = $('#sMic'); mic.classList.remove('rec'); mic.innerHTML = icon('microphone', 1); mic.setAttribute('aria-label', 'Ghi âm (phím Space)');
  $('#sMine').disabled = false;
  const pro = document.body.classList.contains('pro');
  if (!pro && S.quota <= 0) { $('#sStatus').innerHTML = 'Hết 5 lượt chấm hôm nay. Bạn vẫn có thể nghe lại giọng mình. <b>Pro</b> chấm không giới hạn.'; return; }
  loopiSay('listening', 'Để mình chấm từng âm nhé…');
  mic.classList.add('busy'); mic.innerHTML = icon('hourglass-medium', 1); $('#sStatus').textContent = 'Đang chấm phát âm…';
  setTimeout(() => {
    mic.classList.remove('busy'); mic.innerHTML = icon('microphone', 1);
    if (!pro) { S.quota--; bump($('#quotaLeft'), S.quota); $('#quotaBar').style.width = S.quota * 20 + '%'; }
    S.step = 3; sSteps(); sRenderText('result'); sResult(); loopiSay('encourage', 'Còn 3 từ cần sửa, âm /θ/ là chính. Bấm từ đỏ để xem nhé!');
    $('#sStatus').innerHTML = 'Bấm vào từ <b style="color:var(--danger)">gạch chân đỏ</b> để xem lỗi âm vị';
  }, 1300);
}
function sResult() {
  const o = SHADOW.overall, box = $('#sResult'); box.style.display = '';
  box.innerHTML = `
    <div class="card rv"><div class="score-row">
      <div class="row" style="gap:20px"><div class="ring" id="rTot"></div><div><div class="overline">Điểm phát âm</div><h2>Khá ổn, còn 3 từ cần sửa</h2><div class="row w" style="margin-top:8px"><span class="chip t-bad">Thay phụ âm bằng âm khác</span><span class="chip t-warn">Rụng phụ âm cuối</span></div></div></div>
      <div class="row w" style="gap:24px">${[['acc', 'Chính xác', 'Phát âm đúng từng âm'], ['flu', 'Trôi chảy', 'Ngắt nghỉ tự nhiên'], ['comp', 'Đầy đủ', 'Đọc đủ các từ'], ['pros', 'Ngữ điệu', 'Nhấn âm, lên xuống giọng']].map(([k, l, t]) =>
        `<div style="text-align:center" title="${t}"><div class="ring" id="r-${k}"></div><div class="small" style="margin-top:6px;font-weight:600">${l}</div></div>`).join('')}</div>
    </div></div>

    <div class="g-learn">
    <div class="card rv"><div class="row between" style="margin-bottom:16px"><h3 class="row g8">${icon('magnifying-glass')}Lỗi âm vị (${SHADOW.errors.length} từ)</h3><span class="small muted">Âm dưới 60 điểm là lỗi</span></div>
      ${SHADOW.errors.map((e, k) => `
      <div class="w-acc ${k === 0 ? 'open' : ''}" id="acc-${e.i}">
        <button data-acc aria-expanded="${k === 0}"><b style="font-size:18px">${esc(e.w)}</b><span class="ipa muted">${e.ipa}</span><span class="badge ${scoreTone(e.score)}">${e.score}</span>
          <span class="small muted hide-m">${e.ph.filter(p => p[1] < 60).map(p => `/${p[0]}/ ${p[2] === '—' ? 'rụng âm' : p[2] ? '→ /' + p[2] + '/' : 'chưa chuẩn'}`).join(', ')}</span><i class="ph ph-caret-down chev" aria-hidden="true"></i></button>
        <div class="body"><div><div class="inner">
          <div class="phons">${e.ph.map(([s, v, pr]) => `<div class="phon ${scoreTone(v)}"><div class="s">${s}</div><div class="small">${v}${pr ? ' · ' + (pr === '—' ? 'rụng' : 'bạn đọc /' + pr + '/') : ''}</div></div>`).join('')}</div>
          <div class="tipbox">${icon('lightbulb')}<span>${e.tip}</span></div>
          <div class="row w">${aud(e.w, 'Nghe mẫu')}<button class="aud us" data-act="sMine"><span class="aud-dot">${icon('play', 1)}</span>Giọng tôi</button><button class="btn text sm" data-act="pairToast" data-pair="${e.pair}">${icon('target')}Luyện cặp ${e.pair}</button></div>
          <div class="lockbox" style="max-width:380px"><div class="blur"><div class="video-ph">${icon('play-circle', 1)}</div></div>
            <div class="ov free-only"><span class="badge pro">${icon('crown-simple', 1)}PRO</span><b class="small">Video khẩu hình âm /${e.ph.find(p => p[1] < 60)[0]}/</b><button class="btn primary sm" data-act="togglePro">Mở với Pro</button></div></div>
        </div></div></div>
      </div>`).join('')}</div>

    <div class="card card-highlight rv"><div class="row between"><h3 class="row g8">${icon('sparkle', 1)}Nhận xét AI</h3><span class="badge pro">PRO</span></div>
      <div class="lockbox" style="margin-top:12px"><div class="blur" id="aiBody">${SHADOW.ai.map(([a, b]) => `<p class="small" style="margin-bottom:10px"><b>${a}:</b> ${b}</p>`).join('')}</div>
        <div class="ov free-only"><b>Nhận xét riêng cho từng lần bạn đọc</b><button class="btn primary sm" data-act="togglePro">Mở với Pro</button></div></div>
      <div class="row pro-only" style="margin-top:6px"><span class="small muted">Hữu ích không?</span><button class="icon-btn" data-act="thumb" aria-label="Hữu ích">${icon('thumbs-up')}</button><button class="icon-btn" data-act="thumb" aria-label="Không hữu ích">${icon('thumbs-down')}</button></div></div>
    </div>

    <div class="row w rv"><button class="btn ghost" data-act="sRetry">${icon('arrow-counter-clockwise')}Đọc lại <span class="free-only small muted">· còn ${S.quota} lượt</span></button><button class="btn ghost" data-act="baseline">${icon('map-pin')}Đặt làm bản ghi mốc</button>
      <span class="grow"></span><button class="btn primary lg" data-act="sDone">${icon('check')}Hoàn thành</button></div>`;
  reveal(box);
  ring($('#rTot'), o.total, { size: 124, stroke: 12, label: 'Tổng' });
  [['acc', o.acc], ['flu', o.flu], ['comp', o.comp], ['pros', o.pros]].forEach(([k, v]) => ring($('#r-' + k), v, { size: 80, stroke: 8 }));
  if (document.body.classList.contains('pro')) typeAI();
  setTimeout(() => box.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }), 250);
}
function typeAI() { // hiệu ứng stream như LLM
  const el = $('#aiBody'); if (!el) return; const ps = $$('p', el); ps.forEach(p => p.style.opacity = 0);
  ps.forEach((p, i) => setTimeout(() => { p.style.transition = 'opacity .4s'; p.style.opacity = 1; }, 300 + i * 450));
}
function sReset() { loopiSay('speaking', 'Nghe mẫu một lần trước, rồi đọc theo nhịp nhé.'); S.step = 1; sSteps(); sRenderText(); $('#sResult').style.display = 'none'; $('#sMine').disabled = !S.blobUrl; sIdle();
  $('#sStatus').innerHTML = 'Nghe mẫu trước, rồi nhấn micro (hoặc <kbd>Space</kbd>) để đọc theo'; }

Object.assign(ACT, {
  sMine() { if (S.blobUrl) new Audio(S.blobUrl).play(); else toast('Chưa có bản ghi thật (đang mô phỏng)', null, 'microphone-slash'); },
  sRetry() { sReset(); }, sDone() { completeTask('drill'); if (!state.focus) sReset(); },
  baseline() { toast('Đã đặt làm bản ghi mốc — so sánh lại sau 4 tuần', null, 'map-pin'); },
  pairToast(e) { toast(`Mở bài luyện cặp ${e.dataset.pair} (nghe chọn đúng → đọc được chấm)`, null, 'target'); },
  thumb() { toast('Cảm ơn phản hồi của bạn!', null, 'heart'); },
});

function applyLesson() {
  const slug = qs().get('lesson') || curLesson.shadowing, L = lessonOf(slug);
  if (!L) return;
  if (curLesson.shadowing !== slug) setCurLesson('shadowing', slug);
  const c = $('#sCrumb'); c.dataset.id = slug; c.querySelector('span').textContent = L.title;
  $('#v-shadowing .overline').textContent = `Shadowing · ${L.cefr}`;
}

Shell.click((t) => {
  const acc = t.closest('[data-acc]'); if (acc) { const open = acc.parentElement.classList.toggle('open'); acc.setAttribute('aria-expanded', open); return true; }
  const wi = t.closest('#sText .badw'); if (wi) { const el = $('#acc-' + wi.dataset.wi); if (el) { el.classList.add('open'); el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }); } return true; }
});
Shell.key((e) => { if (e.code === 'Space') { e.preventDefault(); sMic(); return true; } }, 'late');
$('#sListen').addEventListener('click', sListen);
$('#sMic').addEventListener('click', sMic);
$('#sMine').addEventListener('click', () => ACT.sMine());
window.addEventListener('ll:theme', () => { if (S.step < 3) sIdle(); });
window.addEventListener('ll:pro', () => { if (isPro() && $('#sResult').style.display !== 'none') typeAI(); });
window.addEventListener('resize', () => { if (S.step < 3) sIdle(); });

applyLesson();
sRenderText(); sSteps(); loopiSay('speaking', 'Nghe mẫu một lần trước, rồi đọc theo nhịp nhé.'); vpRender('s');
requestAnimationFrame(() => { if (S.step < 3) sIdle(); });
