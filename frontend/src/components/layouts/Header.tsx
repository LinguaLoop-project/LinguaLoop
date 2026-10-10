import { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DEFAULT_LANGUAGE, isLanguage, setLanguage, type Language } from "@/i18n";
import Logo from "@/components/common/Logo";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import ThemeToggle from "@/components/common/ThemeToggle";
import {
  ChevronDown,
  Menu,
  X,
  Headphones,
  Mic,
  BookOpen,
  MessageSquare,
  Award,
  Sparkles,
  Layers,
  GraduationCap,
  TrendingUp,
  LogIn,
} from "lucide-react";

export default function Header() {
  const { t, i18n } = useTranslation("layout");
  const lang: Language = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE;
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--bg-base)]/90 backdrop-blur-md shadow-md border-b border-[var(--border)] supports-[backdrop-filter]:bg-[var(--bg-base)]/75 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Logo */}
        <Link
          to="/"
          className="flex items-center shrink-0 group py-1 mr-4 lg:mr-8"
          aria-label={t("header.homeLabel")}
        >
          <Logo size={34} showText={true} />
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav
          className="hidden lg:flex items-center gap-1 xl:gap-2 mr-auto"
          aria-label={t("header.mainMenu")}
        >
          {/* Listening */}
          <div className="relative">
            <NavLink
              to="/dictation"
              className={({ isActive }) =>
                `flex relative items-center gap-2 text-sm font-medium transition-all py-1.5 px-3 h-10 rounded-lg ${
                  isActive
                    ? "bg-[var(--surface-hover)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-white"
                }`
              }
            >
              <Headphones className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{t("header.nav.listening")}</span>
            </NavLink>
          </div>

          {/* Pronunciation */}
          <div className="relative">
            <NavLink
              to="/shadowing"
              className={({ isActive }) =>
                `flex relative items-center gap-2 text-sm font-medium transition-all py-1.5 px-3 h-10 rounded-lg ${
                  isActive
                    ? "bg-[var(--surface-hover)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-white"
                }`
              }
            >
              <Mic className="w-4 h-4 text-pink-400 shrink-0" />
              <span>{t("header.nav.pronunciation")}</span>
            </NavLink>
          </div>

          {/* Vocabulary */}
          <div className="relative">
            <NavLink
              to="/vocabulary"
              className={({ isActive }) =>
                `flex relative items-center gap-2 text-sm font-medium transition-all py-1.5 px-3 h-10 rounded-lg ${
                  isActive
                    ? "bg-[var(--surface-hover)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-white"
                }`
              }
            >
              <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t("header.nav.vocabulary")}</span>
            </NavLink>
          </div>

          {/* Speaking */}
          {/* <div className="relative">
              <NavLink
                to="/practice-english-speaking"
                className={({ isActive }) =>
                  `flex relative items-center gap-2 text-sm font-medium transition-all py-1.5 px-3 h-10 rounded-lg ${
                    isActive
                      ? "bg-[var(--surface-hover)] text-white shadow-sm"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-white"
                  }`
                }
              >
                <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Speaking</span>
              </NavLink>
            </div> */}

          {/* IELTS Exams with NEW Badge */}
          {/* <div className="relative">
              <NavLink
                to="/exams/ielts"
                className={({ isActive }) =>
                  `flex relative items-center gap-2 text-sm font-medium transition-all py-1.5 px-3 h-10 rounded-lg pr-9 ${
                    isActive
                      ? "bg-[var(--surface-hover)] text-white shadow-sm"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-white"
                  }`
                }
              >
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>IELTS Exams</span>
                <span className="inline-flex absolute top-1.5 right-1.5 items-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white shadow-sm animate-pulse tracking-wide">
                  NEW
                </span>
              </NavLink>
            </div> */}

          {/* More Dropdown */}
          <div className="relative" ref={moreDropdownRef}>
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`relative flex items-center gap-1 text-sm font-medium transition-colors py-1.5 px-3 h-10 rounded-lg ${
                isMoreOpen
                  ? "bg-[var(--surface-hover)] text-white"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-white"
              }`}
              aria-haspopup="menu"
              aria-expanded={isMoreOpen}
            >
              <span>{t("header.nav.more")}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${isMoreOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isMoreOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl bg-[var(--surface)] border border-[var(--border-strong)] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  to="/lessons"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">{t("header.more.lessons.title")}</div>
                    <div className="text-xs text-[var(--text-subtle)]">
                      {t("header.more.lessons.desc")}
                    </div>
                  </div>
                </Link>

                <Link
                  to="/weakness"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">{t("header.more.weakness.title")}</div>
                    <div className="text-xs text-[var(--text-subtle)]">
                      {t("header.more.weakness.desc")}
                    </div>
                  </div>
                </Link>

                <Link
                  to="/test"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">{t("header.more.test.title")}</div>
                    <div className="text-xs text-[var(--text-subtle)]">
                      {t("header.more.test.desc")}
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Side Actions: Streak, Theme Toggle, Language, Login */}
        <div className="hidden lg:flex items-center space-x-2.5 shrink-0">
          <nav className="flex items-center space-x-2">
            {/* Streak Counter Pill */}
            {/* <div
              className="flex items-center gap-1.5 h-9 px-3 bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-full text-xs font-semibold text-[var(--warning)] cursor-pointer transition-colors shadow-sm"
              title="Chuỗi 5 ngày học liên tiếp"
            >
              <Flame className="w-4 h-4 fill-[var(--warning)] text-[var(--warning)] animate-bounce" />
              <span>5 ngày</span>
            </div> */}

            <ThemeToggle />

            <LanguageSwitcher />

            {/* Login / Auth Button */}
            <Link
              to="/auth/login"
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-strong)] hover:bg-[var(--surface-hover)] text-[var(--text)] h-9 px-3.5 py-1.5 text-sm font-medium transition-all"
            >
              <LogIn className="w-4 h-4 text-[var(--text-subtle)]" />
              <span>{t("header.login")}</span>
            </Link>

            {/* Quick Action: Start Learning */}
            <Link
              to="/dictation"
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 text-sm font-semibold rounded-lg text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
              style={{ background: "var(--btn-primary)" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("header.start")}</span>
            </Link>
          </nav>
        </div>

        {/* Mobile Header Controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />

          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface)] transition-colors border border-[var(--border)] size-9 flex items-center justify-center"
            aria-label={t("header.toggleMenu")}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-1">
            <Link
              to="/dictation"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-hover)]"
            >
              <Headphones className="w-4 h-4 text-purple-400" />
              <span>{t("header.nav.listening")}</span>
            </Link>
            <Link
              to="/shadowing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-hover)]"
            >
              <Mic className="w-4 h-4 text-pink-400" />
              <span>{t("header.nav.pronunciation")}</span>
            </Link>
            <Link
              to="/vocabulary"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-hover)]"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>{t("header.nav.vocabulary")}</span>
            </Link>
            <Link
              to="/practice-english-speaking"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-hover)]"
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>{t("header.nav.speaking")}</span>
            </Link>
            <Link
              to="/exams/ielts"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-hover)]"
            >
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>{t("header.nav.ielts")}</span>
              </div>
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white shadow-sm">
                {t("header.badgeNew")}
              </span>
            </Link>

            <div className="pt-2 border-t border-[var(--border)]">
              <Link
                to="/lessons"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              >
                <Layers className="w-4 h-4" />
                <span>{t("header.more.lessons.title")}</span>
              </Link>
              <Link
                to="/weakness"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              >
                <TrendingUp className="w-4 h-4" />
                <span>{t("header.mobileWeakness")}</span>
              </Link>
              <Link
                to="/test"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{t("header.more.test.title")}</span>
              </Link>
            </div>
          </nav>

          {/* Mobile Bottom Options */}
          <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-[var(--text-subtle)] font-medium">
                {t("common:language.display")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void setLanguage("vi")}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    lang === "vi"
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface)]"
                  }`}
                >
                  {t("common:language.names.vi")}
                </button>
                <button
                  type="button"
                  onClick={() => void setLanguage("en")}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    lang === "en"
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface)]"
                  }`}
                >
                  {t("common:language.names.en")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-hover)] text-center"
              >
                <LogIn className="w-4 h-4" />
                <span>{t("header.login")}</span>
              </Link>
              <Link
                to="/dictation"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold text-center text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
                style={{ background: "var(--btn-primary)" }}
              >
                <Sparkles className="w-4 h-4" />
                <span>{t("header.learnNow")}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
