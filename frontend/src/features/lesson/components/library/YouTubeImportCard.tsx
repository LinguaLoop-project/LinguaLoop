import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import SearchInput from "@/components/common/SearchInput";

const TOAST_MS = 4000;

/** Khối "Tạo bài từ video YouTube" (Pro, AI). Hiện mới là phần giao diện: chưa gọi API tạo bài. */
export default function YouTubeImportCard() {
  const { t } = useTranslation("pages");
  const [url, setUrl] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const create = () => {
    if (!url.trim()) return;
    setToast(
      t(
        "student.lessons.ytCard.toast",
        "AI đang tách câu và ước lượng trình độ… Bài sẽ chờ duyệt trước khi công khai",
      ),
    );
    setUrl("");
  };

  return (
    <div className="mb-8">
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm font-medium text-text shadow-[var(--shadow-card)]"
        >
          <Icon name="wand-sparkles" className="text-lg text-primary-text" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-5 rounded-3xl border border-border-strong bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6 lg:flex-nowrap">
        <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-md bg-danger/15 text-[28px] text-danger">
          <Icon name="video" />
        </div>
        <div className="min-w-[260px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-text">{t("student.lessons.ytCard.title", "Tạo bài từ video YouTube")}</h3>
            <Badge variant="primary">
              <Icon name="sparkles" />
              AI
            </Badge>
            <Badge variant="pro">
              <Icon name="crown" fill />
              PRO
            </Badge>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-text-muted sm:text-[15px]">
            {t(
              "student.lessons.ytCard.desc",
              "Dán link video tiếng Anh, AI tách câu, gắn mốc thời gian và ước lượng trình độ. Bài được duyệt trước khi hiện công khai.",
            )}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto lg:flex-[0_1_460px]">
          <SearchInput
            className="flex-1"
            placeholder={t("student.lessons.ytCard.placeholder", "https://youtube.com/watch?v=…")}
            ariaLabel="Link YouTube"
            icon={<Icon name="link" />}
            value={url}
            onChange={setUrl}
            onKeyDown={(e) => {
              if (e.key === "Enter") create();
            }}
          />
          <Button
            data-act="ytCreate"
            onClick={create}
            leftIcon={<Icon name="wand-sparkles" />}
            className="w-full justify-center sm:w-auto"
          >
            {t("student.lessons.ytCard.createBtn", "Tạo bài")}
          </Button>
        </div>
      </div>
    </div>
  );
}
