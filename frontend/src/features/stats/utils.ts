import type {
  ActivityDay,
  DictationErrorRow,
  HistoryItem,
  HistoryMode,
  PhonemeCell,
  PhonemeDetail,
  PhonemeLevel,
  PracticeKind,
  ScorePoint,
  StatsRange,
  WeekPoint,
} from "./types";

export const RANGES: StatsRange[] = ["7d", "30d", "all"];
export const DEFAULT_RANGE: StatsRange = "30d";

export const HISTORY_MODES: HistoryMode[] = ["all", "dictation", "shadowing", "vocab", "ai"];

/** Số ngày có hoạt động tối đa hiển thị trên mỗi trang Lịch sử luyện tập. */
export const HISTORY_DAYS_PER_PAGE = 3;

/** Số hoạt động hiển thị mặc định cho mỗi ngày trước khi thu gọn vào nút "Xem thêm". */
export const INITIAL_ITEMS_PER_DAY = 3;

/** Số lần gặp tối thiểu để một âm có tỷ lệ lỗi (BR-TH-11); trùng ngưỡng của backend. */
export const MIN_PHONEME_ENCOUNTERS = 5;

/** Khoảng trên địa chỉ trang; giá trị lạ về mặc định 30 ngày. */
export function parseRange(raw: string | null): StatsRange {
  return RANGES.find((r) => r === raw) ?? DEFAULT_RANGE;
}

/** Bộ lọc chế độ của Lịch sử luyện tập; giá trị lạ về "Tất cả". */
export function parseHistoryMode(raw: string | null): HistoryMode {
  return HISTORY_MODES.find((m) => m === raw) ?? "all";
}

/** Trang trên địa chỉ đánh số từ 1; trả về chỉ số từ 0, giá trị sai về trang đầu. */
export function parsePage(raw: string | null): number {
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 1 ? n - 1 : 0;
}

/** Lớp màu của một ô âm vị theo mức (BR-TH-09); dùng token của hệ thống thiết kế. */
export function phonemeTone(level: PhonemeLevel): string {
  switch (level) {
    case "good":
      return "border-success/40 bg-success/10 text-success";
    case "attention":
      return "border-warning/40 bg-warning/10 text-warning";
    case "bad":
      return "border-danger/40 bg-danger/10 text-danger";
    default:
      return "border-border bg-surface text-text-subtle";
  }
}

/** Tách bản đồ thành nhóm "Nguyên âm đơn & đôi" và "Phụ âm", giữ thứ tự chuẩn của bảng 44 âm vị. */
export function splitPhonemes(cells: PhonemeCell[]): { vowels: PhonemeCell[]; consonants: PhonemeCell[] } {
  return {
    vowels: cells.filter((c) => c.kind !== "consonant"),
    consonants: cells.filter((c) => c.kind === "consonant"),
  };
}

/** Phần trăm bề rộng của ba đoạn trên thanh lỗi; tổng các đoạn bằng tỷ lệ lỗi của nhóm. */
export interface ErrorSegments {
  omitted: number;
  substituted: number;
  misspelled: number;
}

/**
 * Chia thanh lỗi của một nhóm từ thành ba nguyên nhân (BR-TH-05). Từ đã lộ do xin gợi ý là từ học viên chưa tự viết
 * được nên gộp vào "Bỏ sót". Nhóm chưa gặp từ nào thì cả ba đoạn bằng 0.
 */
export function errorSegments(row: DictationErrorRow): ErrorSegments {
  if (row.opportunities <= 0) return { omitted: 0, substituted: 0, misspelled: 0 };
  const pct = (n: number) => (n * 100) / row.opportunities;
  return {
    omitted: pct(row.omitted + row.revealed),
    substituted: pct(row.substituted),
    misspelled: pct(row.misspelled),
  };
}

/**
 * Điểm của đường xu hướng lỗi 8 tuần cho SVG `viewBox="0 0 width height"`: trục dọc là tỷ lệ lỗi 0–100%. Tuần không có
 * lần gặp nào bị bỏ qua nên đường nối hai tuần có dữ liệu thay vì tụt về 0.
 */
export function trendPoints(trend: WeekPoint[], width: number, height: number, padding = 4): string {
  if (trend.length === 0) return "";
  const step = trend.length > 1 ? width / (trend.length - 1) : 0;
  return trend
    .flatMap((point, i) => {
      if (point.errorPercent === null) return [];
      const y = padding + ((100 - point.errorPercent) / 100) * (height - 2 * padding);
      return [`${(i * step).toFixed(1)},${y.toFixed(1)}`];
    })
    .join(" ");
}

