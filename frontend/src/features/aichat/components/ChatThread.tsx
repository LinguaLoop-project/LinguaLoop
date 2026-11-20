import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { ClickableText } from "@/features/dictionary";
import type { ChatMessage } from "../types";

export interface ChatThreadProps {
  messages: ChatMessage[];
  /** Gia sư đang soạn câu trả lời: hiện ba chấm sau câu của học viên. */
  thinking: boolean;
  /** Mở lại bản cũ chỉ đọc: không cuộn xuống cuối. */
  readOnly?: boolean;
}

function TutorBubble({ message }: Readonly<{ message: ChatMessage }>) {
  const { t } = useTranslation("aichat");
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden="true" className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-text">
        <Icon name="bot" className="size-5" />
      </span>
      <div className="min-w-0 max-w-[min(100%,40rem)]">
        <p className="mb-1 text-xs font-semibold text-text-muted">{t("thread.tutor")}</p>
        <p className="rounded-lg rounded-tl-sm border border-border bg-surface px-4 py-3 text-[15px] leading-relaxed">
          <ClickableText text={message.text} />
        </p>
        {message.hint && (
          <p className="mt-2 flex gap-2 rounded-md bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] px-3 py-2 text-[13px] leading-relaxed">
            <Icon name="lightbulb" className="mt-0.5 size-4 shrink-0 text-warning" />
            <span className="whitespace-pre-line">
              <b>{t("thread.hint")}: </b>
              {message.hint}
            </span>
          </p>
        )}
      </div>
    </li>
  );
}

function StudentBubble({ message }: Readonly<{ message: ChatMessage }>) {
  const { t } = useTranslation("aichat");
  return (
    <li className="flex flex-col items-end gap-2">
      <div className="max-w-[min(100%,36rem)]">
        <p className="mb-1 flex items-center justify-end gap-1.5 text-xs font-semibold text-text-muted">
          {message.voice && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-primary-text">
              <Icon name="mic" className="size-3" />
              {t("thread.voice")}
            </span>
          )}
          {t("thread.you")}
        </p>
        <p className="rounded-lg rounded-tr-sm bg-primary px-4 py-3 text-[15px] leading-relaxed text-white">{message.text}</p>
      </div>
      {(message.feedback || message.better) && (
        <div className="w-full max-w-[min(100%,36rem)] rounded-lg border border-border border-l-[3px] border-l-primary bg-bg-elevated p-3.5 text-sm leading-relaxed">
          {message.feedback && (
            <p className="whitespace-pre-line">
              <b className="mr-1 text-primary-text">{t("thread.feedback")}:</b>
              {message.feedback}
            </p>
          )}
          {message.better && (
            <p className="mt-2 border-t border-border pt-2">
              <span className="block text-xs font-semibold uppercase tracking-wide text-text-muted">{t("thread.better")}</span>
              <span className="font-medium">
                <ClickableText text={message.better} />
              </span>
            </p>
          )}
        </div>
      )}
    </li>
  );
}

/** Dòng hội thoại giữa gia sư và học viên; tự cuộn xuống tin mới nhất khi đang trò chuyện. */
export default function ChatThread({ messages, thinking, readOnly = false }: Readonly<ChatThreadProps>) {
  const { t } = useTranslation("aichat");
  const boxRef = useRef<HTMLDivElement>(null);

  // Khung có chiều cao cố định và tự cuộn; chỉ cuộn bên trong khung, không kéo cả trang theo tin mới
  useEffect(() => {
    const box = boxRef.current;
    if (!readOnly && box) box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking, readOnly]);

  return (
    <div
      ref={boxRef}
      tabIndex={0}
      aria-label={t("thread.label")}
      className="h-[min(28rem,55vh)] overflow-y-auto overscroll-contain pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <ol className="flex flex-col gap-5" aria-live="polite">
        {messages.map((message) =>
          message.role === "tutor" ? (
            <TutorBubble key={message.id} message={message} />
          ) : (
            <StudentBubble key={message.id} message={message} />
          ),
        )}
        {thinking && (
          <li className="flex items-center gap-2 pl-12 text-sm text-text-muted" role="status">
            <Icon name="loader-circle" className="size-4 animate-spin" />
            {t("thread.thinking")}
          </li>
        )}
      </ol>
    </div>
  );
}
