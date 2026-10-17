/**
 * LinguaLoop v2 — shell.js (Học viên)
 * Khung chung: thanh bên, thanh trên, tìm nhanh (Ctrl K), tài khoản, phiên tập trung, chân trang, lớp phủ.
 * Giữ đủ hành vi của mockups-student/shell.js (xem docs/ux/MOCKUP-V2-PARITY.md), khác ở:
 *  - Icon Lucide (map từ tên Phosphor trong data.js), không vật thể 3D / parallax / spotlight.
 *  - Chuyển động có mục đích (DESIGN.v2 §8): vào trang, chỉ báo tab trượt, đếm số, phản hồi sự kiện.
 *  - Mascot xuất hiện nhiều hơn, chỉ đổi trạng thái khi có sự kiện.
 * Dữ liệu mẫu, không gọi backend.
 */
'use strict';

/* ─── 1. Tiện ích ─── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
};
const sess = {
  get(k, d) { try { const v = sessionStorage.getItem('ll2s-' + k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { sessionStorage.setItem('ll2s-' + k, JSON.stringify(v)); } catch (_) {} },
  del(k) { try { sessionStorage.removeItem('ll2s-' + k); } catch (_) {} },
};
const qs = () => new URLSearchParams(location.search);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* Icon: data.js còn dùng tên Phosphor, đổi sang Lucide ở đây */
const PH2LU = {
  'airplane-takeoff': 'plane-takeoff', 'airplane-tilt': 'plane', arrange: 'arrow-down-up', 'bookmarks-simple': 'bookmark', 'bookmark-simple': 'bookmark',
  broom: 'brush', 'calendar-blank': 'calendar', cards: 'layers', 'chats-circle': 'messages-square', 'clock-countdown': 'timer',
  'envelope-simple': 'mail', exam: 'file-check', 'film-slate': 'clapperboard', 'film-strip': 'film', 'fish-simple': 'fish', 'house-line': 'house',
  'map-trifold': 'map', 'moon-stars': 'moon-star', move: 'move', 'music-notes': 'music', path: 'route', 'person-simple-walk': 'footprints', planet: 'orbit',
  'police-car': 'siren', 'presentation-chart': 'presentation', 'rocket-launch': 'rocket', scales: 'scale', 'suitcase-rolling': 'luggage',
  'user-circle': 'circle-user', 'sun-horizon': 'sun', books: 'library', microphone: 'mic', 'crown-simple': 'crown', 'speaker-high': 'volume-2',
  'youtube-logo': 'youtube', waveform: 'audio-lines', 'list-numbers': 'list-ordered', 'magnifying-glass': 'search', 'caret-right': 'chevron-right',
  'caret-down': 'chevron-down', 'play-circle': 'circle-play', sparkle: 'sparkles', funnel: 'filter', 'magic-wand': 'wand-sparkles', fire: 'flame',
  'lock-simple-open': 'lock-open', 'check-circle': 'circle-check', confetti: 'party-popper', 'push-pin': 'pin', 'eye-slash': 'eye-off', 'note-pencil': 'pencil',
  trash: 'trash-2', lightning: 'zap', 'circle-half': 'contrast', 'lock-key': 'lock-keyhole', 'sign-out': 'log-out', 'facebook-logo': 'facebook',
  'tiktok-logo': 'music-2', 'gear-six': 'settings', 'sign-in': 'log-in', seal: 'badge-check', question: 'circle-help', 'bookmarks': 'bookmark',
  present: 'gift', thin: 'ruler', through: 'route', schedule: 'calendar', scheduling: 'calendar', presenting: 'presentation',
  'arrow-counter-clockwise': 'rotate-ccw', 'arrow-square-out': 'external-link', 'arrows-clockwise': 'refresh-cw', 'closed-captioning': 'captions',
  'download-simple': 'download', 'envelope-open': 'mail-open', 'hourglass-medium': 'hourglass', 'link-break': 'unlink', 'list-bullets': 'list',
  'lock-simple': 'lock', 'pencil-simple': 'pencil', 'pencil-simple-line': 'pencil-line', 'plus-circle': 'circle-plus', quotes: 'quote',
  'seal-check': 'badge-check', smiley: 'smile', stack: 'layers', stop: 'square', 'upload-simple': 'upload', 'video-camera': 'video',
  warning: 'triangle-alert', 'warning-circle': 'circle-alert', 'x-circle': 'circle-x', 'check-square': 'square-check', 'info': 'info',
  plant: 'sprout', tree: 'tree-pine', mountains: 'mountain', 'arrows-left-right': 'arrow-left-right', 'chat-teardrop-text': 'message-square-text',
  certificate: 'award', student: 'graduation-cap', 'device-mobile': 'smartphone', 'device-tablet': 'tablet', desktop: 'monitor', 'bell-simple': 'bell',
  'user-plus': 'user-plus', 'gear': 'settings', 'sliders-horizontal': 'sliders-horizontal', 'chart-line-up': 'trending-up', 'chart-bar': 'chart-column',
  'trend-down': 'trending-down', 'arrow-clockwise': 'rotate-cw', 'speaker-simple-high': 'volume-2', 'speaker-slash': 'volume-x', 'record': 'circle-dot',
  'microphone-slash': 'mic-off', 'skip-forward': 'skip-forward', 'rewind': 'rewind', 'repeat-once': 'repeat-1', 'shuffle-simple': 'shuffle',
  'heart-straight': 'heart', 'star-four': 'sparkle', 'flag-banner': 'flag', 'identification-card': 'id-card', 'credit-card': 'credit-card',
  'receipt': 'receipt', 'cloud-arrow-up': 'cloud-upload', 'trash-simple': 'trash-2', 'x-square': 'square-x', 'at': 'at-sign',
  'chat-teardrop-dots': 'message-circle-more', 'eye-closed': 'eye-off', 'fingerprint-simple': 'fingerprint', 'paper-plane-tilt': 'send', 'smiley-sad': 'frown', 'smiley-meh': 'meh', 'thumbs-up': 'thumbs-up',
};
const lu = (n) => PH2LU[n] || n;
/* Icon nào đặt `fill` vẫn đọc được; icon nhiều nét (file, thẻ, người...) tô đặc sẽ thành một khối */
const FILL_OK = new Set(['play', 'pause', 'square', 'flame', 'star', 'heart', 'bookmark', 'crown', 'zap', 'circle', 'circle-dot', 'thumbs-up', 'thumbs-down', 'sparkle', 'sparkles', 'bell', 'lightbulb']);
const icon = (n, cls = 'ic') => { const c = (cls === 1 || cls === true) ? (FILL_OK.has(lu(n)) ? 'ic fill' : 'ic') : (cls || 'ic'); return `<i data-lucide="${lu(n)}" class="${c}" aria-hidden="true"></i>`; };
const refreshIcons = () => { if (window.lucide) lucide.createIcons(); };

