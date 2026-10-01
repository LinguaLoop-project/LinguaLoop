/* Cài đặt tài khoản: hồ sơ, học tập, giao diện, bảo mật, gói và thanh toán, quyền riêng tư (S-25, S-26, S-27) */
'use strict';
let DEVICES = [['desktop', 'Chrome · Windows 11', 'TP. Hồ Chí Minh · đang hoạt động'], ['device-mobile', 'Safari · iPhone 13', 'TP. Hồ Chí Minh · 2 giờ trước'], ['device-tablet', 'Chrome · Android', 'Đà Nẵng · 5 ngày trước']];
function doPw(f) {
  const o = $('#pwOld').value, n = $('#pwNew').value, n2 = $('#pwNew2').value;
  const ok = [fieldErr('pwOld', !o ? 'Nhập mật khẩu hiện tại' : ''), fieldErr('pwNew', !pwValid(n) ? 'Cần ít nhất 8 ký tự, có cả chữ và số' : n === o ? 'Mật khẩu mới phải khác mật khẩu cũ' : ''), fieldErr('pwNew2', n2 !== n ? 'Hai mật khẩu chưa khớp' : '')].every(Boolean);
  if (!ok) { $('.field.bad input', f).focus(); return; }
  const btn = $('button[type=submit]', f); busy(btn, 'Đang cập nhật…');
  setTimeout(() => { unbusy(btn); f.reset(); $('#pwNewMeter').dataset.s = 0; DEVICES = DEVICES.slice(0, 1); renderSettings('security'); toast('Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.', null, 'check-circle'); }, 800);
}

