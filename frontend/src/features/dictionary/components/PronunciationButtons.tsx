import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import type { Accent, Pronunciation } from "../types";
import { audioOf, ipaOf, playPronunciation } from "../utils";

const ACCENTS: Accent[] = ["us", "uk"];

export interface PronunciationButtonsProps {
  headword: string;
  pronunciation: Pronunciation;
}

/** Nút nghe US/UK kèm phiên âm. Không có audio thì đọc bằng giọng trình duyệt; không có giọng nào thì vẫn cho nghe một nút. */
export default function PronunciationButtons({ headword, pronunciation }: PronunciationButtonsProps) {
  const { t } = useTranslation("dictionary");
  const available = ACCENTS.filter((accent) => ipaOf(pronunciation, accent) || audioOf(pronunciation, accent));
  const accents = available.length > 0 ? available : (["us"] as Accent[]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {accents.map((accent) => {
        const ipa = ipaOf(pronunciation, accent);
        const label = t(`accent.${accent}`);
        return (
          <button
            key={accent}
            type="button"
            aria-label={`${t("word.listen", { accent: label })}${ipa ? ` ${ipa}` : ""}`}
            onClick={() => playPronunciation(headword, accent, audioOf(pronunciation, accent))}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border-strong bg-surface-hover px-3 text-xs font-semibold text-text transition-colors hover:border-primary hover:bg-primary-soft"
          >
            <Icon name="volume-2" className="h-4 w-4" />
            {label}
            {ipa && <span className="font-normal text-text-muted">{ipa}</span>}
          </button>
        );
      })}
    </div>
  );
}
