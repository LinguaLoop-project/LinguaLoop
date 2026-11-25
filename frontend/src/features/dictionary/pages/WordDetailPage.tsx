import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import LoopiSay from "@/components/common/LoopiSay";
import SearchInput from "@/components/common/SearchInput";
import Skeleton from "@/components/common/Skeleton";
import { useSavedWords, type CardStatus } from "@/features/vocab";
import MeaningActions from "../components/MeaningActions";
import PronunciationButtons from "../components/PronunciationButtons";
import { isWordNotFound, useDictionarySearch, useWordLookup } from "../hooks";
import type { MeaningGroup, WordView } from "../types";
import { mainPronunciation, normalizeWord } from "../utils";

const STATUS_TONE: Record<CardStatus, "warning" | "info" | "success" | undefined> = {
  new: undefined,
  learning: "warning",
  reviewing: "info",
  mastered: "success",
};

function speakExample(text: string) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }
}

function MeaningGroupsSection({
  headword,
  saveable,
  groups,
}: {
  headword: string;
  saveable: boolean;
  groups: MeaningGroup[];
}) {
  const { t } = useTranslation("dictionary");
  const [selectedPos, setSelectedPos] = useState<string>("all");

  const totalMeanings = useMemo(
    () => groups.reduce((acc, g) => acc + g.meanings.length, 0),
    [groups],
  );

  const visibleGroups = useMemo(
    () =>
      selectedPos === "all"
        ? groups
        : groups.filter((g, idx) => `${g.pos ?? "other"}-${idx}` === selectedPos),
    [groups, selectedPos],
  );

  return (
    <div className="flex flex-col gap-5">
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedPos("all")}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              selectedPos === "all"
                ? "bg-primary text-white"
                : "border border-border-strong bg-surface text-text-muted hover:text-text"
            }`}
          >
            {t("detail.allPos", { count: totalMeanings })}
          </button>
          {groups.map((g, idx) => {
            const key = `${g.pos ?? "other"}-${idx}`;
            const label = g.pos ? t(`pos.${g.pos}`, { defaultValue: g.pos }) : t("word.otherPos");
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedPos(key)}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  selectedPos === key
                    ? "bg-primary text-white"
                    : "border border-border-strong bg-surface text-text-muted hover:text-text"
                }`}
              >
                {label} ({g.meanings.length})
              </button>
            );
          })}
        </div>
      )}

      {visibleGroups.map((group, gIdx) => {
        const posLabel = group.pos ? t(`pos.${group.pos}`, { defaultValue: group.pos }) : t("word.otherPos");
        return (
          <div
            key={`${group.pos ?? "other"}-${gIdx}`}
            className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                  {posLabel}
                </span>
                <span className="text-xs text-text-muted">
                  {t("detail.meaningsCount", { count: group.meanings.length })}
                </span>
              </div>
              <PronunciationButtons headword={headword} pronunciation={group.pronunciation} />
            </div>

            <ol className="flex flex-col divide-y divide-border">
              {group.meanings.map((meaning, mIdx) => (
                <li key={meaning.no} className="flex flex-col gap-2.5 py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
                      <span className="inline-grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold tabular-nums text-primary-text">
                        {mIdx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold leading-snug text-text">
                          {meaning.translationVi || meaning.definitionVi || meaning.definitionEn}
                        </p>
                        {meaning.definitionEn && (
                          <p className="mt-1 text-sm text-text-muted">{meaning.definitionEn}</p>
                        )}
                        {meaning.definitionVi && meaning.definitionVi !== meaning.translationVi && (
                          <p className="mt-0.5 text-sm text-text-muted">{meaning.definitionVi}</p>
                        )}
                      </div>
                    </div>
                    {saveable && <MeaningActions headword={headword} meaningNo={meaning.no} />}
                  </div>

                  {meaning.exampleEn && (
                    <div className="ml-8 flex items-start justify-between gap-2 rounded-md border-l-2 border-primary bg-bg-elevated px-3.5 py-2.5 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="italic text-info">“{meaning.exampleEn}”</p>
                        {meaning.exampleVi && (
                          <p className="mt-0.5 text-[13px] text-text-muted">{meaning.exampleVi}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label={t("detail.listenExample")}
                        title={t("detail.listenExample")}
                        onClick={() => speakExample(meaning.exampleEn!)}
                      >
                        <Icon name="volume-2" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

/** Trang chi tiết một từ vựng (`/student/dictionary/:word`): hiển thị toàn bộ nhóm từ loại, nghĩa, ví dụ, từ gốc và từ liên quan. */
export default function WordDetailPage() {
  const { word: rawWord = "" } = useParams<{ word: string }>();
  const { t } = useTranslation(["dictionary", "mywords"]);
  const navigate = useNavigate();

  const normalized = normalizeWord(decodeURIComponent(rawWord));
  const lookup = useWordLookup(normalized || null);
  const relatedSearch = useDictionarySearch(normalized);
  const savedWordsQuery = useSavedWords();

  const [quickInput, setQuickInput] = useState("");

  const word: WordView | undefined = lookup.data;
  const targetHeadword = word?.lemma?.headword ?? word?.headword ?? normalized;

  const savedForWord = useMemo(
    () =>
      (savedWordsQuery.data ?? []).filter(
        (item) =>
          item.headword.toLowerCase() === normalized.toLowerCase() ||
          item.headword.toLowerCase() === targetHeadword.toLowerCase(),
      ),
    [savedWordsQuery.data, normalized, targetHeadword],
  );

  const relatedWords = useMemo(
    () =>
      (relatedSearch.data ?? []).filter(
        (w) => w.headword.toLowerCase() !== normalized.toLowerCase(),
      ),
    [relatedSearch.data, normalized],
  );

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = normalizeWord(quickInput);
    if (!next) return;
    setQuickInput("");
    navigate(`/student/dictionary/${encodeURIComponent(next)}`);
  };

  if (lookup.isPending) {
    return (
      <section className="w-full" aria-busy="true" aria-label={t("dictionary:lookup.loading")}>
        <Skeleton className="mb-4 h-8 w-36" />
        <Skeleton className="mb-6 h-40 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-56 w-full rounded-lg" />
            <Skeleton className="h-44 w-full rounded-lg" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </section>
    );
  }

  if (lookup.isError || !word) {
    const notFound = isWordNotFound(lookup.error);
    return (
      <section className="w-full">
        <div className="mb-4">
          <Button variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" />} onClick={() => navigate(-1)}>
            {t("dictionary:detail.back")}
          </Button>
        </div>
        <EmptyState
          icon="book-open-text"
          mascotSrc=""
          title={notFound ? t("dictionary:lookup.notFound", { word: rawWord }) : t("dictionary:lookup.error")}
          description={t("dictionary:search.hint")}
          actionText={notFound ? undefined : t("dictionary:lookup.retry")}
          onAction={notFound ? undefined : () => void lookup.refetch()}
        />
      </section>
    );
  }

  const hasOwnMeanings = word.groups.length > 0;
  const totalMeanings =
    word.groups.reduce((s, g) => s + g.meanings.length, 0) +
    (word.lemma ? word.lemma.groups.reduce((s, g) => s + g.meanings.length, 0) : 0);
  const posList = [...new Set((hasOwnMeanings ? word.groups : word.lemma?.groups ?? []).map((g) => g.pos).filter(Boolean))] as string[];

  return (
    <section className="w-full">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Button variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" />} onClick={() => navigate(-1)}>
            {t("dictionary:detail.back")}
          </Button>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-text">{t("dictionary:title")}</span>
          <span aria-hidden="true">/</span>
          <b className="text-primary-text">{word.headword}</b>
        </div>

        <form onSubmit={handleQuickSubmit} className="w-full sm:w-72">
          <SearchInput
            value={quickInput}
            onChange={setQuickInput}
            placeholder={t("dictionary:search.placeholder")}
            ariaLabel={t("dictionary:search.aria")}
          />
        </form>
      </div>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fn-vocab/40 bg-fn-vocab-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-fn-vocab">
              <Icon name="book-open-text" className="size-3.5" />
              {t("dictionary:detail.overline")}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-[-0.02em] text-primary-text">
              {word.headword}
            </h1>
            {posList.map((pos) => (
              <span
                key={pos}
                className="rounded-full border border-primary/40 bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-text"
              >
                {t(`dictionary:pos.${pos}`, { defaultValue: pos })}
              </span>
            ))}
            <span className="text-sm text-text-muted">
              · {t("dictionary:detail.meaningsCount", { count: totalMeanings })}
            </span>
          </div>

          <PronunciationButtons headword={word.headword} pronunciation={mainPronunciation(word)} />

          {word.lemma && (
            <p className="text-sm text-text-muted">
              {hasOwnMeanings ? t("dictionary:word.lemmaMeanings") : t("dictionary:word.lemmaOf")}{" "}
              <Link
                to={`/student/dictionary/${encodeURIComponent(word.lemma.headword)}`}
                className="font-bold text-primary-text underline-offset-4 hover:underline"
              >
                {word.lemma.headword}
              </Link>
            </p>
          )}
        </div>

        <div className="shrink-0">
          <LoopiSay mood="hello" text={t("dictionary:detail.say")} />
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          {hasOwnMeanings && (
            <MeaningGroupsSection headword={word.headword} saveable={!word.lemma} groups={word.groups} />
          )}

          {word.lemma && word.lemma.groups.length > 0 && (
            <div className="flex flex-col gap-3">
              {hasOwnMeanings && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-4 py-3">
                  <div className="text-sm">
                    <span className="text-text-muted">{t("dictionary:word.lemmaMeanings")}: </span>
                    <Link
                      to={`/student/dictionary/${encodeURIComponent(word.lemma.headword)}`}
                      className="font-display text-base font-bold text-primary-text hover:underline"
                    >
                      {word.lemma.headword}
                    </Link>
                  </div>
                  <PronunciationButtons headword={word.lemma.headword} pronunciation={word.lemma.pronunciation} />
                </div>
              )}
              <MeaningGroupsSection headword={word.lemma.headword} saveable groups={word.lemma.groups} />
            </div>
          )}

          {!hasOwnMeanings && (!word.lemma || word.lemma.groups.length === 0) && (
            <div className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-text-muted">
              {t("dictionary:word.noMeaning")}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-primary-text">
                {t("dictionary:detail.savedSection")}
              </h2>
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold tabular-nums text-primary-text">
                {savedForWord.length}
              </span>
            </div>
            {savedForWord.length === 0 ? (
              <p className="text-[13px] leading-relaxed text-text-muted">{t("dictionary:detail.savedEmpty")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {savedForWord.map((saved) => (
                  <li key={saved.id} className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <b className="text-sm">{saved.headword}</b>
                      <Badge tone={STATUS_TONE[saved.status]}>{t(`mywords:words.status.${saved.status}`)}</Badge>
                    </div>
                    {saved.meaningVi && <p className="text-[13px] text-text-muted">{saved.meaningVi}</p>}
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/student/mywords"
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-text hover:underline"
            >
              {t("dictionary:detail.viewAllSaved")}
              <Icon name="arrow-right" className="size-3.5" />
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.1em] text-primary-text">
              {t("dictionary:detail.relatedSection")}
            </h2>
            {relatedWords.length === 0 ? (
              <p className="text-[13px] text-text-muted">{t("dictionary:detail.relatedEmpty")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {relatedWords.slice(0, 6).map((rel) => {
                  const groups = rel.groups.length > 0 ? rel.groups : rel.lemma?.groups ?? [];
                  const firstMeaning = groups[0]?.meanings[0]?.translationVi;
                  const firstPos = groups[0]?.pos;
                  const pron = mainPronunciation(rel);
                  return (
                    <li key={rel.headword} className="py-2.5 first:pt-0 last:pb-0">
                      <Link
                        to={`/student/dictionary/${encodeURIComponent(rel.headword)}`}
                        className="group flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <b className="text-sm font-bold text-text transition-colors group-hover:text-primary-text">
                              {rel.headword}
                            </b>
                            {pron.ipaUs && <span className="text-xs text-text-muted">{pron.ipaUs}</span>}
                            {firstPos && (
                              <span className="rounded-full border border-border bg-bg-elevated px-1.5 py-0.2 text-[10px] font-semibold text-text-muted">
                                {t(`dictionary:pos.${firstPos}`, { defaultValue: firstPos })}
                              </span>
                            )}
                          </div>
                          {firstMeaning && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">{firstMeaning}</p>
                          )}
                        </div>
                        <Icon
                          name="chevron-right"
                          className="mt-1 size-4 shrink-0 text-text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-primary-text"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
