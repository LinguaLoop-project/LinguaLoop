/**
 * LinguaLoop — shell.js (Học viên)
 * Khung chung cho mọi trang học viên: tiện ích, sidebar, top bar, footer, thanh điều hướng mobile,
 * lớp phủ (toast, dialog, palette, sheet), điều hướng giữa các trang, sự kiện dùng chung.
 * Mỗi trang HTML gọi Shell.init(pageId) sau khi nạp shell.js và data.js.
 *
 * pageId: today | weakness | dictation | shadowing | vocab | lessons | topic | lesson |
 *         deck | group | mywords | test | settings | brand | login | register | forgot | verify
 * Dữ liệu mẫu, không gọi backend.
 */
'use strict';

/* ─── 1. Tiện ích cơ bản ─── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
                set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
const icon = (n, fill) => `<i class="${fill ? 'ph-fill' : 'ph'} ph-${n}" aria-hidden="true"></i>`;
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const sess = {
  get(k, d) { try { const v = sessionStorage.getItem('ll3s-' + k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { sessionStorage.setItem('ll3s-' + k, JSON.stringify(v)); } catch (_) {} },
  del(k) { try { sessionStorage.removeItem('ll3s-' + k); } catch (_) {} },
};
const qs = () => new URLSearchParams(location.search);

/* ─── 2. Tiện ích giao diện: toast, notice, confetti, ring, TTS, âm "ting", mascot, vật thể ─── */
let toastT;
function toast(msg, action, ic) {
  const t = $('#toast'); t.querySelector('span').textContent = msg;
  t.querySelector('i').className = ic ? `ph ph-${ic}` : 'ph';
  const b = t.querySelector('button');
  if (action) { b.style.display = ''; b.textContent = action.label; b.onclick = () => { action.fn(); t.classList.remove('on'); }; } else b.style.display = 'none';
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200);
}
let noticeT;
function notice(html) {
  const n = $('#notice'); n.innerHTML = html; n.classList.add('on');
  clearTimeout(noticeT); noticeT = setTimeout(() => n.classList.remove('on'), 2600);
}

function confetti() {
  if (reduced()) return;
  const c = $('#confetti'), x = c.getContext('2d'); const dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = [cssVar('--primary'), cssVar('--accent'), cssVar('--accent-2'), cssVar('--warning')]; // tím – hồng – vàng
  const P = Array.from({ length: 150 }, () => ({ x: innerWidth / 2, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 4, r: Math.random() * 6 + 3, c: cols[Math.random() * cols.length | 0], a: Math.random() * 6 }));
  let f = 0; (function tick() {
    x.clearRect(0, 0, innerWidth, innerHeight);
    P.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += .2; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
    if (++f < 110) requestAnimationFrame(tick); else x.clearRect(0, 0, innerWidth, innerHeight);
  })();
}

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
function particles(el) {
  if (reduced()) return;
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('span'); p.className = 'particle'; const a = i / 8 * Math.PI * 2, d = 26 + Math.random() * 10;
    p.style.setProperty('--tx', Math.cos(a) * d + 'px'); p.style.setProperty('--ty', Math.sin(a) * d + 'px');
    el.appendChild(p); setTimeout(() => p.remove(), 650);
  }
}
function bump(el, v) { // đổi số dạng "lật"
  if (!el) return; if (v !== undefined) el.textContent = v;
  el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip');
}
// Mascot Loopi: dùng asset gốc ở docs/design/loopi-mascot/svg (xem Mascot.tsx trong cùng thư mục).
// Tên trạng thái cũ trong mockup → mood của Loopi
const LOOPI_MOOD = { idle: 'hello', hello: 'hello', happy: 'correct', correct: 'correct', sad: 'encourage', encourage: 'encourage', celebrate: 'celebrate', listen: 'listening', listening: 'listening', speaking: 'speaking' };
const LOOPI_ALT = { hello: 'Loopi vẫy tay chào', listening: 'Loopi đang nghe', speaking: 'Loopi đang nói', correct: 'Loopi vui vì bạn trả lời đúng', encourage: 'Loopi động viên bạn thử lại', celebrate: 'Loopi ăn mừng' };
function mascot(state = 'hello', size = 120, label) {
  const mood = LOOPI_MOOD[state] || 'hello';
  return `<img class="mascot loopi__img loopi--${mood}" src="../loopi-mascot/svg/loopi-${mood}.svg" width="${size}" height="${size}" alt="${label ? LOOPI_ALT[mood] : ''}" draggable="false">`;
}
const obj = (kind, style, cls = '') => `<svg class="obj ${cls}" style="${style}" aria-hidden="true"><use href="#o-${kind}"/></svg>`;
const vimg = (w, cls = '') => `<div class="vimg ${cls}" role="img" aria-label="Minh hoạ cho từ ${esc(w)}"><svg class="art-orb" aria-hidden="true"><use href="#o-orb"/></svg><i class="ph-duotone ph-${DICT[w].img} art" aria-hidden="true"></i></div>`;
const aud = (text, label, { lang = 'en-GB', ipa = '' } = {}) =>
  `<button class="aud ${lang === 'en-US' ? 'us' : ''}" data-say="${esc(text)}" data-lang="${lang}" aria-label="Phát âm ${lang === 'en-US' ? 'giọng Mỹ' : 'giọng Anh'}: ${esc(text)}"><span class="aud-dot">${icon('speaker-high', 1)}<span class="bars"><b></b><b></b><b></b></span></span>${label}${ipa ? ` <span class="ipa">${ipa}</span>` : ''}</button>`;

