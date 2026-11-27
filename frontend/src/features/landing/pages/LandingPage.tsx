import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import { buttonClasses } from "@/components/common/buttonStyles";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import { homePathFor, useAuth } from "@/features/auth";
import DailyGoalSimulator from "../components/DailyGoalSimulator";
import FeatureBento from "../components/FeatureBento";
import HeroPreview from "../components/HeroPreview";
import LessonMarquee from "../components/LessonMarquee";
import Reveal from "../components/Reveal";
import SpotlightCard from "../components/SpotlightCard";

const STAT_KEYS = ["lessons", "sentences", "phonemes", "dictionary", "decks"] as const;

const LOOP_STEPS = [
  { key: "dictation", icon: "headphones", tone: "bg-fn-dictation-soft text-fn-dictation border-fn-dictation/25" },
  { key: "shadowing", icon: "mic", tone: "bg-fn-shadowing-soft text-fn-shadowing border-fn-shadowing/25" },
  { key: "tutor", icon: "bot", tone: "bg-primary-soft text-primary-text border-primary/25" },
  { key: "review", icon: "layers", tone: "bg-fn-vocab-soft text-fn-vocab border-fn-vocab/25" },
] as const;

const TRUST_ITEMS = [
  { key: "voice", icon: "shield-check", tone: "bg-fn-watch-soft text-fn-watch" },
  { key: "deterministic", icon: "target", tone: "bg-fn-dictation-soft text-fn-dictation" },
  { key: "credit", icon: "zap", tone: "bg-fn-vocab-soft text-fn-vocab" },
] as const;

