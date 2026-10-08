import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import viCommon from "./locales/vi/common.json";
import viAuth from "./locales/vi/auth.json";
import viLayout from "./locales/vi/layout.json";
import viPages from "./locales/vi/pages.json";
import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enLayout from "./locales/en/layout.json";
import enPages from "./locales/en/pages.json";

export const SUPPORTED_LANGUAGES = ["vi", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "vi";
export const LANGUAGE_STORAGE_KEY = "ll-lang";

export function isLanguage(value: unknown): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

/** Ngôn ngữ đã chọn lần trước (localStorage), không có thì dùng mặc định. */
function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // localStorage bị chặn: dùng mặc định
  }
  return DEFAULT_LANGUAGE;
}

/** Đổi ngôn ngữ giao diện và nhớ lựa chọn. */
export function setLanguage(language: Language): Promise<unknown> {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // không lưu được thì chỉ mất lựa chọn ở lần mở sau
  }
  return i18n.changeLanguage(language);
}

void i18n.use(initReactI18next).init({
  resources: {
    vi: { common: viCommon, auth: viAuth, layout: viLayout, pages: viPages },
    en: { common: enCommon, auth: enAuth, layout: enLayout, pages: enPages },
  },
  lng: readStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  defaultNS: "common",
  ns: ["common", "auth", "layout", "pages"],
  interpolation: { escapeValue: false }, // React đã escape
  returnNull: false,
});

// Giữ <html lang> khớp ngôn ngữ đang dùng (đọc màn hình, dịch tự động của trình duyệt)
const syncHtmlLang = (language: string) => {
  document.documentElement.lang = language;
};
syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

export default i18n;
