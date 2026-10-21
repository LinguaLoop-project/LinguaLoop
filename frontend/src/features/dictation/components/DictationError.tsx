import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buttonClasses } from "@/components/common/buttonStyles";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import { errorKind } from "../utils";

export interface DictationErrorProps {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
}

/** Lỗi khi tải bài: mất mạng, không tìm thấy, bài Pro bị khoá hoặc lỗi máy chủ; luôn có đường về thư viện. */
export default function DictationError({ error, onRetry, retrying }: DictationErrorProps) {
  const { t } = useTranslation("dictation");
  const { kind, code } = errorKind(error);
  const back = (
    <Link to="/student/lessons" className={buttonClasses({ variant: "ghost" })}>
      {t("backToLessons")}
    </Link>
  );

  if (kind === "pro") {
    return (
      <div
        role="alert"
        className="flex flex-col items-center rounded-lg border border-border bg-surface px-6 py-12 text-center shadow-[var(--shadow-card)]"
      >
        <Icon name="crown" className="h-12 w-12 text-warning" />
        <h2 className="mt-3 font-display text-2xl font-bold">{t("state.proTitle")}</h2>
        <p className="mt-2 max-w-md text-text-muted">{t("state.proDesc")}</p>
        <div className="mt-6">{back}</div>
      </div>
    );
  }

  return (
    <ErrorState
      kind={kind}
      code={kind === "server" ? code : undefined}
      onRetry={kind === "notFound" ? undefined : onRetry}
      retrying={retrying}
      action={back}
    />
  );
}