/* ---------- Cài đặt ---------- */
const SET_TABS = [['profile', 'user-circle', 'Hồ sơ'], ['learning', 'target', 'Học tập'], ['display', 'palette', 'Giao diện & ngôn ngữ'], ['security', 'shield-check', 'Bảo mật & đăng nhập'], ['plan', 'crown-simple', 'Gói & thanh toán'], ['privacy', 'lock-key', 'Quyền riêng tư & dữ liệu']];
const SET = { tab: 'profile', dirty: false };
function setDirty(on) { SET.dirty = on; const b = $('#saveBar'); if (b) b.classList.toggle('on', on); }
const swc = (name, on, label, instant) => `<label class="switch"><input type="checkbox" role="switch" name="${name}" ${on ? 'checked' : ''} aria-label="${label}"${instant ? ' data-instant' : ''}><span class="track"></span></label>`;
const srow = (title, sub, ctrl) => `<div class="set-row"><div class="t"><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</div><div class="c">${ctrl}</div></div>`;
const sseg = (name, opts, val, label) => `<div class="seg" role="radiogroup" aria-label="${label}" data-seg="${name}">${opts.map(([v, l]) => { const on = String(v) === String(val); return `<button type="button" role="radio" aria-checked="${on}" class="${on ? 'on' : ''}" data-v="${v}">${l}</button>`; }).join('')}</div>`;
const fld = (id, label, inner, hint = '', full = false) => `<div class="field ${full ? 'full' : ''}"><label for="${id}">${label}</label>${inner}${hint ? `<p class="hint">${hint}</p>` : ''}<p class="err"></p></div>`;
const pwInp = (id, ac) => `<div class="inp"><i class="ph ph-lock-simple"></i><input id="${id}" type="password" autocomplete="${ac}"><button type="button" class="pw-eye" data-act="pwEye" aria-label="Hiện mật khẩu" aria-pressed="false">${icon('eye')}</button></div>`;
const SET_BODY = {
  profile: () => `
    <div class="card rv"><h3>Ảnh đại diện</h3><p class="small muted">Hiện ở góc trên màn hình và khi bạn chia sẻ tiến độ.</p>
      <div class="av-row" style="margin-top:16px"><span class="avatar xl" aria-hidden="true">${initials(ME.name)}</span>
        <div class="col g8"><div class="row w"><button class="btn ghost sm" data-act="avUpload">${icon('upload-simple')}Tải ảnh lên</button><button class="btn text sm" data-act="avRemove">Dùng chữ viết tắt</button></div>
          <span class="small muted">JPG hoặc PNG, tối đa 2 MB. Ảnh vuông hiển thị đẹp nhất.</span></div></div></div>
    <div class="card rv"><h3>Thông tin cá nhân</h3><p class="small muted">Chỉ bạn thấy các thông tin này.</p>
      <div class="form-grid">
        ${fld('pfName', 'Tên hiển thị', `<div class="inp"><input id="pfName" name="name" value="${esc(ME.name)}" autocomplete="name" maxlength="40"></div>`, 'Dùng để chào bạn trong ứng dụng')}
        ${fld('pfUser', 'Tên người dùng', `<div class="inp"><span class="pre">@</span><input id="pfUser" name="user" value="${esc(ME.user)}" autocomplete="username" maxlength="20" spellcheck="false"></div>`, 'Đăng nhập được bằng tên này thay cho email')}
        <div class="field full"><label for="pfEmail">Email</label><div class="row w" style="gap:12px"><div class="inp disabled grow"><i class="ph ph-envelope-simple"></i><input id="pfEmail" value="${esc(ME.email)}" disabled><span class="badge t-ok">${icon('check-circle', 1)}Đã xác minh</span></div><button class="btn ghost" data-act="changeEmail">Đổi email</button></div></div>
        ${fld('pfBio', 'Giới thiệu', `<div class="inp area"><textarea id="pfBio" name="bio" maxlength="160" rows="3">${esc(ME.bio)}</textarea></div>`, `<span><span id="pfBioCnt">${ME.bio.length}</span>/160 ký tự</span>`, true)}
        ${fld('pfBirth', 'Ngày sinh', `<div class="inp"><i class="ph ph-calendar-blank"></i><input id="pfBirth" name="birthday" type="date" value="${ME.birthday}"></div>`, 'Giúp gợi ý bài hợp lứa tuổi')}
        <div class="field"><span class="lbl">Giới tính</span>${sseg('gender', [['female', 'Nữ'], ['male', 'Nam'], ['other', 'Khác'], ['', 'Không nói']], ME.gender, 'Giới tính')}</div>
      </div></div>`,
  learning: () => `
    <div class="card rv"><h3>Mục tiêu mỗi ngày</h3><p class="small muted">Kế hoạch ở trang Hôm nay được tạo theo các con số này.</p>
      <div class="set-rows">
        ${srow('Thời lượng học', 'Tổng thời gian các việc trong kế hoạch', sseg('dur', [[10, '10 phút'], [15, '15 phút'], [20, '20 phút'], [30, '30 phút']], state.dur, 'Thời lượng học mỗi ngày'))}
        ${srow('Số thẻ ôn tối đa mỗi ngày', 'Thẻ đến hạn vượt quá số này được dời sang hôm sau', `<div class="range"><input type="range" name="maxReviews" min="20" max="300" step="10" value="${ME.maxReviews}" aria-label="Số thẻ ôn tối đa mỗi ngày"><output id="mrOut">${ME.maxReviews}</output></div>`)}
      </div></div>
    <div class="card rv"><h3>Nghe &amp; nói</h3>
      <div class="set-rows">
        ${srow('Giọng đọc mẫu', 'Dùng khi tra từ và khi nghe mẫu shadowing', sseg('voice', [['uk', 'Anh - Anh'], ['us', 'Anh - Mỹ']], ME.voice, 'Giọng đọc mẫu'))}
        ${srow('Tốc độ nghe chép mặc định', 'Vẫn đổi được ngay trong bài', sseg('rate', [['.6', '0.6×'], ['.8', '0.8×'], ['1', '1×']], ME.rate, 'Tốc độ nghe chép mặc định'))}
        ${srow('Hiện video khi luyện', 'Tắt để luyện nghe thuần, không nhìn khẩu hình. Bài audio không bị ảnh hưởng', swc('showVideo', ME.showVideo, 'Hiện video khi luyện'))}
        ${srow('Tự phát câu tiếp theo', 'Bấm Câu tiếp là câu mới tự phát, không cần bấm Play', swc('autoNext', ME.autoNext, 'Tự phát câu tiếp theo'))}
      </div></div>
    <div class="card rv"><h3>Nhắc học</h3>
      <div class="set-rows">
        ${srow('Nhắc học mỗi ngày', 'Gửi thông báo nếu tới giờ này bạn chưa học', `<div class="inp sm"><input type="time" name="remindAt" value="${ME.remindAt}" aria-label="Giờ nhắc học"></div>${swc('remind', ME.remind, 'Nhắc học mỗi ngày')}`)}
        ${srow('Cảnh báo sắp mất chuỗi', 'Nhắc lúc 21:00 nếu hôm đó chưa học gì', swc('streakWarn', ME.streakWarn, 'Cảnh báo sắp mất chuỗi'))}
      </div></div>`,
  display: () => {
    const cur = store.get('ll3-theme', null) || 'system', mini = (t) => `<span class="pv" data-theme="${t}"><i></i><span><b></b><b></b><b></b></span></span>`;
    const opt = (v, l, pv) => `<button type="button" class="theme-opt ${cur === v ? 'on' : ''}" data-act="setTheme" data-v="${v}" aria-pressed="${cur === v}">${pv}<span class="row between"><b class="small">${l}</b><i class="ph-fill ph-check-circle ck" aria-hidden="true"></i></span></button>`;
    return `
    <div class="card rv"><h3>Giao diện</h3><p class="small muted">Áp dụng ngay để bạn xem thử, không cần bấm Lưu.</p>
      <div class="theme-opts">${opt('dark', 'Tối', mini('dark'))}${opt('light', 'Sáng', mini('light'))}${opt('system', 'Theo hệ thống', `<span class="pv-split">${mini('dark')}${mini('light')}</span>`)}</div>
      <div class="set-rows" style="margin-top:8px">${srow('Giảm chuyển động', 'Tắt hiệu ứng trôi nổi, lật số, pháo giấy', sseg('motion', [['system', 'Theo hệ thống'], ['on', 'Luôn giảm']], ME.motion, 'Giảm chuyển động'))}</div></div>
    <div class="card rv"><h3>Ngôn ngữ &amp; khu vực</h3>
      <div class="set-rows">
        ${srow('Ngôn ngữ giao diện', 'Nghĩa của từ vẫn hiện bằng tiếng Việt', sseg('lang', [['vi', 'Tiếng Việt'], ['en', 'English']], ME.lang, 'Ngôn ngữ giao diện'))}
        ${srow('Múi giờ', 'Dùng để tính chuỗi ngày học và giờ nhắc', `<div class="inp sel"><select name="tz" aria-label="Múi giờ">${[['Asia/Ho_Chi_Minh', 'Hà Nội, TP.HCM (GMT+7)'], ['Asia/Tokyo', 'Tokyo (GMT+9)'], ['Australia/Sydney', 'Sydney (GMT+10)'], ['Europe/London', 'London (GMT+1)'], ['America/New_York', 'New York (GMT−4)']].map(([v, l]) => `<option value="${v}" ${v === ME.tz ? 'selected' : ''}>${l}</option>`).join('')}</select><i class="ph ph-caret-down"></i></div>`)}
      </div></div>`;
  },
  security: () => `
    <form class="card rv" id="fPw" novalidate><h3>Đổi mật khẩu</h3><p class="small muted">Sau khi đổi, các thiết bị khác sẽ phải đăng nhập lại.</p>
      <div class="form-grid">
        ${fld('pwOld', 'Mật khẩu hiện tại', pwInp('pwOld', 'current-password'), '', true)}
        ${fld('pwNew', 'Mật khẩu mới', pwInp('pwNew', 'new-password') + '<div class="pw-meter" id="pwNewMeter" data-s="0" aria-hidden="true"><i></i><i></i><i></i><i></i></div>', 'Ít nhất 8 ký tự, có cả chữ và số')}
        ${fld('pwNew2', 'Nhập lại mật khẩu mới', pwInp('pwNew2', 'new-password'))}
      </div>
      <div class="row" style="margin-top:20px;justify-content:flex-end"><button class="btn primary" type="submit">Cập nhật mật khẩu</button></div></form>
    <div class="card rv"><h3>Đăng nhập bằng tài khoản khác</h3>
      <div class="set-rows">${srow(`<svg class="gg" aria-hidden="true"><use href="#g-google"/></svg>Google`, ME.google ? `Đã liên kết với ${esc(ME.email)}` : 'Chưa liên kết. Liên kết để đăng nhập bằng 1 chạm', ME.google ? `<button class="btn ghost sm" data-act="unlinkGoogle">Huỷ liên kết</button>` : `<button class="btn ghost sm" data-act="linkGoogle">Liên kết</button>`)}</div></div>
    <div class="card rv"><div class="row between w"><div><h3>Thiết bị đang đăng nhập</h3><p class="small muted">Thấy thiết bị lạ? Đăng xuất thiết bị đó rồi đổi mật khẩu.</p></div>${DEVICES.length > 1 ? `<button class="btn ghost sm" data-act="logoutOthers">${icon('sign-out')}Đăng xuất thiết bị khác</button>` : ''}</div>
      <div class="set-rows">${DEVICES.map((d, i) => `<div class="set-row dev"><span class="dev-ic">${icon(d[0])}</span><div class="t"><b>${d[1]}</b><span>${d[2]}</span></div><div class="c">${i === 0 ? '<span class="badge t-ok">Thiết bị này</span>' : `<button class="btn text sm" data-act="logoutDev" data-i="${i}">Đăng xuất</button>`}</div></div>`).join('')}</div></div>`,
  plan: () => {
    const pro = isPro(), used = 5 - S.quota;
    const use = (l, v, p, tone = '') => `<div class="usage"><span class="small">${l}</span><b class="small">${v}</b>${p != null ? `<div class="bar thin ${tone}"><i style="width:${p}%"></i></div>` : ''}</div>`;
    return `
    <div class="card card-highlight rv"><div class="row between w" style="align-items:flex-start"><div><div class="overline">Gói hiện tại</div><h2>${pro ? 'Pro · 12 tháng' : 'Free'}</h2><p class="small muted" style="margin-top:4px">${pro ? 'Tự gia hạn ngày 28/09/2027 · 396.000đ' : 'Đủ để luyện mỗi ngày. Pro mở chấm không giới hạn và nhận xét AI.'}</p></div>${pro ? `<span class="badge pro">${icon('crown-simple', 1)}PRO</span>` : ''}</div>
      <div class="overline" style="margin-top:24px">Đã dùng hôm nay</div>
      <div class="col g12">
        ${use('Chấm phát âm', pro ? 'Không giới hạn' : `${used}/5 lượt`, pro ? null : used * 20, used >= 4 ? 't-warn' : '')}
        ${use('Nhận xét AI', pro ? '3 lần' : 'Chỉ có ở Pro', null)}
        ${use('Video khẩu hình', pro ? 'Mở' : 'Chỉ có ở Pro', null)}
        ${use('Tạo bài từ YouTube', pro ? '1/10 bài tháng này' : 'Chỉ có ở Pro', pro ? 10 : null)}
      </div>
      ${pro ? `<div class="row w" style="margin-top:20px"><button class="btn ghost sm" data-act="cancelRenew">Huỷ tự gia hạn</button><button class="btn text sm" data-act="togglePro">Xem như gói Free</button></div>` : ''}</div>
    ${pro ? '' : `<div class="card rv"><h3>Nâng cấp Pro</h3><p class="small muted">Huỷ lúc nào cũng được, vẫn dùng Pro tới hết kỳ đã trả.</p>
      <div class="price-grid">${[['1 tháng', '49.000đ', '/tháng', ''], ['6 tháng', '39.000đ', '/tháng · trả 234.000đ', 'Tiết kiệm 20%'], ['12 tháng', '33.000đ', '/tháng · trả 396.000đ', 'Phổ biến nhất']].map(([n, p, u, tag], i) =>
        `<button type="button" class="price ${i === 2 ? 'on' : ''}" data-act="pickPrice" aria-pressed="${i === 2}">${tag ? `<span class="badge ${i === 2 ? 't-pri' : 't-ok'}">${tag}</span>` : '<span class="badge t-mut">Linh hoạt</span>'}<b>${n}</b><span class="h2">${p}</span><span class="small muted">${u}</span></button>`).join('')}</div>
      <ul class="tips small"><li>Chấm phát âm không giới hạn</li><li>Nhận xét AI cho từng lần đọc</li><li>Video khẩu hình cho từng âm</li><li>Hồ sơ điểm yếu đầy đủ, xu hướng theo tuần</li><li>Tạo bài từ video YouTube</li></ul>
      <button class="btn primary lg" style="margin-top:16px" data-act="togglePro">${icon('crown-simple', 1)}Dùng thử Pro 7 ngày</button></div>`}
    <div class="card rv"><h3>Lịch sử thanh toán</h3>${pro ? `<table class="wtab" style="margin-top:12px"><thead><tr><th>Ngày</th><th>Gói</th><th>Số tiền</th><th>Trạng thái</th></tr></thead><tbody><tr><td>28/09/2026</td><td>Pro 12 tháng</td><td>396.000đ</td><td><span class="badge t-ok">Đã thanh toán</span></td></tr></tbody></table>` : '<p class="small muted" style="margin-top:8px">Chưa có giao dịch nào.</p>'}</div>`;
  },
  privacy: () => `
    <div class="card rv"><h3>Giọng nói &amp; AI</h3><p class="small muted">Bạn đồng ý lần đầu khi ghi âm. Thay đổi ở đây có hiệu lực ngay và được ghi lại.</p>
      <div class="set-rows">
        ${srow('Lưu bản ghi giọng nói', 'Để nghe lại và so sánh tiến bộ theo thời gian. Tắt thì bản ghi bị xoá ngay sau khi chấm.</span><span class="subtle">Đồng ý ngày 12/08/2026 · chính sách bản 1.2', swc('consentVoice', ME.consentVoice, 'Lưu bản ghi giọng nói', 1))}
        ${srow('Gửi bài đọc cho AI nhận xét', 'Bản ghi và điểm từng âm được gửi cho AI để viết nhận xét riêng. Tắt thì không có Nhận xét AI.</span><span class="subtle">Đồng ý ngày 12/08/2026 · chính sách bản 1.2', swc('consentAi', ME.consentAi, 'Gửi bài đọc cho AI nhận xét', 1))}
      </div></div>
    <div class="card rv"><h3>Dữ liệu của bạn</h3>
      <div class="set-rows">
        ${srow('Tải bản sao dữ liệu', 'Từ đã lưu, lịch sử luyện, điểm số và ghi chú (JSON). Link tải gửi qua email.', `<button class="btn ghost sm" data-act="exportData">${icon('download-simple')}Yêu cầu bản sao</button>`)}
        ${srow('Xoá lịch sử tra từ', 'Không ảnh hưởng tới các từ bạn đã lưu', `<button class="btn ghost sm" data-act="clearHistory">Xoá lịch sử</button>`)}
      </div></div>
    <div class="card danger-zone rv"><h3>Xoá tài khoản</h3><p class="small muted" style="margin-top:4px">Xoá tài khoản, tiến độ, từ đã lưu và mọi bản ghi giọng nói. Bạn có 14 ngày để đổi ý bằng cách đăng nhập lại, sau đó không khôi phục được.</p>
      <button class="btn danger" style="margin-top:16px" data-act="deleteAcct">${icon('trash')}Xoá tài khoản</button></div>`,
};
function renderSettings(tab) {
  if (!SET_BODY[tab]) tab = 'profile'; SET.tab = tab; setDirty(false);
  $('#setNav').innerHTML = SET_TABS.map(([k, ic, l]) => `<button data-go="settings" data-id="${k}" class="${k === tab ? 'on' : ''}"${k === tab ? ' aria-current="page"' : ''}>${icon(ic, k === tab)}${l}</button>`).join('')
    + `<span class="sep"></span><button class="danger" data-act="logout">${icon('sign-out')}Đăng xuất</button>`;
  $('#setBody').innerHTML = SET_BODY[tab]();
  reveal($('#setBody')); requestAnimationFrame(segAll);
  const on = $('#setNav .on'); if (on && innerWidth < 1024) on.scrollIntoView({ block: 'nearest', inline: 'center' });
}
function setSeg(btn) {
  segPick(btn); $$('button', btn.closest('.seg')).forEach(b => b.setAttribute('aria-checked', b === btn)); setDirty(true);
}


