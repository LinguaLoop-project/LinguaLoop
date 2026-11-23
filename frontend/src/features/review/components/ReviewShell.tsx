import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import ProgressBar from "@/components/common/ProgressBar";
import type { StepState } from "../flow";
import { useScrollTopOn } from "../hooks";

export interface ShellStep {
  key: "cards" | "sentences";
  state: StepState;
  /** Chữ trên chip, vd "Thẻ" hoặc "Câu 2/4". */
  label: string;
}

export interface ReviewShellProps {
  title: string;
  /** Các chặng của phiên; một chặng thì thanh tiến độ chung chỉ có một chip. */
  steps: ShellStep[];
  /** 0–100: tiến độ của chặng đang làm, hiện dưới các chip. */
  percent?: number;
  progressLabel?: string;
  /** Có thì hiện nút "Thoát"; không có (vd chặng thẻ, đã có nút thoát riêng) thì ẩn. */
  onExit?: () => void;
  /** Đích quay về ở góc trên trái (mặc định `/student`). */
  backTo?: string;
  /** Nhãn của link quay về (mặc định `t("backToToday")`). */
  backLabel?: string;
  /** Đổi giá trị này (chặng, số câu đã xong) thì trang cuộn về đầu. */
  scrollKey: string | number;
  children: ReactNode;
}

const CHIP: Record<StepState, string> = {
  active: "border-primary bg-primary-soft font-semibold text-text",
  done: "border-success/40 bg-success/10 text-success",
  todo: "border-border text-text-muted",
};

/** Khung dùng chung của phiên ôn: tiêu đề, thanh tiến độ nối các chặng (thẻ rồi câu) và nút thoát. */
export default function ReviewShell({
  title,
  steps,
  percent,
  progressLabel,
  onExit,
  backTo = "/student",
  backLabel,
  scrollKey,
  children,
}: ReviewShellProps) {
  const { t } = useTranslation("review");
  useScrollTopOn(scrollKey);
  return (
    <section className="flex w-full flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary-text">
            <Icon name="arrow-left" />
            {backLabel ?? t("backToToday")}
          </Link>
          <h1 className="font-display text-2xl font-bold leading-tight">{title}</h1>
        </div>
        {onExit && (
          <Button variant="ghost" size="sm" leftIcon={<Icon name="log-out" />} onClick={onExit}>
            {t("exit")}
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-2">
        <ol className="flex flex-wrap items-center gap-2" aria-label={t("stepsLabel")}>
          {steps.map((step, i) => (
            <li key={step.key} className="flex items-center gap-2">
              {i > 0 && <Icon name="chevron-right" className="text-text-subtle" />}
              <span
                aria-current={step.state === "active" ? "step" : undefined}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] ${CHIP[step.state]}`}
              >
                {step.state === "done" && <Icon name="check" className="text-sm" />}
                {step.label}
              </span>
            </li>
          ))}
        </ol>
        {percent !== undefined && <ProgressBar value={percent} tone="primary" thin label={progressLabel ?? t("stepsLabel")} />}
      </div>

      {children}
    </section>
  );
}
