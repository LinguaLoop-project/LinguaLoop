import { useNavigate, useLocation } from "react-router-dom";
import { useQuota } from "@/hooks/useQuota";

export interface PlaceholderPageProps {
  title: string;
  description?: string;
  badge?: string;
  icon?: string;
}

function resolveIcon(title: string, customIcon?: string): string {
  if (customIcon) return customIcon.replace(/^ph-/, "");

  const t = title.toLowerCase();
  if (t.includes("bài học") || t.includes("bài giảng")) return "books";
  if (t.includes("chủ đề")) return "folders";
  if (t.includes("từ vựng") || t.includes("bộ từ") || t.includes("thẻ")) return "cards";
  if (t.includes("nghe") || t.includes("dictation")) return "headphones";
  if (t.includes("nói") || t.includes("shadowing") || t.includes("ngữ âm") || t.includes("âm")) return "microphone";
  if (t.includes("người dùng") || t.includes("học viên") || t.includes("giáo viên")) return "users";
  if (t.includes("báo lỗi") || t.includes("báo cáo")) return "flag";
  if (t.includes("kiểm tra") || t.includes("thi") || t.includes("cefr") || t.includes("câu hỏi")) return "exam";
  if (t.includes("nhật ký") || t.includes("lịch sử") || t.includes("audit")) return "clock-counter-clockwise";
  if (t.includes("hạn mức") || t.includes("gói") || t.includes("thuê bao") || t.includes("pro")) return "credit-card";
  if (t.includes("cài đặt") || t.includes("hệ thống")) return "gear-six";
  if (t.includes("hồ sơ")) return "user-circle";
  if (t.includes("thống kê") || t.includes("tiến độ") || t.includes("báo cáo")) return "chart-line-up";
  if (t.includes("lớp")) return "chalkboard-teacher";
  if (t.includes("từ điển")) return "book-open-text";
  if (t.includes("hôm nay")) return "sun-horizon";
  if (t.includes("lưu") || t.includes("đã lưu")) return "bookmarks-simple";
  if (t.includes("điểm yếu")) return "target";
  if (t.includes("soạn")) return "pencil-line";
  return "sparkle";
}

export default function PlaceholderPage({
  title,
  description = "Tính năng này đang được hoàn thiện theo đúng thiết kế và quy trình của LinguaLoop.",
  badge = "Đang phát triển",
  icon,
}: PlaceholderPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkQuota, incrementQuota } = useQuota();
  const iconBase = resolveIcon(title, icon);

  // Xác định trang chủ theo layout
  const homePath = location.pathname.startsWith("/admin")
    ? "/admin"
    : location.pathname.startsWith("/teacher")
    ? "/teacher"
    : "/student";

  const homeLabel = location.pathname.startsWith("/admin")
    ? "Tổng quan Quản trị"
    : location.pathname.startsWith("/teacher")
    ? "Tổng quan Giảng viên"
    : "Về Hôm nay";

  return (
    <div className="w-full py-8 md:py-12 px-4 flex justify-center items-center">
      <div className="relative w-full max-w-2xl p-7 md:p-10 rounded-2xl bg-surface-glass backdrop-blur-xl border border-border-strong shadow-[var(--shadow-card)] overflow-hidden text-center flex flex-col items-center">
        {/* Glow hiệu ứng nền */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.18)_0%,transparent_70%)] pointer-events-none"
          aria-hidden="true"
        />

        {/* Icon đại diện */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-soft border border-[color-mix(in_srgb,var(--primary)_30%,transparent)] text-accent text-3xl shadow-[0_0_24px_rgba(139,92,246,0.22)] mb-4 shrink-0">
          <i className={`ph ph-${iconBase}`} aria-hidden="true" />
        </div>

        {/* Badge trạng thái */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-soft text-accent border border-[color-mix(in_srgb,var(--primary)_25%,transparent)] mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>{badge}</span>
        </div>

        {/* Tiêu đề & Mô tả */}
        <h1 className="text-2xl md:text-3xl font-extrabold font-display text-text tracking-tight mb-2.5">
          {title}
        </h1>
        <p className="text-text-muted text-sm md:text-base leading-relaxed max-w-lg mb-7">
          {description}
        </p>

        {/* Khối xem trước tính năng đang chuẩn bị */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
          <div className="p-3.5 rounded-xl border border-border bg-surface/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-accent text-sm font-semibold">
              <i className="ph ph-layout text-base" aria-hidden="true" />
              <span>Giao diện chuẩn</span>
            </div>
            <p className="text-xs text-text-muted leading-snug">
              Bám sát bộ mockup & hệ màu chuyên sâu.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-accent text-sm font-semibold">
              <i className="ph ph-robot text-base" aria-hidden="true" />
              <span>Hỗ trợ AI</span>
            </div>
            <p className="text-xs text-text-muted leading-snug">
              Phân tầng CEFR, chấm phát âm & gợi ý từ.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-accent text-sm font-semibold">
              <i className="ph ph-arrows-clockwise text-base" aria-hidden="true" />
              <span>Đồng bộ tức thì</span>
            </div>
            <p className="text-xs text-text-muted leading-snug">
              Lưu tiến trình học và số liệu thông suốt.
            </p>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border-strong bg-surface text-text text-sm font-semibold transition-colors duration-150 hover:bg-surface-hover hover:border-text-muted cursor-pointer select-none"
          >
            <i className="ph ph-arrow-left text-base" aria-hidden="true" />
            <span>Quay lại trang trước</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(homePath)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold transition-opacity duration-150 hover:opacity-90 shadow-sm cursor-pointer select-none border-0"
          >
            <i className="ph ph-house text-base" aria-hidden="true" />
            <span>{homeLabel}</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (checkQuota()) {
                incrementQuota();
                alert("Đã thực hiện một hành động thành công!");
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 shadow-sm cursor-pointer select-none border border-purple-200 dark:border-purple-800"
          >
            <i className="ph-fill ph-lightning text-base" aria-hidden="true" />
            <span>Thử Action (Quota)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
