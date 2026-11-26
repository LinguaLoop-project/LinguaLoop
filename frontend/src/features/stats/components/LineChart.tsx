import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { formatAxis, formatDay, niceTicks } from "../statsFormat";

export interface ChartSeries {
  key: string;
  label: string;
  values: number[];
  /** Biến CSS màu chuỗi, gán theo thứ tự cố định (--chart-1, --chart-2...). */
  color: string;
}

export interface LineChartProps {
  days: string[];
  series: ChartSeries[];
  /** Định dạng giá trị trong tooltip và bảng. */
  format: (value: number) => string;
  /** Mô tả ngắn cho trình đọc màn hình. */
  ariaLabel: string;
  /** Có thì vẽ khung trống kèm thông báo thay vì đường (UC-NK-02 nhánh 3a). */
  emptyText?: string;
  height?: number;
}

const PAD = { top: 12, right: 16, bottom: 28, left: 48 };

/** Theo dõi bề rộng thật của khung để vẽ SVG đúng tỉ lệ, chữ không bị kéo giãn. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Chỉ số của vài ngày cách đều để ghi nhãn trục hoành, luôn có ngày đầu và ngày cuối. */
function labelIndexes(count: number, max: number): number[] {
  if (count <= max) return Array.from({ length: count }, (_, i) => i);
  const step = (count - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => Math.round(i * step));
}

/**
 * Biểu đồ đường theo ngày: nét 2px, lưới mảnh, đường dóng dọc bắt ngày gần nhất và một tooltip liệt kê mọi chuỗi;
 * dùng phím mũi tên để đi qua từng ngày. Hai chuỗi trở lên có chú giải; luôn có bảng số liệu để xem không cần rê chuột.
 */
export default function LineChart({ days, series, format, ariaLabel, emptyText, height = 240 }: Readonly<LineChartProps>) {
  const { t, i18n } = useTranslation("statsAdmin");
  const [boxRef, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  const language = i18n.language;

  const count = days.length;
  const empty = emptyText !== undefined;
  const max = empty ? 0 : Math.max(0, ...series.flatMap((s) => s.values));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (count <= 1 ? plotW / 2 : (i * plotW) / (count - 1));
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const labelled = labelIndexes(count, width < 480 ? 4 : 7);

  const pickIndex = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left - PAD.left) / Math.max(plotW, 1);
    setActive(Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1)))));
  };
  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowLeft" ? -1 : 1;
    setActive((current) => Math.min(count - 1, Math.max(0, (current ?? count - 1) + delta)));
  };

  const tooltipLeft = active === null ? 0 : Math.min(Math.max(x(active) - 80, 0), Math.max(width - 168, 0));

  return (
    <div className="flex flex-col gap-3">
      {series.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span aria-hidden className="h-0.5 w-3.5 rounded-full" style={{ background: `var(${s.color})` }} />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      <div ref={boxRef} className="relative w-full" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={ariaLabel}
            tabIndex={empty ? -1 : 0}
            className="block overflow-visible rounded-md focus-visible:outline-2 focus-visible:outline-primary"
            onPointerMove={empty ? undefined : pickIndex}
            onPointerLeave={() => setActive(null)}
            onFocus={() => !empty && setActive(count - 1)}
            onBlur={() => setActive(null)}
            onKeyDown={empty ? undefined : onKeyDown}
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={PAD.left} x2={PAD.left + plotW} y1={y(tick)} y2={y(tick)} stroke="var(--chart-grid)" strokeWidth={1} />
                <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-text-subtle text-[11px] tabular-nums">
                  {formatAxis(tick, language)}
                </text>
              </g>
            ))}
            {labelled.map((i) => (
              <text
                key={days[i]}
                x={x(i)}
                y={height - 8}
                textAnchor={i === 0 ? "start" : i === count - 1 ? "end" : "middle"}
                className="fill-text-subtle text-[11px] tabular-nums"
              >
                {formatDay(days[i], language)}
              </text>
            ))}

            {!empty &&
              series.map((s) => {
                const points = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
                return (
                  <g key={s.key}>
                    {series.length === 1 && (
                      <polygon
                        points={`${x(0)},${y(0)} ${points} ${x(count - 1)},${y(0)}`}
                        fill={`var(${s.color})`}
                        opacity={0.1}
                      />
                    )}
                    <polyline points={points} fill="none" stroke={`var(${s.color})`} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                  </g>
                );
              })}

            {active !== null && !empty && (
              <g aria-hidden>
                <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--border-strong)" strokeWidth={1} />
                {series.map((s) => (
                  <circle key={s.key} cx={x(active)} cy={y(s.values[active] ?? 0)} r={4} fill={`var(${s.color})`} stroke="var(--surface)" strokeWidth={2} />
                ))}
              </g>
            )}
          </svg>
        )}

        {empty && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-text-muted">{emptyText}</p>
        )}

        {active !== null && !empty && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 w-[168px] rounded-md border border-border-strong bg-bg-elevated px-3 py-2 text-xs shadow-[var(--shadow-card)]"
            style={{ left: tooltipLeft }}
          >
            <p className="mb-1 text-text-muted">{formatDay(days[active], language)}</p>
            <ul className="flex flex-col gap-0.5">
              {series.map((s) => (
                <li key={s.key} className="flex items-center gap-2">
                  <span aria-hidden className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: `var(${s.color})` }} />
                  <span className="font-semibold text-text tabular-nums">{format(s.values[active] ?? 0)}</span>
                  <span className="truncate text-text-muted">{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {!empty && (
        <div>
          <button
            type="button"
            aria-expanded={showTable}
            aria-controls={tableId}
            onClick={() => setShowTable((v) => !v)}
            className="cursor-pointer text-xs font-semibold text-primary-text hover:underline"
          >
            {showTable ? t("chart.hideTable") : t("chart.showTable")}
          </button>
          {showTable && (
            <div id={tableId} className="mt-2 max-h-64 overflow-auto rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface text-text-subtle">
                  <tr>
                    <th className="px-3 py-2 font-semibold">{t("chart.day")}</th>
                    {series.map((s) => (
                      <th key={s.key} className="px-3 py-2 text-right font-semibold">
                        {s.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day, i) => (
                    <tr key={day} className="border-t border-border">
                      <td className="px-3 py-1.5 text-text-muted">{formatDay(day, language)}</td>
                      {series.map((s) => (
                        <td key={s.key} className="px-3 py-1.5 text-right text-text tabular-nums">
                          {format(s.values[i] ?? 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