const scoreColor = (v) => v >= 80 ? 'var(--success)' : v >= 60 ? 'var(--warning)' : 'var(--danger)';
const scoreTone = (v) => v >= 80 ? 't-ok' : v >= 60 ? 't-warn' : 't-bad';
function ring(el, value, { size = 120, stroke = 10, max = 100, color, label = '', text } = {}) {
  const r = (size - stroke) / 2, C = 2 * Math.PI * r;
  el.innerHTML = `<svg width="${size}" height="${size}"><circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>
    <circle class="val" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}" stroke="${color || scoreColor(value)}" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
    <div class="num" style="font-size:${Math.round(size * .27)}px"><span>0</span>${label ? `<small>${label}</small>` : ''}</div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => { el.querySelector('.val').style.strokeDashoffset = C * (1 - Math.min(value, max) / max); }));
  const span = el.querySelector('.num span'), t0 = performance.now();
  (function count(t) { const k = Math.min(1, (t - t0) / 900); span.textContent = text ? text(k) : Math.round(value * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(count); })(t0);
}

let voices = [];
if ('speechSynthesis' in window) { const lv = () => voices = speechSynthesis.getVoices(); lv(); speechSynthesis.onvoiceschanged = lv; }
function speak(text, { rate = .9, lang = 'en-GB' } = {}, btn) {
  if (btn && btn.classList.contains('aud')) { // vòng tròn → sóng âm 3 vạch khi đang phát
    $$('.aud.playing').forEach(b => b.classList.remove('playing')); btn.classList.add('playing');
    clearTimeout(btn._t); btn._t = setTimeout(() => btn.classList.remove('playing'), Math.max(900, text.split(/\s+/).length * 420 / rate));
  }
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate;
  const v = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith('en')); if (v) u.voice = v;
  if (btn) u.onend = () => { clearTimeout(btn._t); btn.classList.remove('playing'); };
  speechSynthesis.speak(u);
}

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

// Segmented control: chỉ báo active trượt giữa các tab
function segMove(seg) {
  const b = seg.querySelector('button.on'); if (!b || !seg.offsetParent) return;
  seg.style.setProperty('--x', b.offsetLeft + 'px'); seg.style.setProperty('--w', b.offsetWidth + 'px');
}
const segAll = () => $$('.seg').forEach(segMove);
function segPick(btn) { const seg = btn.closest('.seg'); $$('button', seg).forEach(b => b.classList.toggle('on', b === btn)); segMove(seg); }

// Xuất hiện khi vào màn: fade + translateY(24px → 0), stagger 60ms
function reveal(root) {
  $$('.rv', root).forEach((el, i) => { el.classList.remove('in'); void el.offsetWidth; el.style.animationDelay = i * 60 + 'ms'; el.classList.add('in'); });
}

// Thẻ chọn một trong các trạng thái mascot Loopi cạnh lời nhắn (dùng ở nghe chép, shadowing)
function loopiSay(mood, text, id = 'sLoopi') { const el = $('#' + id); if (el) el.innerHTML = `${mascot(mood, 64)}<span>${text}</span>`; }

// Toast hiển thị ở trang kế tiếp (dùng khi vừa chuyển trang)
function flash(msg, ic, extra) { sess.set('flash', { msg, ic, ...(extra || {}) }); }

/* ─── 3. Hàm dùng chung giữa các trang ─── */
const isPro = () => document.body.classList.contains('pro');
const duo = (n) => `<i class="ph-duotone ph-${n}" aria-hidden="true"></i>`;
function thumb(L, corners = true) {
  return `<div class="lthumb"><svg class="art-orb" viewBox="0 0 200 200" aria-hidden="true"><use href="#o-orb"/></svg><i class="ph-duotone ph-${L.ic} art" aria-hidden="true"></i>
    ${corners ? `<div class="corner tl">${L.pro ? `<span class="badge pro">${icon('crown-simple', 1)}PRO</span>` : ''}<span class="tag-glass" title="Lượt học">${icon('headphones')}${fmtNum(L.views)}</span></div>
    <div class="corner tr"><span class="badge cefr ${L.cefr}">${L.cefr}</span></div>
    <div class="corner bl"><span class="tag-glass">${L.src === 'youtube' ? icon('youtube-logo', 1) + 'YouTube' : icon('waveform') + 'Audio'}</span></div>
    <div class="corner br"><span class="tag-glass">${icon('clock')}${L.dur}</span></div>` : ''}</div>`;
}
function emptyState(title, sub, action = '') {
  return `<div class="empty">${mascot('sad', 96)}<h3>${title}</h3><p class="small muted">${sub}</p>${action}</div>`;
}
const secHead = (ic, title, count, action = '') => `<div class="sec-head rv"><h2><span class="sec-ic">${duo(ic)}</span>${title}${count != null ? ` <small>${count}</small>` : ''}</h2>${action}</div>`;
// khoảng cách chỉnh sửa (tra từ gần đúng, chấm nghe chép)
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
let userT = 0, DLG = { fn: null, text: '' };
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

/* ─── 4. Tài khoản (hồ sơ lưu trong localStorage để giữ giữa các trang) ─── */
const ME = { name: 'Minh Anh', user: 'minhanh', email: 'minhanh.nguyen@gmail.com', bio: 'Đang ôn IELTS 6.5, thích xem phim hoạt hình.', birthday: '2003-05-30', gender: '',
  tz: 'Asia/Ho_Chi_Minh', lang: 'vi', motion: 'system', maxReviews: 100, voice: 'uk', rate: '.8', showVideo: true, autoNext: true, remind: true, remindAt: '20:00', streakWarn: true,
  google: true, consentVoice: true, consentAi: true };
const initials = (n) => n.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase() || '?';
Object.assign(ME, store.get('ll3-me', {}));
const saveMe = () => store.set('ll3-me', ME);

function renderAcct() {
  const b = $('#acctBtn'); b.textContent = initials(ME.name); b.setAttribute('aria-label', `Tài khoản ${ME.name}`);
  $('#acctMenu').innerHTML = `<div class="acct-head"><span class="avatar lg" aria-hidden="true">${initials(ME.name)}</span><div class="grow"><b class="ell" style="display:block">${esc(ME.name)}</b><div class="small muted ell">${esc(ME.email)}</div></div></div>
    <button role="menuitem" class="acct-plan" data-go="settings" data-id="plan">${isPro() ? `<span class="badge pro">${icon('crown-simple', 1)}PRO</span><span class="small muted">Gia hạn 28/09/2027</span>` : `<span class="badge">Free</span><span class="small">Nâng cấp Pro</span>${icon('arrow-right')}`}</button>
    <hr>
    ${[['profile', 'user-circle', 'Hồ sơ'], ['learning', 'target', 'Cài đặt học tập'], ['security', 'shield-check', 'Bảo mật & đăng nhập'], ['privacy', 'lock-key', 'Quyền riêng tư & dữ liệu']].map(([k, ic, l]) => `<button role="menuitem" data-go="settings" data-id="${k}">${icon(ic)}${l}</button>`).join('')}
    <button role="menuitem" data-act="theme">${icon('circle-half')}Đổi giao diện sáng/tối</button>
    <hr><button role="menuitem" class="danger" data-act="logout">${icon('sign-out')}Đăng xuất</button>`;
}
function closeMenu() { const m = $('#acctMenu'); if (m && m.classList.contains('on')) { m.classList.remove('on'); $('#acctBtn').setAttribute('aria-expanded', 'false'); } }

function confirmDlg({ title, body, ok = 'Đồng ý', tone = 't-pri', ic = 'question', danger = false, confirmText = '', onOk }) {
  closeMenu();
  $('#dlgIn').innerHTML = `<div class="dlg-ic ${tone}">${icon(ic, 1)}</div><h2 id="dlgTitle">${title}</h2><p class="muted" id="dlgBody">${body}</p>
    ${confirmText ? `<div class="field" style="margin-top:16px"><label for="dlgInput">Gõ <b>${esc(confirmText)}</b> để xác nhận</label><div class="inp"><input id="dlgInput" autocomplete="off" spellcheck="false"></div></div>` : ''}
    <div class="acts"><button class="btn ghost" data-act="close">Huỷ</button><button class="btn ${danger ? 'danger' : 'primary'}" id="dlgOk" ${confirmText ? 'disabled' : ''}>${ok}</button></div>`;
  DLG = { fn: onOk, text: confirmText };
  $('#dialog').classList.add('on'); $('#scrim').classList.add('on');
  setTimeout(() => ($('#dlgInput') || $('#dlgOk')).focus(), 60);
}

/* ─── 5. Trạng thái dùng chung: kế hoạch hôm nay, từ đã lưu, thẻ đến hạn ─── */
const state = { done: new Set(store.get('ll3-done', [])), focus: sess.get('focus', null), dur: store.get('ll3-dur', 15) };
const saved = new Set(store.get('ll3-saved', ['present#Tính từ#1']));
let due = store.get('ll3-due', 8);
const isSaved = (w) => [...saved].some(k => k.startsWith(w + '#'));
function syncSaves() {
  $$('.save[data-save]').forEach(b => { const k = b.dataset.save, w = k.split('#')[0]; b.classList.toggle('on', saved.has(k) || (k.split('#').length === 3 && saved.has(w + '#all'))); b.setAttribute('aria-pressed', b.classList.contains('on')); });
  if (Shell.hooks.syncSaves) Shell.hooks.syncSaves();
}
function setDue(delta) {
  due = Math.max(0, due + delta); store.set('ll3-due', due);
  bump($('#dueTag'), due); bump($('#dueBadge'), due);
  const tabs = $('#vTabs'); if (tabs) requestAnimationFrame(() => segMove(tabs));
}
const streakNow = () => state.done.size > 0 ? 5 : 4;

function renderFocus() {
  const fb = $('#focusbar'); if (!fb) return;
  if (!state.focus) { fb.classList.remove('on'); return; }
  fb.classList.add('on');
  $('#focusSteps').innerHTML = PLAN.map(t => `<i class="${state.done.has(t.id) ? 'done' : t.id === state.focus.cur ? 'cur' : ''}"></i>`).join('');
  const cur = PLAN.find(t => t.id === state.focus.cur); $('#focusLabel').textContent = cur ? cur.title : '';
}
function completeTask(id) {
  const first = !state.done.has(id), wasZero = state.done.size === 0;
  state.done.add(id); store.set('ll3-done', [...state.done]);
  if (typeof renderToday === 'function') renderToday();
  $('#streakNum').textContent = streakNow();
  if (wasZero) { // lên streak: lửa phóng to, số lật, pill trượt xuống
    notice(`${mascot('celebrate', 40)}${icon('fire', 1)}Chuỗi 5 ngày liên tiếp! Giữ vững nhé`);
    bump($('#streakNum')); bump($('#streakBig'));
    const fl = $('.flame'); if (fl) { fl.classList.remove('big'); void fl.offsetWidth; fl.classList.add('big'); }
  }
  if (state.focus) {
    const i = PLAN.findIndex(t => t.id === id);
    const next = PLAN.slice(i + 1).find(t => !state.done.has(t.id)) || PLAN.find(t => !state.done.has(t.id));
    if (next) { state.focus.cur = next.id; sess.set('focus', state.focus); flash(`Xong. Tiếp: ${next.title}`, 'check-circle'); setTimeout(() => go(next.go, { tab: next.tab }), 700); }
    else { state.focus = null; sess.del('focus'); flash('Hoàn thành phiên 15 phút!', 'confetti', { confetti: true }); go('today'); return; }
  } else if (first) toast('Đã đánh dấu hoàn thành trong kế hoạch hôm nay', null, 'check-circle');
  if (state.done.size === PLAN.length && !state.focus) confetti();
}

/* ─── 6. Điều hướng giữa các trang ─── */
const PAGE_URL = { today: 'index.html', weakness: 'weakness.html', dictation: 'dictation.html', shadowing: 'shadowing.html', vocab: 'vocab.html',
  lessons: 'lessons.html', topic: 'topic.html', lesson: 'lesson.html', deck: 'deck.html', group: 'group.html', mywords: 'mywords.html',
  brand: 'brand.html', test: 'test.html', settings: 'settings.html', login: 'login.html', register: 'register.html', forgot: 'forgot.html', verify: 'verify.html' };
// Màn con → mục điều hướng được tô sáng
const NAV_OF = { topic: 'lessons', lesson: 'lessons', deck: 'vocab', group: 'vocab', dictation: 'lessons/dictation', shadowing: 'lessons/shadowing' };
function go(view, opts = {}) {
  if (Shell.guard && Shell.guard(view, opts)) return; // vd: Cài đặt còn thay đổi chưa lưu
  if (!PAGE_URL[view]) view = 'today';
  const q = new URLSearchParams();
  ['id', 'g', 'tab', 'ctx', 'word', 'lesson'].forEach(k => { const v = opts[k]; if (v != null && v !== '' && v !== false) q.set(k, v === true ? 1 : v); });
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  location.href = PAGE_URL[view] + (q.toString() ? '?' + q : '');
}

/* ─── 7. Palette tìm nhanh + ghi chú UX ─── */
const SCREENS = [['today', 'sun-horizon', 'Hôm nay'], ['lessons', 'books', 'Bài học · Chủ đề'], ['lessons/dictation', 'headphones', 'Nghe chép'], ['lessons/shadowing', 'microphone', 'Shadowing'], ['vocab', 'cards', 'Từ vựng · Bộ từ'], ['mywords', 'bookmarks-simple', 'Từ & câu đã lưu'], ['weakness', 'target', 'Điểm yếu'], ['test', 'exam', 'Kiểm tra trình độ'], ['brand', 'seal', 'Nhận diện: logo & mascot'], ['settings', 'gear-six', 'Cài đặt tài khoản'], ['login', 'sign-in', 'Đăng nhập'], ['register', 'user-plus', 'Đăng ký']];
let pSel = 0, pItems = [];
function paletteOpen() { $('#palette').classList.add('on'); $('#scrim').classList.add('on'); const i = $('#pInput'); i.value = ''; paletteRender(''); setTimeout(() => i.focus(), 30); }
function paletteRender(q) {
  q = q.trim().toLowerCase(); pSel = 0;
  const words = Object.keys(DICT).concat(Object.keys(FORM_INDEX)).filter(w => !q || w.includes(q)).slice(0, 6).map(w => ({ t: 'word', w: FORM_INDEX[w] || w, label: w, sub: firstVi(FORM_INDEX[w] || w) }));
  const les = LESSONS.filter(L => q && (L.title + ' ' + L.vi).toLowerCase().includes(q)).slice(0, 4).map(L => ({ t: 'lesson', id: L.slug, label: L.title, sub: L.cefr + ' · ' + topicOf(L.topic).name }));
  const scr = SCREENS.filter(([, , n]) => !q || n.toLowerCase().includes(q)).map(([id, ic, n]) => ({ t: 'go', id, ic, label: n }));
  const act = [{ t: 'act', a: 'theme', ic: 'circle-half', label: 'Đổi giao diện sáng/tối' }, { t: 'act', a: 'togglePro', ic: 'crown-simple', label: 'Bật/tắt chế độ Pro (xem thử)' }].filter(x => !q || x.label.toLowerCase().includes(q));
  pItems = [...words, ...les, ...scr, ...act];
  let html = '', k = 0;
  const grp = (title, arr, render) => { if (!arr.length) return; html += `<div class="grp">${title}</div>`; arr.forEach(x => { html += `<button class="it ${k === 0 ? 'hl' : ''}" data-pi="${k}">${render(x)}</button>`; k++; }); };
  grp('Từ điển', words, x => `${icon('book-open-text')}<b>${x.label}</b><span class="r">${x.sub}</span>`);
  grp('Bài học', les, x => `${icon('play-circle')}${esc(x.label)}<span class="r">${x.sub}</span>`);
  grp('Đi tới', scr, x => `${icon(x.ic)}${x.label}`); grp('Thao tác', act, x => `${icon(x.ic)}${x.label}`);
  $('#pList').innerHTML = html || `<div class="small muted" style="padding:16px">Không có kết quả cho “${esc(q)}”</div>`;
}
function paletteRun(k) {
  const x = pItems[k]; if (!x) return; closeAll();
  if (x.t === 'word') go('vocab', { tab: 'lookup', word: x.w }); else if (x.t === 'lesson') go('lesson', { id: x.id }); else if (x.t === 'go') { const [v, id] = x.id.split('/'); go(v, { id }); } else ACT[x.a]();
}
function uxOpen(k) {
  const [title, items] = UX[k]; $('#shTitle').textContent = title;
  $('#shBody').innerHTML = `<p class="small muted">Vì sao màn này được thiết kế như vậy — tham khảo sản phẩm nào, dựa trên số liệu khảo sát nào.</p>` + items.map(([a, b]) => `<div class="ref"><b>${a}</b><span class="small muted">${b}</span></div>`).join('');
  $('#sheet').classList.add('on'); $('#scrim').classList.add('on');
}
function closeAll() { $('#palette').classList.remove('on'); $('#sheet').classList.remove('on'); $('#dialog').classList.remove('on'); $('#scrim').classList.remove('on'); closeMenu(); }

/* ─── 8. Hành động dùng chung (data-act) ─── */
function setPro(on, silent) {
  document.body.classList.toggle('pro', on);
  const p = $('#planPill'); if (p) { p.innerHTML = on ? `${icon('crown-simple', 1)}PRO` : 'Free'; p.classList.toggle('is-pro', on); }
  store.set('ll3-pro', on);
  if (!silent) toast(on ? 'Đang xem với gói Pro' : 'Đang xem với gói Free', null, 'crown-simple');
  window.dispatchEvent(new Event('ll:pro'));
}
const ACT = {
  palette: paletteOpen, close: closeAll,
  theme() {
    const root = document.documentElement, n = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.classList.add('theme-anim'); root.dataset.theme = n; store.set('ll3-theme', n);
    setTimeout(() => root.classList.remove('theme-anim'), 320); window.dispatchEvent(new Event('ll:theme'));
  },
  togglePro() { setPro(!isPro()); },
  startFocus() { const next = PLAN.find(t => !state.done.has(t.id)); if (!next) { toast('Bạn đã xong kế hoạch hôm nay', null, 'confetti'); return; } state.focus = { cur: next.id }; sess.set('focus', state.focus); go(next.go, { tab: next.tab }); },
  endFocus() { state.focus = null; sess.del('focus'); renderFocus(); toast('Đã thoát phiên. Tiến độ vẫn được lưu.', null, 'check'); },
  acctMenu() {
    const m = $('#acctMenu'), on = !m.classList.contains('on'); if (on) renderAcct();
    m.classList.toggle('on', on); $('#acctBtn').setAttribute('aria-expanded', on);
    if (on) setTimeout(() => $('[role="menuitem"]', m).focus({ preventScroll: true }), 40);
  },
  logout() {
    closeAll(); if (typeof setDirty === 'function') setDirty(false);
    flash('Đã đăng xuất. Tiến độ học vẫn được lưu trong tài khoản.', 'sign-out'); sess.set('prefill', 1); go('login');
  },
  pwEye: togglePwEye,
  footLink(b) { toast(`Trang “${b.dataset.name}” chưa có trong bản mẫu`, null, 'info'); },
  // Ôn thẻ đến hạn: nhớ đang đi từ đâu tới để có nút quay lại ở màn Ôn thẻ
  reviewDue() {
    const from = Shell.page, d = deckOf(curDeck) || DECKS[0];
    const VC = from === 'deck' ? { go: 'deck', id: d.slug, label: d.name, badge: d.name, over: `Ôn tập · ${d.name}`, title: 'Thẻ đến hạn hôm nay' }
      : from === 'mywords' ? { go: 'mywords', label: 'Từ & câu đã lưu', badge: 'Từ đã lưu', over: 'Ôn tập', title: 'Thẻ đến hạn hôm nay' } : null;
    if (VC) sess.set('vc', VC);
    go('vocab', { tab: 'review', ctx: !!VC });
  },
};

/* ─── 9. Sự kiện dùng chung (mỗi trang đăng ký thêm bằng Shell.click / Shell.key) ─── */
const CLICKS = [], KEYS_EARLY = [], KEYS = [];
document.addEventListener('click', e => {
  const t = e.target;
  if (!t.closest('.acct')) closeMenu(); else if (t.closest('#acctMenu [role="menuitem"]')) setTimeout(closeMenu);
  for (const fn of CLICKS) if (fn(t, e) === true) return;
});
// Handler dùng chung, thứ tự giữ đúng như bản một trang
CLICKS.push((t) => {
  if (t.closest('#dlgOk')) { const f = DLG.fn; closeAll(); if (f) f(); return true; }
  const sv = t.closest('[data-save]');
  if (sv) { const k = sv.dataset.save; const on = !saved.has(k); on ? saved.add(k) : saved.delete(k); store.set('ll3-saved', [...saved]); syncSaves();
    const btn = $$('.save[data-save]').find(b => b.dataset.save === k) || sv;
    if (on) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); particles(btn); setDue(1);
      toast('Đã lưu vào Từ của tôi', { label: 'Hoàn tác', fn: () => { saved.delete(k); store.set('ll3-saved', [...saved]); syncSaves(); setDue(-1); } }, 'bookmark-simple'); }
    else setDue(-1);
    return true; }
  const gEl = t.closest('[data-go]'); if (gEl) { closeAll(); go(gEl.dataset.go, { id: gEl.dataset.id, g: gEl.dataset.g != null ? +gEl.dataset.g : undefined }); return true; }
  const a = t.closest('[data-act]'); if (a) { if (ACT[a.dataset.act]) ACT[a.dataset.act](a); return true; }
  const task = t.closest('[data-task]'); if (task) { const p = PLAN.find(x => x.id === task.dataset.task); go(p.go, { tab: p.tab }); return true; }
  const ux = t.closest('[data-ux]'); if (ux) { uxOpen(ux.dataset.ux); return true; }
  if (t.id === 'scrim') closeAll();
  const say = t.closest('[data-say]'); if (say) { speak(say.dataset.say, { lang: say.dataset.lang || 'en-GB', rate: .9 }, say); return true; }
  const pi = t.closest('[data-pi]'); if (pi) { paletteRun(+pi.dataset.pi); return true; }
});
document.addEventListener('input', e => {
  const x = e.target;
  if (x.id === 'dlgInput') $('#dlgOk').disabled = x.value.trim() !== DLG.text;
  if (x.id === 'pInput') paletteRender(x.value);
  if (x.id !== 'rgUser' && x.closest('.field.bad')) x.closest('.field').classList.remove('bad'); // gõ lại thì bỏ báo lỗi
});
document.addEventListener('keydown', e => {
  const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); paletteOpen(); return; }
  if (e.key === 'Escape') { closeAll(); return; }
  if ($('#palette').classList.contains('on')) {
    const its = $$('#pList .it'); if (!its.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); pSel = (pSel + (e.key === 'ArrowDown' ? 1 : -1) + its.length) % its.length; its.forEach((x, i) => x.classList.toggle('hl', i === pSel)); its[pSel].scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Enter') { e.preventDefault(); paletteRun(pSel); }
    return;
  }
  for (const fn of KEYS_EARLY) if (fn(e, typing) === true) return; // phím dùng được cả khi đang gõ (vd nghe chép)
  if (typing) return;
  if (e.key === 'Enter' && document.activeElement?.matches('article[tabindex], .rel[tabindex]')) { e.preventDefault(); document.activeElement.click(); return; }
  for (const fn of KEYS) if (fn(e) === true) return;
  if (e.code === 'Space' && document.activeElement?.tagName === 'BUTTON') return; // để nút đang focus tự xử lý Space (a11y)
  if (e.key === '/') { e.preventDefault(); const s = $('#vSearch'); if (s) s.focus(); else paletteOpen(); return; }
  for (const fn of KEYS_LATE) if (fn(e) === true) return;
});
const KEYS_LATE = [];
// Spotlight theo con trỏ + parallax vật thể 3D (chỉ ở hero, tắt khi reduced-motion / mobile)
document.addEventListener('pointermove', e => {
  const s = e.target.closest && e.target.closest('.spotlight');
  if (s) { const r = s.getBoundingClientRect(); s.style.setProperty('--mx', e.clientX - r.left + 'px'); s.style.setProperty('--my', e.clientY - r.top + 'px'); }
  if (reduced() || innerWidth < 768) return;
  const px = (e.clientX / innerWidth - .5) * 2, py = (e.clientY / innerHeight - .5) * 2;
  $$('.view.on .parallax .obj').forEach(o => { const k = +(o.dataset.depth || 1) * 20; o.style.setProperty('--px', (-px * k).toFixed(1) + 'px'); o.style.setProperty('--py', (-py * k).toFixed(1) + 'px'); });
}, { passive: true });
window.addEventListener('resize', () => segAll());

/* ─── 10. Khung trang ─── */
const SPRITE = `
<svg class="sprite" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="gBody" cx=".38" cy=".3" r=".85">
      <stop offset="0" style="stop-color:var(--surface-hover)"/>
      <stop offset=".55" style="stop-color:var(--bg-base)"/>
      <stop offset="1" style="stop-color:var(--bg-base)"/>
    </radialGradient>
    <radialGradient id="gRim" cx=".75" cy=".85" r=".7">
      <stop offset="0" style="stop-color:var(--primary);stop-opacity:.9"/>
      <stop offset=".45" style="stop-color:var(--primary);stop-opacity:.25"/>
      <stop offset="1" style="stop-color:var(--primary);stop-opacity:0"/>
    </radialGradient>
    <linearGradient id="gEdge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" style="stop-color:var(--accent);stop-opacity:.85"/>
      <stop offset=".45" style="stop-color:var(--accent);stop-opacity:0"/>
      <stop offset="1" style="stop-color:var(--accent-2);stop-opacity:.85"/>
    </linearGradient>
    <radialGradient id="gSpec">
      <stop offset="0" stop-color="#fff" stop-opacity=".85"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gHalo">
      <stop offset="0" style="stop-color:var(--primary);stop-opacity:.45"/>
      <stop offset="1" style="stop-color:var(--primary);stop-opacity:0"/>
    </radialGradient>
    <linearGradient id="gRing" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8B5CF6"/><stop offset=".5" stop-color="#C084FC"/><stop offset="1" stop-color="#F0ABFC"/>
    </linearGradient>
    <linearGradient id="gLogo" x1="20" y1="88" x2="80" y2="12" gradientUnits="userSpaceOnUse">
      <stop offset="0" style="stop-color:var(--ll-s1)"/><stop offset=".55" style="stop-color:var(--ll-s2)"/><stop offset="1" style="stop-color:var(--ll-s3)"/>
    </linearGradient>
  </defs>
  <!-- Logo "Bong bóng lặp" — nguồn: docs/design/lingualoop-logo/Logo.tsx. Độ dày nét theo cỡ: >48px (lg), 25–48px, ≤24px (sm, bỏ đầu mũi tên).
       Biến thể đơn sắc: đặt --lg và --lg-bar = currentColor -->
  <symbol id="logo-mark-lg" viewBox="0 0 100 100">
    <path d="M24 88 L34 73.7 A32 32 0 1 1 66 73.7" fill="none" style="stroke:var(--lg, url(#gLogo))" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M79.8 76.1 L66 73.7 L70.8 60.5" fill="none" style="stroke:var(--lg, url(#gLogo))" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M37 39 V53 M50 32 V60 M63 38 V54" fill="none" style="stroke:var(--lg-bar, var(--text))" stroke-width="7" stroke-linecap="round"/>
  </symbol>
  <symbol id="logo-mark" viewBox="0 0 100 100">
    <path d="M24 88 L34 73.7 A32 32 0 1 1 66 73.7" fill="none" style="stroke:var(--lg, url(#gLogo))" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M79.8 76.1 L66 73.7 L70.8 60.5" fill="none" style="stroke:var(--lg, url(#gLogo))" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M37 39 V53 M50 32 V60 M63 38 V54" fill="none" style="stroke:var(--lg-bar, var(--text))" stroke-width="9" stroke-linecap="round"/>
  </symbol>
  <symbol id="logo-mark-sm" viewBox="0 0 100 100">
    <path d="M24 88 L34 73.7 A32 32 0 1 1 66 73.7" fill="none" style="stroke:var(--lg, url(#gLogo))" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M38 41 V51 M50 35 V57 M62 41 V51" fill="none" style="stroke:var(--lg-bar, var(--text))" stroke-width="11" stroke-linecap="round"/>
  </symbol>
  <symbol id="o-orb" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="86" fill="url(#gBody)"/>
    <circle cx="100" cy="100" r="86" fill="url(#gRim)"/>
    <circle cx="100" cy="100" r="85" fill="none" stroke="url(#gEdge)" stroke-width="2.5"/>
    <ellipse cx="66" cy="58" rx="28" ry="13" transform="rotate(-32 66 58)" fill="url(#gSpec)"/>
  </symbol>
  <symbol id="o-torus" viewBox="0 0 200 200">
    <path fill-rule="evenodd" d="M10 100a90 58 0 1 0 180 0a90 58 0 1 0-180 0ZM60 92a40 18 0 1 0 80 0a40 18 0 1 0-80 0Z" fill="url(#gBody)"/>
    <path fill-rule="evenodd" d="M10 100a90 58 0 1 0 180 0a90 58 0 1 0-180 0ZM60 92a40 18 0 1 0 80 0a40 18 0 1 0-80 0Z" fill="url(#gRim)"/>
    <path fill-rule="evenodd" d="M10 100a90 58 0 1 0 180 0a90 58 0 1 0-180 0ZM60 92a40 18 0 1 0 80 0a40 18 0 1 0-80 0Z" fill="none" stroke="url(#gEdge)" stroke-width="2.5"/>
    <ellipse cx="56" cy="74" rx="26" ry="8" transform="rotate(-18 56 74)" fill="url(#gSpec)"/>
  </symbol>
  <symbol id="o-star" viewBox="0 0 200 200">
    <path d="M100 6C107 72 128 93 194 100C128 107 107 128 100 194C93 128 72 107 6 100C72 93 93 72 100 6Z" fill="url(#gBody)"/>
    <path d="M100 6C107 72 128 93 194 100C128 107 107 128 100 194C93 128 72 107 6 100C72 93 93 72 100 6Z" fill="url(#gRim)"/>
    <path d="M100 6C107 72 128 93 194 100C128 107 107 128 100 194C93 128 72 107 6 100C72 93 93 72 100 6Z" fill="none" stroke="url(#gEdge)" stroke-width="2.5"/>
    <ellipse cx="82" cy="80" rx="14" ry="6" transform="rotate(-40 82 80)" fill="url(#gSpec)"/>
  </symbol>
  <symbol id="o-cone" viewBox="0 0 200 200">
    <path d="M100 10L174 158A74 26 0 0 1 26 158Z" fill="url(#gBody)"/>
    <path d="M100 10L174 158A74 26 0 0 1 26 158Z" fill="url(#gRim)"/>
    <path d="M100 10L174 158A74 26 0 0 1 26 158Z" fill="none" stroke="url(#gEdge)" stroke-width="2.5"/>
    <path d="M26 158A74 26 0 0 0 174 158" fill="none" stroke="url(#gEdge)" stroke-width="2" opacity=".6"/>
    <ellipse cx="74" cy="92" rx="5" ry="40" transform="rotate(26 74 92)" fill="url(#gSpec)"/>
  </symbol>
  <symbol id="g-google" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
  </symbol>
</svg>
`;
const BG_FX = `/*@H 110 110*/`;
const RAIL = `
  <aside class="rail" aria-label="Điều hướng chính">
    <button class="brand" data-go="today" aria-label="LinguaLoop, về trang Hôm nay"><svg class="brand-mark" viewBox="0 0 100 100" aria-hidden="true"><use href="#logo-mark"/></svg><span class="lbl wordmark">Lingua<b>Loop</b></span></button>
    <button class="nav" data-go="today" data-nav="today" aria-label="Hôm nay"><i class="ph ph-sun-horizon" data-icon="sun-horizon"></i><span class="lbl">Hôm nay</span></button>
    <div class="rail-sep">Học</div>
    <button class="nav" data-go="lessons" data-nav="lessons" aria-label="Bài học"><i class="ph ph-books" data-icon="books"></i><span class="lbl">Bài học</span></button>
    <button class="nav" data-go="lessons" data-id="dictation" data-nav="lessons/dictation" aria-label="Nghe chép"><i class="ph ph-headphones" data-icon="headphones"></i><span class="lbl">Nghe chép</span></button>
    <button class="nav" data-go="lessons" data-id="shadowing" data-nav="lessons/shadowing" aria-label="Shadowing"><i class="ph ph-microphone" data-icon="microphone"></i><span class="lbl">Shadowing</span></button>
    <button class="nav" data-go="vocab" data-nav="vocab" aria-label="Từ vựng"><i class="ph ph-cards" data-icon="cards"></i><span class="lbl">Từ vựng</span></button>
    <div class="rail-sep">Của tôi</div>
    <button class="nav" data-go="mywords" data-nav="mywords" aria-label="Từ và câu đã lưu"><i class="ph ph-bookmarks-simple" data-icon="bookmarks-simple"></i><span class="lbl">Từ &amp; câu đã lưu</span><span class="tag count" id="dueTag">8</span></button>
    <button class="nav" data-go="weakness" data-nav="weakness" aria-label="Điểm yếu"><i class="ph ph-target" data-icon="target"></i><span class="lbl">Điểm yếu</span></button>
    <button class="nav" data-go="test" data-nav="test" aria-label="Kiểm tra trình độ"><i class="ph ph-exam" data-icon="exam"></i><span class="lbl">Kiểm tra trình độ</span></button>
    <div class="rail-foot">
      <div class="card tight card-highlight spotlight pro-card free-only">
        <span class="badge pro"><i class="ph-fill ph-crown-simple"></i>PRO</span>
        <b class="h3" style="display:block;margin-top:10px">Từ 33k/tháng</b>
        <p class="small muted" style="margin:4px 0 12px">Chấm không giới hạn, nhận xét AI, video khẩu hình.</p>
        <button class="btn primary sm" style="width:100%" data-act="togglePro">Dùng thử Pro</button>
      </div>
    </div>
  </aside>
`;
const TOPBAR = `
    <header class="top">
      <button class="m-only brand-btn" data-go="today" aria-label="LinguaLoop, về trang Hôm nay"><svg class="brand-mark" viewBox="0 0 100 100" aria-hidden="true"><use href="#logo-mark"/></svg></button>
      <button class="cmdk-btn" data-act="palette" aria-label="Mở tìm kiếm nhanh"><i class="ph ph-magnifying-glass"></i><span class="lbl">Tra từ, mở bài, chuyển màn…</span><kbd>Ctrl K</kbd></button>
      <div class="top-right">
        <span class="pill streak-pill" title="Chuỗi ngày học"><i class="ph-fill ph-fire"></i><span class="count" id="streakNum">5</span></span>
        <button class="pill hide-m" data-act="togglePro" id="planPill">Free</button>
        <button class="icon-btn theme-btn" data-act="theme" aria-label="Đổi giao diện sáng/tối"><span class="theme-ic"><i class="ph ph-moon"></i><i class="ph ph-sun"></i></span></button>
        <div class="acct">
          <button class="avatar" id="acctBtn" data-act="acctMenu" aria-haspopup="menu" aria-expanded="false" aria-controls="acctMenu" aria-label="Tài khoản Minh Anh">MA</button>
          <div class="acct-menu glass" id="acctMenu" role="menu" aria-label="Tài khoản"></div>
        </div>
      </div>
    </header>
`;
const FOCUSBAR = `
      <div class="focusbar glass" id="focusbar">
        <i class="ph-fill ph-lightning"></i>
        <b class="small">Phiên 15 phút</b>
        <div class="steps" id="focusSteps"></div>
        <span class="small muted hide-m" id="focusLabel"></span>
        <button class="btn ghost sm" data-act="endFocus">Thoát</button>
      </div>
`;
const FOOTER = `
    <footer class="foot" id="foot">
      <div class="wrap">
        <div class="foot-grid">
          <div class="foot-brand">
            <button class="brand" data-go="today" aria-label="LinguaLoop, về trang Hôm nay"><svg class="brand-mark" viewBox="0 0 100 100" aria-hidden="true"><use href="#logo-mark"/></svg><span class="wordmark">Lingua<b>Loop</b></span></button>
            <p class="small muted">Luyện nghe chép và phát âm tiếng Anh trên video thật. Mỗi ngày 15 phút, đúng vào điểm yếu của bạn.</p>
            <div class="row g8">
              <button class="icon-btn" data-act="footLink" data-name="Facebook LinguaLoop" aria-label="Facebook"><i class="ph ph-facebook-logo"></i></button>
              <button class="icon-btn" data-act="footLink" data-name="Kênh YouTube LinguaLoop" aria-label="YouTube"><i class="ph ph-youtube-logo"></i></button>
              <button class="icon-btn" data-act="footLink" data-name="TikTok LinguaLoop" aria-label="TikTok"><i class="ph ph-tiktok-logo"></i></button>
              <button class="icon-btn" data-act="footLink" data-name="Email hỗ trợ" aria-label="Gửi email cho LinguaLoop"><i class="ph ph-envelope-simple"></i></button>
            </div>
          </div>
          <nav class="foot-col" aria-label="Học">
            <h4>Học</h4>
            <button data-go="lessons">Bài học</button>
            <button data-go="lessons" data-id="dictation">Nghe chép</button>
            <button data-go="lessons" data-id="shadowing">Shadowing</button>
            <button data-go="vocab">Từ vựng</button>
            <button data-go="test">Kiểm tra trình độ</button>
          </nav>
          <nav class="foot-col" aria-label="Của tôi">
            <h4>Của tôi</h4>
            <button data-go="mywords">Từ &amp; câu đã lưu</button>
            <button data-go="weakness">Điểm yếu</button>
            <button data-go="settings" data-id="profile">Cài đặt tài khoản</button>
            <button data-go="settings" data-id="plan">Gói Pro</button>
          </nav>
          <nav class="foot-col" aria-label="Hỗ trợ">
            <h4>Hỗ trợ</h4>
            <button data-act="footLink" data-name="Hướng dẫn bắt đầu">Hướng dẫn bắt đầu</button>
            <button data-act="footLink" data-name="Câu hỏi thường gặp">Câu hỏi thường gặp</button>
            <button data-act="footLink" data-name="Báo lỗi nội dung">Báo lỗi nội dung</button>
            <button data-act="footLink" data-name="Liên hệ góp ý">Liên hệ góp ý</button>
          </nav>
          <nav class="foot-col" aria-label="Về LinguaLoop">
            <h4>Về LinguaLoop</h4>
            <button data-go="brand">Logo &amp; mascot</button>
            <button data-act="footLink" data-name="Điều khoản sử dụng">Điều khoản sử dụng</button>
            <button data-act="footLink" data-name="Chính sách quyền riêng tư">Chính sách quyền riêng tư</button>
            <button data-act="footLink" data-name="Dữ liệu giọng nói">Dữ liệu giọng nói</button>
          </nav>
        </div>
        <div class="foot-bottom">
          <span class="small muted">© 2026 LinguaLoop. Video bài học thuộc bản quyền của kênh gốc, chỉ dùng để học.</span>
          <span class="grow"></span>
          <span class="sys-ok small"><i aria-hidden="true"></i>Hệ thống hoạt động bình thường</span>
          <button class="chip" data-go="settings" data-id="display"><i class="ph ph-globe"></i>Tiếng Việt</button>
        </div>
      </div>
    </footer>
`;
const MNAV = `
<nav class="mnav glass" aria-label="Điều hướng">
  <button data-go="today" data-nav="today"><i class="ph ph-sun-horizon" data-icon="sun-horizon"></i>Hôm nay</button>
  <button data-go="lessons" data-nav="lessons"><i class="ph ph-books" data-icon="books"></i>Bài học</button>
  <button data-go="vocab" data-nav="vocab"><i class="ph ph-cards" data-icon="cards"></i>Từ vựng</button>
  <button data-go="mywords" data-nav="mywords"><i class="ph ph-bookmarks-simple" data-icon="bookmarks-simple"></i>Của tôi</button>
  <button data-go="weakness" data-nav="weakness"><i class="ph ph-target" data-icon="target"></i>Điểm yếu</button>
</nav>
`;
const OVERLAYS = `
<div class="scrim" id="scrim"></div>
<div class="palette glass" id="palette" role="dialog" aria-label="Tìm kiếm nhanh"><div class="p-in"><i class="ph ph-magnifying-glass"></i><input id="pInput" placeholder="Tìm từ, bài học, màn hình…" autocomplete="off" aria-label="Tìm kiếm"></div><div class="list" id="pList"></div></div>
<aside class="sheet glass" id="sheet" role="dialog" aria-labelledby="shTitle"><div class="sh-head"><h2 id="shTitle"></h2><button class="icon-btn" data-act="close" aria-label="Đóng"><i class="ph ph-x"></i></button></div><div class="sh-body" id="shBody"></div></aside>
<div class="dialog glass" id="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlgTitle" aria-describedby="dlgBody"><div id="dlgIn"></div></div>
<div class="notice glass" id="notice" role="status"></div>
<div class="toast glass" id="toast" role="status"><i class="ph"></i><span></span><button style="display:none"></button></div>
<canvas id="confetti"></canvas>
`;

const Shell = {
  page: null,
  guard: null,   // hàm chặn điều hướng (trả true để chặn)
  hooks: {},
  click(fn) { CLICKS.push(fn); },
  key(fn, when) { (when === 'early' ? KEYS_EARLY : when === 'late' ? KEYS_LATE : KEYS).push(fn); },

  /* o.auth: trang đăng nhập/đăng ký (không có sidebar) */
  init(pageId, o = {}) {
    this.page = pageId;
    const body = document.body;
    body.insertAdjacentHTML('afterbegin', SPRITE + BG_FX);
    if (o.auth) {
      body.classList.add('auth-mode');
    } else {
      const shell = document.createElement('div'); shell.className = 'shell';
      shell.innerHTML = RAIL + '<div class="page">' + TOPBAR + '</div>';
      const page = $('.page', shell), main = $('main.main');
      if (main) { page.appendChild(main); $('.wrap', main).insertAdjacentHTML('afterbegin', FOCUSBAR); }
      page.insertAdjacentHTML('beforeend', FOOTER);
      body.appendChild(shell);
      body.insertAdjacentHTML('beforeend', MNAV);
      $('#foot').classList.toggle('min', ['dictation', 'shadowing', 'test'].includes(pageId));
    }
    body.insertAdjacentHTML('beforeend', OVERLAYS);

    if (store.get('ll3-pro', false)) setPro(true, true);
    if (!o.auth) {
      renderAcct(); renderFocus();
      $('#streakNum').textContent = streakNow(); $('#dueTag').textContent = due;
      const m = qs().get('id');
      const nk = pageId === 'lessons' && m ? 'lessons/' + m : NAV_OF[pageId] || pageId;
      $$('.nav[data-nav], .mnav [data-nav]').forEach(b => {
        const on = b.dataset.nav === nk || (!!b.closest('.mnav') && nk.startsWith(b.dataset.nav + '/')); b.classList.toggle('on', on);
        if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
        const i = b.querySelector('i[data-icon]'); if (i) i.className = (on ? 'ph-fill' : 'ph') + ' ph-' + i.dataset.icon; // icon active chuyển sang fill
      });
    }
    const f = sess.get('flash', null);
    if (f) { sess.del('flash'); setTimeout(() => { toast(f.msg, null, f.ic); if (f.confetti) confetti(); }, 350); }
    const view = $('.view.on'); if (view) reveal(view);
    requestAnimationFrame(segAll);
    if (document.fonts) document.fonts.ready.then(segAll);
  },
};
