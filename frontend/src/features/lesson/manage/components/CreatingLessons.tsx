import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { youTubeThumbnail } from "@/lib/youtube";
import { dismissJob, retryJob, useCreateJobs, type CreateJob } from "../createJobs";
import { errorMessage } from "../errors";
import { TEACHER_LESSONS_PATH } from "../paths";
import type { CreateLessonInput } from "../types";
import { useCreateCallbacks } from "../useCreateCallbacks";
import { MetaChip } from "./LessonBits";

/** Lỗi tạm thời (mạng, máy chủ, dịch vụ ngoài bận): thử lại với đúng dữ liệu cũ có thể thành công. */
const isTransient = (job: CreateJob) =>
  job.error?.kind === "network" || job.error?.kind === "server" || job.error?.kind === "unknown";

function useElapsed(since: number, running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Các bài đang tạo hoặc tạo lỗi, hiện ở đầu danh sách bài (UC-BH-03). Lỗi giữ nguyên dữ liệu đã nhập: thử lại ngay, hoặc
 * đưa về thẻ tạo bài để sửa.
 */
export default function CreatingLessons({ onEdit }: Readonly<{ onEdit: (input: CreateLessonInput) => void }>) {
  const jobs = useCreateJobs((s) => s.jobs);
  if (jobs.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2.5" aria-live="polite">
      {jobs.map((job) => (
        <CreatingRow key={job.key} job={job} onEdit={onEdit} />
      ))}
    </ul>
  );
}

function CreatingRow({ job, onEdit }: Readonly<{ job: CreateJob; onEdit: (input: CreateLessonInput) => void }>) {
  const { t } = useTranslation("lessonManage");
  const queryClient = useQueryClient();
  const callbacks = useCreateCallbacks();
  const running = job.status === "running";
  const elapsed = useElapsed(job.startedAt, running);
  const ownLessonId = job.error?.code === "LESSON_VIDEO_TAKEN" ? job.error.details.lessonId : undefined;

  return (
    <li
      className={`flex flex-wrap items-center gap-4 rounded-xl border border-dashed bg-surface p-3 sm:flex-nowrap ${
        running ? "border-primary" : "border-danger"
      }`}
    >
      <div className="relative h-[72px] w-32 shrink-0 overflow-hidden rounded-lg bg-bg-elevated">
        {job.youtubeId && <img src={youTubeThumbnail(job.youtubeId)} alt="" className="h-full w-full object-cover" />}
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-2xl text-white">
          <Icon name={running ? "loader-circle" : "circle-alert"} className={running ? "animate-spin" : undefined} />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="truncate text-base font-semibold text-text">{job.input.title || t("create.untitled")}</p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
          <MetaChip icon="folders">{job.topicName ?? "—"}</MetaChip>
          <MetaChip icon="graduation-cap">{job.input.cefrLevel}</MetaChip>
        </div>
        {running ? (
          <p className="text-xs text-text-muted">
            {t("create.working", { elapsed })} <span className="text-text-subtle">· {t("create.canLeave")}</span>
          </p>
        ) : (
          <p className="text-xs text-danger">
            {errorMessage(t, job.error)}{" "}
            {typeof ownLessonId === "string" && (
              <Link className="font-semibold underline" to={`${TEACHER_LESSONS_PATH}/${ownLessonId}`}>
                {t("create.openOwnLesson", { title: String(job.error?.details.title ?? "") })}
              </Link>
            )}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {running ? (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-text">
            {t("create.creating")}
          </span>
        ) : (
          <>
            {isTransient(job) && (
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Icon name="rotate-ccw" />}
                onClick={() => retryJob(job.key, callbacks, queryClient)}
              >
                {t("common.retry")}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Icon name="pencil-line" />}
              onClick={() => {
                dismissJob(job.key);
                onEdit(job.input);
              }}
            >
              {t("create.edit")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              aria-label={t("create.dismiss")}
              title={t("create.dismiss")}
              onClick={() => dismissJob(job.key)}
            >
              <Icon name="x" />
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
