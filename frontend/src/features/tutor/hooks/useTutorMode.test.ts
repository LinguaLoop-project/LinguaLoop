import { describe, expect, it, vi } from "vitest";
import { parseMode, storageKey } from "./useTutorMode";

// api và store đăng nhập kéo theo axiosClient và i18n (cần document); chỉ cần các hàm thuần
vi.mock("../api", () => ({}));
vi.mock("@/features/auth/stores/authStore", () => ({ useAuthStore: () => undefined }));

describe("parseMode", () => {
  it("chỉ nhận on/off đã lưu, còn lại là chưa trả lời", () => {
    expect(parseMode("on")).toBe("on");
    expect(parseMode("off")).toBe("off");
    expect(parseMode(null)).toBe("ask");
    expect(parseMode("true")).toBe("ask");
  });
});

describe("storageKey", () => {
  it("khác nhau theo người dùng và theo bài", () => {
    expect(storageKey("u1", "l1")).not.toBe(storageKey("u2", "l1"));
    expect(storageKey("u1", "l1")).not.toBe(storageKey("u1", "l2"));
  });
});
