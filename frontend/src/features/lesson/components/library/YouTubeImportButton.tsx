import YouTubeLogo from "@/components/common/YouTubeLogo";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import { useAiEnergy } from "@/hooks/useAiEnergy";
import { toast } from "@/stores/toastStore";

/** Nút "Tạo bài từ YouTube" ở đầu trang và hộp thoại của nó (`ytOpen` trong lessons.html). Hiện là phần giao diện, chưa gọi API tạo bài. */
export default function YouTubeImportButton() {
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const { isPro } = useAiEnergy();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const p = "student.lessons.ytCard";

  const submit = () => {
    if (!isPro) {
      setOpen(false);
      navigate("/pricing");
      return;
    }
    setOpen(false);
    setUrl("");
    toast(t(`${p}.toast`, "AI đang tách câu và ước lượng trình độ… Bài sẽ chờ duyệt trước khi công khai"), { icon: "wand-sparkles" });
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <YouTubeLogo className="h-5 w-5" />
        {t(`${p}.openBtn`, "Tạo bài từ YouTube")}
        <Badge variant="pro">
          <Icon name="crown" />
          PRO
        </Badge>
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} labelledBy="yt-title">
        <div className="flex items-center gap-4">
          <Mascot mood="celebrate" size={72} alt="" />
          <div>
            <h2 id="yt-title" className="font-display text-2xl font-bold leading-[1.3] tracking-[-0.01em]">
              {t(`${p}.title`, "Tạo bài từ video YouTube")}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="primary">
                <Icon name="sparkles" />
                AI
              </Badge>
              <Badge variant="pro">
                <Icon name="crown" />
                PRO
              </Badge>
            </div>
          </div>
        </div>
        <p className="mt-4 text-text-muted">
          {t(`${p}.desc`, "Dán link video tiếng Anh, AI tách câu, gắn mốc thời gian và ước lượng trình độ. Bài được duyệt trước khi hiện công khai.")}
        </p>
        <div className="relative mt-4">
          <span className="pointer-events-none absolute left-3.5 top-3 text-xl text-text-subtle">
            <Icon name="link" />
          </span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && url.trim() && submit()}
            placeholder={t(`${p}.placeholder`, "https://youtube.com/watch?v=…")}
            aria-label="Link YouTube"
            autoComplete="off"
            autoFocus
            className="h-11 w-full rounded-md border border-border-strong bg-surface pl-[42px] pr-3.5 text-text outline-none transition-colors placeholder:text-text-subtle focus:border-primary"
          />
        </div>
        {!isPro && (
          <div className="mt-3 flex items-center gap-3 rounded-md bg-primary-soft p-3.5">
            <Icon name="crown" className="h-6 w-6 shrink-0" />
            <span>{t(`${p}.proOnly`, "Tạo bài từ YouTube là tính năng của gói Pro.")}</span>
          </div>
        )}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("student.lessons.cancel", "Huỷ")}
          </Button>
          <Button onClick={submit} leftIcon={<Icon name={isPro ? "wand-sparkles" : "crown"} />}>
            {isPro ? t(`${p}.createBtn`, "Tạo bài") : t("student.lessons.tryPro", "Dùng thử Pro")}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
