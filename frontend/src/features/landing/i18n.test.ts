import { describe, expect, it } from "vitest";
import en from "@/i18n/locales/en/landing.json";
import vi from "@/i18n/locales/vi/landing.json";

function leafKeys(obj: unknown, prefix = ""): string[] {
  if (Array.isArray(obj)) {
    return obj.flatMap((item, index) => leafKeys(item, `${prefix}[${index}]`));
  }
  if (obj && typeof obj === "object") {
    return Object.entries(obj).flatMap(([k, v]) => leafKeys(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

describe("landing i18n parity", () => {
  it("keeps vi and en landing translation keys in sync", () => {
    expect(leafKeys(vi).sort()).toEqual(leafKeys(en).sort());
  });
});