/** Điểm của đường điểm phát âm trung bình (0–100) cho SVG `viewBox="0 0 width height"`; một mốc duy nhất vẽ ở giữa. */
export function scorePoints(scores: ScorePoint[], width: number, height: number, padding = 4): string {
  if (scores.length === 0) return "";
  const step = scores.length > 1 ? width / (scores.length - 1) : 0;
  const x = (i: number) => (scores.length > 1 ? i * step : width / 2);
  return scores
    .map((p, i) => `${x(i).toFixed(1)},${(padding + ((100 - p.averageScore) / 100) * (height - 2 * padding)).toFixed(1)}`)
    .join(" ");
}

/** Số tuần có dữ liệu trong xu hướng. */
export function weeksWithData(trend: WeekPoint[]): number {
  return trend.filter((p) => p.errorPercent !== null).length;
}

/** Có đủ tuần có dữ liệu để vẽ một đường (ít nhất hai điểm). */
export function hasTrend(trend: WeekPoint[]): boolean {
  return weeksWithData(trend) >= 2;
}

/** Đường dẫn của nút "Luyện ngay" ở một nhóm từ: bài gần nhất sai nhóm đó, hoặc thư viện Nghe chép (BR-TH-14). */
export function dictationPracticeHref(row: Pick<DictationErrorRow, "practiceLessonId">): string {
  return row.practiceLessonId ? `/student/dictation/${row.practiceLessonId}` : "/student/dictation";
}

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

/** Mức màu của một ngày trên lịch nhiệt: 0, 1 đến 4, 5 đến 9, 10 đến 19, từ 20 hoạt động (BR-TH-15). */
export function heatLevel(count: number): HeatLevel {
  if (count <= 0) return 0;
  if (count < 5) return 1;
  if (count < 10) return 2;
  if (count < 20) return 3;
  return 4;
}

export interface HeatCell {
  date: string;
  count: number;
  level: HeatLevel;
}

const DAY_MS = 86_400_000;

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Chia các ngày từ `from` (thứ Hai) đến `to` thành các cột tuần, mỗi cột 7 ô từ thứ Hai đến Chủ nhật. Ngày sau `to`
 * chưa tới nên là null. Ngày không có trong `days` là 0 hoạt động.
 */
/** Số ngày của Lịch nhiệt, tính cả hôm nay (BR-TH-15); trùng hằng số của backend. */
export const ACTIVITY_WINDOW_DAYS = 90;

/** Ngày đầu tiên của cửa sổ 90 ngày kết thúc ở `to`. */
export function activityWindowStart(to: string): string {
  return addDays(to, -(ACTIVITY_WINDOW_DAYS - 1));
}

/**
 * Lưới tuần của Lịch nhiệt, mỗi cột bắt đầu từ thứ Hai. Ô trước `windowStart` (đầu cột đầu tiên) hoặc sau `to` để trống
 * nên số ô có ngày đúng bằng số ngày của cửa sổ.
 */
export function buildHeatWeeks(
  from: string,
  to: string,
  days: ActivityDay[],
  windowStart: string = from,
): (HeatCell | null)[][] {
  const counts = new Map(days.map((d) => [d.date, d.count]));
  const weeks: (HeatCell | null)[][] = [];
  for (let start = from; start <= to; start = addDays(start, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(start, i);
        if (date > to || date < windowStart) return null;
        const count = counts.get(date) ?? 0;
        return { date, count, level: heatLevel(count) };
      }),
    );
  }
  return weeks;
}

/** Số ngày có ít nhất một hoạt động trong lịch. */
export function activeDayCount(days: ActivityDay[]): number {
  return days.filter((d) => d.count > 0).length;
}

/** Tổng hợp nhanh cho Lịch nhiệt 90 ngày: số ngày có học, tổng hoạt động và kỷ lục hoạt động trong 1 ngày. */
export function activitySummary(days: ActivityDay[]): {
  activeDays: number;
  totalActivities: number;
  bestDayCount: number;
} {
  return {
    activeDays: activeDayCount(days),
    totalActivities: days.reduce((sum, d) => sum + Math.max(0, d.count), 0),
    bestDayCount: days.reduce((max, d) => Math.max(max, d.count), 0),
  };
}

export interface HistoryDateGroup {
  dayKey: string;
  items: HistoryItem[];
}