Object.assign(ACT, {
  setCancel() { renderSettings(SET.tab); toast('Đã bỏ các thay đổi', null, 'arrow-counter-clockwise'); },
  setSave() {
    const bd = $('#setBody'), val = (n) => { const el = $(`[name="${n}"]`, bd); return !el ? undefined : el.type === 'checkbox' ? el.checked : el.value; };
    const segv = (n) => { const s = $(`[data-seg="${n}"] button.on`, bd); return s ? s.dataset.v : undefined; };
    if (SET.tab === 'profile') {
      const name = val('name').trim(), user = val('user').trim().toLowerCase();
      const ok = [fieldErr('pfName', !name ? 'Nhập tên hiển thị' : ''), fieldErr('pfUser', !USER_RE.test(user) ? 'Chỉ dùng chữ thường không dấu, số hoặc dấu gạch dưới, 3–20 ký tự' : '')].every(Boolean);
      if (!ok) { $('.field.bad input', bd).focus(); return; }
      Object.assign(ME, { name, user, bio: val('bio'), birthday: val('birthday'), gender: segv('gender') });
      renderAcct(); $('.avatar.xl', bd).textContent = initials(ME.name);
    }
    if (SET.tab === 'learning') {
      Object.assign(ME, { maxReviews: +val('maxReviews'), voice: segv('voice'), rate: segv('rate'), showVideo: val('showVideo'), autoNext: val('autoNext'), remind: val('remind'), remindAt: val('remindAt'), streakWarn: val('streakWarn') });
      const dur = +segv('dur'); if (dur !== state.dur) { state.dur = dur; store.set('ll3-dur', dur); }
      store.set('ll3-vp-hide', { d: !ME.showVideo, s: !ME.showVideo });
      
    }
    if (SET.tab === 'display') { Object.assign(ME, { motion: segv('motion'), lang: segv('lang'), tz: val('tz') }); if (ME.lang === 'en') toast('Bản mẫu mới có tiếng Việt', null, 'translate'); }
    saveMe(); setDirty(false); toast('Đã lưu thay đổi', null, 'check-circle');
  },
  setTheme(b) {
    const v = b.dataset.v, root = document.documentElement, t = v === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : v;
    root.classList.add('theme-anim'); root.dataset.theme = t; store.set('ll3-theme', v === 'system' ? null : v); setTimeout(() => root.classList.remove('theme-anim'), 320);
    window.dispatchEvent(new Event('ll:theme'));
    $$('.theme-opt').forEach(o => { const on = o.dataset.v === v; o.classList.toggle('on', on); o.setAttribute('aria-pressed', on); });
  },
  avUpload() { toast('Chọn ảnh từ máy (JPG, PNG, tối đa 2 MB)', null, 'upload-simple'); },
  avRemove() { toast('Đang dùng chữ viết tắt tên bạn làm ảnh đại diện', null, 'user-circle'); },
  changeEmail() { toast('Nhập email mới, mã xác nhận sẽ gửi tới cả email cũ và mới', null, 'envelope-simple'); },
  linkGoogle() { ME.google = true; renderSettings('security'); toast('Đã liên kết Google', null, 'check-circle'); },
  unlinkGoogle() {
    confirmDlg({ title: 'Huỷ liên kết Google?', body: 'Sau đó bạn đăng nhập bằng email và mật khẩu. Hãy chắc là bạn còn nhớ mật khẩu.', ok: 'Huỷ liên kết', tone: 't-warn', ic: 'link-break',
      onOk: () => { ME.google = false; renderSettings('security'); toast('Đã huỷ liên kết Google', null, 'link-break'); } });
  },
  logoutDev(b) { const d = DEVICES.splice(+b.dataset.i, 1)[0]; renderSettings('security'); toast(`Đã đăng xuất ${d[1]}`, null, 'sign-out'); },
  logoutOthers() {
    confirmDlg({ title: 'Đăng xuất các thiết bị khác?', body: `${DEVICES.length - 1} thiết bị sẽ phải đăng nhập lại. Thiết bị bạn đang dùng vẫn giữ đăng nhập.`, ok: 'Đăng xuất', tone: 't-warn', ic: 'sign-out',
      onOk: () => { DEVICES = DEVICES.slice(0, 1); renderSettings('security'); toast('Đã đăng xuất khỏi các thiết bị khác', null, 'check-circle'); } });
  },
  pickPrice(b) { $$('.price').forEach(p => { const on = p === b; p.classList.toggle('on', on); p.setAttribute('aria-pressed', on); }); },
  cancelRenew() {
    confirmDlg({ title: 'Huỷ tự gia hạn?', body: 'Bạn vẫn dùng Pro tới hết ngày 28/09/2027. Sau đó tài khoản về gói Free, dữ liệu giữ nguyên.', ok: 'Huỷ gia hạn', tone: 't-warn', ic: 'calendar-x',
      onOk: () => toast('Đã huỷ tự gia hạn. Pro còn hiệu lực tới 28/09/2027', null, 'calendar-x') });
  },
  exportData() { toast('Đã nhận yêu cầu. Link tải sẽ gửi tới email của bạn trong 24 giờ', null, 'download-simple'); },
  clearHistory() { toast('Đã xoá lịch sử tra từ', { label: 'Hoàn tác', fn: () => {} }, 'trash'); },
  deleteAcct() {
    confirmDlg({ title: 'Xoá tài khoản?', body: 'Tiến độ, từ đã lưu và bản ghi giọng nói sẽ bị xoá. Trong 14 ngày bạn có thể đăng nhập lại để huỷ yêu cầu.', ok: 'Xoá tài khoản', tone: 't-bad', ic: 'trash', danger: true, confirmText: ME.user,
      onOk: () => { setDirty(false); flash('Đã lên lịch xoá tài khoản. Đăng nhập lại trong 14 ngày để huỷ.', 'trash'); go('login'); } });
  },
});

