import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Skeleton from "@/components/common/Skeleton";
import {
  PronunciationButtons,
  WordCard,
  displayGroups,
  isWordNotFound,
  mainPronunciation,
  type WordView,
} from "@/features/dictionary";
import type { IpaAccent } from "../utils";

const K = "student.shadowingPractice.dictionary";
/** Số loại từ hiện ở bản gọn; còn lại xem ở "Xem đầy đủ". */
const MAX_GROUPS = 3;

function Compact({ view, accent }: { view: WordView; accent: IpaAccent }) {
  const { t } = useTranslation("dictionary");
  const groups = displayGroups(view).slice(0, MAX_GROUPS);
  const { lemma } = view;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <PronunciationButtons headword={view.headword} pronunciation={mainPronunciation(view)} firstAccent={accent} />
      </div>
      {lemma && (
        <p className="text-[13px] text-text-muted">
          {view.groups.length > 0 ? t("word.lemmaMeanings") : t("word.lemmaOf")}{" "}
          <b className="font-semibold text-text">{lemma.headword}</b>
        </p>
      )}
      {groups.length === 0 ? (
        <p className="text-[13px] text-text-muted">{t("word.noMeaning")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {groups.map((group, i) => {
            const first = group.meanings[0];
            return (
              <li key={`${group.pos ?? "none"}-${i}`} className="flex flex-col gap-1">
                <p className="leading-snug">
                  <span className="mr-2 inline-block rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                    {group.pos ? t(`pos.${group.pos}`, { defaultValue: group.pos }) : t("word.otherPos")}
                  </span>
                  <span className="font-semibold text-text">{first?.translationVi}</span>
                </p>
                {first?.exampleEn && (
                  <p className="border-l-2 border-border-strong pl-2.5 text-[13px] leading-normal">
                    <span className="italic text-info">{first.exampleEn}</span>
                    {first.exampleVi && <span className="block text-text-muted">{first.exampleVi}</span>}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export interface WordDictionarySectionProps {
  /** Từ đã chuẩn hoá, dùng cho thông báo khi từ điển chưa có từ này. */
  word: string;
  /** Kết quả tra từ; `WordDetail` giữ query này để dùng chung cho nút nghe và mục từ điển. */
  lookup: UseQueryResult<WordView>;
  /** Giọng người học chọn xem; giọng này đứng trước khi hiện cả US lẫn UK. */
  accent: IpaAccent;
}

/**
 * Mục "Từ điển" của một từ trong câu: phiên âm từ điển (dạng đứng riêng, có thể khác cách đọc trong câu) theo cả hai
 * giọng, mức CEFR và nghĩa. Chỉ để tham khảo, không ảnh hưởng đến điểm; từ chưa có trong từ điển thì báo rõ mà không
 * làm mất phần chấm điểm.
 */
export default function WordDictionarySection({ word, lookup, accent }: WordDictionarySectionProps) {
  const { t } = useTranslation("pages");
  const { t: td } = useTranslation("dictionary");
  const [full, setFull] = useState(false);

  let body;
  if (lookup.isPending) {
    body = (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label={td("lookup.loading")}>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  } else if (lookup.isError) {
    body = isWordNotFound(lookup.error) ? (
      <p className="text-[13px] text-text-muted">{td("lookup.notFound", { word })}</p>
    ) : (
      <div className="flex flex-col items-start gap-2">
        <p className="text-[13px] text-text-muted">{td("lookup.error")}</p>
        <Button variant="ghost" size="sm" isLoading={lookup.isFetching} onClick={() => void lookup.refetch()}>
          {td("lookup.retry")}
        </Button>
      </div>
    );
  } else {
    body = full ? <WordCard word={lookup.data} /> : <Compact view={lookup.data} accent={accent} />;
  }

  return (
    <section aria-label={t(`${K}.title`)} className="mt-4 border-t border-border pt-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <b className="text-sm">{t(`${K}.title`)}</b>
          <span className="text-xs text-text-subtle">{t(`${K}.hint`)}</span>
        </div>
        {lookup.isSuccess && (
          <Button variant="ghost" size="sm" onClick={() => setFull((v) => !v)} aria-expanded={full}>
            {t(`${K}.${full ? "compact" : "full"}`)}
          </Button>
        )}
      </div>
      {body}
    </section>
  );
}
