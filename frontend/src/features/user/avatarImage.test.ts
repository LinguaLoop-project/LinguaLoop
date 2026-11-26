import { describe, expect, it } from "vitest";
import { AVATAR_MAX_INPUT_BYTES, avatarProblem, squareCrop } from "./avatarImage";

describe("avatarProblem (AC-TK-67)", () => {
  it("nhận JPG, PNG, WebP trong giới hạn dung lượng", () => {
    expect(avatarProblem({ type: "image/jpeg", size: 1_000_000 })).toBeNull();
    expect(avatarProblem({ type: "image/png", size: AVATAR_MAX_INPUT_BYTES })).toBeNull();
    expect(avatarProblem({ type: "image/webp", size: 10 })).toBeNull();
  });

  it("từ chối loại tệp khác và tệp quá nặng", () => {
    expect(avatarProblem({ type: "image/gif", size: 10 })).toBe("type");
    expect(avatarProblem({ type: "application/pdf", size: 10 })).toBe("type");
    expect(avatarProblem({ type: "image/png", size: AVATAR_MAX_INPUT_BYTES + 1 })).toBe("size");
  });
});

describe("squareCrop (AC-TK-66)", () => {
  it("ảnh ngang: cắt phần giữa theo chiều rộng", () => {
    expect(squareCrop(1600, 900)).toEqual({ sx: 350, sy: 0, side: 900 });
  });

  it("ảnh dọc: cắt phần giữa theo chiều cao", () => {
    expect(squareCrop(900, 1600)).toEqual({ sx: 0, sy: 350, side: 900 });
  });

  it("ảnh đã vuông giữ nguyên, kích thước lẻ làm tròn xuống", () => {
    expect(squareCrop(512, 512)).toEqual({ sx: 0, sy: 0, side: 512 });
    expect(squareCrop(101, 50)).toEqual({ sx: 25, sy: 0, side: 50 });
  });
});
