import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Giao diện của khách và của học viên (AC-TK-70): đăng xuất không được xoá lựa chọn đã lưu trên trình duyệt. */
describe("giao diện khi đăng xuất và đăng nhập lại (AC-TK-70)", () => {
  let store: Map<string, string>;
  let dataset: Record<string, string>;

  beforeEach(() => {
    vi.resetModules();
    store = new Map([
      ["ll3-theme", JSON.stringify("light")],
      ["ll.appearance", JSON.stringify({ accent: "pink", sentenceSize: "lg", learnBackground: "paper" })],
    ]);
    dataset = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    });
    vi.stubGlobal("document", { documentElement: { dataset } });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false, addEventListener: () => undefined }) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("khách thấy mặc định Tím Vũ Trụ, đăng nhập lại thì về đúng lựa chọn cũ", async () => {
    const theme = await import("./useTheme");
    const appearance = await import("./useAppearance");
    expect(dataset.theme).toBe("light");
    expect(dataset.accent).toBe("pink");

    theme.showDefaultTheme();
    appearance.showDefaultAppearance();
    expect(dataset.theme).toBe("dark");
    expect(dataset.accent).toBe("violet");
    expect(dataset.learnBg).toBe("aurora");
    // Lựa chọn đã lưu không bị xoá
    expect(store.get("ll3-theme")).toBe(JSON.stringify("light"));
    expect(JSON.parse(store.get("ll.appearance")!).accent).toBe("pink");

    theme.restoreStoredTheme();
    appearance.restoreStoredAppearance();
    expect(dataset.theme).toBe("light");
    expect(dataset.accent).toBe("pink");
    expect(dataset.learnBg).toBe("paper");
  });

  it("khách bấm đổi sáng/tối chỉ có hiệu lực trong phiên, không ghi đè lựa chọn của học viên", async () => {
    const theme = await import("./useTheme");
    theme.showDefaultTheme();

    theme.setTheme("dark");
    expect(dataset.theme).toBe("dark");
    expect(store.get("ll3-theme")).toBe(JSON.stringify("light"));

    theme.restoreStoredTheme();
    theme.setTheme("dark");
    expect(store.get("ll3-theme")).toBe(JSON.stringify("dark"));
  });

  it("Khôi phục mặc định trong Cài đặt thì xoá lựa chọn đã lưu", async () => {
    const theme = await import("./useTheme");
    const appearance = await import("./useAppearance");

    theme.resetTheme();
    appearance.resetAppearance();

    expect(store.has("ll3-theme")).toBe(false);
    expect(store.has("ll.appearance")).toBe(false);
    expect(dataset.theme).toBe("dark");
  });
});
