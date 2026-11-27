import { describe, expect, it, vi } from "vitest";
import { publicAxios } from "@/api/axiosClient";
import { fetchShowcase, formatDuration } from "./api";

vi.mock("@/api/axiosClient", () => ({ publicAxios: { get: vi.fn() }, axiosClient: { get: vi.fn() } }));

describe("bài học giới thiệu trên trang chủ (AC-TC-44)", () => {
  it("gọi API công khai không kèm token và trả phần data", async () => {
    const showcase = { lessons: [], topics: ["Travel"] };
    vi.mocked(publicAxios.get).mockResolvedValueOnce({ data: { data: showcase } });

    await expect(fetchShowcase()).resolves.toEqual(showcase);
    expect(publicAxios.get).toHaveBeenCalledWith("/public/lessons/showcase");
  });

  it("định dạng thời lượng mm:ss", () => {
    expect(formatDuration(125)).toBe("02:05");
    expect(formatDuration(59.6)).toBe("01:00");
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(-3)).toBe("00:00");
  });
});