/** Kiểm tra một dòng lịch sử có khớp bộ lọc chế độ (`mode`) đang chọn hay không (BR-TH-07). */
export function matchesHistoryMode(item: HistoryItem, mode: HistoryMode): boolean {
  if (mode === "all") return true;
  if (mode === "vocab") return item.type === "vocab";
  if (mode === "ai") return item.type === "ai";
  return item.type === "practice" && item.mode === mode;
}

/**
 * Ngày lịch (`YYYY-MM-DD`) theo múi giờ địa phương của dòng lịch sử. Ưu tiên trường `day` từ backend;
 * nếu thiếu thì đổi từ `at` theo giờ địa phương (không cắt chuỗi UTC `slice(0, 10)` để tránh lệch ngày lúc 00:00–07:00).
 */
export function itemLocalDayKey(item: HistoryItem, timeZone?: string): string {
  if (item.day) return item.day;
  const parsed = new Date(item.at);
  if (Number.isNaN(parsed.getTime())) return item.at.slice(0, 10);
  return dayKeyInZone(parsed, timeZone);
}

/** Ngày lịch `YYYY-MM-DD` của một thời điểm theo múi giờ `timeZone` (múi giờ hồ sơ học viên); thiếu hoặc sai thì dùng giờ trình duyệt. */
export function dayKeyInZone(date: Date, timeZone?: string): string {
  const format = (zone?: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  try {
    return format(timeZone);
  } catch {
    return format(undefined);
  }
}

/** Ngày lịch liền trước `dayKey` (`YYYY-MM-DD`), tính trên lịch nên không phụ thuộc múi giờ hay giờ mùa hè. */
export function previousDayKey(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Lọc các dòng khớp `mode`, gom theo từng ngày có hoạt động (mới nhất trước) và giới hạn tối đa `maxDays` ngày mỗi trang.
 * Ngày không có hoạt động nào khớp `mode` sẽ hoàn toàn không xuất hiện.
 */
export function groupHistoryByDate(
  items: HistoryItem[],
  mode: HistoryMode = "all",
  maxDays: number = HISTORY_DAYS_PER_PAGE,
  timeZone?: string,
): HistoryDateGroup[] {
  const byDay = new Map<string, HistoryItem[]>();
  for (const item of items) {
    if (!matchesHistoryMode(item, mode)) continue;
    const dayKey = itemLocalDayKey(item, timeZone);
    const list = byDay.get(dayKey);
    if (list) {
      list.push(item);
    } else {
      byDay.set(dayKey, [item]);
    }
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, Math.max(1, maxDays))
    .map(([dayKey, dayItems]) => ({ dayKey, items: dayItems }));
}

/** Màu huy hiệu điểm/độ chính xác trên dòng lịch sử: >= 80 xanh lá, 50–79 vàng, < 50 đỏ. */
export function scoreBadgeTone(score: number): "success" | "warning" | "danger" {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

/** Chênh lệch có dấu: "+5", "-3" hoặc "0" (BR-TH-13). */
export function signedDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

/** Đường dẫn của nút "Luyện ngay": bài gần nhất đọc sai âm đó, hoặc thư viện Shadowing nếu không có (BR-TH-10). */
export function practiceHref(detail: Pick<PhonemeDetail, "practiceLessonId">): string {
  return detail.practiceLessonId ? `/student/shadowing/${detail.practiceLessonId}` : "/student/shadowing";
}

/**
 * Nơi mở lại nội dung của một dòng lịch sử; null khi nội dung gốc không còn mở được (BR-TH-06): dòng vẫn hiện kết quả
 * nhưng không có nút mở.
 */
export function historyHref(item: HistoryItem): string | null {
  if (!item.available) return null;
  if (item.type === "practice" && item.lessonId) return `/student/${item.mode}/${item.lessonId}`;
  if (item.type === "ai" && item.lessonId) return `/student/lessons/${item.lessonId}/ai`;
  if (item.type === "vocab") {
    if (item.deckKind === "saved") return "/student/mywords";
    if (item.deckId && item.deckKind === "personal") return `/student/vocab/mine/${item.deckId}`;
    if (item.deckId) return `/student/vocab/${item.deckId}`;
  }
  return null;
}

/** Chế độ luyện câu của một dòng `practice`; null với dòng thuộc loại khác. */
export function practiceKind(item: HistoryItem): PracticeKind | null {
  if (item.type !== "practice") return null;
  return item.mode === "dictation" || item.mode === "shadowing" ? item.mode : null;
}

/** Tỷ lệ phần trăm làm tròn; 0 khi mẫu số bằng 0. */
export function percentOf(part: number, whole: number): number {
  return whole > 0 ? Math.round((part * 100) / whole) : 0;
}
