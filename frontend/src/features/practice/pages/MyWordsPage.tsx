import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buttonClasses } from "@/components/common/buttonStyles";
import Icon from "@/components/common/Icon";
import LoopiSay from "@/components/common/LoopiSay";
import type { MascotMood } from "@/components/common/Mascot";
import SegmentedControl from "@/components/common/SegmentedControl";
import { useSavedWords } from "@/features/vocab";
import NotesTab from "../components/NotesTab";
import ReviewTab from "../components/ReviewTab";
import SavedWordsTab from "../components/SavedWordsTab";
import { useNoteEntries, useReviewEntries } from "../hooks";

const TABS = ["words", "review", "notes"] as const;
type Tab = (typeof TABS)[number];
const DEFAULT_TAB: Tab = "words";

const isTab = (value: string | null): value is Tab => TABS.includes(value as Tab);

/** Trang `/student/mywords` (Từ & câu đã lưu): Từ đã lưu (mặc định), Câu cần ôn, Ghi chú (UC-HT-07). */
export default function MyWordsPage() {
  const { t } = useTranslation("mywords");
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const tab: Tab = isTab(requested) ? requested : DEFAULT_TAB;
  const words = useSavedWords();
  const review = useReviewEntries();
  const notes = useNoteEntries();

  const dueWordsCount = (words.data ?? []).filter((w) => w.due).length;
  const reviewCount = review.data?.length ?? 0;

  const counts: Record<Tab, number | null> = {
    words: words.data?.length ?? null,
    review: review.data?.length ?? null,
    notes: notes.data?.length ?? null,
  };

  const headerInfo = (): { mood: MascotMood; say: string; ctaTo?: string; ctaLabel?: string; ctaIcon?: string } => {
    if (tab === "review") {
      if (reviewCount > 0) {
        return {
          mood: "listening",
          say: t("header.sayReviewSentences", { count: reviewCount }),
          ctaTo: "/student/review/sentences",
          ctaLabel: t("header.ctaReviewSentences"),
          ctaIcon: "play",
        };
      }
      return { mood: "celebrate", say: t("review.emptyDesc") };
    }
    if (tab === "notes") {
      return { mood: "hello", say: t("header.sayNotes") };
    }
    if (dueWordsCount > 0) {
      return {
        mood: "correct",
        say: t("header.sayDueWords", { count: dueWordsCount }),
        ctaTo: "/student/review/daily",
        ctaLabel: t("header.ctaReviewWords"),
        ctaIcon: "flame",
      };
    }
    return { mood: "celebrate", say: t("header.sayAllWordsClear") };
  };

  const info = headerInfo();

  return (
    <section className="w-full" id="v-mywords">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:flex-nowrap">
        <div className="min-w-0 lg:flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-fn-vocab">
            <Icon name="bookmark" className="h-3.5 w-3.5" />
            {t("overline")}
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{t("title")}</h1>
          <p className="mt-1 text-text-muted">{t("subtitle")}</p>
        </div>

        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-3">
          <LoopiSay mood={info.mood} text={info.say} />
          {info.ctaTo && info.ctaLabel && (
            <Link to={info.ctaTo} className={buttonClasses({ variant: "primary", size: "sm" })}>
              {info.ctaIcon && <Icon name={info.ctaIcon} className="h-4 w-4" />}
              {info.ctaLabel}
            </Link>
          )}
        </div>
      </header>

      <SegmentedControl
        className="mb-5"
        ariaLabel={t("tabs.label")}
        value={tab}
        onChange={(value) => setParams(value === DEFAULT_TAB ? {} : { tab: value }, { replace: true })}
        options={TABS.map((value) => ({
          value,
          label: counts[value] === null ? t(`tabs.${value}`) : `${t(`tabs.${value}`)} (${counts[value]})`,
        }))}
      />
      {tab === "words" ? <SavedWordsTab /> : tab === "review" ? <ReviewTab /> : <NotesTab />}
    </section>
  );
}
