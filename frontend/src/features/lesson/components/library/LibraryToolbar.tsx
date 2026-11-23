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

/** Thanh tìm và lọc: tên bài, trình độ, tiến độ, sắp xếp, bài miễn phí và bài ngắn. */
export default function LibraryToolbar({ filters, onChange }: LibraryToolbarProps) {
  const { t } = useTranslation("pages");
  const set = <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => onChange({ ...filters, [key]: value });
  const p = "student.lessons.toolbar";

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-center">
        <SearchInput
          className="w-full min-w-[220px] sm:flex-1"
          id="lsSearch"
          placeholder={t(`${p}.searchPlaceholder`, "Tìm bài học theo tên…")}
          ariaLabel={t(`${p}.searchAria`, "Tìm bài học")}
          value={filters.search}
          onChange={(v) => set("search", v)}
        />

        <div className="max-w-full overflow-x-auto [scrollbar-width:none]">
          <SegmentedControl
            id="lsLevel"
            ariaLabel={t(`${p}.levels.label`, "Trình độ")}
            options={[
              { value: "all", label: t(`${p}.levels.all`, "Tất cả") },
              { value: "basic", label: t(`${p}.levels.basic`, "Cơ bản (A1–A2)") },
              { value: "mid", label: t(`${p}.levels.mid`, "Trung cấp (B1–B2)") },
              { value: "adv", label: t(`${p}.levels.adv`, "Nâng cao (C1–C2)") },
            ]}
            value={filters.level}
            onChange={(v) => set("level", v)}
          />
        </div>

        <div className="max-w-full overflow-x-auto [scrollbar-width:none]">
          <SegmentedControl
            id="lsSort"
            ariaLabel={t(`${p}.sorts.label`, "Sắp xếp")}
            options={[
              { value: "pop", label: t(`${p}.sorts.pop`, "Phổ biến") },
              { value: "new", label: t(`${p}.sorts.new`, "Mới") },
              { value: "short", label: t(`${p}.sorts.short`, "Ngắn") },
            ]}
            value={filters.sort}
            onChange={(v) => set("sort", v)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-full overflow-x-auto [scrollbar-width:none]">
          <SegmentedControl
            id="lsState"
            ariaLabel={t(`${p}.states.label`, "Tiến độ")}
            options={[
              { value: "all", label: t(`${p}.states.all`, "Tất cả") },
              { value: "todo", label: t(`${p}.states.todo`, "Chưa học") },
              { value: "doing", label: t(`${p}.states.doing`, "Đang học") },
              { value: "done", label: t(`${p}.states.done`, "Đã xong") },
            ]}
            value={filters.state}
            onChange={(v) => set("state", v)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip id="lsFree" active={filters.freeOnly} onClick={() => set("freeOnly", !filters.freeOnly)}>
            <Icon name="lock-open" className="text-lg" />
            {t(`${p}.freeOnly`, "Chỉ bài miễn phí")}
          </Chip>

          <Chip id="lsShort" active={filters.shortOnly} onClick={() => set("shortOnly", !filters.shortOnly)}>
            <Icon name="clock" className="text-lg" />
            {t(`${p}.shortOnly`, "Bài ngắn (≤ 3p)")}
          </Chip>
        </div>
      </div>
    </div>
  );
}
