import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SegmentedControl from "@/components/common/SegmentedControl";
import Icon from "@/components/common/Icon";
import NotesTab from "../components/NotesTab";
import ReviewTab from "../components/ReviewTab";
import SavedWordsTab from "../components/SavedWordsTab";
import { useNoteEntries, useReviewEntries } from "@/features/practice/hooks";
import { useSavedWords } from "@/features/vocab";

const TABS = ["words", "review", "notes"] as const;
type Tab = (typeof TABS)[number];
const DEFAULT_TAB: Tab = "words";

const isTab = (value: string | null): value is Tab => TABS.includes(value as Tab);

/** Trang `/student/mywords` (Từ & câu đã lưu): Từ đã lưu (mặc định), Câu cần ôn, Ghi chú (UC-VOCAB-02). */
export default function MyWordsPage() {
  const { t } = useTranslation("mywords");
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const tab: Tab = isTab(requested) ? requested : DEFAULT_TAB;
  const words = useSavedWords();
  const review = useReviewEntries();
  const notes = useNoteEntries();
  const counts: Record<Tab, number | null> = {
    words: words.data?.length ?? null,
    review: review.data?.length ?? null,
    notes: notes.data?.length ?? null,
  };

  return (
    <section className="w-full" id="v-mywords">
      <header className="mb-5">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
          <Icon name="bookmark" className="h-4 w-4" />
          {t("overline")}
        </div>
        <h1 className="text-[30px]">{t("title")}</h1>
        <p className="mt-1 text-text-muted">{t("subtitle")}</p>
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
