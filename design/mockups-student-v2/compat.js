/**
 * LinguaLoop v2 — compat.js
 * Hàm hỗ trợ của mockups-student/shell.js mà các trang P2–P4 (nghe chép, shadowing, từ vựng, cài đặt, đăng nhập...) còn dùng.
 * Nạp sau shell.js. Giữ nguyên chữ ký của v1 để script trang dùng lại được.
 */
'use strict';
let actx;
function ting() { // âm "ting" khi trả lời đúng
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(1320, t); o.frequency.exponentialRampToValueAtTime(1760, t + .08);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .35);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + .4);
  } catch (_) {}
}
function xpFly(el, n = 10) {
  if (!el) return; const r = el.getBoundingClientRect();
  const s = document.createElement('span'); s.className = 'xp-fly'; s.textContent = `+${n} XP`;
  s.style.left = r.left + r.width / 2 + 'px'; s.style.top = r.top - 8 + 'px';
  document.body.appendChild(s); setTimeout(() => s.remove(), 900);
}
const obj = (kind, style, cls = '') => `<svg class="obj ${cls}" style="${style}" aria-hidden="true"><use href="#o-${kind}"/></svg>`;
const vimg = (w, cls = '') => `<div class="vimg ${cls}" role="img" aria-label="Minh hoạ cho từ ${esc(w)}"><svg class="art-orb" aria-hidden="true"><use href="#o-orb"/></svg><i class="ph-duotone ph-${DICT[w].img} art" aria-hidden="true"></i></div>`;
const aud = (text, label, { lang = 'en-GB', ipa = '' } = {}) =>
  `<button class="aud ${lang === 'en-US' ? 'us' : ''}" data-say="${esc(text)}" data-lang="${lang}" aria-label="Phát âm ${lang === 'en-US' ? 'giọng Mỹ' : 'giọng Anh'}: ${esc(text)}"><span class="aud-dot">${icon('speaker-high', 1)}<span class="bars"><b></b><b></b><b></b></span></span>${label}${ipa ? ` <span class="ipa">${ipa}</span>` : ''}</button>`;

const scoreColor = (v) => v >= 80 ? 'var(--success)' : v >= 60 ? 'var(--warning)' : 'var(--danger)';
const scoreTone = (v) => v >= 80 ? 't-ok' : v >= 60 ? 't-warn' : 't-bad';
function drawWave(canvas, levels, color) {
  const dpr = devicePixelRatio || 1, w = canvas.clientWidth, hgt = canvas.clientHeight;
  if (!w) return;
  if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = hgt * dpr; }
  const x = canvas.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, hgt);
  const n = Math.floor(w / 6); x.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const v = levels[levels.length - n + i] ?? .04; const bh = Math.max(3, v * hgt);
    x.globalAlpha = .35 + .65 * Math.min(1, v * 2);
    x.beginPath(); x.roundRect ? x.roundRect(i * 6 + 1, (hgt - bh) / 2, 3.5, bh, 2) : x.rect(i * 6 + 1, (hgt - bh) / 2, 3.5, bh); x.fill();
  }
  x.globalAlpha = 1;
}
// Thẻ chọn một trong các trạng thái mascot Loopi cạnh lời nhắn (dùng ở nghe chép, shadowing)
function loopiSay(mood, text, id = 'sLoopi') { const el = $('#' + id); if (el) el.innerHTML = `${mascot(mood, 64)}<span>${text}</span>`; }

