/**
 * LinguaLoop — shell.js (Admin)
 */
'use strict';

const $ = id => document.getElementById(id);
function actionIcon(a){ return {create:'ph-plus-circle',update:'ph-pencil-simple',publish:'ph-rocket-launch',delete:'ph-trash'}[a]||'ph-circle'; }
function actionColor(a){ return {create:'var(--success)',update:'var(--info)',publish:'var(--accent)',delete:'var(--danger)'}[a]||'var(--text-muted)'; }
function actionBg(a){ const c={create:'var(--success)',update:'var(--info)',publish:'var(--accent)',delete:'var(--danger)'}[a];return `color-mix(in srgb,${c} 15%,transparent)`; }
function actionLabel(a){ return {create:'Tạo',update:'Sửa',publish:'Duyệt',delete:'Xoá'}[a]||a; }

const SVG_SPRITE = `
<svg class="sprite" aria-hidden="true" focusable="false">
<defs>
  <radialGradient id="gBody" cx=".38" cy=".3" r=".85">
    <stop offset="0" style="stop-color:var(--surface-hover)"/>
    <stop offset=".55" style="stop-color:var(--bg-base)"/>
    <stop offset="1" style="stop-color:var(--bg-base)"/>
  </radialGradient>
  <radialGradient id="gRim" cx=".75" cy=".85" r=".7">
    <stop offset="0" style="stop-color:var(--primary);stop-opacity:.9"/>
    <stop offset=".45" style="stop-color:var(--primary);stop-opacity:.2"/>
    <stop offset="1" style="stop-color:var(--primary);stop-opacity:0"/>
  </radialGradient>
  <linearGradient id="gEdge" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" style="stop-color:var(--accent);stop-opacity:.85"/>
    <stop offset=".45" style="stop-color:var(--accent);stop-opacity:0"/>
    <stop offset="1" style="stop-color:var(--accent-2);stop-opacity:.85"/>
  </linearGradient>
  <radialGradient id="gSpec">
    <stop offset="0" stop-color="#fff" stop-opacity=".8"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="gLogo" x1="20" y1="88" x2="80" y2="12" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#8B5CF6"/>
    <stop offset=".55" stop-color="#C084FC"/>
    <stop offset="1" stop-color="#F0ABFC"/>
  </linearGradient>
</defs>
<symbol id="logo-mark" viewBox="0 0 100 100">
  <path d="M24 88 L34 73.7 A32 32 0 1 1 66 73.7" fill="none" stroke="url(#gLogo)" stroke-width="10" stroke-linecap="round"/>
  <path d="M79.8 76.1 L66 73.7 L70.8 60.5" fill="none" stroke="url(#gLogo)" stroke-width="10" stroke-linecap="round"/>
  <path d="M37 39 V53 M50 32 V60 M63 38 V54" fill="none" stroke="var(--text)" stroke-width="9" stroke-linecap="round"/>
</symbol>
<symbol id="o-orb" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="86" fill="url(#gBody)"/>
  <circle cx="100" cy="100" r="86" fill="url(#gRim)"/>
  <circle cx="100" cy="100" r="85" fill="none" stroke="url(#gEdge)" stroke-width="2.5"/>
  <ellipse cx="66" cy="58" rx="28" ry="13" transform="rotate(-32 66 58)" fill="url(#gSpec)"/>
</symbol>
</svg>`;

const NAV_ITEMS = [
  { id:'dashboard', icon:'ph-squares-four', label:'Tổng quan', href:'index.html', group:null },
  { id:'users',     icon:'ph-users',        label:'Người dùng', href:'users.html', group:'Hệ thống' },
  { id:'reports',   icon:'ph-flag',         label:'Báo lỗi nội dung', href:'reports.html', group:'Kiểm duyệt', badge:'5', badgeCls:'t-bad' },
  { id:'decks',     icon:'ph-stack',        label:'Duyệt bộ từ công khai', href:'decks.html', group:null, badge:'8', badgeCls:'t-warn' },
  { id:'audit',     icon:'ph-clock-counter-clockwise', label:'Nhật ký nội dung', href:'audit.html', group:null },
  { id:'limits',    icon:'ph-sliders-horizontal', label:'Gói & Hạn mức', href:'limits.html', group:'Cấu hình' },
  { id:'subs',      icon:'ph-credit-card',  label:'Đăng ký Pro', href:'subs.html', group:null },
  { id:'errors',    icon:'ph-warning-circle', label:'Danh mục lỗi', href:'errors.html', group:null },
];

const PAGE_TITLES = {
  dashboard:'Tổng quan', users:'Quản lý người dùng', reports:'Hàng đợi báo lỗi',
  decks:'Duyệt bộ từ', audit:'Nhật ký nội dung', limits:'Gói & Hạn mức',
  subs:'Đăng ký Pro', errors:'Danh mục lỗi'
};

