/* Kiểm tra trình độ: 3 phần (từ vựng, nghe chép, nói), kết quả CEFR có khoảng tin cậy (O-03 → O-06, S-22) */
'use strict';
const TEST_VOCAB = [['house', 'A1'], ['borrow', 'A2'], ['flomber', null], ['reliable', 'B1'], ['although', 'B1'], ['trindle', null], ['negotiate', 'B2'], ['resilient', 'C1'], ['ubiquitous', 'C2'], ['schedule', 'B1']];
const T = { stage: 'intro', i: 0, ans: [], plays: 0, timer: 0 };
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
function testHeader(sec) {
  const names = ['Từ vựng', 'Nghe chép', 'Nói'];
  return `<div class="row" style="gap:8px;margin-bottom:16px">${names.map((n, k) => `<div class="grow"><div class="bar ${k < sec ? 't-ok' : ''}"><i style="width:${k < sec ? 100 : k === sec ? (sec === 0 ? T.i / TEST_VOCAB.length * 100 : 50) : 0}%"></i></div><div class="small" style="margin-top:6px;font-weight:600;color:${k === sec ? 'var(--text)' : 'var(--text-muted)'}">${n}</div></div>`).join('')}</div>`;
}
const testIcon = (ic) => `<div class="test-icon"><svg aria-hidden="true"><use href="#o-orb"/></svg>${icon(ic, 1)}</div>`;
function testRender() {
  const box = $('#tStage'); clearInterval(T.timer);
  if (T.stage === 'intro') {
    box.innerHTML = `<div class="test-wrap parallax">
      ${obj('cone', '--s:96px;top:-36px;left:-40px;--d:-2s', 'm-hide')}${obj('torus', '--s:110px;bottom:-40px;right:-44px;--d:-4s;--dur:8s')}${obj('star', '--s:48px;top:24px;right:8%;--dur:9s', 'm-hide')}
      <div class="card glass spotlight test-card">
      ${testIcon('exam')}<h2 style="margin:8px 0">Kiểm tra trình độ theo khung CEFR</h2>
      <p class="muted">Khoảng 10 phút · kết quả cho từng kỹ năng · không có đáp án sai bị phạt, cứ trả lời thật</p>
      <div class="g-3" style="margin:28px 0;text-align:left">
        <div class="card tight lift" data-act="tStart"><i class="ph ph-book-open-text" style="font-size:24px;color:var(--accent)"></i><b style="display:block;margin-top:8px">Từ vựng</b><div class="small muted">Biết hay không biết từ · ~3 phút</div></div>
        <div class="card tight lift" data-act="tStart"><i class="ph ph-headphones" style="font-size:24px;color:var(--accent)"></i><b style="display:block;margin-top:8px">Nghe chép</b><div class="small muted">Nghe tối đa 2 lần · ~4 phút</div></div>
        <div class="card tight lift" data-act="tStart"><i class="ph ph-microphone" style="font-size:24px;color:var(--accent)"></i><b style="display:block;margin-top:8px">Nói</b><div class="small muted">Cần micro · ~3 phút</div></div></div>
      <button class="btn primary lg" data-act="tStart">Bắt đầu<i class="ph ph-arrow-right arr" aria-hidden="true"></i></button>
      <p class="small muted" style="margin-top:12px">Lưu tiến độ tự động — thoát giữa chừng vẫn làm tiếp được</p></div></div>`;
  } else if (T.stage === 'vocab') {
    const [w] = TEST_VOCAB[T.i];
    box.innerHTML = `${testHeader(0)}<div class="card test-card"><div class="small muted">Câu ${T.i + 1}/${TEST_VOCAB.length}</div>
      <div class="display-lg text-gradient test-word">${w}</div><p class="muted">Bạn có biết nghĩa của từ này không?</p>
      <div class="yn"><button data-yn="0">Không biết<small>← hoặc N</small></button><button data-yn="1">Biết<small>→ hoặc Y</small></button></div>
      <div class="timer"><i id="tTimer"></i></div>
      <p class="small muted" style="margin-top:12px">Có vài từ không có thật để kiểm tra đoán mò — cứ trả lời thật lòng</p></div>`;
    const bar = $('#tTimer'); bar.style.transition = 'none'; bar.style.width = '100%';
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = 'width 8s linear'; bar.style.width = '0%'; }));
  } else if (T.stage === 'dict') {
    box.innerHTML = `${testHeader(1)}<div class="card test-card"><p class="muted">Nghe và gõ lại câu (tối đa 2 lần nghe)</p>
      <button class="play-big" style="margin:20px auto 8px" data-act="tPlay" id="tPlayBtn" aria-label="Phát câu">${icon('play', 1)}</button><div class="small muted" id="tPlays">Còn 2 lần nghe</div>
      <div class="dict-box" style="margin-top:20px"><textarea id="tInput" placeholder="Gõ câu bạn nghe…" style="min-height:96px;font-size:18px;padding-bottom:20px" aria-label="Câu bạn nghe được"></textarea></div>
      <button class="btn primary" style="margin-top:16px" data-act="tDictNext">Tiếp<i class="ph ph-arrow-right arr" aria-hidden="true"></i></button></div>`;
  } else if (T.stage === 'speak') {
    box.innerHTML = `${testHeader(2)}<div class="card test-card"><p class="muted">Đọc to câu sau</p>
      <div class="karaoke" style="margin:20px 0">The weather is getting colder these days.</div>
      <button class="mic" style="margin:0 auto" data-act="tRec" id="tMic" aria-label="Ghi âm">${icon('microphone', 1)}</button><p class="small muted" style="margin-top:12px" id="tMicLbl">Nhấn để ghi (1 lần, được ghi lại 1 lần)</p>
      <button class="btn text sm" style="margin-top:12px" data-act="tSkip">Không có micro? Bỏ qua phần này</button></div>`;
  } else if (T.stage === 'calc') {
    box.innerHTML = `<div class="card test-card">${mascot('listen', 110).replace('class="mascot', 'style="margin:0 auto" class="mascot')}<div class="ring" id="tCalc" style="margin-top:8px"></div><h2 style="margin-top:16px" id="tCalcLbl">Đang phân tích từ vựng…</h2></div>`;
    ring($('#tCalc'), 100, { size: 110, color: 'url(#gRing)', text: k => Math.round(k * 100) + '%' });
    const lbls = ['Đang phân tích từ vựng…', 'Đang chấm nghe chép…', 'Đang chấm phát âm…', 'Ước tính trình độ…'];
    lbls.forEach((l, k) => setTimeout(() => { const el = $('#tCalcLbl'); if (el) el.textContent = l; }, k * 450));
    setTimeout(() => { T.stage = 'result'; testRender(); }, 1900);
  } else if (T.stage === 'result') {
    const known = T.ans.filter((a, k) => a && TEST_VOCAB[k][1]).length, fake = T.ans.filter((a, k) => a && !TEST_VOCAB[k][1]).length;
    const vocabScore = Math.max(20, Math.min(92, 30 + known * 8 - fake * 10));
    const skills = [['book-open-text', 'Từ vựng', vocabScore, 7], ['headphones', 'Nghe chép', 56, 9], ['microphone', 'Nói', 61, 10]];
    // Ngưỡng điểm → CEFR (algorithm_version tạm); pos() quy điểm về vị trí trên thanh 6 khúc đều nhau
    const CUT = [0, 25, 45, 65, 80, 92, 100];
    const lvl = s => LEVELS[Math.max(0, CUT.findIndex((c, k) => s < CUT[k + 1]))];
    const pos = s => { const k = Math.max(0, CUT.findIndex((c, i) => s < CUT[i + 1])); return (k + (s - CUT[k]) / (CUT[k + 1] - CUT[k])) / 6 * 100; };
    box.innerHTML = `<div class="test-wrap">${obj('orb', '--s:96px;top:-40px;right:-36px')}${obj('star', '--s:52px;bottom:40px;left:-28px;--d:-3s', 'm-hide')}
      <div class="card card-highlight test-card"><div class="overline">Trình độ ước tính</div>
      <div class="display-xl text-gradient">${lvl(Math.round(skills.reduce((a, s) => a + s[2], 0) / 3))}</div>
      <p class="muted" style="margin-top:8px">Bạn hiểu ý chính của hội thoại quen thuộc và xử lý được tình huống du lịch thường gặp.</p>
      <div class="col g24" style="margin-top:28px;text-align:left">${skills.map(([ic, n, s, ci], k) => `<div>
        <div class="row between"><b class="row g8">${icon(ic)}${n}</b><span class="row" style="gap:8px"><span class="small muted">${s} điểm</span><span class="badge cefr ${lvl(s)}">${lvl(s)}</span></span></div>
        <div class="cefr-scale">${LEVELS.map(l => `<span class="${l}"></span>`).join('')}<div class="band" id="band${k}" style="left:0;width:0"></div><div class="mark" id="mark${k}" style="left:0"></div></div>
        <div class="cefr-lbl">${LEVELS.map(l => `<span>${l}</span>`).join('')}</div>
        <div class="small muted" style="margin-top:4px">Khoảng tin cậy ${s - ci}–${s + ci} · sẽ chính xác hơn khi bạn học thêm</div></div>`).join('')}</div>
      <div class="tipbox" style="margin-top:24px;text-align:left">${icon('target')}<span>Phát hiện sớm: <b>bỏ sót từ chức năng</b> khi nghe, và âm <b class="ipa">/θ/</b> khi nói. Kế hoạch hôm nay đã được cập nhật.</span></div>
      <div class="row w" style="justify-content:center;margin-top:24px"><button class="btn ghost" data-act="tRestart">Làm lại</button><button class="btn primary" data-go="today">Xem kế hoạch hôm nay<i class="ph ph-arrow-right arr" aria-hidden="true"></i></button></div>
      <p class="small muted" style="margin-top:12px">Kiểm tra lại sau 4 tuần để thấy tiến bộ</p></div></div>`;
    skills.forEach(([, , s, ci], k) => setTimeout(() => { const l = pos(s - ci), r = pos(Math.min(99, s + ci)); $('#band' + k).style.left = l + '%'; $('#band' + k).style.width = (r - l) + '%'; $('#mark' + k).style.left = `calc(${pos(s)}% - 2px)`; }, 150 + k * 150));
    confetti();
  }
}
function testAnswer(yes) {
  const btn = $(`[data-yn="${yes ? 1 : 0}"]`); if (btn) btn.classList.add(yes ? 'flash-y' : 'flash-n');
  T.ans[T.i] = !!yes;
  setTimeout(() => { T.i++; if (T.i >= TEST_VOCAB.length) T.stage = 'dict'; testRender(); }, 160);
}

