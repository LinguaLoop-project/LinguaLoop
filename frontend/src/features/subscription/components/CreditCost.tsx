import { useTranslation } from "react-i18next";
import { useAiEnergy } from "@/hooks/useAiEnergy";
import type { AiAction } from "../types";

export interface CreditCostProps {
  action: AiAction;
  /** Số đơn vị sẽ dùng (gợi ý dịch: số câu). Bỏ trống thì hiện giá một đơn vị. */
  quantity?: number;
  /** Hiện giá theo đơn vị ("1 credit/câu") thay vì tổng. */
  perUnit?: boolean;
  className?: string;
}

/**
 * Giá credit hiện kèm nút trước khi dùng tính năng AI (BR-GA-06). Chưa tải xong giá thì không hiện gì, để không hiện số
 * sai; server vẫn kiểm tra số dư khi bấm.
 */
export default function CreditCost({ action, quantity = 1, perUnit = false, className = "" }: Readonly<CreditCostProps>) {
  const { t } = useTranslation("common");
  const { priceOf } = useAiEnergy();
  const price = priceOf(action);
  if (price === undefined) return null;
  const label = perUnit ? t("credit.costEach", { count: price }) : t("credit.cost", { count: price * quantity });
  return <span className={`font-normal opacity-80 ${className}`}>· {label}</span>;
}
