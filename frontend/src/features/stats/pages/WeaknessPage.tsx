import { useState } from "react";
import { useTranslation } from "react-i18next";
import Skeleton from "@/components/common/Skeleton";
import DictationErrorsCard from "../components/DictationErrorsCard";
import PhonemeMap from "../components/PhonemeMap";
import PhonemePanel from "../components/PhonemePanel";
import RangeTabs from "../components/RangeTabs";
import ScoreTrendCard from "../components/ScoreTrendCard";
import StatsError from "../components/StatsError";
import WrongWordsCard from "../components/WrongWordsCard";
import { usePronunciation } from "../hooks";
import type { PhonemeCell } from "../types";
import { useRangeParam } from "../useRangeParam";

/** Âm mở sẵn khi vào trang: âm có tỷ lệ lỗi cao nhất trong các âm đã đủ dữ liệu; chưa có âm nào thì không mở. */
function defaultSymbol(cells: PhonemeCell[]): string | null {
  const rated = cells.filter((c) => c.errorPercent !== null);
  if (rated.length === 0) return null;
  return rated.reduce((worst, c) => ((c.errorPercent ?? 0) > (worst.errorPercent ?? 0) ? c : worst)).symbol;
}

/** Trang Điểm yếu: bản đồ 44 âm vị, điểm phát âm và lỗi Nghe chép theo nhóm từ (UC-TH-03, BR-TH-05). */
export default function WeaknessPage() {
  const { t } = useTranslation("stats");
  const [range, setRange] = useRangeParam();
  const query = usePronunciation(range);
  const [picked, setPicked] = useState<string | null>(null);
  const data = query.data;
  const selected = picked ?? (data ? defaultSymbol(data.phonemes) : null);

  return (
    <section className="flex w-full flex-col gap-6" id="v-weakness">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-fn-assessment">{t("weakness.overline")}</div>
          <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{t("weakness.title")}</h1>
          <p className="mt-1 text-text-muted">{t("weakness.sub")}</p>
        </div>
        <RangeTabs value={range} onChange={setRange} />
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          {query.isError && !data ? (
            <StatsError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
          ) : !data ? (
            <div className="flex flex-col gap-6" aria-busy="true">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <ScoreTrendCard data={data} />
              <PhonemeMap cells={data.phonemes} selected={selected} onSelect={setPicked} />
            </>
          )}
          <DictationErrorsCard range={range} />
          <WrongWordsCard range={range} />
        </div>
        <PhonemePanel symbol={selected} range={range} />
      </div>
    </section>
  );
}
