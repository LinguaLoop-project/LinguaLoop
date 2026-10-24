import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Icon from "@/components/common/Icon";
import SearchInput from "@/components/common/SearchInput";
import Skeleton from "@/components/common/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useDictionarySearch } from "../hooks";
import { normalizeWord } from "../utils";
import WordCard from "./WordCard";

const DEBOUNCE_MS = 250;
const TITLE_ID = "dictionary-dialog-title";

export interface DictionarySearchDialogProps {
  onClose: () => void;
}

/** Hộp "Từ điển": gõ để tìm trong kho từ, kết quả hiện đủ nghĩa và phát âm. Mở ra là ô trống; đóng thì bỏ trạng thái. */
export default function DictionarySearchDialog({ onClose }: DictionarySearchDialogProps) {
  const { t } = useTranslation("dictionary");
  const [input, setInput] = useState("");
  const query = normalizeWord(useDebounce(input, DEBOUNCE_MS));
  const search = useDictionarySearch(query);

  const body = () => {
    if (!query) return <p className="py-6 text-center text-[13px] text-text-muted">{t("search.hint")}</p>;
    if (search.isError) {
      return (
        <div className="flex flex-col items-center gap-2 py-6">
          <p className="text-[13px] text-text-muted">{t("lookup.error")}</p>
          <Button variant="ghost" size="sm" isLoading={search.isFetching} onClick={() => void search.refetch()}>
            {t("lookup.retry")}
          </Button>
        </div>
      );
    }
    if (search.isPending) {
      return (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label={t("search.loading")}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      );
    }
    if (search.data.length === 0) {
      return <p className="py-6 text-center text-[13px] text-text-muted">{t("search.empty", { query })}</p>;
    }
    return (
      <ul className={`flex flex-col gap-3 transition-opacity ${search.isPlaceholderData ? "opacity-60" : ""}`}>
        {search.data.map((word) => (
          <li key={word.headword} className="rounded-lg border border-border bg-bg-elevated p-4">
            <WordCard word={word} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID} wide>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={TITLE_ID} className="flex items-center gap-2 text-lg font-bold">
          <Icon name="book-open-text" />
          {t("title")}
        </h2>
        <Button variant="ghost" iconOnly aria-label={t("close")} onClick={onClose}>
          <Icon name="x" />
        </Button>
      </div>
      <SearchInput
        value={input}
        onChange={setInput}
        placeholder={t("search.placeholder")}
        ariaLabel={t("search.aria")}
        autoFocus
        className="mb-4"
      />
      <div aria-live="polite" className="max-h-[58vh] overflow-y-auto pr-1">
        {body()}
      </div>
    </Dialog>
  );
}