/* Mascot Loopi: sáu trạng thái; chỉ đổi khi có sự kiện */
const MOOD_ALT = { hello: 'Loopi vẫy tay chào', listening: 'Loopi đang nghe', speaking: 'Loopi đang nói', correct: 'Loopi vui vì bạn làm đúng', encourage: 'Loopi động viên bạn', celebrate: 'Loopi ăn mừng' };
const MOOD_OF = { idle: 'hello', happy: 'correct', sad: 'encourage', listen: 'listening', celebr: 'celebrate' };
const mascot = (mood = 'hello', size = 96, cls = '') => {
  let m = MOOD_OF[mood] || mood; if (!MOOD_ALT[m]) m = 'hello';
  const isLabel = typeof cls === 'string' && /[^\x00-\x7F]/.test(cls);   // v1 truyền nhãn mô tả ở tham số thứ ba
  return `<img class="mascot ${isLabel ? '' : cls}" src="../loopi-mascot/svg/loopi-${m}.svg" alt="${esc(isLabel ? cls : MOOD_ALT[m])}" width="${size}" height="${size}" style="--s:${size}px">`;
};
/* Lời nhắn của Loopi cạnh tiêu đề trang */
const loopiBubble = (mood, text, size = 64) => `<div class="loopi-say">${mascot(mood, size)}<span class="bubble">${text}</span></div>`;

const duo = (n) => icon(n, 'ic duo');