// Rời trang khi còn thay đổi chưa lưu thì hỏi lại
Shell.guard = (view, opts) => {
  if (!SET.dirty) return false;
  confirmDlg({ title: 'Bỏ thay đổi chưa lưu?', body: 'Các thay đổi trong Cài đặt chưa được lưu sẽ mất.', ok: 'Bỏ thay đổi', tone: 't-warn', ic: 'warning', onOk: () => { setDirty(false); go(view, opts); } });
  return true;
};

Shell.click((t) => {
  const ss = t.closest('#setBody [data-seg] button'); if (ss) { setSeg(ss); return true; }
});
document.addEventListener('submit', e => { if (e.target.id === 'fPw') { e.preventDefault(); doPw(e.target); } });
document.addEventListener('input', e => {
  const x = e.target;
  if (x.id === 'pwNew') pwMeter(x, 'pwNewMeter');
  if (x.id === 'pfBio') $('#pfBioCnt').textContent = x.value.length;
  if (x.name === 'maxReviews') $('#mrOut').textContent = x.value;
  if (x.closest('#setBody') && !x.closest('#fPw') && !x.hasAttribute('data-instant')) setDirty(true);
});
document.addEventListener('change', e => {
  const x = e.target; if (!x.matches('[data-instant]')) return;
  ME[x.name] = x.checked; saveMe(); const lbl = x.getAttribute('aria-label');
  toast(x.checked ? `Đã bật: ${lbl}` : `Đã tắt: ${lbl}${x.name === 'consentVoice' ? '. Bản ghi cũ sẽ bị xoá trong 24 giờ' : ''}`,
    { label: 'Hoàn tác', fn: () => { x.checked = !x.checked; ME[x.name] = x.checked; saveMe(); } }, x.checked ? 'check-circle' : 'shield-slash');
});
window.addEventListener('ll:pro', () => { if (typeof SET !== 'undefined') renderSettings(SET.tab); });

renderSettings(qs().get('id') || 'profile');
