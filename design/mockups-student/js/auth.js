/* Đăng nhập, đăng ký, quên mật khẩu, xác minh email (G-03, G-04, G-05). Mỗi trang là một form. */
'use strict';
let loginFails = 0, rsT = 0;
function resendTimer(n) {
  const b = $('#vfResend'); clearInterval(rsT); b.disabled = true;
  const tick = () => { b.textContent = n > 0 ? `Gửi lại sau ${n}s` : 'Gửi lại thư'; if (n-- <= 0) { b.disabled = false; clearInterval(rsT); } };
  tick(); rsT = setInterval(tick, 1000);
}
function doLogin(f) {
  const em = $('#liEmail').value.trim(), pw = $('#liPw').value; $('#loginAlert').hidden = true;
  const ok = [fieldErr('liEmail', !em ? 'Nhập email của bạn' : !EMAIL_RE.test(em) ? 'Email chưa đúng định dạng, ví dụ ban@email.com' : ''), fieldErr('liPw', !pw ? 'Nhập mật khẩu' : '')].every(Boolean);
  if (!ok) { $('.field.bad input', f).focus(); return; }
  const btn = $('button[type=submit]', f); busy(btn, 'Đang đăng nhập…');
  setTimeout(() => {
    unbusy(btn);
    if (pw.length < 6) { // không nói rõ sai email hay sai mật khẩu để tránh dò tài khoản
      loginFails++; const left = 5 - loginFails, al = $('#loginAlert'); al.hidden = false;
      al.innerHTML = `${icon('warning-circle', 1)}<span>${left > 0 ? `Email hoặc mật khẩu chưa đúng. Còn ${left} lần thử trước khi tạm khoá 15 phút.` : 'Bạn đã nhập sai 5 lần nên đăng nhập bị tạm khoá 15 phút.'} <button type="button" class="link" data-go="forgot">Đặt lại mật khẩu</button></span>`;
      $('#liPw').value = ''; $('#liPw').focus(); return;
    }
    loginFails = 0; ME.email = em; saveMe(); flash(`Chào mừng trở lại, ${ME.name}`, 'hand-waving'); go('today');
  }, 800);
}
function doRegister(f) {
  const u = $('#rgUser').value.trim().toLowerCase(), em = $('#rgEmail').value.trim(), pw = $('#rgPw').value;
  const ok = [
    fieldErr('rgUser', !u ? 'Chọn một tên người dùng' : !USER_RE.test(u) ? 'Chỉ dùng chữ thường không dấu, số hoặc dấu gạch dưới, 3–20 ký tự' : TAKEN.includes(u) ? 'Tên này đã có người dùng' : ''),
    fieldErr('rgEmail', !em ? 'Nhập email của bạn' : !EMAIL_RE.test(em) ? 'Email chưa đúng định dạng, ví dụ ban@email.com' : ''),
    fieldErr('rgPw', !pw ? 'Tạo mật khẩu cho tài khoản' : !pwValid(pw) ? 'Cần ít nhất 8 ký tự, có cả chữ và số' : ''),
    fieldErr('rgTerms', !$('#rgTerms').checked ? 'Bạn cần đồng ý với điều khoản để tạo tài khoản' : ''),
  ].every(Boolean);
  if (!ok) { const b = $('.field.bad input', f); if (b) b.focus(); return; }
  const btn = $('button[type=submit]', f); busy(btn, 'Đang tạo tài khoản…');
  setTimeout(() => { unbusy(btn); Object.assign(ME, { email: em, user: u, name: u }); saveMe(); go('verify'); }, 900);
}
function doForgot(f) {
  const em = $('#fgEmail').value.trim();
  if (!fieldErr('fgEmail', !em ? 'Nhập email bạn dùng để đăng ký' : !EMAIL_RE.test(em) ? 'Email chưa đúng định dạng, ví dụ ban@email.com' : '')) { $('#fgEmail').focus(); return; }
  const btn = $('button[type=submit]', f); busy(btn, 'Đang gửi…');
  setTimeout(() => { unbusy(btn); btn.textContent = 'Gửi lại link'; const ok = $('#forgotOk'); ok.hidden = false; // cùng một câu dù email có tồn tại hay không
    ok.innerHTML = `${icon('check-circle', 1)}<span>Nếu <b>${esc(em)}</b> có tài khoản, link đặt lại mật khẩu sẽ tới trong vài phút và dùng được trong 30 phút. Nhớ xem cả thư mục Spam.</span>`; }, 800);
}

Object.assign(ACT, {
  oauth(b) { busy(b, 'Đang mở Google…'); setTimeout(() => { unbusy(b); flash(`Đã đăng nhập bằng Google · ${ME.email}`, 'check-circle'); go('today'); }, 900); },
  resend() { toast('Đã gửi lại thư xác minh', null, 'envelope-simple'); resendTimer(30); },
  openMail() { toast('Mở hộp thư của bạn (Gmail, Outlook…)', null, 'envelope-open'); },
  afterVerify(b) { flash('Email đã được xác minh (mô phỏng). Chào mừng bạn!', 'hand-waving'); go(b.dataset.to); },
});

document.addEventListener('submit', e => {
  const fn = { fLogin: doLogin, fReg: doRegister, fForgot: doForgot }[e.target.id];
  if (fn) { e.preventDefault(); fn(e.target); }
});
document.addEventListener('input', e => {
  const x = e.target;
  if (x.id === 'rgUser') rgUserCheck(x);
  if (x.id === 'rgPw') pwMeter(x, 'rgPwMeter');
});

(function boot() {
  const v = Shell.page;
  $$(`#a-${v} .field`).forEach(f => f.classList.remove('bad'));
  if (v === 'login' && sess.get('prefill', 0)) { sess.del('prefill'); $('#liEmail').value = ME.email; }
  if (v === 'verify') { $('#vfEmail').textContent = ME.email; resendTimer(30); }
})();
