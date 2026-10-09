import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from "./googleConfig";

const STATE_KEY = "ll-google-state";

function randomState(): string {
  return crypto.randomUUID();
}

/**
 * Chuyển sang trang đồng ý của Google. `state` ngẫu nhiên lưu ở sessionStorage để trang /authenticate
 * kiểm tra lại, chặn việc ai đó ép người dùng nạp một `code` do kẻ khác tạo (CSRF đăng nhập).
 */
export function startGoogleLogin(): void {
  const state = randomState();
  try {
    sessionStorage.setItem(STATE_KEY, state);
  } catch {
    // sessionStorage bị chặn: không kiểm tra được state nên không thể đăng nhập an toàn
    return;
  }
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

/** Đọc rồi xoá `state` đã lưu; đúng khi trùng với `state` Google trả về. Chỉ dùng được một lần. */
export function consumeGoogleState(received: string | null): boolean {
  try {
    const expected = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(STATE_KEY);
    return expected !== null && expected === received;
  } catch {
    return false;
  }
}
