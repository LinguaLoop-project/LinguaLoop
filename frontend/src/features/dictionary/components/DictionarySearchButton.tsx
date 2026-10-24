import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import DictionarySearchDialog from "./DictionarySearchDialog";

/** Nút mở hộp tra từ điển; đặt ở thanh trên để dùng được ở mọi trang. */
export default function DictionarySearchButton() {
  const { t } = useTranslation("dictionary");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" iconOnly aria-label={t("open")} title={t("open")} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <Icon name="book-open-text" />
      </Button>
      {/* Portal ra body: thanh trên có backdrop-filter nên phần tử fixed bên trong sẽ bị nhốt trong thanh trên. */}
      {open && createPortal(<DictionarySearchDialog onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