function buildSidebar(activeId) {
  let lastGroup = null;
  const items = NAV_ITEMS.map(n => {
    let sep = '';
    if (n.group && n.group !== lastGroup) {
      sep = `<div class="rail-sep lbl">${n.group}</div>`;
      lastGroup = n.group;
    }
    const badge = n.badge ? `<span class="tag ${n.badgeCls} lbl">${n.badge}</span>` : '';
    const on = n.id === activeId ? ' on' : '';
    return `${sep}
<a class="nav${on}" href="${n.href}" id="nav-${n.id}" aria-label="${n.label}">
  <i class="ph ${n.icon}"></i><span class="lbl">${n.label}</span>${badge}
</a>`;
  }).join('');

  return `
<aside class="rail" id="rail" aria-label="Điều hướng Admin">
  <div class="rail-brand">
    <svg class="brand-mark" viewBox="0 0 100 100" aria-hidden="true"><use href="#logo-mark"/></svg>
    <span class="wordmark lbl">Lingua<b>Loop</b></span>
  </div>
  ${items}
</aside>`;
}

function buildHeader(activeId) {
  const title = PAGE_TITLES[activeId] || 'Tổng quan';
  return `
<header class="top" id="topBar">
  <nav class="breadcrumb" aria-label="Vị trí hiện tại">
    <a href="index.html">Admin</a>
    <span aria-hidden="true">&#8250;</span>
    <b>${title}</b>
  </nav>
  <div class="top-right">
    <button class="icon-btn theme-btn" id="themeBtn" aria-label="Đổi giao diện sáng/tối">
      <span class="theme-ic" aria-hidden="true"><i class="ph ph-moon"></i><i class="ph ph-sun"></i></span>
    </button>
    <div class="acct">
      <button class="avatar" id="acctBtn" aria-haspopup="true" aria-expanded="false" aria-label="Tài khoản">AD</button>
      <div class="acct-menu glass" id="acctMenu" role="menu">
        <div class="acct-menu-head"><b>Admin Tâm</b><span>admin@lingualoop.app</span></div>
        <button class="acct-menu-item" role="menuitem" style="color:var(--danger)"><i class="ph ph-sign-out"></i>Đăng xuất</button>
      </div>
    </div>
  </div>
</header>`;
}

const SHARED_OVERLAYS = `
<div class="toast" id="toast" role="status" aria-live="polite">
  <i class="ph" id="toastIc"></i><span id="toastMsg"></span>
</div>
<div class="modal-back" id="modalConfirm">
  <div class="modal" role="alertdialog" aria-modal="true">
    <div class="modal-head"><h2>Xác nhận</h2></div>
    <div class="modal-body"><p id="confirmMsg" class="muted"></p></div>
    <div class="modal-foot"><button class="btn ghost" id="cancelConfirm">Huỷ</button><button class="btn danger" id="okConfirm"><i class="ph ph-check"></i>Xác nhận</button></div>
  </div>
</div>`;

const Shell = {
  init(pageId) {
    const saved = (() => { try{ return JSON.parse(localStorage.getItem('ll-theme')); }catch{ return null; } })();
    const theme = saved || (matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;

    document.body.insertAdjacentHTML('afterbegin',
      SVG_SPRITE + `<div class="bg-fx" aria-hidden="true"><div class="bg-glow"></div><div class="bg-dots"></div></div>`
    );

    const shell = document.createElement('div');
    shell.className = 'shell';
    shell.innerHTML = buildSidebar(pageId);

    const pageDiv = document.createElement('div');
    pageDiv.className = 'page';
    pageDiv.innerHTML = buildHeader(pageId);

    const main = document.querySelector('main');
    if (main) pageDiv.appendChild(main);

    shell.appendChild(pageDiv);
    document.body.appendChild(shell);
    document.body.insertAdjacentHTML('beforeend', SHARED_OVERLAYS);

    this._setupTheme();
    this._setupAcctMenu();
    this._setupSegChip();
    this._setupModals();
  },
  _setupTheme() {
    const btn = $('themeBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const html = document.documentElement;
      const t = html.dataset.theme === 'dark' ? 'light' : 'dark';
      html.classList.add('theme-anim');
      html.dataset.theme = t;
      localStorage.setItem('ll-theme', JSON.stringify(t));
      setTimeout(() => html.classList.remove('theme-anim'), 400);
    });
  },
  _setupAcctMenu() {
    const btn = $('acctBtn'), menu = $('acctMenu');
    if (!btn) return;
    btn.addEventListener('click', e => { e.stopPropagation(); const open = menu.classList.toggle('open'); btn.setAttribute('aria-expanded', open); });
    document.addEventListener('click', () => { menu.classList.remove('open'); btn.setAttribute('aria-expanded','false'); });
  },
  _setupSegChip() {
    document.querySelectorAll('.seg').forEach(seg => {
      seg.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        seg.querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      });
    });
  },
  _setupModals() {
    window.openModal = id => $(id).classList.add('open');
    window.closeModal = id => $(id).classList.remove('open');
    $('cancelConfirm')?.addEventListener('click', () => window.closeModal('modalConfirm'));
    document.addEventListener('keydown', e => { if (e.key==='Escape') window.closeModal('modalConfirm'); });
  },
  toast(msg, type='ok') {
    const el = $('toast'), ic = $('toastIc');
    $('toastMsg').textContent = msg;
    el.className = 'toast show ' + type;
    ic.className = 'ph ' + (type==='ok'?'ph-check-circle':type==='bad'?'ph-x-circle':'ph-warning-circle');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  },
  confirm(msg, onOk) {
    $('confirmMsg').innerHTML = msg;
    $('okConfirm').onclick = () => { window.closeModal('modalConfirm'); if (onOk) onOk(); };
    window.openModal('modalConfirm');
  }
};
window.Shell = Shell;
