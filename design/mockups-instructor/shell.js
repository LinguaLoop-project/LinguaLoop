/**
 * LinguaLoop — shell.js
 * Inject sidebar + header vào mọi trang Giảng viên.
 * Mỗi trang HTML gọi Shell.init(pageId) sau khi DOM sẵn sàng.
 *
 * pageId map:
 *  'dashboard' | 'topics' | 'lessons' | 'compose' |
 *  'decks'     | 'cefr'   | 'reports' | 'dict'    |
 *  'phoneme'   | 'qbank'  | 'audit'
 */
'use strict';

/* ─── 1. Tiện ích ─── */
const $ = id => document.getElementById(id);
function scoreColor(n){ return n>=80?'var(--success)':n>=60?'var(--warning)':'var(--danger)'; }
function actionIcon(a){ return {create:'ph-plus-circle',update:'ph-pencil-simple',publish:'ph-rocket-launch',delete:'ph-trash'}[a]||'ph-circle'; }
function actionColor(a){ return {create:'var(--success)',update:'var(--info)',publish:'var(--accent)',delete:'var(--danger)'}[a]||'var(--text-muted)'; }
function actionBg(a){ const c={create:'var(--success)',update:'var(--info)',publish:'var(--accent)',delete:'var(--danger)'}[a];return `color-mix(in srgb,${c} 15%,transparent)`; }
function actionLabel(a){ return {create:'Tạo',update:'Sửa',publish:'Đăng',delete:'Xoá'}[a]||a; }

/* ─── 2. SVG Sprite ─── */
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

/* ─── 3. Nav items ─── */
const NAV_ITEMS = [
  { id:'dashboard', icon:'ph-squares-four', label:'Tổng quan', href:'index.html', group:null },
  { id:'topics',    icon:'ph-folders',      label:'Chủ đề',       href:'topics.html',   group:'Nội dung' },
  { id:'lessons',   icon:'ph-film-strip',   label:'Bài học',      href:'lessons.html',  group:null },
  { id:'decks',     icon:'ph-stack',        label:'Bộ từ vựng',   href:'decks.html',    group:null },
  { id:'cefr',      icon:'ph-robot',        label:'Duyệt CEFR AI',href:'cefr.html',     group:'Ngôn ngữ', badge:'12', badgeCls:'t-warn' },
  { id:'dict',      icon:'ph-book-open-text',label:'Từ điển',     href:'dict.html',     group:null },
  { id:'phoneme',   icon:'ph-waveform',     label:'Ngữ âm',       href:'phoneme.html',  group:null },
  { id:'qbank',     icon:'ph-exam',         label:'Câu hỏi kiểm tra', href:'qbank.html', group:null },
  { id:'reports',   icon:'ph-flag',         label:'Báo lỗi của tôi', href:'reports.html', group:'Theo dõi', badge:'3', badgeCls:'t-bad' },
  { id:'audit',     icon:'ph-clock-counter-clockwise', label:'Lịch sử thay đổi', href:'audit.html', group:null },
];

const PAGE_TITLES = {
  dashboard:'Tổng quan', topics:'Chủ đề', lessons:'Bài học', compose:'Soạn bài học mới',
  decks:'Bộ từ vựng', cefr:'Duyệt CEFR AI', reports:'Báo lỗi nội dung',
  dict:'Từ điển', phoneme:'Ngữ âm', qbank:'Ngân hàng câu hỏi', audit:'Lịch sử thay đổi',
};

/* ─── 4. Sidebar HTML ─── */
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
<aside class="rail" id="rail" aria-label="Điều hướng giảng viên">
  <div class="rail-brand">
    <svg class="brand-mark" viewBox="0 0 100 100" aria-hidden="true"><use href="#logo-mark"/></svg>
    <span class="wordmark lbl">Lingua<b>Loop</b></span>
  </div>
  <button class="switch-role" id="btnSwitchRole">
    <i class="ph ph-student"></i><span>Xem như học viên</span>
  </button>
  ${items}
</aside>`;
}

/* ─── 5. Header HTML ─── */
function buildHeader(activeId) {
  const title = PAGE_TITLES[activeId] || 'Tổng quan';
  return `
