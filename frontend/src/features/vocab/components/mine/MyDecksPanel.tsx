import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import Button from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import type { MyDeck } from "../../myDecks";
import { useMyDecks } from "../../myDecksHooks";
import MyDeckCard from "./MyDeckCard";
import MyDeckDeleteDialog from "./MyDeckDeleteDialog";
import MyDeckDialog from "./MyDeckDialog";

const GRID = "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3";

type Dialog = { kind: "add" } | { kind: "rename"; deck: MyDeck } | { kind: "delete"; deck: MyDeck } | null;

/** Mục "Bộ của tôi" ở trang Từ vựng (UC-HT-08): danh sách bộ cá nhân, thêm, đổi tên và xóa. */
export default function MyDecksPanel() {
  const { t } = useTranslation("vocab");
  const query = useMyDecks();
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);

  const header = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 id="my-decks-title" className="text-xl font-bold">
          {t("mine.title")}
        </h2>
        <p className="text-sm text-text-muted">{t("mine.subtitle")}</p>
      </div>
      <Button leftIcon={<Icon name="plus" />} onClick={() => setDialog({ kind: "add" })}>
        {t("mine.add")}
      </Button>
    </div>
  );

  const body = () => {
    if (query.isPending) {
      return (
        <div role="status" aria-label={t("loading")} className={GRID}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[148px] rounded-lg" />
          ))}
        </div>
      );
    }
    if (query.isError) {
      const offline = isAxiosError(query.error) && !query.error.response;
      return <ErrorState kind={offline ? "network" : "server"} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
    }
    if (query.data.length === 0) {
      return (
        <EmptyState
          icon="layers"
          title={t("mine.empty.title")}
          description={t("mine.empty.desc")}
          actionText={t("mine.add")}
          onAction={() => setDialog({ kind: "add" })}
        />
      );
    }
    return (
      <>
        <div className={GRID}>
          {query.data.map((deck) => (
            <MyDeckCard
              key={deck.id}
              deck={deck}
              onRename={(target) => setDialog({ kind: "rename", deck: target })}
              onDelete={(target) => setDialog({ kind: "delete", deck: target })}
            />
          ))}
        </div>
        <p className="mt-5 text-[13px] text-text-muted">{t("mine.cardsNote")}</p>
      </>
    );
  };

  return (
    <section aria-labelledby="my-decks-title">
      {header}
      {body()}
      {dialog?.kind === "add" && <MyDeckDialog deck={null} onClose={close} onGone={() => void query.refetch()} />}
      {dialog?.kind === "rename" && <MyDeckDialog deck={dialog.deck} onClose={close} onGone={() => void query.refetch()} />}
      {dialog?.kind === "delete" && <MyDeckDeleteDialog deck={dialog.deck} onClose={close} />}
    </section>
  );
}
