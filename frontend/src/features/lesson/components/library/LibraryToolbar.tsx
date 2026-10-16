import { useTranslation } from "react-i18next";
import Chip from "@/components/common/Chip";
import Icon from "@/components/common/Icon";
import SearchInput from "@/components/common/SearchInput";
import SegmentedControl from "@/components/common/SegmentedControl";
import type { LibraryFilters } from "../../utils";

export interface LibraryToolbarProps {
  filters: LibraryFilters;
  onChange: (next: LibraryFilters) => void;
}

/** Thanh tìm và lọc: tên bài, trình độ, sắp xếp, chỉ bài miễn phí. */
export default function LibraryToolbar({ filters, onChange }: LibraryToolbarProps) {
  const { t } = useTranslation("pages");
  const set = <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => onChange({ ...filters, [key]: value });
  const p = "student.lessons.toolbar";

  return (
    <div className="mb-5 flex flex-col flex-wrap items-stretch gap-2.5 sm:flex-row sm:items-center sm:gap-3">
      <SearchInput
        className="w-full min-w-[200px] sm:flex-1"
        id="lsSearch"
        placeholder={t(`${p}.searchPlaceholder`, "Tìm bài học theo tên…")}
        ariaLabel={t(`${p}.searchAria`, "Tìm bài học")}
        value={filters.search}
        onChange={(v) => set("search", v)}
      />

      <div className="max-w-full overflow-x-auto scrollbar-none">
        <SegmentedControl
          id="lsLevel"
          ariaLabel={t(`${p}.levels.label`, "Trình độ")}
          options={[
            { value: "all", label: t(`${p}.levels.all`, "Tất cả") },
            { value: "basic", label: t(`${p}.levels.basic`, "Cơ bản") },
            { value: "mid", label: t(`${p}.levels.mid`, "Trung cấp") },
            { value: "adv", label: t(`${p}.levels.adv`, "Nâng cao") },
          ]}
          value={filters.level}
          onChange={(v) => set("level", v)}
        />
      </div>

      <div className="max-w-full overflow-x-auto scrollbar-none">
        <SegmentedControl
          id="lsSort"
          ariaLabel={t(`${p}.sorts.label`, "Sắp xếp")}
          options={[
            { value: "pop", label: t(`${p}.sorts.pop`, "Phổ biến"), icon: <Icon name="flame" /> },
            { value: "new", label: t(`${p}.sorts.new`, "Mới"), icon: <Icon name="clock" /> },
            { value: "short", label: t(`${p}.sorts.short`, "Ngắn"), icon: <Icon name="timer" /> },
          ]}
          value={filters.sort}
          onChange={(v) => set("sort", v)}
        />
      </div>

      <Chip id="lsFree" active={filters.freeOnly} onClick={() => set("freeOnly", !filters.freeOnly)} className="self-start sm:self-auto">
        <Icon name="lock-open" />
        {t(`${p}.freeOnly`, "Chỉ bài miễn phí")}
      </Chip>
    </div>
  );
}
