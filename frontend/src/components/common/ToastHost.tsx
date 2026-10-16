import Button from "./Button";
import Icon from "./Icon";
import { useToastStore } from "@/stores/toastStore";

/** Đặt một lần trong khung chung; hiện thông báo từ `toast()` ở đáy giữa màn hình. */
export default function ToastHost() {
  const { message, icon, action, hide } = useToastStore();
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-7 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-md border border-border-strong bg-surface px-4 py-3 shadow-[var(--shadow-card)] transition-[opacity,transform] duration-200 ${
        message ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-5 opacity-0"
      }`}
    >
      {message && (
        <>
          <Icon name={icon} />
          <span>{message}</span>
          {action && (
            <Button
              variant="text"
              size="sm"
              onClick={() => {
                action.onClick();
                hide();
              }}
            >
              {action.label}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
