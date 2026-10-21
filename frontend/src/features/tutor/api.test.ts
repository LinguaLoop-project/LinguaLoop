import { AxiosError } from "axios";
import { describe, expect, it, vi } from "vitest";
import { TutorApiError, toTutorError } from "./api";

// axiosClient kéo theo store đăng nhập và i18n (cần document); chỉ cần hàm đổi lỗi nên thay bằng đối tượng rỗng
vi.mock("@/api/axiosClient", () => ({ axiosClient: {} }));

function axiosFailure(status: number, data: unknown): AxiosError {
  return new AxiosError("fail", "ERR_BAD_RESPONSE", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: {} as never,
    data,
  });
}

describe("toTutorError", () => {
  it("đọc mã lỗi, chỉ dẫn cho gia sư và Danh sách từ lỗi trong details", () => {
    const words = [{ word: "things", phoneme: "θ", score: 54, tipVi: "Đặt lưỡi giữa hai hàm răng" }];
    const e = toTutorError(
      axiosFailure(503, { code: "TUTOR_LIVE_UNAVAILABLE", message: "x", details: { words, instruction: "Nhắc đọc lại" } }),
    );
    expect(e).toBeInstanceOf(TutorApiError);
    expect(e.status).toBe(503);
    expect(e.code).toBe("TUTOR_LIVE_UNAVAILABLE");
    expect(e.words).toEqual(words);
    expect(e.instruction).toBe("Nhắc đọc lại");
  });

  it("details thiếu hoặc sai kiểu thì bỏ qua, không văng lỗi", () => {
    const e = toTutorError(axiosFailure(409, { code: "TUTOR_SESSION_CONFLICT", message: "đã kết thúc", details: { words: "x" } }));
    expect(e.code).toBe("TUTOR_SESSION_CONFLICT");
    expect(e.words).toBeUndefined();
    expect(e.instruction).toBeUndefined();
  });

  it("lỗi mạng (không có phản hồi) có status 0", () => {
    const e = toTutorError(new AxiosError("Network Error"));
    expect(e.status).toBe(0);
    expect(e.code).toBe("NETWORK_ERROR");
  });

  it("giữ nguyên TutorApiError đã có", () => {
    const original = new TutorApiError("m", 400, "VALIDATION_FAILED");
    expect(toTutorError(original)).toBe(original);
  });
});
