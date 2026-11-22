import { useQueryClient } from "@tanstack/react-query";
import { useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import CreditCost from "@/features/subscription/components/CreditCost";
import { AI_ACTION_LESSON_IMPORT } from "@/features/subscription/types";
import { parseYouTubeId, youTubeThumbnail } from "@/lib/youtube";
import { toast } from "@/stores/toastStore";
import { isCreating, startCreate } from "../createJobs";
import { errorMessage } from "../errors";
import { useYouTubePreview } from "../hooks";
import { TEACHER_LESSONS_PATH } from "../paths";
import { useCreateCallbacks } from "../useCreateCallbacks";
import { CEFR_LEVELS, type CefrLevel, type CreateLessonInput, type LessonApiError, type TopicOption } from "../types";
import { ToggleChip } from "./LessonBits";

const TITLE_MAX = 100;

type FieldKey = "title" | "topicId" | "cefrLevel";
type FormErrors = Partial<Record<FieldKey, string>>;

interface FormValues {
  youtubeUrl: string;
  topicId: string;
  cefrLevel: CefrLevel | "";
  pro: boolean;
}

/** Tiêu đề giáo viên đã sửa, gắn với video đang xem trước; đổi video thì quay về tên video. */
interface TitleDraft {
  videoId: string;
  value: string;
}

const EMPTY: FormValues = { youtubeUrl: "", topicId: "", cefrLevel: "", pro: false };

const formatDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export interface LessonCreateCardProps {
  topics: TopicOption[];
  /** Điền sẵn khi giáo viên bấm "Sửa lại" một lượt tạo lỗi. */
  initial?: CreateLessonInput | null;
  linkRef?: Ref<HTMLInputElement>;
}

/**
 * Thẻ tạo bài từ link YouTube (UC-BH-03), đặt ngay trên danh sách bài. Dán link thì hệ thống đọc thông tin video và hiện
 * ảnh, tên, thời lượng; giáo viên chọn chủ đề, trình độ rồi bấm "Bắt đầu tạo". Lượt tạo chạy nền ở mức ứng dụng; ô link
 * được xóa để dán link tiếp, chủ đề và trình độ giữ nguyên vì giáo viên hay tạo nhiều bài cùng chủ đề.
 */
export default function LessonCreateCard({ topics, initial, linkRef }: Readonly<LessonCreateCardProps>) {
  const { t } = useTranslation("lessonManage");
  const queryClient = useQueryClient();
  const callbacks = useCreateCallbacks();
  const [values, setValues] = useState<FormValues>(
    initial
      ? { youtubeUrl: initial.youtubeUrl, topicId: initial.topicId, cefrLevel: initial.cefrLevel, pro: initial.pro }
      : EMPTY,
  );
  const [titleDraft, setTitleDraft] = useState<TitleDraft | null>(() => {
    const id = initial ? parseYouTubeId(initial.youtubeUrl) : null;
    return id && initial?.title ? { videoId: id, value: initial.title } : null;
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const set = (patch: Partial<FormValues>) => {
    setValues((v) => ({ ...v, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const key of Object.keys(patch)) delete next[key as FieldKey];
      return next;
    });
  };

  const videoId = parseYouTubeId(values.youtubeUrl);
  const busy = videoId !== null && isCreating(videoId);
  const preview = useYouTubePreview(values.youtubeUrl, busy ? null : videoId);
  const title = titleDraft?.videoId === videoId ? titleDraft.value : (preview.data?.title ?? "");
  const previewError = preview.error as LessonApiError | null;
  const ownLessonId = previewError?.code === "LESSON_VIDEO_TAKEN" ? previewError.details.lessonId : undefined;

  let linkError: string | null = null;
  if (values.youtubeUrl.trim() !== "") {
    if (!videoId) linkError = t("form.linkInvalid");
    else if (busy) linkError = t("create.alreadyCreating");
    else if (preview.isError) linkError = errorMessage(t, preview.error);
  }

  const reset = () => {
    setValues((v) => ({ ...v, youtubeUrl: "" }));
    setTitleDraft(null);
    setErrors({});
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId || !preview.data) return;
    const found: FormErrors = {};
    const length = [...title.trim()].length;
    if (length === 0 || length > TITLE_MAX) found.title = t("form.titleInvalid");
    if (!values.topicId) found.topicId = t("form.topicRequired");
    if (!values.cefrLevel) found.cefrLevel = t("form.levelRequired");
    setErrors(found);
    if (Object.keys(found).length > 0 || !values.cefrLevel) return;
    const input: CreateLessonInput = {
      youtubeUrl: values.youtubeUrl.trim(),
      title: title.trim(),
      topicId: values.topicId,
      cefrLevel: values.cefrLevel,
      pro: values.pro,
    };
    startCreate(input, topics.find((topic) => topic.id === values.topicId)?.name ?? null, callbacks, queryClient);
    reset();
    toast(t("create.started"), { icon: "loader-circle" });
  };

  const selectClass = (error?: string) =>
    `h-10 min-w-0 cursor-pointer rounded-md border bg-surface px-3 text-sm text-text transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-primary ${
      error ? "border-danger" : "border-border"
    }`;

  return (
    <section
      aria-labelledby="lesson-create-title"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-danger text-xl text-white">
            <Icon name="play" />
          </span>
          <div className="min-w-0">
            <h2 id="lesson-create-title" className="flex flex-wrap items-center gap-2 text-lg font-bold text-text">
              {t("create.cardTitle")}
              <Badge>
                <Icon name="sparkles" />
                AI
              </Badge>
            </h2>
            <p className="text-sm text-text-muted">{t("create.cardSubtitle")}</p>
          </div>
        </div>
      </div>

      <form className="flex flex-col gap-3" onSubmit={onSubmit} noValidate>
        <div className="flex flex-col gap-1">
          <div
            className={`flex h-12 min-w-0 items-center gap-2.5 rounded-xl border bg-bg px-3.5 transition-[border-color,box-shadow] focus-within:shadow-[0_0_0_3px_var(--primary-soft)] ${
              linkError ? "border-danger" : "border-border-strong focus-within:border-primary"
            }`}
          >
            <Icon name="link" className="text-xl text-text-subtle" />
            <input
              ref={linkRef}
              id="lesson-link"
              aria-label={t("form.link")}
              aria-invalid={linkError ? true : undefined}
              aria-describedby="lesson-link-msg"
              value={values.youtubeUrl}
              onChange={(e) => set({ youtubeUrl: e.target.value })}
              placeholder={t("create.linkPlaceholder")}
              className="h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] text-text outline-none placeholder:text-text-subtle"
            />
            {values.youtubeUrl && (
              <button
                type="button"
                onClick={reset}
                aria-label={t("create.clearLink")}
                title={t("create.clearLink")}
                className="cursor-pointer rounded text-text-subtle hover:text-text focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Icon name="x" />
              </button>
            )}
          </div>
          <p id="lesson-link-msg" className={`text-xs ${linkError ? "text-danger" : "text-text-subtle"}`}>
            {linkError ?? t("create.limits")}{" "}
            {typeof ownLessonId === "string" && (
              <Link className="font-semibold underline" to={`${TEACHER_LESSONS_PATH}/${ownLessonId}`}>
                {t("create.openOwnLesson", { title: String(previewError?.details.title ?? "") })}
              </Link>
            )}
          </p>
        </div>

        {videoId && !linkError && (
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-bg-elevated p-3 sm:flex-row">
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-bg sm:w-56">
              <img src={youTubeThumbnail(videoId)} alt="" className="h-full w-full object-cover" />
              {preview.data && (
                <span className="absolute right-1.5 bottom-1.5 rounded bg-black/75 px-1.5 py-0.5 font-mono text-xs text-white">
                  {formatDuration(preview.data.durationSec)}
                </span>
              )}
            </div>

            {preview.data ? (
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-text-muted">
                  {t("form.title")}
                  <input
                    value={title}
                    maxLength={120}
                    onChange={(e) => {
                      setTitleDraft({ videoId, value: e.target.value });
                      setErrors((v) => ({ ...v, title: undefined }));
                    }}
                    aria-invalid={errors.title ? true : undefined}
                    className={`h-10 min-w-0 rounded-md border bg-surface px-3 text-[15px] font-semibold text-text ${
                      errors.title ? "border-danger" : "border-border"
                    }`}
                  />
                  {errors.title && <span className="font-normal text-danger">{errors.title}</span>}
                </label>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,9rem)_auto]">
                  <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-text-muted">
                    {t("form.topic")}
                    <select
                      value={values.topicId}
                      onChange={(e) => set({ topicId: e.target.value })}
                      aria-invalid={errors.topicId ? true : undefined}
                      className={selectClass(errors.topicId)}
                    >
                      <option value="">{t("form.choose")}</option>
                      {topics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                    </select>
                    {errors.topicId && <span className="font-normal text-danger">{errors.topicId}</span>}
                  </label>
                  <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-text-muted">
                    {t("form.level")}
                    <select
                      value={values.cefrLevel}
                      onChange={(e) => set({ cefrLevel: e.target.value as CefrLevel | "" })}
                      aria-invalid={errors.cefrLevel ? true : undefined}
                      className={selectClass(errors.cefrLevel)}
                    >
                      <option value="">{t("form.choose")}</option>
                      {CEFR_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    {errors.cefrLevel && <span className="font-normal text-danger">{errors.cefrLevel}</span>}
                  </label>
                  <div className="flex flex-col gap-1 text-xs font-semibold text-text-muted">
                    <span aria-hidden="true">&nbsp;</span>
                    <ToggleChip icon="crown" label={t("form.pro")} checked={values.pro} onChange={(pro) => set({ pro })} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" leftIcon={<Icon name="wand-sparkles" />}>
                    {t("create.start")} <CreditCost action={AI_ACTION_LESSON_IMPORT} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2" aria-live="polite">
                <span className="flex items-center gap-2 text-sm text-text-muted">
                  <Icon name="loader-circle" className="animate-spin" />
                  {t("create.loadingPreview")}
                </span>
                <span className="h-4 w-3/4 animate-pulse rounded bg-bg" />
                <span className="h-4 w-1/2 animate-pulse rounded bg-bg" />
              </div>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
