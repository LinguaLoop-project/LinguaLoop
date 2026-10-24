import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import type { MeaningGroup, Pronunciation, WordView } from "../types";
import { samePronunciation } from "../utils";
import PronunciationButtons from "./PronunciationButtons";

interface GroupListProps {
  headword: string;
  groups: MeaningGroup[];
  /** Phát âm chung của từ; nhóm nào có phát âm khác (vd "present" động từ) thì hiện riêng ở nhóm đó. */
  basePronunciation: Pronunciation;
}

function GroupList({ headword, groups, basePronunciation }: GroupListProps) {
  const { t } = useTranslation("dictionary");
  return (
    <div className="flex flex-col gap-3.5">
      {groups.map((group, groupIndex) => (
        <section key={`${group.pos ?? "none"}-${groupIndex}`} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {group.pos && <Badge tone="primary">{t(`pos.${group.pos}`, { defaultValue: group.pos })}</Badge>}
            {!samePronunciation(group.pronunciation, basePronunciation) && (
              <PronunciationButtons headword={headword} pronunciation={group.pronunciation} />
            )}
          </div>
          <ol className="flex flex-col gap-2.5">
            {group.meanings.map((meaning) => (
              <li key={meaning.no} className="flex flex-col gap-1">
                {meaning.translationVi && <p className="font-semibold leading-snug text-text">{meaning.translationVi}</p>}
                {meaning.exampleEn && (
                  <p className="border-l-2 border-border-strong pl-2.5 text-[13px] leading-normal">
                    <span className="italic text-text">{meaning.exampleEn}</span>
                    {meaning.exampleVi && <span className="block text-text-muted">{meaning.exampleVi}</span>}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
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

  return (
    <article className="flex flex-col gap-3">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl font-bold leading-tight text-primary-text">{word.headword}</h3>
          {word.cefrLevel && <Badge variant={word.cefrLevel}>{word.cefrLevel}</Badge>}
        </div>
        <PronunciationButtons headword={word.headword} pronunciation={word.pronunciation} />
      </header>

      {hasOwnMeanings && (
        <GroupList headword={word.headword} groups={word.groups} basePronunciation={word.pronunciation} />
      )}

      {lemma && (
        <div className={`flex flex-col gap-3 ${hasOwnMeanings ? "border-t border-border pt-3" : ""}`}>
          <p className="text-[13px] text-text-muted">
            {hasOwnMeanings ? t("word.lemmaMeanings") : t("word.lemmaOf")}{" "}
            <b className="font-semibold text-text">{lemma.headword}</b>
          </p>
          <GroupList headword={lemma.headword} groups={lemma.groups} basePronunciation={lemma.pronunciation} />
        </div>
      )}

      {!hasOwnMeanings && (!lemma || lemma.groups.length === 0) && (
        <p className="text-[13px] text-text-muted">{t("word.noMeaning")}</p>
      )}
    </article>
  );
}
