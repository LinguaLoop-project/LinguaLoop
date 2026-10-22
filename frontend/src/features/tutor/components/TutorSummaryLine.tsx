import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import type { TutorSummary } from "../types";
import { practiced } from "../utils";

/** Dòng "Gia sư: things 54 → 86 ✓" dưới kết quả câu sau một phiên; điểm của Lượt shadowing gốc không đổi. */
export default function TutorSummaryLine({ summary }: { summary: TutorSummary }) {
  const { t } = useTranslation("pages");
  const done = practiced(summary.words);
  if (done.length === 0) return null;

  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-primary-soft px-3 py-2 text-sm">
      <Icon name="bot" className="text-primary" />
      <b>{t("student.tutor.lesson.summary")}</b>
      {done.map((w) => (
        <span key={w.word} className="inline-flex items-center gap-1">
          {w.word} {Math.round(w.baseline)} → {w.best !== undefined ? Math.round(w.best) : "—"}
          {w.status === "passed" && <Icon name="check" className="text-success" />}
          {w.status === "needs_practice" && <Icon name="rotate-cw" className="text-warning" />}
        </span>
      ))}
    </p>
  );
}