<header class="top" id="topBar">
  <nav class="breadcrumb" aria-label="Vị trí hiện tại">
    <a href="index.html">Giảng viên</a>
    <span aria-hidden="true">&#8250;</span>
    <b>${title}</b>
  </nav>
  <div class="top-right">
    <button class="icon-btn theme-btn" id="themeBtn" aria-label="Đổi giao diện sáng/tối">
      <span class="theme-ic" aria-hidden="true"><i class="ph ph-moon"></i><i class="ph ph-sun"></i></span>
    </button>
    <div class="acct">
      <button class="avatar" id="acctBtn" aria-haspopup="true" aria-expanded="false" aria-label="Tài khoản">GV</button>
      <div class="acct-menu glass" id="acctMenu" role="menu">
        <div class="acct-menu-head"><b>Nguyễn Văn Giảng</b><span>instructor@lingualoop.app</span></div>
        <a class="acct-menu-item" role="menuitem" href="audit.html"><i class="ph ph-clock-counter-clockwise"></i>Lịch sử của tôi</a>
        <div class="acct-menu-sep"></div>
        <button class="acct-menu-item" role="menuitem" id="btnSwitchRole2"><i class="ph ph-student"></i>Xem như học viên</button>
        <button class="acct-menu-item" role="menuitem" style="color:var(--danger)"><i class="ph ph-sign-out"></i>Đăng xuất</button>
      </div>
    </div>
  </div>
</header>`;
}

/* ─── 6. Shared overlays ─── */
const SHARED_OVERLAYS = `
<!-- Toast -->
<div class="toast" id="toast" role="status" aria-live="polite">
  <i class="ph" id="toastIc"></i><span id="toastMsg"></span>
</div>
<!-- Modal topic -->
<div class="modal-back" id="modalTopic">
  <div class="modal" role="dialog" aria-labelledby="modalTopicTitle" aria-modal="true" style="width:500px; max-width:90vw;">
    <div class="modal-head"><h2 id="modalTopicTitle">Tạo chủ đề</h2><button class="icon-btn" id="closeModalTopic"><i class="ph ph-x"></i></button></div>
    <div class="modal-body">
      <div class="field"><label class="req" for="dtName">Tên chủ đề</label><input type="text" id="dtName" placeholder="vd: Travel &amp; Tourism"><span class="field-err">Bắt buộc</span></div>
      <div class="field"><label for="dtNameVi">Tên tiếng Việt</label><input type="text" id="dtNameVi" placeholder="vd: Du lịch & Khám phá"></div>
      <div class="form-row" style="margin-top:12px; margin-bottom:12px">
        <div class="field"><label class="req" for="dtSlug">Slug</label><input type="text" id="dtSlug" placeholder="travel-tourism"></div>
        <div class="field"><label for="dtOrder">Thứ tự</label><input type="number" id="dtOrder" value="1" min="1"></div>
      </div>
      <label class="toggle"><input type="checkbox" id="dtStatus" checked><span class="toggle-track"></span><span><b class="small">Đã đăng</b></span></label>
    </div>
    <div class="modal-foot"><button class="btn ghost" id="cancelModalTopic">Huỷ</button><button class="btn primary" id="saveModalTopic"><i class="ph ph-check"></i>Lưu chủ đề</button></div>
  </div>
</div>
<!-- Scrim sentence -->
<div class="scrim" id="scrimSent" aria-hidden="true"></div>
<aside class="drawer" id="drawerSent" role="dialog" aria-labelledby="drawerSentTitle" aria-modal="true">
  <div class="drawer-head"><h2 id="drawerSentTitle">Câu #1</h2><button class="icon-btn" id="closeDrawerSent"><i class="ph ph-x"></i></button></div>
  <div class="drawer-body">
    <div class="form-row">
      <div class="field"><label for="dsStart">Bắt đầu (mm:ss.ms)</label><input type="text" id="dsStart" placeholder="00:12.300"></div>
      <div class="field"><label for="dsEnd">Kết thúc</label><input type="text" id="dsEnd" placeholder="00:15.800"></div>
    </div>
    <div class="field"><label class="req" for="dsSent">Câu tiếng Anh</label><textarea id="dsSent" rows="3"></textarea></div>
    <div class="field"><label for="dsTrans">Dịch tiếng Việt</label><textarea id="dsTrans" rows="2"></textarea></div>
    <div class="field"><label for="dsIpa">IPA</label><div class="row g8"><input type="text" id="dsIpa" style="font-family:var(--font-ipa)"><button class="btn ghost sm" id="btnAutoIpa"><i class="ph ph-magic-wand"></i>Tự sinh</button></div></div>
    <div class="field"><label for="dsCefr">Mức CEFR câu</label><div class="row g8"><select id="dsCefr" style="flex:1"><option>A1</option><option>A2</option><option selected>B1</option><option>B2</option><option>C1</option><option>C2</option></select><span class="badge ai sm">AI: B1 (84%)</span><button class="btn ghost xs" id="btnAcceptCefr">Duyệt</button></div></div>
  </div>
  <div class="drawer-foot"><button class="btn danger sm" id="btnDelSent"><i class="ph ph-trash"></i>Xoá câu</button><span class="grow"></span><button class="btn ghost" id="cancelDrawerSent">Huỷ</button><button class="btn primary" id="saveDrawerSent"><i class="ph ph-check"></i>Lưu câu</button></div>