/** Trang giới thiệu công khai của LinguaLoop tại `/`. */
export default function LandingPage() {
  const { t } = useTranslation("landing");
  const { isAuthenticated, user } = useAuth();
  const { hash } = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Khi người dùng bấm link từ trang khác tới `/#faq` hoặc `/#privacy`, cuộn đúng tới mục tương ứng.
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash]);

  const authedHome = user ? homePathFor(user) : "/student";
  const primaryHref = isAuthenticated ? authedHome : "/auth/register";
  // Học viên mở thẳng bài vừa bấm; khách được mời đăng ký trước
  const lessonHref = (lessonId: string) =>
    isAuthenticated && user?.role === "student" ? `/student/lessons/${lessonId}` : primaryHref;
  const proHref = isAuthenticated
    ? user?.role === "student"
      ? "/student/subscription?choose=1"
      : authedHome
    : "/auth/register";

  const freeItems = t("pricing.free.items", { returnObjects: true }) as string[];
  const proItems = t("pricing.pro.items", { returnObjects: true }) as string[];
  const faqItems = t("faq.items", { returnObjects: true }) as { q: string; a: string }[];

  return (
    <div data-landing className="flex flex-col">
      {/* 1. HERO (tối ưu chiều cao cho điện thoại và giữ đúng 1 mascot hiển thị trên mỗi kích thước màn hình) */}
      <section className="relative overflow-x-clip px-4 pb-12 pt-7 sm:px-6 sm:pb-18 sm:pt-14 lg:pb-22 lg:pt-18">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-14">
          <div className="flex flex-col items-start">
            {/* Lời chào nhỏ kèm Loopi chỉ hiển thị trên mobile */}
            <div className="mb-3 flex items-center gap-2.5 rounded-full border border-primary/25 bg-primary-soft/80 py-1 pl-1.5 pr-3.5 sm:hidden">
              <Mascot mood="hello" size={38} alt={t("hero.loopiAlt")} className="shrink-0" />
              <span className="text-xs font-semibold text-primary-text">{t("hero.mobileGreeting")}</span>
            </div>

            <span className="hidden items-center gap-2 rounded-full border border-primary/30 bg-primary-soft px-3.5 py-1 text-xs font-semibold text-primary-text sm:inline-flex">
              <Icon name="sparkles" className="text-sm" />
              {t("hero.badge")}
            </span>

            <h1 className="mt-2 font-display text-[32px] font-bold leading-[1.12] tracking-[-0.025em] text-text sm:mt-5 sm:text-[46px] lg:text-[52px]">
              {t("hero.titleBefore")}
              <span className="bg-[linear-gradient(110deg,var(--ll-s1),var(--ll-s2),var(--ll-s3))] bg-clip-text text-transparent">
                {t("hero.titleHighlight")}
              </span>
              {t("hero.titleAfter")}
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-text-muted sm:mt-5 sm:text-[17px]">
              {t("hero.subtitle")}
            </p>

            <div className="mt-6 flex w-full flex-col gap-2.5 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <Link to={primaryHref} className={buttonClasses({ variant: "primary", size: "lg" })}>
                <Icon name="sparkles" />
                {isAuthenticated ? t("hero.ctaContinue") : t("hero.ctaStart")}
              </Link>
              <a href="#loop" className={buttonClasses({ variant: "secondary", size: "lg" })}>
                <Icon name="circle-play" />
                {t("hero.ctaHowItWorks")}
              </a>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-text-muted sm:mt-7">
              <li className="inline-flex items-center gap-1.5">
                <Icon name="circle-check" className="text-success" />
                {t("hero.trust.noCard")}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Icon name="circle-check" className="text-success" />
                {t("hero.trust.responsive")}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Icon name="circle-check" className="text-success" />
                {t("hero.trust.aiTrial")}
              </li>
            </ul>
          </div>

          <HeroPreview />
        </div>
      </section>

      {/* 2. DẢI SỐ LIỆU TỐI GIẢN (không viền từng thẻ để màn hình thoáng hơn) */}
      <section aria-label={t("stats.ariaLabel")} className="border-y border-border bg-bg-elevated/60 px-4 py-7 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-border">
          {STAT_KEYS.map((key) => (
            <div key={key} className="px-2 sm:px-5 lg:first:pl-0 lg:last:pr-0">
              <div className="font-display text-2xl font-bold tracking-[-0.02em] text-primary-text sm:text-3xl">
                {t(`stats.items.${key}.value`)}
              </div>
              <div className="mt-1 text-sm font-semibold text-text">{t(`stats.items.${key}.label`)}</div>
              <div className="mt-0.5 text-xs text-text-muted">{t(`stats.items.${key}.detail`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 2B. DẢI BÀI HỌC CHUYỂN ĐỘNG 2 HÀNG NGƯỢC CHIỀU */}
      <LessonMarquee lessonHref={lessonHref} />

      {/* 3. VÒNG LẶP 4 BƯỚC CÓ MŨI TÊN KẾT NỐI + MÔ PHỎNG ĐỊNH MỨC ÔN NGÀY */}
      <section id="loop" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-text">
              {t("loop.eyebrow")}
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-text sm:text-4xl">
              {t("loop.title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-text-muted">{t("loop.subtitle")}</p>
          </div>

          {/* 4 bước có đường nối trực quan trên desktop */}
          <div className="relative mt-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-[12%] right-[12%] top-11 hidden border-t-2 border-dashed border-border-strong lg:block"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {LOOP_STEPS.map((item, index) => (
                <article
                  key={item.key}
                  className="relative flex flex-col rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong"
                >
                  {index < LOOP_STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-4 top-8 z-10 hidden h-7 w-7 place-items-center rounded-full border border-border-strong bg-bg-elevated text-xs text-primary-text lg:grid"
                    >
                      <Icon name="arrow-right" />
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`grid h-11 w-11 place-items-center rounded-md border text-xl ${item.tone}`}>
                      <Icon name={item.icon} />
                    </span>
                    <span className="font-mono text-xs font-semibold text-text-subtle">
                      {t(`loop.steps.${item.key}.step`)}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold text-text">
                    {t(`loop.steps.${item.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {t(`loop.steps.${item.key}.desc`)}
                  </p>
                </article>
              ))}
            </div>

            {/* Chỉ dẫn quay vòng lại Bước 01 */}
            <div className="mt-5 flex items-center justify-center gap-2 rounded-full border border-dashed border-primary/35 bg-primary-soft/50 px-4 py-2 text-center text-xs font-medium text-primary-text sm:mx-auto sm:w-fit sm:text-[13px]">
              <Icon name="refresh-cw" className="text-sm" />
              <span>{t("loop.returnCycle")}</span>
            </div>
          </div>

          <DailyGoalSimulator />
        </Reveal>
      </section>

      {/* 4. BENTO GRID TÍNH NĂNG NỔI BẬT */}
      <section id="features" className="scroll-mt-20 border-t border-border bg-bg-elevated/40 px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-text">
              {t("features.eyebrow")}
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-text sm:text-4xl">
              {t("features.title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-text-muted">{t("features.subtitle")}</p>
          </div>

          <FeatureBento />
        </Reveal>
      </section>

      {/* 5. MINH BẠCH AI & QUYỀN RIÊNG TƯ GIỌNG NÓI */}
      <section id="privacy" className="scroll-mt-20 border-t border-border px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-text">
              {t("trust.eyebrow")}
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-text sm:text-4xl">
              {t("trust.title")}
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3 md:divide-x md:divide-border">
            {TRUST_ITEMS.map((item) => (
              <div key={item.key} className="flex flex-col items-start md:px-6 md:first:pl-0 md:last:pr-0">
                <span className={`grid h-11 w-11 place-items-center rounded-md text-xl ${item.tone}`}>
                  <Icon name={item.icon} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-text">{t(`trust.items.${item.key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{t(`trust.items.${item.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* 6. SO SÁNH GÓI MIỄN PHÍ & PRO */}
      <section id="pricing" className="scroll-mt-20 border-t border-border bg-bg-elevated/40 px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-text">
              {t("pricing.eyebrow")}
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-text sm:text-4xl">
              {t("pricing.title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-text-muted">{t("pricing.subtitle")}</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Gói Miễn phí */}
            <SpotlightCard
              glowColor="var(--primary)"
              className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-2xl font-bold text-text">{t("pricing.free.name")}</h3>
                  <Badge>{t("pricing.free.tag")}</Badge>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold text-text">{t("pricing.free.price")}</span>
                  <span className="text-sm text-text-muted">/ {t("pricing.free.period")}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">{t("pricing.free.desc")}</p>

                <ul className="mt-6 flex flex-col gap-3 border-t border-border pt-6 text-sm text-text">
                  {freeItems.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Icon name="check" className="mt-0.5 text-base text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-2">
                <Link to={primaryHref} className={buttonClasses({ variant: "secondary", fullWidth: true })}>
                  {isAuthenticated ? t("pricing.free.ctaAuthed") : t("pricing.free.cta")}
                </Link>
              </div>
            </SpotlightCard>

            {/* Gói Pro */}
            <SpotlightCard
              glowColor="var(--warning)"
              className="rounded-xl border border-warning/40 bg-[linear-gradient(155deg,var(--surface),color-mix(in_srgb,var(--warning)_8%,var(--surface)))] p-6 shadow-[var(--shadow-card)] sm:p-8"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-2xl font-bold text-text">{t("pricing.pro.name")}</h3>
                  <Badge variant="pro">
                    <Icon name="crown" />
                    {t("pricing.pro.tag")}
                  </Badge>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-text">{t("pricing.pro.price")}</span>
                  <span className="text-sm text-text-muted">· {t("pricing.pro.period")}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">{t("pricing.pro.desc")}</p>

                <ul className="mt-6 flex flex-col gap-3 border-t border-border pt-6 text-sm text-text">
                  {proItems.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Icon name="circle-check" className="mt-0.5 text-base text-warning" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-2">
                <Link to={proHref} className={buttonClasses({ variant: "primary", fullWidth: true })}>
                  <Icon name="crown" />
                  {isAuthenticated ? t("pricing.pro.ctaAuthed") : t("pricing.pro.cta")}
                </Link>
              </div>
            </SpotlightCard>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-text-muted">
            <Icon name="credit-card" className="text-sm text-primary-text" />
            <span>{t("pricing.paymentNote")}</span>
          </p>
        </Reveal>
      </section>

      {/* 7. CÂU HỎI THƯỜNG GẶP */}
      <section id="faq" className="scroll-mt-20 border-t border-border px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-text">
              {t("faq.eyebrow")}
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-text sm:text-4xl">
              {t("faq.title")}
            </h2>
          </div>

          <div className="mt-10 flex flex-col gap-3">
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${idx}`}
                    id={`faq-trigger-${idx}`}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-text"
                  >
                    <span>{item.q}</span>
                    <Icon
                      name="chevron-down"
                      className={`text-lg text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180 text-primary-text" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div
                      id={`faq-panel-${idx}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${idx}`}
                      className="border-t border-border px-5 py-4 text-sm leading-relaxed text-text-muted"
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* 8. FINAL CTA */}
      <section className="px-4 pb-12 pt-4 sm:px-6 sm:pb-16">
        <Reveal className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-primary/30 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_16%,var(--surface)),var(--surface)_55%,color-mix(in_srgb,var(--accent-2)_14%,var(--surface)))] p-8 text-center shadow-[var(--shadow-card)] sm:p-12">
          <h2 className="font-display text-2xl font-bold text-text sm:text-4xl">{t("finalCta.title")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
            {t("finalCta.subtitle")}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to={primaryHref} className={buttonClasses({ variant: "primary", size: "lg" })}>
              <Icon name="sparkles" />
              {isAuthenticated ? t("finalCta.primaryAuthed") : t("finalCta.primaryGuest")}
            </Link>
            {!isAuthenticated && (
              <Link to="/auth/login" className={buttonClasses({ variant: "secondary", size: "lg" })}>
                {t("finalCta.secondaryGuest")}
              </Link>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  );
}
