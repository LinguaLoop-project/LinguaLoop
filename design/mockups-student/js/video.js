/* Khung video theo câu: mỗi câu có sentences.start_ms/end_ms, bấm phát chỉ chạy đúng đoạn của câu.
   Bài audio (lessons.source_type = 'audio') chỉ có thanh chia câu, không có khung video.
   Dùng ở Nghe chép (key 'd') và Shadowing (key 's'). Nạp trước dictation.js / shadowing.js. */
'use strict';
const VP = { d: { k: 0, raf: 0, loopT: 0, loop: false, cc: false }, s: { k: 0, raf: 0, loopT: 0, loop: false, cc: false } };
const VP_HIDE = store.get('ll3-vp-hide', {});
function vpSegs(L) { // mô phỏng start/end: chia đều thời lượng bài cho L.n câu
  const tot = durSec(L.dur), step = (tot - 1) / L.n;
  return Array.from({ length: L.n }, (_, i) => ({ s: .6 + i * step, e: .6 + i * step + step * .86 }));
}
const fmtS = (x) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${(x % 60).toFixed(1).padStart(4, '0')}`;
function vpRender(key) {
  const host = $('#' + key + 'Vp'); if (!host) return;
  const m = key === 'd' ? 'dictation' : 'shadowing', L = lessonOf(curLesson[m]) || LESSONS[0], st = VP[key];
  vpStop(key);
  st.L = L; st.segs = vpSegs(L); st.k = key === 'd' ? Math.min(D.i, L.n - 1) : 0;
  const tot = durSec(L.dur), sg = st.segs[st.k], video = L.src === 'youtube', hidden = !!VP_HIDE[key];
  const text = key === 'd' ? DICT_SENTENCES[D.i].t : SHADOW.text, ccOk = key === 's' || D.checked;
  const track = `<div class="vp-track" role="group" aria-label="Các câu trong ${video ? 'video' : 'bài nghe'}">${st.segs.map((x, i) => {
    const cls = i === st.k ? 'cur' : key === 'd' && D.scores[i] != null ? 'done' : '';
    return `<button class="vp-seg ${cls}" style="left:${(x.s / tot * 100).toFixed(2)}%;width:${((x.e - x.s) / tot * 100).toFixed(2)}%" data-vpseg="${key}:${i}" aria-label="Câu ${i + 1}, bắt đầu ${fmtT(Math.floor(x.s))}"${i === st.k ? ' aria-current="true"' : ''}></button>`; }).join('')}<span class="vp-head" style="left:${(sg.s / tot * 100).toFixed(2)}%"></span></div>`;
  host.innerHTML = `<div class="vp ${video ? '' : 'audio'} ${video && hidden ? 'collapsed' : ''}" id="${key}VpBox">
    ${video ? `<div class="vp-screen">${thumb(L, false)}
      <div class="vp-top"><span class="tag-glass">${icon('youtube-logo', 1)}YouTube · câu ${st.k + 1}/${L.n}</span><button class="tag-glass" data-act="vpHide" data-vp="${key}">${icon('ear')}Chỉ nghe</button></div>
      <button class="vp-center" data-act="vpPlay" data-vp="${key}" aria-label="Phát đoạn video của câu ${st.k + 1}">${icon('play', 1)}</button>
      <div class="vp-cap ${st.cc && ccOk ? '' : 'off'}" id="${key}VpCap">${esc(text)}</div></div>` : ''}
    <div class="vp-bar">
      ${!video ? `<span class="vp-kind small">${icon('waveform')}Bài audio</span>` : hidden ? `<button class="chip" data-act="vpHide" data-vp="${key}">${icon('video-camera')}Hiện video</button>` : ''}
      <span class="vp-time small"><b id="${key}VpNow">${fmtS(sg.s)}</b><span class="muted"> / ${fmtT(tot)}</span></span>
      ${track}
      ${video ? `<button class="chip" data-act="vpCc" data-vp="${key}" aria-label="Phụ đề" aria-pressed="${st.cc && ccOk}" ${ccOk ? 'title="Phụ đề của câu này"' : 'disabled title="Phụ đề mở sau khi bạn kiểm tra câu"'}>${icon('closed-captioning')}<span class="vp-l">CC</span></button>` : ''}
      <button class="chip" data-act="vpLoop" data-vp="${key}" aria-label="Lặp câu" aria-pressed="${st.loop}" title="Tự phát lại đoạn của câu này">${icon('repeat')}<span class="vp-l">Lặp câu</span></button>
    </div></div>`;
}
function vpRun(key, ms, idx) {
  const st = VP[key], box = $('#' + key + 'VpBox'); if (!box || !st.segs) return;
  vpStop(key);
  const sg = st.segs[idx ?? st.k], tot = durSec(st.L.dur), head = $('.vp-head', box), now = $('#' + key + 'VpNow'), t0 = performance.now();
  box.classList.add('playing');
  const f = (t) => {
    const p = Math.min(1, (t - t0) / ms), x = sg.s + (sg.e - sg.s) * p;
    head.style.left = (x / tot * 100).toFixed(2) + '%'; now.textContent = fmtS(x);
    if (p < 1) { st.raf = requestAnimationFrame(f); return; }
    box.classList.remove('playing');
    if (st.loop && idx == null) st.loopT = setTimeout(() => (key === 'd' ? dictPlay() : sListen()), 700);
  };
  st.raf = requestAnimationFrame(f);
}
function vpStop(key) { const st = VP[key]; cancelAnimationFrame(st.raf); clearTimeout(st.loopT); const b = $('#' + key + 'VpBox'); if (b) b.classList.remove('playing'); }
function vpSeg(key, i) {
  i = +i;
  if (key === 'd') {
    if (i === D.i) return dictPlay();
    if (i < D.i && DICT_SENTENCES[i]) { const t = DICT_SENTENCES[i].t; speak(t, { rate: D.rate, lang: 'en-US' }); vpRun('d', t.split(' ').length * 420 / D.rate, i); toast(`Nghe lại câu ${i + 1}`, null, 'arrow-counter-clockwise'); return; }
    toast('Làm xong câu hiện tại để mở câu tiếp theo', null, 'lock-simple'); return;
  }
  if (i === 0) return sListen();
  toast('Bản mẫu mới dựng câu 1. Bản thật: bấm đoạn nào thì chuyển sang câu đó', null, 'info');
}

Object.assign(ACT, {
  vpPlay(b) { if (b.dataset.vp === 'd') dictPlay(); else sListen(); },
  vpHide(b) { const k = b.dataset.vp; VP_HIDE[k] = !VP_HIDE[k]; store.set('ll3-vp-hide', VP_HIDE); vpRender(k); toast(VP_HIDE[k] ? 'Đã ẩn video, chỉ nghe tiếng' : 'Đã hiện video', null, VP_HIDE[k] ? 'ear' : 'video-camera'); },
  vpCc(b) { const k = b.dataset.vp, st = VP[k]; st.cc = !st.cc; b.setAttribute('aria-pressed', st.cc); const c = $('#' + k + 'VpCap'); if (c) c.classList.toggle('off', !st.cc); },
  vpLoop(b) { const st = VP[b.dataset.vp]; st.loop = !st.loop; b.setAttribute('aria-pressed', st.loop); if (!st.loop) clearTimeout(st.loopT); toast(st.loop ? 'Lặp câu: bật. Đoạn của câu này tự phát lại' : 'Lặp câu: tắt', null, 'repeat'); },
});

Shell.click((t) => {
  const vs = t.closest('[data-vpseg]'); if (vs) { vpSeg(...vs.dataset.vpseg.split(':')); return true; }
});