</aside>
<!-- Modal diff -->
<div class="modal-back" id="modalDiff">
  <div class="modal" role="dialog" aria-labelledby="diffTitle" aria-modal="true">
    <div class="modal-head"><h2 id="diffTitle">Thay đổi</h2><button class="icon-btn" id="closeModalDiff"><i class="ph ph-x"></i></button></div>
    <div class="modal-body" id="diffBody"></div>
    <div class="modal-foot"><button class="btn ghost" id="closeModalDiff2">Đóng</button></div>
  </div>
</div>
<!-- Modal confirm -->
<div class="modal-back" id="modalConfirm">
  <div class="modal" role="alertdialog" aria-modal="true">
    <div class="modal-head"><h2>Xác nhận xoá</h2></div>
    <div class="modal-body"><p id="confirmMsg" class="muted"></p></div>
    <div class="modal-foot"><button class="btn ghost" id="cancelConfirm">Huỷ</button><button class="btn danger" id="okConfirm"><i class="ph ph-trash"></i>Xoá</button></div>
  </div>
</div>`;

/* ─── 7. Shell.init ─── */
const Shell = {
  init(pageId) {
    // Theme (trước khi render để tránh flash)
    const saved = (() => { try{ return JSON.parse(localStorage.getItem('ll-theme')); }catch{ return null; } })();
    const theme = saved || (matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;

    // Inject sprite + bg
    document.body.insertAdjacentHTML('afterbegin',
      SVG_SPRITE + `<div class="bg-fx" aria-hidden="true"><div class="bg-glow"></div><div class="bg-dots"></div></div>`
    );

    // Build shell wrapper
    const shell = document.createElement('div');
    shell.className = 'shell';
    shell.innerHTML = buildSidebar(pageId);

    // Move existing body content into page div
    const pageDiv = document.createElement('div');
    pageDiv.className = 'page';
    pageDiv.innerHTML = buildHeader(pageId);

    // Move all existing elements (except sprite + bg-fx) into page
    const main = document.querySelector('main');
    if (main) pageDiv.appendChild(main);

    shell.appendChild(pageDiv);
    document.body.appendChild(shell);

    // Inject overlays
    document.body.insertAdjacentHTML('beforeend', SHARED_OVERLAYS);

    // Setup shared UI
    this._setupTheme();
    this._setupAcctMenu();
    this._setupSegChip();
    this._setupDrawers();
    this._setupModals();
    this._setupSwitchRole();
  },

  /* Theme */
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

  /* Account menu */
  _setupAcctMenu() {
    const btn = $('acctBtn'), menu = $('acctMenu');
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    });
  },

  /* Seg + chip toggles */
  _setupSegChip() {
    document.querySelectorAll('.seg').forEach(seg => {
      seg.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        seg.querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      });
    });
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const on = chip.getAttribute('aria-pressed') === 'true';
        chip.setAttribute('aria-pressed', String(!on));
        chip.classList.toggle('on', !on);
      });
    });
  },

  /* Drawers */
  _setupDrawers() {
    const open  = (d,s) => { $(d).classList.add('open'); $(s).classList.add('open'); };
    const close = (d,s) => { $(d).classList.remove('open'); $(s).classList.remove('open'); };
    window.openDrawer  = open;
    window.closeDrawer = close;
    // Topic drawer (now modal)
    // Event listeners for modal are attached in _setupModals now
    // Sentence drawer
    $('closeDrawerSent')?.addEventListener('click', () => close('drawerSent','scrimSent'));
    $('cancelDrawerSent')?.addEventListener('click', () => close('drawerSent','scrimSent'));
    $('scrimSent')?.addEventListener('click', () => close('drawerSent','scrimSent'));
    $('saveDrawerSent')?.addEventListener('click', () => { close('drawerSent','scrimSent'); Shell.toast('Đã lưu câu'); });
  },

  /* Modals */
  _setupModals() {
    const open  = id => $(id).classList.add('open');
    const close = id => $(id).classList.remove('open');
    window.openModal  = open;
    window.closeModal = close;
    
    // Topic modal
    $('closeModalTopic')?.addEventListener('click', () => close('modalTopic'));
    $('cancelModalTopic')?.addEventListener('click', () => close('modalTopic'));
    $('saveModalTopic')?.addEventListener('click', () => {
      const name = $('dtName')?.value.trim();
      if (!name) { $('dtName')?.closest('.field')?.classList.add('error'); return; }
      close('modalTopic');
      Shell.toast('Đã lưu chủ đề "' + name + '"');
    });

    $('closeModalDiff')?.addEventListener('click', () => close('modalDiff'));
    $('closeModalDiff2')?.addEventListener('click', () => close('modalDiff'));
    $('cancelConfirm')?.addEventListener('click', () => close('modalConfirm'));
    document.addEventListener('keydown', e => { if (e.key==='Escape') { close('modalDiff'); close('modalConfirm'); close('modalTopic'); } });
  },

  /* Switch role */
  _setupSwitchRole() {
    ['btnSwitchRole','btnSwitchRole2'].forEach(id =>
      $(id)?.addEventListener('click', () => Shell.toast('Tính năng xem như học viên sẽ mở trong tab mới'))
    );
  },

  /* ─ Toast ─ */
  _toastTimer: null,
  toast(msg, type='ok') {
    const el = $('toast'), ic = $('toastIc');
    $('toastMsg').textContent = msg;
    el.className = 'toast show ' + type;
    ic.className = 'ph ' + (type==='ok'?'ph-check-circle':type==='bad'?'ph-x-circle':'ph-warning-circle');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  },

  /* ─ Confirm delete ─ */
  confirmDelete(label, onOk) {
    $('confirmMsg').innerHTML = `Bạn có chắc muốn xoá <b>${label}</b>? Hành động này không thể hoàn tác.`;
    $('okConfirm').onclick = () => { closeModal('modalConfirm'); if (onOk) onOk(); };
    openModal('modalConfirm');
  },

  /* ─ Diff viewer ─ */
  showDiff(before, after, title='Thay đổi') {
    $('diffTitle').textContent = title;
    $('diffBody').innerHTML = `
      <div class="diff-grid">
        <div><div class="diff-col-head before">Trước</div><div class="diff-col"><div class="diff-line del">- ${before}</div></div></div>
        <div><div class="diff-col-head after">Sau</div><div class="diff-col"><div class="diff-line add">+ ${after}</div></div></div>
      </div>`;
    openModal('modalDiff');
  },

  /* ─ Shared render helpers ─ */
  cefrBadge(cefr, sm='') {
    return `<span class="badge cefr ${cefr}${sm ? ' sm':''}"">${cefr}</span>`;
  },
  statusBadge(s) {
    return s==='pub'
      ? `<span class="badge pub sm">Đã đăng</span>`
      : `<span class="badge draft sm">Nháp</span>`;
  },

  /* Activity item */
  activityItem(a) {
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <span style="width:28px;height:28px;border-radius:50%;background:${actionBg(a.action)};display:grid;place-items:center;font-size:14px;flex-shrink:0;color:${actionColor(a.action)}">
        <i class="ph ${actionIcon(a.action)}"></i>
      </span>
      <div class="grow">
        <div class="small bold">${actionLabel(a.action)} ${a.type}</div>
        <div class="small muted truncate">${a.name}</div>
      </div>
      <span class="small subtle">${a.time}</span>
    </div>`;
  },

  /* Pagination */
  pagination(containerId, total, page=1, perPage=10) {
    const pages = Math.ceil(total/perPage);
    if (pages<=1) return;
    const el = $(containerId);
    if (!el) return;
    let html = `<span class="pg-info">${total} mục</span>`;
    for (let i=1;i<=pages;i++) html += `<button class="${i===page?'on':''}">${i}</button>`;
    el.innerHTML = html;
  },

  /* Speak (TTS) */
  speak(word) {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(word);
    u.lang='en-GB'; u.rate=0.8; speechSynthesis.speak(u);
  },
};
window.Shell = Shell;
window.scoreColor = scoreColor;
window.actionIcon = actionIcon;
window.actionColor = actionColor;
window.actionBg = actionBg;
window.actionLabel = actionLabel;
