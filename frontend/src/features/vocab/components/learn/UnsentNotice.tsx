import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { answerQueue } from "../../answerQueue";

/** Cảnh báo còn câu trả lời chưa gửi được (mất mạng); biến mất khi hàng đợi đã gửi hết (UC-HT-02 4b, UC-HT-03 7a). */
export default function UnsentNotice() {
  const { t } = useTranslation("vocab");
  const unsent = useSyncExternalStore(answerQueue.subscribe, answerQueue.size);
  if (unsent === 0) return null;
  return (
    <p role="status" className="mt-2 inline-flex items-center gap-1.5 text-sm text-warning">
      <Icon name="wifi-off" className="h-4 w-4" />
      {t("learn.unsent", { count: unsent })}
    </p>
  );
}
