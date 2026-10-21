import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import type { PracticeWord } from "../types";
import { NO_RETRY_CODES } from "../utils";

const K = "student.tutor.fallback";

export interface TutorFallbackProps {
  /** Mã lỗi của server khi tạo hoặc bắt đầu phiên; null khi lỗi micro hoặc kết nối. */
  code: string | null;
  reason: string | null;
  words: PracticeWord[];
  isPro: boolean;
  onRetry: () => void;
  onUpgrade: () => void;
}

/** Không mở được gia sư: nói rõ lý do và vẫn cho luyện bằng Mẹo sửa dạng chữ. Phiên không bị trừ lượt. */
export default function TutorFallback({ code, reason, words, isPro, onRetry, onUpgrade }: TutorFallbackProps) {
  const { t } = useTranslation("pages");
  const known = code && NO_RETRY_CODES.has(code);
  const quotaOut = code === "QUOTA_EXCEEDED";

  return (
    <div role="status" className="flex flex-col gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4">
      <div className="flex items-start gap-3">
        <Mascot mood="encourage" size={56} alt="" className="hidden sm:block" />
        <div className="min-w-0 flex-1">
          <b>{t(known ? `${K}.${code}.title` : `${K}.default.title`)}</b>
          <p className="mt-1 text-sm text-text-muted">
            {known ? t(`${K}.${code}.body`) : t(`${K}.default.body`)}
            {!known && reason && <span className="block text-text-subtle">{reason}</span>}
          </p>
        </div>
      </div>
      {words.length > 0 && (
        <>
          <p className="text-sm text-text-muted">{t(`${K}.tipsIntro`)}</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {words.map((w) => (
              <li key={w.word} className="rounded-md bg-bg-elevated px-3 py-2 text-sm">
                <b>{w.word}</b>
                {w.phoneme && <span className="text-text-muted"> /{w.phoneme}/</span>}
                <span className="text-text-muted"> · {Math.round(w.score)}/100</span>
                {w.tipVi && (
                  <p className="mt-1 flex items-start gap-1.5">
                    <Icon name="lightbulb" className="mt-0.5 flex-none text-warning" />
                    {w.tipVi}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="flex flex-wrap gap-2">
        {quotaOut && !isPro && (
          <Button size="sm" onClick={onUpgrade} leftIcon={<Icon name="crown" />}>
            {t(`${K}.upgrade`)}
          </Button>
        )}
        {!known && (
          <Button size="sm" variant="ghost" onClick={onRetry} leftIcon={<Icon name="rotate-cw" />}>
            {t(`${K}.retry`)}
          </Button>
        )}
      </div>
    </div>
  );
}
