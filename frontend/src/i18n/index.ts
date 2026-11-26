import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import viCommon from "./locales/vi/common.json";
import viAuth from "./locales/vi/auth.json";
import viLayout from "./locales/vi/layout.json";
import viPages from "./locales/vi/pages.json";
import viDictation from "./locales/vi/dictation.json";
import viMywords from "./locales/vi/mywords.json";
import viPractice from "./locales/vi/practice.json";
import viDictionary from "./locales/vi/dictionary.json";
import viVocab from "./locales/vi/vocab.json";
import viReport from "./locales/vi/report.json";
import viAichat from "./locales/vi/aichat.json";
import viLessonManage from "./locales/vi/lessonManage.json";
import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enLayout from "./locales/en/layout.json";
import enPages from "./locales/en/pages.json";
import enDictation from "./locales/en/dictation.json";
import enMywords from "./locales/en/mywords.json";
import enPractice from "./locales/en/practice.json";
import enDictionary from "./locales/en/dictionary.json";
import enVocab from "./locales/en/vocab.json";
import viWatch from "./locales/vi/watch.json";
import viSaved from "./locales/vi/saved.json";
import enSaved from "./locales/en/saved.json";
import enWatch from "./locales/en/watch.json";
import viReview from "./locales/vi/review.json";
import enReview from "./locales/en/review.json";
import viStats from "./locales/vi/stats.json";
import enStats from "./locales/en/stats.json";
import enReport from "./locales/en/report.json";
import enAichat from "./locales/en/aichat.json";
import enLessonManage from "./locales/en/lessonManage.json";
import viUserAdmin from "./locales/vi/userAdmin.json";
import enUserAdmin from "./locales/en/userAdmin.json";
import viCreditAdmin from "./locales/vi/creditAdmin.json";
import enCreditAdmin from "./locales/en/creditAdmin.json";
import viAuditAdmin from "./locales/vi/auditAdmin.json";
import enAuditAdmin from "./locales/en/auditAdmin.json";
import viStatsAdmin from "./locales/vi/statsAdmin.json";
import enStatsAdmin from "./locales/en/statsAdmin.json";
import viSubscription from "./locales/vi/subscription.json";
import enSubscription from "./locales/en/subscription.json";

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
    vi: { common: viCommon, auth: viAuth, layout: viLayout, pages: viPages, dictation: viDictation, mywords: viMywords, practice: viPractice, dictionary: viDictionary, vocab: viVocab, review: viReview, report: viReport, watch: viWatch, saved: viSaved, aichat: viAichat, lessonManage: viLessonManage, userAdmin: viUserAdmin, creditAdmin: viCreditAdmin, stats: viStats, auditAdmin: viAuditAdmin, statsAdmin: viStatsAdmin, subscription: viSubscription },
    en: { common: enCommon, auth: enAuth, layout: enLayout, pages: enPages, dictation: enDictation, mywords: enMywords, practice: enPractice, dictionary: enDictionary, vocab: enVocab, review: enReview, report: enReport, watch: enWatch, saved: enSaved, aichat: enAichat, lessonManage: enLessonManage, userAdmin: enUserAdmin, creditAdmin: enCreditAdmin, stats: enStats, auditAdmin: enAuditAdmin, statsAdmin: enStatsAdmin, subscription: enSubscription },
  },
  lng: readStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  defaultNS: "common",
  ns: ["common", "auth", "layout", "pages", "dictation", "mywords", "dictionary", "practice", "vocab", "review", "watch", "saved", "lessonManage", "userAdmin", "aichat", "creditAdmin", "stats", "auditAdmin", "statsAdmin", "subscription"],
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
