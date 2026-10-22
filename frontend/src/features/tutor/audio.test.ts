import { describe, expect, it } from "vitest";
import { base64ToInt16, int16ToBase64 } from "./audio";

describe("base64 của PCM", () => {
  it("đi và về giữ nguyên mẫu, kể cả khối lớn hơn một bước mã hoá", () => {
    const pcm = new Int16Array(40_000).map((_, i) => ((i * 37) % 65536) - 32768);
    expect(Array.from(base64ToInt16(int16ToBase64(pcm)))).toEqual(Array.from(pcm));
  });

  it("chuỗi rỗng cho mảng rỗng", () => {
    expect(base64ToInt16("")).toHaveLength(0);
  });
});
