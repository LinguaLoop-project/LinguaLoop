import { beforeEach, describe, expect, it, vi } from "vitest";
import { statsApi } from "./api";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/api/axiosClient", () => ({ axiosClient: { get } }));

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: { data: { ok: true } } });
});

describe("statsApi", () => {
  it("lấy tổng quan theo khoảng và bóc lớp ApiResponse (AC-TH-03)", async () => {
    await expect(statsApi.getOverview("7d")).resolves.toEqual({ ok: true });
    expect(get).toHaveBeenCalledWith("/stats/overview", expect.objectContaining({ params: { range: "7d" } }));
  });

  it("chuỗi ngày học không cần tham số (AC-TH-02)", async () => {
    await statsApi.getStreak();
    expect(get.mock.calls[0][0]).toBe("/stats/streak");
  });

  it("lịch sử gửi chế độ, khoảng và trang từ 0 (AC-TH-09, AC-TH-10)", async () => {
    await statsApi.getHistory("shadowing", "all", 2);
    expect(get).toHaveBeenCalledWith(
      "/stats/history",
      expect.objectContaining({ params: { mode: "shadowing", range: "all", page: 2 } }),
    );
  });

  it("các lượt của Buổi luyện đi theo bài, chế độ và ngày (AC-TH-24)", async () => {
    await statsApi.getPracticeSession("lesson-1", "dictation", "2026-11-22");
    expect(get).toHaveBeenCalledWith(
      "/stats/history/practice-sessions/lesson-1",
      expect.objectContaining({ params: { mode: "dictation", day: "2026-11-22" } }),
    );
  });

  it("ký hiệu âm vị đi qua query để giữ nguyên ký tự IPA (AC-TH-16)", async () => {
    await statsApi.getPhoneme("θ", "30d");
    expect(get).toHaveBeenCalledWith(
      "/stats/pronunciation/phoneme",
      expect.objectContaining({ params: { symbol: "θ", range: "30d" } }),
    );
  });

  it("lỗi mạng được ném lên để giao diện báo kèm nút Thử lại (AC-TH-07)", async () => {
    get.mockRejectedValue(new Error("Network Error"));
    await expect(statsApi.getDictationErrors("30d")).rejects.toThrow("Network Error");
  });
});
