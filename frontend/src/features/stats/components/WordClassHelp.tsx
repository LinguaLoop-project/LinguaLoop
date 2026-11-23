import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

const CLASSES = ["function", "content", "inflected", "number", "proper", "other"] as const;

/** Nút "!" mở phần giải thích ý nghĩa và ví dụ của sáu nhóm từ (BR-TH-12, BR-TH-17). */
export default function WordClassHelp() {
  const { t } = useTranslation("stats");
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("weakness.dictation.help.toggle")}
        title={t("weakness.dictation.help.toggle")}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border text-[13px] font-bold leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          open ? "border-primary bg-primary-soft text-primary-text" : "border-border-strong text-text-muted hover:bg-surface-hover hover:text-text"
        }`}
      >
        !
      </button>
      {open && (
        <div
          id={panelId}
          className="mb-4 mt-1 basis-full rounded-md border border-border bg-bg-elevated p-4 text-sm"
        >
          <p className="text-text-muted">{t("weakness.dictation.help.intro")}</p>
          <dl className="mt-3 flex flex-col gap-3">
            {CLASSES.map((key) => (
              <div key={key}>
                <dt className="font-semibold">{t(`weakness.dictation.class.${key}`)}</dt>
                <dd className="text-text-muted">
                  {t(`weakness.dictation.help.${key}.desc`)}{" "}
                  <span className="text-text">{t("weakness.dictation.help.examples", { list: t(`weakness.dictation.help.${key}.examples`) })}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </>
  );
}
