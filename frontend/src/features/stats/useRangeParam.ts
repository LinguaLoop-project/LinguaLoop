import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { StatsRange } from "./types";
import { DEFAULT_RANGE, parseRange } from "./utils";

/**
 * Khoảng thống kê lưu trên địa chỉ trang (`?range=7d`) để chia sẻ và dùng nút Lùi. Giá trị mặc định (30 ngày) không ghi
 * lên địa chỉ. Đổi khoảng thì về trang đầu của mọi danh sách phân trang cùng địa chỉ.
 */
export function useRangeParam(): [StatsRange, (range: StatsRange) => void] {
  const [params, setParams] = useSearchParams();
  const range = parseRange(params.get("range"));
  const setRange = useCallback(
    (next: StatsRange) => {
      setParams(
        (current) => {
          const out = new URLSearchParams(current);
          if (next === DEFAULT_RANGE) out.delete("range");
          else out.set("range", next);
          out.delete("page");
          return out;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  return [range, setRange];
}
