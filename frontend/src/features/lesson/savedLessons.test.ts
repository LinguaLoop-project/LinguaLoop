import { describe, expect, it } from "vitest";
import viSaved from "@/i18n/locales/vi/saved.json";
import enSaved from "@/i18n/locales/en/saved.json";
import { nextMode, savedAgo } from "./savedUtils";

describe("nextMode (AC-TC-36)", () => {
  it("gợi ý chế độ làm ít hơn", () => {
    expect(nextMode({ dictationPercent: 80, shadowingPercent: 10 })).toBe("shadowing");
    expect(nextMode({ dictationPercent: 0, shadowingPercent: 40 })).toBe("dictation");
  });

  it("bằng nhau (kể cả chưa học) thì nghe chép", () => {
    expect(nextMode({ dictationPercent: 0, shadowingPercent: 0 })).toBe("dictation");
    expect(nextMode({ dictationPercent: 100, shadowingPercent: 100 })).toBe("dictation");
  });
});

describe("savedAgo", () => {
  const now = new Date("2026-11-19T12:00:00Z");

  it("dưới một phút là vừa xong", () => {
    expect(savedAgo("2026-11-19T11:59:40Z", now, "vi")).toBe("bây giờ");
  });

  it("đổi sang phút, giờ và ngày", () => {
    expect(savedAgo("2026-11-19T11:30:00Z", now, "en")).toBe("30 minutes ago");
    expect(savedAgo("2026-11-19T09:00:00Z", now, "en")).toBe("3 hours ago");
    expect(savedAgo("2026-11-16T12:00:00Z", now, "en")).toBe("3 days ago");
  });
});

function keysOf(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    keysOf(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("saved.json", () => {
  it("tiếng Việt và tiếng Anh có cùng bộ khoá", () => {
    expect(keysOf(viSaved).sort()).toEqual(keysOf(enSaved).sort());
  });
});
