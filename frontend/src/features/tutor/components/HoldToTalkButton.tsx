import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";

export interface HoldToTalkButtonProps {
  holding: boolean;
  onStart: () => void;
  onStop: () => void;
}

/**
 * Nút giữ để đọc: đang giữ nghĩa là đang ghi âm cho Azure chấm, thả ra là gửi. Dùng được bằng chuột, cảm ứng và bàn
 * phím (giữ Space hoặc Enter khi nút đang được chọn; Space ở cấp trang do TutorPanel xử lý).
 */
export default function HoldToTalkButton({ holding, onStart, onStop }: HoldToTalkButtonProps) {
  const { t } = useTranslation("pages");
  const label = holding ? t("student.tutor.scoring.holding") : t("student.tutor.scoring.hold");
  return (
    <button
      type="button"
      aria-pressed={holding}
      aria-label={label}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onStart();
      }}
      onPointerUp={onStop}
      onPointerCancel={onStop}
      onBlur={onStop}
      onKeyDown={(event) => {
        if ((event.key === " " || event.key === "Enter") && !event.repeat) {
          event.preventDefault();
          onStart();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          onStop();
        }
      }}
      onContextMenu={(event) => event.preventDefault()}
      style={{ touchAction: "none" }}
      className={`relative grid h-[88px] w-[88px] cursor-pointer select-none place-items-center rounded-full border-none bg-fn-shadowing text-on-fn shadow-[0_6px_18px_color-mix(in_srgb,var(--fn-shadowing)_40%,transparent)] transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${
        holding ? "scale-110 ring-4 ring-fn-shadowing/40 motion-safe:animate-pulse" : ""
      }`}
    >
      <Icon name="mic" className="text-4xl" />
    </button>
  );
}