function lev(a, b) { const m = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; }
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
// SM-2 dùng cho ôn thẻ (vocab.js) và học một bài trong bộ (group.js)
function sm2(c, q) {
  let { ef, interval, reps } = c;
  // SM-2 (user_card_progress) + hệ số kiểu Anki để Khó/Được/Dễ cho khoảng ôn khác nhau
  ef = Math.max(1.3, +(ef + (.1 - (5 - q) * (.08 + (5 - q) * .02))).toFixed(2));
  if (q < 3) { reps = 0; interval = 0; }
  else {
    const mod = q === 3 ? 1.2 : q === 4 ? ef : ef * 1.3;
    interval = reps === 0 ? (q === 5 ? 4 : 1) : reps === 1 ? (q === 3 ? 3 : q === 4 ? 6 : 8) : Math.max(interval + 1, Math.round(interval * mod));
    reps++;
  }
  return { ef, interval, reps };
}
const ivl = (c, q) => { const n = sm2(c, q); return n.interval === 0 ? '10 phút' : n.interval === 1 ? '1 ngày' : n.interval < 30 ? n.interval + ' ngày' : Math.round(n.interval / 30) + ' tháng'; };

/* Biểu mẫu: báo lỗi dưới ô nhập, nút bận, độ mạnh mật khẩu */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, USER_RE = /^[a-z0-9_]{3,20}$/, TAKEN = ['minhanh', 'admin', 'lingualoop', 'test'];
let userT = 0;
function fieldErr(id, msg) {
  const el = $('#' + id), f = el.closest('.field'); f.classList.toggle('bad', !!msg); if (msg) f.classList.remove('ok');
  const e = $('.err', f); if (e) e.innerHTML = msg ? `${icon('warning-circle', 1)}<span>${msg}</span>` : '';
  el.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg;
}
function busy(btn, label) { btn.dataset.html = btn.innerHTML; btn.classList.add('loading'); btn.innerHTML = `<i class="ph ph-circle-notch spin" aria-hidden="true"></i>${label}`; }
function unbusy(btn) { btn.classList.remove('loading'); btn.innerHTML = btn.dataset.html; }
const pwValid = (v) => v.length >= 8 && /[a-z]/i.test(v) && /\d/.test(v);
function pwScore(v) { if (!v) return 0; let s = 0; if (v.length >= 8) s++; if (/[a-z]/i.test(v) && /\d/.test(v)) s++; if (/[^a-z0-9]/i.test(v)) s++; if (v.length >= 12) s++; return Math.max(1, s); }
const PW_LABEL = ['', 'Yếu', 'Tạm được', 'Mạnh', 'Rất mạnh'];
function pwMeter(inp, meterId) {
  const s = pwScore(inp.value), m = $('#' + meterId); m.dataset.s = s;
  const h = $('.hint', m.closest('.field')); if (!h) return;
  h.className = 'hint'; h.innerHTML = inp.value ? `<span>Độ mạnh: <b>${PW_LABEL[s]}</b>${pwValid(inp.value) ? '' : ' · cần ít nhất 8 ký tự, có cả chữ và số'}</span>` : 'Ít nhất 8 ký tự, có cả chữ và số';
}
function rgUserCheck(inp) {
  const u = inp.value.trim().toLowerCase(), h = $('#rgUserHint'), f = inp.closest('.field'); f.classList.remove('bad', 'ok'); clearTimeout(userT);
  if (!u) { h.className = 'hint'; h.textContent = '3–20 ký tự: chữ thường, số hoặc dấu gạch dưới'; return; }
  if (!USER_RE.test(u)) { h.className = 'hint bad'; h.innerHTML = `${icon('warning-circle', 1)}Chỉ dùng chữ thường không dấu, số hoặc dấu gạch dưới, 3–20 ký tự`; return; }
  h.className = 'hint'; h.innerHTML = `<i class="ph ph-circle-notch spin" aria-hidden="true"></i>Đang kiểm tra…`;
  userT = setTimeout(() => { const taken = TAKEN.includes(u); f.classList.toggle('ok', !taken); h.className = 'hint ' + (taken ? 'bad' : 'ok');
    h.innerHTML = taken ? `${icon('x-circle', 1)}@${esc(u)} đã có người dùng. Thử @${esc(u)}_2026?` : `${icon('check-circle', 1)}@${esc(u)} dùng được`; }, 450);
}
function togglePwEye(b) { const i = $('input', b.closest('.inp')), show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.setAttribute('aria-pressed', show); b.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'); b.innerHTML = icon(show ? 'eye-slash' : 'eye'); }
