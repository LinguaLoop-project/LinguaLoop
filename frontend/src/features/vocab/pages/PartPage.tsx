import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import Button from "@/components/common/Button";
import ErrorState from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import { useQuotaStore } from "@/stores/quotaStore";
import { vocabApi } from "../api";
import { answerQueue } from "../answerQueue";
import LearnSession from "../components/learn/LearnSession";
import type { AnswerDraft } from "../components/learn/shared";
import { usePart } from "../hooks";
import { LEARN_MODES, loadMode, saveMode } from "../learn";
import type { AnswerInput, DeckPart, LearnMode, PartDetail } from "../types";
import { deckUrl, nextPartIndex, partState, partUrl, visibleParts } from "../utils";

const MODE_ICONS: Record<LearnMode, string> = {
  guess: "keyboard",
  flashcard: "layers",
  quiz: "list-ordered",
  reverse_quiz: "arrow-left-right",
  repeat: "volume-2",
};

const SIDE_WINDOW = 12;

/** Danh sách phần của bộ ở bên cạnh: phần đang học, phần đã xong, phần bị khoá. */
function PartsNav({ detail }: { detail: PartDetail }) {
  const { t, i18n } = useTranslation("vocab");
  const openUpgrade = useQuotaStore((s) => s.setShowUpgradeModal);
  const next = nextPartIndex(detail.parts);
  const shown = visibleParts(detail.parts, detail.index, false, SIDE_WINDOW);
  const vi = i18n.language.startsWith("vi");

  const label = (part: DeckPart) => (vi ? part.nameVi : null) ?? part.name;

  return (
    <nav aria-label={t("learn.partsNav")} className="flex flex-col gap-0.5">
      <div className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
        {t("learn.partsNav")}
        {detail.parts.length > SIDE_WINDOW && (
          <span className="ml-1 font-medium normal-case tracking-normal">
            · {t("learn.partsRange", { from: shown.from + 1, to: shown.to, total: detail.parts.length })}
          </span>
        )}
      </div>
      {shown.items.map((part) => {
        const state = partState(part, next);
        const current = part.index === detail.index;
        const icon = state === "locked" ? "lock" : state === "done" ? "circle-check" : "play";
        const className = `flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
          current ? "bg-primary-soft font-semibold text-text" : "text-text-muted hover:bg-surface-hover hover:text-text"
        } ${state === "locked" ? "opacity-70" : ""}`;
        const content = (
          <>
            <Icon name={icon} className={`h-4 w-4 flex-none ${state === "done" ? "text-success" : ""}`} />
            <span className="min-w-0 flex-1 truncate">
              {part.index + 1}. {label(part)}
            </span>
          </>
        );
        return state === "locked" ? (
          <button key={part.index} type="button" className={className} onClick={() => openUpgrade(true, "pro")}>
            {content}
          </button>
        ) : (
          <Link key={part.index} to={partUrl(detail.deck.slug, part.index)} className={className} aria-current={current ? "page" : undefined}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

function Loading() {
  const { t } = useTranslation("vocab");
  return (
    <div role="status" aria-label={t("learn.loading")} className="flex flex-col gap-4">
      <Skeleton className="h-[72px] rounded-lg" />
      <Skeleton className="h-[360px] rounded-lg" />
    </div>
  );
}

/** Phần bị khoá với gói Free (server trả 403): mời nâng cấp thay vì hiện lỗi. */
function Locked({ slug }: { slug: string }) {
  const { t } = useTranslation("vocab");
  const openUpgrade = useQuotaStore((s) => s.setShowUpgradeModal);
  return (
    <EmptyState
      icon="crown"
      title={t("learn.locked.title")}
      description={t("learn.locked.desc")}
    >
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button leftIcon={<Icon name="crown" />} onClick={() => openUpgrade(true, "pro")}>
          {t("learn.locked.unlock")}
        </Button>
        <Link to={deckUrl(slug)} className={buttonClasses({ variant: "ghost" })}>
          {t("learn.locked.back")}
        </Link>
      </div>
    </EmptyState>
  );
}

/** Trang `/student/vocab/:deckId/parts/:part` (UC-VOCAB-05): học từ mới một phần bằng một trong năm cách học. */
export default function PartPage() {
  const { t, i18n } = useTranslation("vocab");
  const params = useParams();
  const slug = params.deckId;
  const partNumber = Number(params.part);
  const query = usePart(slug, partNumber);
  const [mode, setMode] = useState<LearnMode>(loadMode);

  // Mở phiên học khi tải xong phần (không mở cho phần bị khoá). Dùng truy vấn để StrictMode không mở hai phiên.
  const session = useQuery({
    queryKey: ["vocab", "session", slug, partNumber],
    queryFn: () => vocabApi.openSession(slug!, partNumber),
    enabled: query.isSuccess,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const sessionId = session.data ?? null;

  // Câu trả lời đến trước khi có phiên (hiếm) được giữ lại rồi gửi khi phiên mở xong.
  const early = useRef<AnswerInput[]>([]);
  const submit = (answer: AnswerDraft) => {
    const full: AnswerInput = { ...answer, answerId: crypto.randomUUID() };
    if (sessionId) answerQueue.enqueue(sessionId, full);
    else early.current.push(full);
  };
  useEffect(() => {
    if (!sessionId) return;
    for (const answer of early.current.splice(0)) answerQueue.enqueue(sessionId, answer);
  }, [sessionId]);

  const changeMode = (value: string) => {
    setMode(value as LearnMode);
    saveMode(value as LearnMode);
    // Nút vừa bấm giữ focus sẽ nuốt phím Enter, Space của màn học; bỏ focus để phím tắt dùng được ngay.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const back = (
    <Link to={slug ? deckUrl(slug) : "/student/vocab"} className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
      <Icon name="arrow-left" className="h-4 w-4" />
      {t("detail.back")}
    </Link>
  );

  if (!slug) return null;
  if (query.isPending) return <section className="w-full">{back}<Loading /></section>;

  if (query.isError) {
    const status = isAxiosError(query.error) ? query.error.response?.status : undefined;
    return (
      <section className="w-full">
        {back}
        {status === 403 ? (
          <Locked slug={slug} />
        ) : status === 404 ? (
          <ErrorState
            kind="notFound"
            action={<Link to={deckUrl(slug)} className={buttonClasses({ variant: "ghost" })}>{t("learn.locked.back")}</Link>}
          />
        ) : (
          <ErrorState
            kind={isAxiosError(query.error) && !query.error.response ? "network" : "server"}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        )}
      </section>
    );
  }

  const detail = query.data;
  const vi = i18n.language.startsWith("vi");
  const partName = (vi ? detail.nameVi : null) ?? detail.name;
  const deckName = (vi ? detail.deck.nameVi : null) ?? detail.deck.name;
  const upcoming = detail.parts[detail.index + 1];
  const nextPartHref = upcoming && !upcoming.locked ? partUrl(detail.deck.slug, upcoming.index) : null;

  return (
    <section className="w-full" id="v-part">
      {back}
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 truncate text-xs font-bold uppercase tracking-wider text-fn-vocab">{deckName}</div>
          <h1 className="text-[28px]">{t("learn.partTitle", { number: detail.index + 1, name: partName })}</h1>
        </div>
        <div className="max-w-full overflow-x-auto">
          <SegmentedControl
            ariaLabel={t("learn.modeLabel")}
            value={mode}
            onChange={changeMode}
            options={LEARN_MODES.map((value) => ({
              value,
              label: t(`learn.modes.${value}`),
              icon: <Icon name={MODE_ICONS[value]} className="h-4 w-4" />,
            }))}
          />
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="order-2 rounded-lg border border-border bg-surface p-2 lg:order-1">
          <PartsNav detail={detail} />
        </aside>
        <div className="order-1 min-w-0 lg:order-2">
          {detail.cards.length === 0 ? (
            <EmptyState title={t("learn.empty.title")} description={t("learn.empty.desc")} />
          ) : (
            <LearnSession
              mode={mode}
              cards={detail.cards}
              partNumber={detail.index + 1}
              nextPartHref={nextPartHref}
              deckHref={deckUrl(detail.deck.slug)}
              onAnswer={submit}
            />
          )}
        </div>
      </div>
    </section>
  );
}