/* ─── 2. Phản hồi: toast, thông báo, confetti, vòng tiến độ, đếm số, TTS ─── */
let toastT;
function toast(msg, action, ic = 'info') {
  const t = $('#toast'); if (!t) return;
  t.innerHTML = `${icon(ic)}<span>${esc(msg)}</span>${action ? `<button class="btn text sm" id="toastAct">${esc(action.label)}</button>` : ''}`;
  refreshIcons();
  if (action) $('#toastAct').onclick = () => { action.fn(); t.classList.remove('on'); };
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3400);
}
let noticeT;
function notice(html) {
  const n = $('#notice'); n.innerHTML = html; refreshIcons();
  n.classList.add('on'); clearTimeout(noticeT); noticeT = setTimeout(() => n.classList.remove('on'), 2800);
}
function confetti() {
  if (reduced()) return;
  const c = $('#confetti'), x = c.getContext('2d'), dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = [cssVar('--primary'), cssVar('--fn-dictation'), cssVar('--fn-shadowing'), cssVar('--fn-vocab'), cssVar('--warning')];
  const P = Array.from({ length: 120 }, () => ({ x: innerWidth / 2, y: innerHeight * .4, vx: (Math.random() - .5) * 15, vy: Math.random() * -12 - 4,
    r: Math.random() * 6 + 4, c: cols[Math.random() * cols.length | 0], a: Math.random() * 6 }));
  let f = 0;
  (function tick() {
    x.clearRect(0, 0, innerWidth, innerHeight);
    P.forEach(p => { p.vy += .4; p.x += p.vx; p.y += p.vy; p.a += .2; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
    if (++f < 80) requestAnimationFrame(tick); else x.clearRect(0, 0, innerWidth, innerHeight);
  })();
}
function particles(el) { // hạt nhỏ toả ra khi lưu từ
  if (reduced()) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 7; i++) {
    const p = document.createElement('i'); p.className = 'particle';
    const a = (Math.PI * 2 * i) / 7;
    p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;--dx:${Math.cos(a) * 22}px;--dy:${Math.sin(a) * 22}px`;
    document.body.appendChild(p); setTimeout(() => p.remove(), 600);
  }
}
function countUp(el, to, ms = 700, fmt = (v) => Math.round(v)) {
  if (!el) return; if (reduced()) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  (function step(t) { const k = Math.min(1, (t - t0) / ms); el.textContent = fmt(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(t0);
}
function bump(el, v) { // đổi số dạng "lật"
  if (!el) return; if (v !== undefined) el.textContent = v; el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip');
}
function ring(el, value, { size = 120, max = 100, label = '', fn = '', text = null } = {}) {
  const r = 45, C = 2 * Math.PI * r;
  el.className = 'ring ' + fn; el.style.setProperty('--size', size + 'px');
  el.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="bg" cx="50" cy="50" r="${r}"/><circle class="fg" cx="50" cy="50" r="${r}" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
    <div class="lbl"><span class="num" style="font-size:${Math.round(size * .27)}px">0</span>${label ? `<span class="small muted">${label}</span>` : ''}</div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => { $('.fg', el).style.strokeDashoffset = C * (1 - Math.min(value, max) / max); }));
  if (text) { const n = $('.num', el), t0 = performance.now(); (function c(t) { const k = Math.min(1, (t - t0) / 900); n.textContent = text(k); if (k < 1) requestAnimationFrame(c); })(t0); }
  else countUp($('.num', el), value, 800);
}
let voices = [];
if ('speechSynthesis' in window) { const lv = () => voices = speechSynthesis.getVoices(); lv(); speechSynthesis.onvoiceschanged = lv; }
function speak(text, { rate = .9, lang = 'en-GB' } = {}, btn) {
  if (btn) { btn.classList.add('playing'); clearTimeout(btn._t); btn._t = setTimeout(() => btn.classList.remove('playing'), Math.max(900, text.split(/\s+/).length * 420 / rate)); }
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate;
  const v = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith('en')); if (v) u.voice = v;
  if (btn) u.onend = () => { clearTimeout(btn._t); btn.classList.remove('playing'); };
  speechSynthesis.speak(u);
}

/* ─── 3. Vào trang, chỉ báo tab trượt ─── */
let io;
function reveal(root = document) {
  const els = $$('.rv:not(.in)', root);
  if (reduced() || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  io = io || new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach((el, i) => { el.style.setProperty('--i', Math.min(i, 8)); io.observe(el); });
}
function segMove(seg) {
  let th = $('.seg-thumb', seg); if (!th) { th = document.createElement('i'); th.className = 'seg-thumb'; th.setAttribute('aria-hidden', 'true'); seg.prepend(th); }
  const on = $('button.on', seg); if (!on) { th.style.opacity = 0; return; }
  th.style.opacity = 1; th.style.width = on.offsetWidth + 'px'; th.style.transform = `translateX(${on.offsetLeft - 4}px)`;
}
const segAll = () => $$('.seg').forEach(segMove);
function segPick(btn) { const seg = btn.closest('.seg'); $$('button', seg).forEach(b => { b.classList.toggle('on', b === btn); b.setAttribute('aria-pressed', b === btn); }); segMove(seg); }

/* ─── 4. Thành phần dùng chung ─── */
const isPro = () => document.body.classList.contains('pro');
function thumb(L, corners = true) {
  return `<div class="l-thumb">${duo(L.ic).replace('class="ic duo"', 'class="ic-xl"')}
    ${corners ? `<span class="tl">${L.pro ? `<span class="badge pro">${icon('crown')}PRO</span>` : ''}<span class="badge cefr-${L.cefr[0].toLowerCase()}">${L.cefr}</span></span>
    <span class="bl tag">${icon(L.src === 'youtube' ? 'youtube' : 'audio-lines')}${L.src === 'youtube' ? 'YouTube' : 'Audio'}</span>
    <span class="br tag">${icon('clock')}${L.dur}</span>` : ''}</div>`;
}
const emptyState = (title, sub, action = '') => `<div class="empty rv">${mascot('encourage', 112)}<h3 class="h3">${title}</h3><p class="small muted">${sub}</p>${action}</div>`;
const secHead = (ic, title, count, action = '', fn = '') =>
  `<div class="sec-head rv ${fn}"><h2 class="h2"><span class="sec-ic">${duo(ic)}</span>${title}${count != null ? ` <small class="muted">${count}</small>` : ''}</h2>${action}</div>`;

/* ─── 5. Tài khoản & trạng thái dùng chung ─── */
const ME = { name: 'Minh Anh', user: 'minhanh', email: 'minhanh.nguyen@gmail.com', bio: 'Đang ôn IELTS 6.5, thích xem phim hoạt hình.', birthday: '2003-05-30', gender: '',
  tz: 'Asia/Ho_Chi_Minh', lang: 'vi', motion: 'system', maxReviews: 100, voice: 'uk', rate: '.8', showVideo: true, autoNext: true, remind: true, remindAt: '20:00', streakWarn: true,
  google: true, consentVoice: true, consentAi: true };
Object.assign(ME, store.get('ll2-me', {}));
const saveMe = () => store.set('ll2-me', ME);
const initials = (n) => n.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase() || '?';
const state = { done: new Set(store.get('ll2-done', [])), focus: sess.get('focus', null), dur: store.get('ll2-dur', 15) };
const saved = new Set(store.get('ll2-saved', ['present#Tính từ#1']));
let due = store.get('ll2-due', 8);
const streakNow = () => state.done.size > 0 ? 5 : 4;

function renderAcct() {
  $('#acctBtn').textContent = initials(ME.name);
  $('#acctMenu').innerHTML = `<div class="acct-head"><span class="avatar lg" aria-hidden="true">${initials(ME.name)}</span><div class="grow"><b>${esc(ME.name)}</b><div class="small muted">${esc(ME.email)}</div></div></div>
    <button role="menuitem" class="acct-plan" data-go="settings">${isPro() ? `<span class="badge pro">${icon('crown')}PRO</span><span class="small muted">Gia hạn 28/09/2027</span>` : `<span class="badge">Free</span><span class="small">Nâng cấp Pro</span>${icon('arrow-right')}`}</button>
    <hr>
    ${[['circle-user', 'Hồ sơ'], ['target', 'Cài đặt học tập'], ['shield-check', 'Bảo mật & đăng nhập'], ['lock-keyhole', 'Quyền riêng tư & dữ liệu']].map(([ic, l]) => `<button role="menuitem" data-go="settings">${icon(ic)}${l}</button>`).join('')}
    <button role="menuitem" data-act="theme">${icon('contrast')}Đổi giao diện sáng/tối</button>
    <hr><button role="menuitem" class="danger" data-act="logout">${icon('log-out')}Đăng xuất</button>`;
  refreshIcons();
}
function closeMenu() { const m = $('#acctMenu'); if (m && m.classList.contains('on')) { m.classList.remove('on'); $('#acctBtn').setAttribute('aria-expanded', 'false'); } }

function confirmDlg({ title, body, ok = 'Đồng ý', tone = 't-pri', ic = 'question', danger = false, confirmText = '', onOk }) {
  closeMenu();
  $('#dlgIn').innerHTML = `${mascot(danger ? 'encourage' : 'hello', 72)}<h2 id="dlgTitle" class="h2 mt8">${title}</h2><p class="muted mt8" id="dlgBody">${body}</p>
    ${confirmText ? `<div class="field mt16"><label for="dlgInput">Gõ <b>${esc(confirmText)}</b> để xác nhận</label><div class="inp"><input id="dlgInput" autocomplete="off" spellcheck="false"></div></div>` : ''}
    <div class="row g12 mt24" style="justify-content:flex-end"><button class="btn ghost" data-act="close">Huỷ</button><button class="btn ${danger ? 'danger' : 'primary'}" id="dlgOk" ${confirmText ? 'disabled' : ''}>${ok}</button></div>`;
  DLG.fn = onOk; DLG.text = confirmText;
  $('#dialog').classList.add('on'); $('#scrim').classList.add('on');
  setTimeout(() => ($('#dlgInput') || $('#dlgOk')).focus(), 60);
}
const DLG = { fn: null, text: '' };
const isSaved = (w) => [...saved].some(k => k.startsWith(w + '#'));

function syncSaves() {
  $$('.save[data-save]').forEach(b => { const k = b.dataset.save, on = saved.has(k); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  const tag = $('#dueTag'); if (tag) tag.textContent = due;
  if (Shell.hooks && Shell.hooks.syncSaves) Shell.hooks.syncSaves();
}
function setDue(delta) { due = Math.max(0, due + delta); store.set('ll2-due', due); bump($('#dueTag'), due); }

/* ─── 6. Phiên tập trung ─── */
function renderFocus() {
  const fb = $('#focusbar'); if (!fb) return;
  if (!state.focus) { fb.classList.remove('on'); return; }
  fb.classList.add('on');
  $('#focusSteps').innerHTML = PLAN.map(t => `<i class="${state.done.has(t.id) ? 'done' : t.id === state.focus.cur ? 'cur' : ''}"></i>`).join('');
  const cur = PLAN.find(t => t.id === state.focus.cur); $('#focusLabel').textContent = cur ? cur.title : '';
}
function completeTask(id) {
  const first = !state.done.has(id), wasZero = state.done.size === 0;
  state.done.add(id); store.set('ll2-done', [...state.done]);
  if (typeof renderToday === 'function') renderToday();
  bump($('#streakNum'), streakNow());
  if (wasZero) {
    notice(`${mascot('celebrate', 40)}${icon('flame')}<span>Chuỗi 5 ngày liên tiếp! Giữ vững nhé</span>`);
    const fl = $('.flame'); if (fl) { fl.classList.remove('pop'); void fl.offsetWidth; fl.classList.add('pop'); }
  }
  if (state.focus) {
    const i = PLAN.findIndex(t => t.id === id);
    const next = PLAN.slice(i + 1).find(t => !state.done.has(t.id)) || PLAN.find(t => !state.done.has(t.id));
    if (next) { state.focus.cur = next.id; sess.set('focus', state.focus); flash(`Xong. Tiếp: ${next.title}`, 'circle-check'); setTimeout(() => go(next.go, { tab: next.tab }), 700); }
    else { state.focus = null; sess.del('focus'); flash('Hoàn thành phiên!', 'party-popper', { confetti: true }); go('today'); return; }
  } else if (first) toast('Đã đánh dấu hoàn thành trong kế hoạch hôm nay', null, 'circle-check');
  if (state.done.size === PLAN.length && !state.focus) confetti();
}

/* ─── 7. Điều hướng ─── */
const PAGE_URL = { today: 'index.html', weakness: 'weakness.html', dictation: 'dictation.html', shadowing: 'shadowing.html', vocab: 'vocab.html',
  lessons: 'lessons.html', topic: 'topic.html', lesson: 'lesson.html', deck: 'deck.html', group: 'group.html', mywords: 'mywords.html',
  brand: 'brand.html', test: 'test.html', settings: 'settings.html', login: 'login.html', register: 'register.html', forgot: 'forgot.html', verify: 'verify.html' };
// Màn con → mục điều hướng được tô sáng
const NAV_OF = { topic: 'lessons', lesson: 'lessons', deck: 'vocab', group: 'vocab', dictation: 'lessons/dictation', shadowing: 'lessons/shadowing' };
function go(view, opts = {}) {
  if (Shell.guard && Shell.guard(view, opts)) return;
  if (!PAGE_URL[view]) view = 'today';
  const q = new URLSearchParams();
  ['id', 'g', 'tab', 'ctx', 'word', 'lesson', 't', 'l'].forEach(k => { const v = opts[k]; if (v != null && v !== '' && v !== false) q.set(k, v === true ? 1 : v); });
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  location.href = PAGE_URL[view] + (q.toString() ? '?' + q : '');
}
// Toast hiển thị ở trang kế tiếp (dùng khi vừa chuyển trang)
function flash(msg, ic, extra) { sess.set('flash', { msg, ic, ...(extra || {}) }); }

/* ─── 8. Tìm nhanh (Ctrl K) ─── */
const SCREENS = [['today', 'sun', 'Hôm nay'], ['lessons', 'library', 'Bài học · Chủ đề'], ['dictation', 'headphones', 'Nghe chép'], ['shadowing', 'mic', 'Shadowing'],
  ['vocab', 'layers', 'Từ vựng · Bộ từ'], ['mywords', 'bookmark', 'Từ & câu đã lưu'], ['weakness', 'target', 'Điểm yếu'], ['test', 'file-check', 'Kiểm tra trình độ'],
  ['settings', 'settings', 'Cài đặt tài khoản']];
let pSel = 0, pItems = [];
function paletteOpen() { $('#palette').classList.add('on'); $('#scrim').classList.add('on'); const i = $('#pInput'); i.value = ''; paletteRender(''); setTimeout(() => i.focus(), 30); }
function paletteRender(q) {
  q = q.trim().toLowerCase(); pSel = 0;
  const words = Object.keys(DICT).concat(Object.keys(FORM_INDEX)).filter(w => !q || w.includes(q)).slice(0, 6).map(w => ({ t: 'word', w: FORM_INDEX[w] || w, label: w, sub: firstVi(FORM_INDEX[w] || w) }));
  const les = LESSONS.filter(L => q && (L.title + ' ' + L.vi).toLowerCase().includes(q)).slice(0, 4).map(L => ({ t: 'lesson', id: L.slug, label: L.title, sub: L.cefr + ' · ' + topicOf(L.topic).name }));
  const scr = SCREENS.filter(([, , n]) => !q || n.toLowerCase().includes(q)).map(([id, ic, n]) => ({ t: 'go', id, ic, label: n }));
  const act = [{ t: 'act', a: 'theme', ic: 'contrast', label: 'Đổi giao diện sáng/tối' }, { t: 'act', a: 'togglePro', ic: 'crown', label: 'Bật/tắt chế độ Pro (xem thử)' }].filter(x => !q || x.label.toLowerCase().includes(q));
  pItems = [...words, ...les, ...scr, ...act];
  let html = '', k = 0;
  const grp = (title, arr, render) => { if (!arr.length) return; html += `<div class="grp overline">${title}</div>`; arr.forEach(x => { html += `<button class="it ${k === 0 ? 'hl' : ''}" data-pi="${k}">${render(x)}</button>`; k++; }); };
  grp('Từ điển', words, x => `${icon('book-open-text')}<b>${x.label}</b><span class="r">${x.sub}</span>`);
  grp('Bài học', les, x => `${icon('circle-play')}${esc(x.label)}<span class="r">${x.sub}</span>`);
  grp('Đi tới', scr, x => `${icon(x.ic)}${x.label}`); grp('Thao tác', act, x => `${icon(x.ic)}${x.label}`);
  $('#pList').innerHTML = html || `<div class="small muted" style="padding:16px">Không có kết quả cho “${esc(q)}”</div>`;
  refreshIcons();
}
function paletteRun(k) {
  const x = pItems[k]; if (!x) return; closeAll();
  if (x.t === 'word') toast(`Tra từ “${x.w}” thuộc màn Từ vựng (P2)`, null, 'book-open-text');
  else if (x.t === 'lesson') go('lesson', { l: x.id });
  else if (x.t === 'go') go(x.id === 'dictation' || x.id === 'shadowing' ? 'lessons' : x.id, x.id === 'dictation' || x.id === 'shadowing' ? { id: x.id } : {});
  else ACT[x.a]();
}
function uxOpen(k) {
  const u = (typeof UX !== 'undefined') && UX[k]; if (!u) return;
  $('#shTitle').textContent = u[0];
  $('#shBody').innerHTML = `<p class="small muted">Vì sao màn này được thiết kế như vậy: tham khảo sản phẩm nào, dựa trên số liệu khảo sát nào.</p>` +
    u[1].map(([a, b]) => `<div class="ref"><b>${a}</b><span class="small muted">${b}</span></div>`).join('');
  $('#sheet').classList.add('on'); $('#scrim').classList.add('on');
}
function closeAll() { ['palette', 'sheet', 'dialog', 'scrim'].forEach(i => $('#' + i).classList.remove('on')); closeMenu(); }

/* ─── 9. Hành động dùng chung (data-act) ─── */
function setPro(on, silent) {
  document.body.classList.toggle('pro', on);
  const p = $('#planPill'); if (p) { p.innerHTML = on ? `${icon('crown')}PRO` : 'Free'; p.classList.toggle('is-pro', on); refreshIcons(); }
  store.set('ll2-pro', on);
  if (!silent) toast(on ? 'Đang xem với gói Pro' : 'Đang xem với gói Free', null, 'crown');
  window.dispatchEvent(new Event('ll:pro'));
}
const ACT = {
  palette: paletteOpen, close: closeAll,
  theme() {
    const root = document.documentElement, n = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.classList.add('theme-anim'); root.dataset.theme = n; store.set('ll2-theme', n);
    setTimeout(() => root.classList.remove('theme-anim'), 320); themeIcon();
  },
  togglePro() { setPro(!isPro()); },
  startFocus() {
    const next = PLAN.find(t => !state.done.has(t.id));
    if (!next) { toast('Bạn đã xong kế hoạch hôm nay', null, 'party-popper'); return; }
    state.focus = { cur: next.id }; sess.set('focus', state.focus); go(next.go, { tab: next.tab });
  },
  endFocus() { state.focus = null; sess.del('focus'); renderFocus(); toast('Đã thoát phiên. Tiến độ vẫn được lưu.', null, 'check'); },
  acctMenu() {
    const m = $('#acctMenu'), on = !m.classList.contains('on'); if (on) renderAcct();
    m.classList.toggle('on', on); $('#acctBtn').setAttribute('aria-expanded', on);
  },
  logout() { closeAll(); try { sess.del('focus'); } catch (e) {} flash('Bạn đã đăng xuất.', 'log-out'); go('login'); },
  footLink(b) { toast(`Trang “${b.dataset.name}” chưa có trong bản mẫu`, null, 'info'); },
  menu() { $('#rail').classList.toggle('open'); },
  rail() { setRail(!document.body.classList.contains('rail-collapsed')); },
};
function setRail(collapsed) {
  document.body.classList.toggle('rail-collapsed', collapsed); store.set('ll2-rail', collapsed);
  const b = $('#railToggle'); if (!b) return;
  const t = collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên';
  b.setAttribute('aria-label', t); b.setAttribute('title', t); b.setAttribute('aria-expanded', !collapsed);
  $('#railIc').innerHTML = icon(collapsed ? 'panel-left-open' : 'panel-left-close'); refreshIcons();
  setTimeout(segAll, 260);
}
function themeIcon() { const el = $('#themeIc'); if (el) { el.innerHTML = icon(document.documentElement.dataset.theme === 'light' ? 'moon' : 'sun'); refreshIcons(); } }

/* ─── 10. Sự kiện ─── */
const CLICKS = [], KEYS_EARLY = [], KEYS = [], KEYS_LATE = [];
document.addEventListener('click', e => {
  const t = e.target;
  if (!t.closest('.acct')) closeMenu(); else if (t.closest('#acctMenu [role="menuitem"]')) setTimeout(closeMenu);
  if (!t.closest('#rail, [data-act="menu"]')) $('#rail')?.classList.remove('open');
  for (const fn of CLICKS) if (fn(t, e) === true) return;
});
CLICKS.push((t) => {
  if (t.closest('#dlgOk')) { const f = DLG.fn; closeAll(); if (f) f(); return true; }
  const sv = t.closest('[data-save]');
  if (sv) {
    const k = sv.dataset.save, on = !saved.has(k); on ? saved.add(k) : saved.delete(k); store.set('ll2-saved', [...saved]); syncSaves();
    if (on) { sv.classList.remove('pop'); void sv.offsetWidth; sv.classList.add('pop'); particles(sv); setDue(1);
      toast('Đã lưu vào Từ của tôi', { label: 'Hoàn tác', fn: () => { saved.delete(k); store.set('ll2-saved', [...saved]); syncSaves(); setDue(-1); } }, 'bookmark'); }
    else setDue(-1);
    return true;
  }
  const g = t.closest('[data-go]'); if (g) { closeAll(); go(g.dataset.go, { id: g.dataset.id, t: g.dataset.t, l: g.dataset.l }); return true; }
  const a = t.closest('[data-act]'); if (a) { if (ACT[a.dataset.act]) ACT[a.dataset.act](a); return true; }
  const task = t.closest('[data-task]'); if (task) { const p = PLAN.find(x => x.id === task.dataset.task); go(p.go, { tab: p.tab }); return true; }
  const ux = t.closest('[data-ux]'); if (ux) { uxOpen(ux.dataset.ux); return true; }
  if (t.id === 'scrim') closeAll();
  const say = t.closest('[data-say]'); if (say) { speak(say.dataset.say, { lang: say.dataset.lang || 'en-GB', rate: .9 }, say); return true; }
  const pi = t.closest('[data-pi]'); if (pi) { paletteRun(+pi.dataset.pi); return true; }
});
document.addEventListener('input', e => {
  const x = e.target;
  if (x.id === 'pInput') paletteRender(x.value);
  if (x.id === 'dlgInput') $('#dlgOk').disabled = x.value.trim() !== DLG.text;
  if (x.id !== 'rgUser' && x.closest && x.closest('.field.bad')) x.closest('.field').classList.remove('bad');
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
  for (const fn of KEYS_EARLY) if (fn(e, typing) === true) return;
  if (typing) return;
  if (e.key === 'Enter' && document.activeElement?.matches('article[tabindex], .rel[tabindex]')) { e.preventDefault(); document.activeElement.click(); return; }
  for (const fn of KEYS) if (fn(e) === true) return;
  if (e.code === 'Space' && document.activeElement?.tagName === 'BUTTON') return;
  if (e.key === '/') { e.preventDefault(); const sv = $('#vSearch'); if (sv) sv.focus(); else paletteOpen(); return; }
  for (const fn of KEYS_LATE) if (fn(e) === true) return;
});
window.addEventListener('resize', () => segAll());

/* ─── 11. Khung trang ─── */
const RAIL = () => `
  <aside class="rail" id="rail" aria-label="Điều hướng chính">
    <div class="rail-top">
      <button class="brand" data-go="today" aria-label="LinguaLoop, về trang Hôm nay"><img src="../lingualoop-logo/svg/favicon.svg" alt=""><span class="lbl wordmark">Lingua<b>Loop</b></span></button>
      <button class="btn icon ghost rail-toggle" data-act="rail" id="railToggle" aria-label="Thu gọn thanh bên" aria-expanded="true" title="Thu gọn thanh bên"><span id="railIc"></span></button>
    </div>
    <button class="nav fn-primary" data-go="today" data-nav="today">${icon('sun', 'ic-lg')}<span class="lbl">Hôm nay</span></button>
    <div class="rail-sep overline">Học</div>
    <button class="nav fn-primary" data-go="lessons" data-nav="lessons">${icon('library', 'ic-lg')}<span class="lbl">Bài học</span></button>
    <button class="nav fn-dictation" data-go="lessons" data-id="dictation" data-nav="lessons/dictation">${icon('headphones', 'ic-lg')}<span class="lbl">Nghe chép</span></button>
    <button class="nav fn-shadowing" data-go="lessons" data-id="shadowing" data-nav="lessons/shadowing">${icon('mic', 'ic-lg')}<span class="lbl">Shadowing</span></button>
    <button class="nav fn-vocab" data-go="vocab" data-nav="vocab">${icon('layers', 'ic-lg')}<span class="lbl">Từ vựng</span></button>
    <div class="rail-sep overline">Của tôi</div>
    <button class="nav fn-vocab" data-go="mywords" data-nav="mywords">${icon('bookmark', 'ic-lg')}<span class="lbl">Từ &amp; câu đã lưu</span><span class="tag count" id="dueTag">${due}</span></button>
    <button class="nav fn-assessment" data-go="weakness" data-nav="weakness">${icon('target', 'ic-lg')}<span class="lbl">Điểm yếu</span></button>
    <button class="nav fn-assessment" data-go="test" data-nav="test">${icon('file-check', 'ic-lg')}<span class="lbl">Kiểm tra trình độ</span></button>
    <div class="spacer"></div>
    <div class="card pro-card free-only">
      <span class="badge pro">${icon('crown')}PRO</span>
      <b class="h3" style="display:block;margin-top:10px">Từ 33k/tháng</b>
      <p class="small muted" style="margin:4px 0 12px">Chấm không giới hạn, nhận xét AI, video khẩu hình.</p>
      <button class="btn primary sm" style="width:100%" data-act="togglePro">Dùng thử Pro</button>
    </div>
    <div class="rail-card">${mascot('hello', 44)}<div><b class="small">Loopi</b><div class="small muted">Giữ chuỗi hôm nay nhé!</div></div></div>
  </aside>`;
const TOPBAR = () => `
  <header class="topbar">
    <button class="btn icon ghost menu-btn" data-act="menu" aria-label="Mở menu">${icon('menu')}</button>
    <button class="cmdk-btn" data-act="palette" aria-label="Mở tìm kiếm nhanh">${icon('search')}<span class="lbl">Tra từ, mở bài, chuyển màn…</span><kbd>Ctrl K</kbd></button>
    <span class="grow"></span>
    <span class="pill-stat streak-pill" title="Chuỗi ngày học">${icon('flame')}<span id="streakNum" class="num">${streakNow()}</span></span>
    <button class="pill-stat hide-sm" data-act="togglePro" id="planPill" title="Bật/tắt gói Pro (xem thử)">Free</button>
    <button class="btn icon ghost" data-act="theme" aria-label="Đổi giao diện sáng/tối"><span id="themeIc"></span></button>
    <div class="acct">
      <button class="avatar" id="acctBtn" data-act="acctMenu" aria-haspopup="menu" aria-expanded="false" aria-controls="acctMenu" aria-label="Tài khoản"></button>
      <div class="acct-menu glass" id="acctMenu" role="menu" aria-label="Tài khoản"></div>
    </div>
  </header>`;
const FOCUSBAR = `
  <div class="focusbar glass" id="focusbar">
    ${icon('zap')}<b class="small">Phiên ${store.get('ll2-dur', 15)} phút</b>
    <div class="steps" id="focusSteps"></div>
    <span class="small muted hide-sm" id="focusLabel"></span>
    <button class="btn ghost sm" data-act="endFocus">Thoát</button>
  </div>`;
const link = (label, go, id) => `<button data-go="${go}"${id ? ` data-id="${id}"` : ''}>${label}</button>`;
const soon = (name) => `<button data-act="footLink" data-name="${name}">${name}</button>`;
const FOOTER = () => `
  <footer class="foot" id="foot"><div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <button class="brand" data-go="today" aria-label="LinguaLoop, về trang Hôm nay"><img src="../lingualoop-logo/svg/favicon.svg" alt=""><span class="wordmark">Lingua<b>Loop</b></span></button>
        <p class="small muted">Luyện nghe chép và phát âm tiếng Anh trên video thật. Mỗi ngày 15 phút, đúng vào điểm yếu của bạn.</p>
        <div class="row g8">
          ${[['facebook', 'Facebook LinguaLoop'], ['youtube', 'Kênh YouTube LinguaLoop'], ['music-2', 'TikTok LinguaLoop'], ['mail', 'Email hỗ trợ']]
            .map(([ic, n]) => `<button class="btn icon ghost" data-act="footLink" data-name="${n}" aria-label="${n}">${icon(ic)}</button>`).join('')}
        </div>
      </div>
      <nav class="foot-col" aria-label="Học"><h4>Học</h4>${link('Bài học', 'lessons')}${link('Nghe chép', 'lessons', 'dictation')}${link('Shadowing', 'lessons', 'shadowing')}${link('Từ vựng', 'vocab')}${link('Kiểm tra trình độ', 'test')}</nav>
      <nav class="foot-col" aria-label="Của tôi"><h4>Của tôi</h4>${link('Từ &amp; câu đã lưu', 'mywords')}${link('Điểm yếu', 'weakness')}${link('Cài đặt tài khoản', 'settings')}${link('Gói Pro', 'settings')}</nav>
      <nav class="foot-col" aria-label="Hỗ trợ"><h4>Hỗ trợ</h4>${soon('Hướng dẫn bắt đầu')}${soon('Câu hỏi thường gặp')}${soon('Báo lỗi nội dung')}${soon('Liên hệ góp ý')}</nav>
      <nav class="foot-col" aria-label="Về LinguaLoop"><h4>Về LinguaLoop</h4>${link('Logo &amp; mascot', 'brand')}${soon('Điều khoản sử dụng')}${soon('Chính sách quyền riêng tư')}${soon('Dữ liệu giọng nói')}</nav>
    </div>
    <div class="foot-bottom">
      <span class="small muted">© 2026 LinguaLoop. Video bài học thuộc bản quyền của kênh gốc, chỉ dùng để học.</span>
      <span class="grow"></span>
      <span class="sys-ok small"><i aria-hidden="true"></i>Hệ thống hoạt động bình thường</span>
      <button class="chip" data-go="settings">${icon('globe')}Tiếng Việt</button>
    </div>
  </div></footer>`;
const OVERLAYS = `
  <div class="scrim" id="scrim"></div>
  <div class="palette glass" id="palette" role="dialog" aria-label="Tìm kiếm nhanh"><div class="p-in">${icon('search')}<input id="pInput" placeholder="Tìm từ, bài học, màn hình…" autocomplete="off" aria-label="Tìm kiếm"></div><div class="list" id="pList"></div></div>
  <aside class="sheet glass" id="sheet" role="dialog" aria-labelledby="shTitle"><div class="sh-head"><h2 id="shTitle" class="h3"></h2><button class="btn icon ghost" data-act="close" aria-label="Đóng">${icon('x')}</button></div><div class="sh-body" id="shBody"></div></aside>
  <div class="dialog glass" id="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlgTitle" aria-describedby="dlgBody"><div id="dlgIn"></div></div>
  <div class="notice glass" id="notice" role="status"></div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <canvas id="confetti" aria-hidden="true"></canvas>`;

/* ─── 12. Trạng thái: đang tải, lỗi, người mới (xem demo bằng ?state=loading|error|empty|new|notfound) ─── */
const skel = (w = '100%', h = 16, r) => `<span class="skel" style="width:${w};height:${h}px${r ? ';border-radius:' + r : ''}"></span>`;
const skelCards = (n = 8) => `<div class="l-grid" aria-busy="true" aria-label="Đang tải bài học">${Array.from({ length: n }, () =>
  `<div class="card l-card skel-card">${skel('100%', 112, '0')}<div class="l-body">${skel('85%', 18)}${skel('55%', 14)}${skel('40%', 12)}
    <div class="lmodes">${skel('100%', 40, 'var(--radius-md)')}${skel('100%', 40, 'var(--radius-md)')}</div></div></div>`).join('')}</div>`;
const ERRORS = {
  network: { mood: 'encourage', title: 'Mất kết nối mạng', sub: 'Kiểm tra Wi-Fi hoặc 4G rồi thử lại. Tiến độ học của bạn vẫn an toàn.', code: '' },
  server: { mood: 'encourage', title: 'Không tải được dữ liệu', sub: 'LinguaLoop đang gặp sự cố. Đây không phải lỗi của bạn, hãy thử lại sau ít giây.', code: 'Mã lỗi: SRV-500 · 15/10/2026 21:42' },
  notfound: { mood: 'encourage', title: 'Không tìm thấy bài học', sub: 'Bài này có thể đã bị gỡ hoặc đường dẫn không đúng.', code: '' },
};
function errorState(kind = 'server', { retry = true, back = ['Về thư viện bài học', 'lessons'] } = {}) {
  const e = ERRORS[kind] || ERRORS.server;
  return `<div class="card err-state" role="alert">${mascot(e.mood, 120)}<h2 class="h2 mt8">${e.title}</h2><p class="muted mt8">${e.sub}</p>
    ${e.code ? `<p class="small subtle mt8">${e.code}</p>` : ''}
    <div class="row g12 mt24" style="justify-content:center">${retry ? `<button class="btn primary" data-act="retry">${icon('rotate-cw')}Thử lại</button>` : ''}${back ? `<button class="btn ghost" data-go="${back[1]}">${back[0]}</button>` : ''}</div></div>`;
}
/* Bảng chọn trạng thái: chỉ có trong mockup để xem từng trạng thái, không phải một phần sản phẩm */
function statePicker(items) {
  const cur = qs().get('state') || 'normal';
  document.body.insertAdjacentHTML('beforeend', `<div class="state-picker collapsed" id="statePicker" aria-label="Chọn trạng thái xem thử (chỉ có trong mockup)">
    <button class="overline sp-head" data-sp="toggle" aria-expanded="false">${icon('flask-conical')}Trạng thái xem thử<span class="sp-cur">${(items.find(i => i[0] === cur) || items[0])[1]}</span></button>
    <div class="row g8 wrap sp-body">${items.map(([k, l]) => `<button class="chip${k === cur ? ' on' : ''}" data-state="${k}">${l}</button>`).join('')}</div></div>`);
  CLICKS.push((t) => {
    const tg = t.closest('[data-sp]');
    if (tg) { const p = $('#statePicker'); p.classList.toggle('collapsed'); tg.setAttribute('aria-expanded', !p.classList.contains('collapsed')); return true; }
    const b = t.closest('[data-state]'); if (!b) return;
    const q = new URLSearchParams(location.search); b.dataset.state === 'normal' ? q.delete('state') : q.set('state', b.dataset.state);
    location.search = q.toString(); return true;
  });
}
Object.assign(ACT, {});

/* Script của trang cũ còn sinh <i class="ph ph-tên">; đổi sang Lucide ngay khi DOM thay đổi */
function phToLucide(root = document) {
  let n = 0;
  $$('i.ph, i.ph-fill, i.ph-duotone, i.ph-bold', root).forEach(el => {
    const name = [...el.classList].find(c => c.startsWith('ph-') && !['ph-fill', 'ph-duotone', 'ph-bold'].includes(c));
    if (!name) return;
    const fill = el.classList.contains('ph-fill') && FILL_OK.has(lu(name.slice(3)));
    const keep = [...el.classList];   // giữ nguyên class cũ (ph, ph-fill, ph-tên) để luật CSS của v1 còn khớp
    el.className = ['ic-ph', fill ? 'fill' : '', ...keep].filter(Boolean).join(' ');
    el.setAttribute('data-lucide', lu(name.slice(3))); n++;
  });
  return n;
}
let phTimer = 0;
function watchPhosphor() {
  const run = () => { phTimer = 0; phToLucide(); if (window.lucide && document.querySelector('i[data-lucide]')) lucide.createIcons(); };
  new MutationObserver(() => { if (!phTimer) phTimer = requestAnimationFrame(run); }).observe(document.body, { childList: true, subtree: true });
}

const Shell = {
  page: null,
  guard: null,
  hooks: {},
  click(fn) { CLICKS.push(fn); },
  key(fn, when) { (when === 'early' ? KEYS_EARLY : when === 'late' ? KEYS_LATE : KEYS).push(fn); },
  init(pageId, o = {}) {
    this.page = pageId;
    const body = document.body, main = $('main.main');
    if (typeof SPRITE !== 'undefined') body.insertAdjacentHTML('afterbegin', SPRITE);
    if (o.auth) {
      body.classList.add('auth-mode');
    } else {
      const shell = document.createElement('div'); shell.className = 'shell';
      shell.innerHTML = RAIL() + '<div class="page">' + TOPBAR() + '</div>';
      const page = $('.page', shell);
      if (main) { page.appendChild(main); $('.wrap', main).insertAdjacentHTML('afterbegin', FOCUSBAR); }
      page.insertAdjacentHTML('beforeend', FOOTER());
      body.prepend(shell);
      $('#foot').classList.toggle('min', ['dictation', 'shadowing', 'test'].includes(pageId));
    }
    body.insertAdjacentHTML('beforeend', OVERLAYS);
    if (store.get('ll2-pro', false)) setPro(true, true);
    if (!o.auth) {
      renderAcct(); renderFocus();
      $$('.rail .nav').forEach(b => { const l = $('.lbl', b); if (l) { b.title = l.textContent; b.setAttribute('aria-label', l.textContent); } });
      setRail(store.get('ll2-rail', false));
      const m = qs().get('id');
      const nk = pageId === 'lessons' && m ? 'lessons/' + m : NAV_OF[pageId] || pageId;
      $$('.nav[data-nav]').forEach(b => { const on = b.dataset.nav === nk; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); });
    }
    themeIcon();
    const f = sess.get('flash', null);
    if (f) { sess.del('flash'); setTimeout(() => { toast(f.msg, null, f.ic); if (f.confetti) confetti(); }, 350); }
    watchPhosphor();
    refreshIcons();
    reveal();
    requestAnimationFrame(segAll);
    if (document.fonts) document.fonts.ready.then(segAll);
  },
};
