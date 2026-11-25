import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import {
  displayGroups,
  mainPronunciation,
  normalizeWord,
  playPronunciation,
  useDictionarySearch,
  type WordView,
} from "@/features/dictionary";
import { useLessonSearch } from "@/features/lesson";
import { useDebounce } from "@/hooks/useDebounce";
import { toggleTheme } from "@/hooks/useTheme";
import { formatDuration } from "@/lib/format";
import type { ShellConfig } from "./shellConfig";

type Item = {
  id: string;
  icon: string;
  label: string;
  sublabel?: string;
  ipa?: string | null;
  pos?: string | null;
  audioWord?: { headword: string; audioUs: string | null };
  meta?: string;
  cefr?: string;
  run: () => void;
};

const DEBOUNCE_MS = 220;

function wordToItem(
  word: WordView,
  tDict: (key: string, opts?: Record<string, unknown>) => string,
  navigate: (to: string) => void,
): Item {
  const groups = displayGroups(word);
  const firstGroup = groups[0];
  const firstMeaning = firstGroup?.meanings[0]?.translationVi ?? undefined;
  const pos = firstGroup?.pos ? tDict(`pos.${firstGroup.pos}`, { defaultValue: firstGroup.pos }) : null;
  const pron = mainPronunciation(word);
  return {
    id: `word-${word.headword}`,
    icon: "book-open-text",
    label: word.headword,
    ipa: pron.ipaUs || pron.ipaUk,
    pos,
    sublabel: firstMeaning,
    audioWord: { headword: word.headword, audioUs: pron.audioUs },
    run: () => navigate(`/student/dictionary/${encodeURIComponent(word.headword)}`),
  };
}

