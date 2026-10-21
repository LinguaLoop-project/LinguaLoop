import { describe, expect, it, vi } from "vitest";
import { parseMode } from "./useTutorMode";

// api kéo theo axiosClient, store đăng nhập và i18n (cần document); parseMode không dùng tới
vi.mock("../api", () => ({}));

describe("parseMode", () => {
  it("chỉ nhận on/off đã lưu, còn lại là chưa trả lời", () => {
    expect(parseMode("on")).toBe("on");
    expect(parseMode("off")).toBe("off");
    expect(parseMode(null)).toBe("ask");
    expect(parseMode("true")).toBe("ask");
  });
});