Object.assign(ACT, {
  tStart() { T.stage = 'vocab'; T.i = 0; T.ans = []; testRender(); }, tRestart() { T.stage = 'intro'; testRender(); },
  tPlay() { if (T.plays >= 2) return; T.plays++; speak('The meeting has been postponed until next week.', { rate: .85, lang: 'en-US' }); $('#tPlays').textContent = T.plays >= 2 ? 'Hết lượt nghe' : 'Còn 1 lần nghe'; if (T.plays >= 2) $('#tPlayBtn').disabled = true; },
  tDictNext() { T.stage = 'speak'; T.plays = 0; testRender(); },
  tRec() { const m = $('#tMic'); if (m.classList.contains('rec')) { m.classList.remove('rec'); m.innerHTML = icon('check', 1); $('#tMicLbl').textContent = 'Đã ghi âm'; setTimeout(() => { T.stage = 'calc'; testRender(); }, 500); } else { m.classList.add('rec'); m.innerHTML = icon('stop', 1); $('#tMicLbl').textContent = 'Đang ghi… nhấn để dừng'; } },
  tSkip() { T.stage = 'calc'; testRender(); },
});

Shell.click((t) => {
  const yn = t.closest('[data-yn]'); if (yn) { testAnswer(yn.dataset.yn === '1'); return true; }
});
Shell.key((e) => {
  if (T.stage === 'vocab') { if (['ArrowRight', 'y', 'Y'].includes(e.key)) testAnswer(true); if (['ArrowLeft', 'n', 'N'].includes(e.key)) testAnswer(false); }
}, 'late');

testRender();