/** Ô tìm nhanh Ctrl K (`.palette` trong mockup v2): tra từ điển gọn (bấm vào mở trang chi tiết từ), tìm bài học, đi tới màn hình và thao tác. */
export default function CommandPalette({ config, open, onOpenChange }: { config: ShellConfig; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation(["layout", "dictionary"]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const learner = config.topBar.kind === "learner";
  const debounced = useDebounce(query, DEBOUNCE_MS);
  const wordQuery = learner && open ? normalizeWord(debounced) : "";
  const lessonQuery = learner && open && debounced.trim().length >= 2 ? debounced.trim() : "";

  const dictSearch = useDictionarySearch(wordQuery);
  const lessonSearch = useLessonSearch({ q: lessonQuery || undefined, size: 4 }, { enabled: Boolean(lessonQuery) });
  const lessonItems = lessonSearch.data?.items;

  // Ctrl/⌘ K mở từ bất kỳ đâu; "/" mở khi không đang gõ vào ô nhập
  useEffect(() => {
    if (!learner) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement | null)?.tagName ?? "");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [learner, onOpenChange]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const close = () => {
    onOpenChange(false);
    setQuery("");
    setSelected(0);
  };

  const { words, lessons, screens, actions } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const go = (to: string) => () => navigate(to);
    const words: Item[] =
      wordQuery && dictSearch.data
        ? dictSearch.data.slice(0, 5).map((w) =>
            wordToItem(w, (key, opts) => t(`dictionary:${key}`, opts), navigate),
          )
        : [];
    const lessons: Item[] =
      lessonQuery && lessonItems
        ? lessonItems.slice(0, 4).map((l) => ({
            id: `lesson-${l.id}`,
            icon: "circle-play",
            label: l.title,
            cefr: l.cefrLevel,
            meta: l.durationSec ? formatDuration(l.durationSec) : undefined,
            run: go(`/student/lessons/${l.id}`),
          }))
        : [];
    const screens: Item[] = config.groups
      .flatMap((g) => g.items)
      .map((i) => ({ id: i.id, icon: i.icon, label: t(`layout:${i.labelKey}`), run: go(i.to) }))
      .filter((i) => !q || i.label.toLowerCase().includes(q));
    const actions: Item[] = [{ id: "theme", icon: "contrast", label: t("layout:theme.toggle"), run: toggleTheme }].filter(
      (a) => !q || a.label.toLowerCase().includes(q),
    );
    return { words, lessons, screens, actions };
  }, [config.groups, dictSearch.data, lessonQuery, lessonItems, navigate, query, t, wordQuery]);

  if (!open) return null;
  const items = [...words, ...lessons, ...screens, ...actions];
  const dictBusy = Boolean(wordQuery) && dictSearch.isPending;
  const hasAnyResult = items.length > 0 || dictBusy || dictSearch.isError;

  const run = (item?: Item) => {
    if (!item) return;
    close();
    item.run();
  };

  const row = (item: Item, index: number) => (
    <div
      key={item.id}
      id={`cmdk-option-${index}`}
      role="option"
      aria-selected={index === selected}
      onClick={() => run(item)}
      onMouseEnter={() => setSelected(index)}
      className={`flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
        index === selected ? "bg-primary-soft" : "bg-transparent hover:bg-surface-hover/60"
      }`}
    >
      <Icon name={item.icon} className={`shrink-0 text-xl ${item.audioWord ? "text-fn-vocab" : ""}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`truncate ${item.audioWord ? "font-display text-base font-bold text-primary-text" : ""}`}>
            {item.label}
          </span>
          {item.ipa && <span className="text-xs text-text-muted">{item.ipa}</span>}
          {item.pos && (
            <span className="rounded-full border border-border bg-bg-elevated px-2 py-0.5 text-[11px] font-semibold text-text-muted">
              {item.pos}
            </span>
          )}
        </div>
        {item.sublabel && <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">{item.sublabel}</p>}
      </div>
      {item.audioWord && (
        <button
          type="button"
          aria-label={t("dictionary:word.listenWord", { word: item.audioWord.headword })}
          title={t("dictionary:word.listenWord", { word: item.audioWord.headword })}
          onClick={(e) => {
            e.stopPropagation();
            playPronunciation(item.audioWord!.headword, "us", item.audioWord!.audioUs);
          }}
          className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-text-muted transition-colors hover:bg-bg-elevated hover:text-text"
        >
          <Icon name="volume-2" className="size-4" />
        </button>
      )}
      {item.cefr && <Badge variant={item.cefr}>{item.cefr}</Badge>}
      {item.meta && <span className="shrink-0 text-xs tabular-nums text-text-muted">{item.meta}</span>}
      {item.audioWord && <Icon name="arrow-right" className="size-4 shrink-0 text-text-subtle" />}
    </div>
  );

  return (
    <>
      <button type="button" aria-label={t("layout:shell.closeMenu")} onClick={close} className="fixed inset-0 z-[80] cursor-default border-0 bg-[rgba(7,5,13,.55)]" />
      <div
        role="dialog"
        aria-label={t("layout:shell.palette.label")}
        className="fixed left-1/2 top-[12vh] z-[90] w-[min(640px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-[0_24px_48px_-16px_rgba(0,0,0,.55),0_0_0_1px_var(--border)]"
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
          else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (items.length) setSelected((s) => (s + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length);
          } else if (e.key === "Enter") {
            if (items[selected]) {
              e.preventDefault();
              run(items[selected]);
            }
          }
        }}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <Icon name="search" className="text-xl text-text-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            placeholder={t("layout:shell.palette.placeholder")}
            aria-label={t("layout:shell.palette.label")}
            autoComplete="off"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-activedescendant={items.length > 0 ? `cmdk-option-${selected}` : undefined}
            className="flex-1 border-0 bg-transparent text-base text-text outline-none placeholder:text-text-subtle"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={t("dictionary:close")}
              onClick={() => {
                setQuery("");
                setSelected(0);
                inputRef.current?.focus();
              }}
            >
              <Icon name="x" />
            </Button>
          )}
        </div>

        <div id="cmdk-list" role="listbox" aria-label={t("layout:shell.palette.label")} className="max-h-[60vh] overflow-y-auto p-2">
          {wordQuery && (dictBusy || dictSearch.isError || words.length > 0) && (
            <>
              <div className="flex items-center gap-1.5 px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-fn-vocab">
                <Icon name="book-open-text" className="size-3.5" />
                {t("layout:shell.palette.dictionary")}
              </div>
              {dictSearch.isError ? (
                <div className="mx-2 my-1 flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-elevated px-3.5 py-2 text-[13px] text-text-muted">
                  <span>{t("dictionary:lookup.error")}</span>
                  <Button variant="ghost" size="sm" isLoading={dictSearch.isFetching} onClick={() => void dictSearch.refetch()}>
                    {t("dictionary:lookup.retry")}
                  </Button>
                </div>
              ) : dictBusy ? (
                <div className="flex flex-col gap-1.5 px-2 py-1" aria-busy="true" aria-label={t("dictionary:search.loading")}>
                  <Skeleton className="h-12 w-full rounded-md" />
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>
              ) : (
                words.map((w, i) => row(w, i))
              )}
            </>
          )}

          {lessons.length > 0 && (
            <>
              <div className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-text">
                {t("layout:shell.palette.lessons")}
              </div>
              {lessons.map((l, i) => row(l, words.length + i))}
            </>
          )}

          {screens.length > 0 && (
            <>
              <div className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-text">
                {t("layout:shell.palette.goTo")}
              </div>
              {screens.map((s, i) => row(s, words.length + lessons.length + i))}
            </>
          )}

          {actions.length > 0 && (
            <>
              <div className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-text">
                {t("layout:shell.palette.actions")}
              </div>
              {actions.map((a, i) => row(a, words.length + lessons.length + screens.length + i))}
            </>
          )}

          {!hasAnyResult && (
            <div className="p-4 text-center text-[13px] text-text-muted">{t("layout:shell.palette.none", { q: query })}</div>
          )}
        </div>
      </div>
    </>
  );
}
