import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import type { MeaningGroup, Pronunciation, WordView } from "../types";
import PronunciationButtons from "./PronunciationButtons";

interface GroupListProps {
  groups: MeaningGroup[];
  /** Nhóm nào có phát âm riêng (từ đồng tự khác âm, vd "present") thì báo lên cha để ghi đè phát âm hiện trên đầu, không hiện 2 hàng. */
  onActivePronunciationChange?: (pronunciation: Pronunciation) => void;
}

function GroupList({ groups, onActivePronunciationChange }: GroupListProps) {
  const { t } = useTranslation("dictionary");
  const [activeIndex, setActiveIndex] = useState(0);
  const active = groups[activeIndex] ?? groups[0];

  useEffect(() => {
    onActivePronunciationChange?.(active.pronunciation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="flex flex-col gap-3">
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {groups.map((group, groupIndex) => (
            <button
              key={`${group.pos ?? "none"}-${groupIndex}`}
              type="button"
              onClick={() => setActiveIndex(groupIndex)}
              className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                groupIndex === activeIndex
                  ? "bg-primary text-white"
                  : "border border-border-strong bg-transparent text-text-muted hover:text-text"
              }`}
            >
              {group.pos ? t(`pos.${group.pos}`, { defaultValue: group.pos }) : t("word.otherPos")}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {groups.length === 1 && active.pos && (
          <span className="w-fit rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white">
            {t(`pos.${active.pos}`, { defaultValue: active.pos })}
          </span>
        )}
        <ol className="flex flex-col divide-y divide-border">
          {active.meanings.map((meaning) => (
            <li key={meaning.no} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
              {meaning.translationVi && <p className="font-semibold leading-snug text-text">{meaning.translationVi}</p>}
              {meaning.exampleEn && (
                <p className="border-l-2 border-border-strong pl-2.5 text-[13px] leading-normal">
                  <span className="italic text-info">{meaning.exampleEn}</span>
                  {meaning.exampleVi && <span className="block text-text-muted">{meaning.exampleVi}</span>}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export interface WordCardProps {
  word: WordView;
}

/** Một từ: từ, mức CEFR, phát âm, các nghĩa gom theo loại từ; dạng chia thì kèm nghĩa của từ gốc. */
export default function WordCard({ word }: WordCardProps) {
  const { t } = useTranslation("dictionary");
  const { lemma } = word;
  const hasOwnMeanings = word.groups.length > 0;

  const [mainPronunciation, setMainPronunciation] = useState(word.pronunciation);
  const [lemmaPronunciation, setLemmaPronunciation] = useState(lemma?.pronunciation);

  return (
    // key=headword: từ tra thay đổi thì remount để state phát âm/tab reset, khỏi cần effect đồng bộ lại.
    <article key={word.headword} className="flex flex-col gap-3">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl font-bold leading-tight text-primary-text">{word.headword}</h3>
          {word.cefrLevel && <Badge variant={word.cefrLevel}>{word.cefrLevel}</Badge>}
        </div>
        <PronunciationButtons headword={word.headword} pronunciation={mainPronunciation} />
      </header>

      {hasOwnMeanings && (
        <GroupList groups={word.groups} onActivePronunciationChange={setMainPronunciation} />
      )}

      {lemma && (
        <div className={`flex flex-col gap-3 ${hasOwnMeanings ? "border-t border-border pt-3" : ""}`}>
          <div className="flex flex-col gap-2">
            <p className="text-[13px] text-text-muted">
              {hasOwnMeanings ? t("word.lemmaMeanings") : t("word.lemmaOf")}{" "}
              <b className="font-semibold text-text">{lemma.headword}</b>
            </p>
            {lemmaPronunciation && <PronunciationButtons headword={lemma.headword} pronunciation={lemmaPronunciation} />}
          </div>
          <GroupList groups={lemma.groups} onActivePronunciationChange={setLemmaPronunciation} />
        </div>
      )}

      {!hasOwnMeanings && (!lemma || lemma.groups.length === 0) && (
        <p className="text-[13px] text-text-muted">{t("word.noMeaning")}</p>
      )}
    </article>
  );
}
