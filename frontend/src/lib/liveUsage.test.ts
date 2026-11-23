import { describe, expect, it } from "vitest";
import { LiveUsageMeter } from "./liveUsage";

describe("LiveUsageMeter", () => {
  it("cộng đầu vào (prompt + kết quả tool) và đầu ra (trả lời + suy nghĩ) qua nhiều lần báo", () => {
    const meter = new LiveUsageMeter();
    meter.add({ promptTokenCount: 100, toolUsePromptTokenCount: 10, responseTokenCount: 30, thoughtsTokenCount: 5 });
    meter.add({ promptTokenCount: 200, responseTokenCount: 50 });
    meter.add(undefined);

    expect(meter.take()).toEqual({ inputTokens: 310, outputTokens: 85 });
  });

  it("take đặt lại về 0 để mỗi phiên chỉ báo một lần", () => {
    const meter = new LiveUsageMeter();
    meter.add({ promptTokenCount: 7 });
    meter.take();

    expect(meter.take()).toEqual({ inputTokens: 0, outputTokens: 0 });
  });

  it("bỏ qua số âm, số lẻ và giá trị không hợp lệ", () => {
    const meter = new LiveUsageMeter();
    meter.add({ promptTokenCount: -5, responseTokenCount: Number.NaN, thoughtsTokenCount: 2.9 });

    expect(meter.take()).toEqual({ inputTokens: 0, outputTokens: 2 });
  });
});
