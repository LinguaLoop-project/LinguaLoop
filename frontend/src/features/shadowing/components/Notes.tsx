import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";

const K = "student.shadowingPractice.notes";

export function MicDeniedNote({ onRetry, onListen }: { onRetry: () => void; onListen: () => void }) {
  const { t } = useTranslation("pages");
  return (
    <div role="alert" className="flex gap-4 rounded-lg border border-warning/40 bg-warning/10 p-4">
      <Mascot mood="encourage" size={64} alt="" className="hidden sm:block" />
      <div className="min-w-0">
        <b>{t(`${K}.micTitle`)}</b>
        <p className="mt-1 text-sm text-text-muted">{t(`${K}.micBody`)}</p>
        <ol className="mt-2 list-decimal pl-5 text-sm text-text-muted">
          <li>{t(`${K}.micStep1`)}</li>
          <li>{t(`${K}.micStep2`)}</li>
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onRetry} leftIcon={<Icon name="rotate-cw" />}>
            {t(`${K}.retry`)}
          </Button>
          <Button variant="text" size="sm" onClick={onListen}>
            {t(`${K}.listenFirst`)}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MessageNote({
  title,
  body,
  onRetry,
}: {
  title?: string;
  body: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation("pages");
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-danger/40 bg-danger/10 p-4">
      <Icon name="triangle-alert" className="text-2xl text-danger" />
      <div className="min-w-48 flex-1">
        {title && <b>{title}</b>}
        <p className={`${title ? "mt-1 " : ""}text-sm text-text-muted`}>{body}</p>
      </div>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} leftIcon={<Icon name="rotate-cw" />}>
          {t(`${K}.retry`)}
        </Button>
      )}
    </div>
  );
}
