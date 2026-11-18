import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import TextField from "@/components/common/TextField";
import { toast } from "@/stores/toastStore";
import { errorMessage, isStaleError } from "../errors";
import { useLessonTopics, useUpdateLesson } from "../hooks";
import { CEFR_LEVELS, type CefrLevel, type LessonApiError, type LessonDetail } from "../types";
import { SelectField } from "./LessonBits";

const TITLE_ID = "lesson-info-title";
const TITLE_MAX = 100;

type Step = "edit" | "confirmPro" | "confirmDiscard";

/**
 * Sửa tiêu đề, chủ đề, trình độ, nhãn Pro (UC-BH-04). Link YouTube chỉ hiển thị. Đổi nhãn Pro của bài Đã xuất bản phải
 * xác nhận (4b); đóng khi còn thay đổi chưa lưu phải xác nhận bỏ (4a). Mất kết nối giữ dữ liệu trên form (6a).
 */
export default function LessonInfoDialog({ lesson, onClose }: Readonly<{ lesson: LessonDetail; onClose: () => void }>) {
  const { t } = useTranslation("lessonManage");
  const topics = useLessonTopics().data ?? [];
  const mutation = useUpdateLesson(lesson.id);
  const [title, setTitle] = useState(lesson.title);
  const [topicId, setTopicId] = useState(lesson.topicId ?? "");
  const [cefrLevel, setCefrLevel] = useState<CefrLevel>(lesson.cefrLevel);
  const [pro, setPro] = useState(lesson.pro);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("edit");

  const dirty =
    title !== lesson.title || topicId !== (lesson.topicId ?? "") || cefrLevel !== lesson.cefrLevel || pro !== lesson.pro;

  const requestClose = () => {
    if (dirty && step === "edit") setStep("confirmDiscard");
    else onClose();
  };

  const save = () => {
    setFormError(null);
    setTitleError(null);
    mutation.mutate(
      { title: title.trim(), topicId, cefrLevel, pro },
      {
        onSuccess: () => {
          toast(t("info.saved"), { icon: "circle-check" });
          onClose();
        },
        onError: (error) => {
          const e = error as unknown as LessonApiError;
          setStep("edit");
          if (e.code === "LESSON_TITLE_TAKEN" || e.fieldErrors.some((f) => f.field === "title")) {
            setTitleError(errorMessage(t, e));
            return;
          }
          if (isStaleError(e)) {
            toast(errorMessage(t, e), { icon: "circle-alert" });
            onClose();
            return;
          }
          setFormError(errorMessage(t, e));
        },
      },
    );
  };

  const submit = () => {
    const trimmed = title.trim();
    if (trimmed.length === 0 || [...trimmed].length > TITLE_MAX) {
      setTitleError(t("form.titleInvalid"));
      return;
    }
    if (lesson.status === "published" && pro !== lesson.pro && step !== "confirmPro") {
      setStep("confirmPro");
      return;
    }
    save();
  };

  return (
    <Dialog open onClose={requestClose} labelledBy={TITLE_ID} wide>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t("info.title")}
        </h2>

        {step === "confirmDiscard" && (
          <FormAlert variant="warning">
            <p>{t("info.discardBody")}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setStep("edit")}>
                {t("info.keepEditing")}
              </Button>
              <Button size="sm" variant="danger" onClick={onClose}>
                {t("info.discard")}
              </Button>
            </div>
          </FormAlert>
        )}
        {step === "confirmPro" && (
          <FormAlert variant="warning">{pro ? t("info.proOnBody") : t("info.proOffBody")}</FormAlert>
        )}
        {formError && <FormAlert variant="danger">{formError}</FormAlert>}

        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-text">{t("form.link")}</span>
          <a className="truncate text-primary-text underline" href={lesson.youtubeUrl} target="_blank" rel="noreferrer">
            {lesson.youtubeUrl}
          </a>
          <span className="text-xs text-text-muted">{t("info.linkLocked")}</span>
        </div>
        <TextField
          id="info-title"
          label={t("form.title")}
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          error={titleError ?? undefined}
        />
        <SelectField id="info-topic" label={t("form.topic")} value={topicId} onChange={setTopicId}>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          id="info-level"
          label={t("form.level")}
          value={cefrLevel}
          onChange={(value) => setCefrLevel(value as CefrLevel)}
        >
          {CEFR_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </SelectField>
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={pro} onChange={(e) => setPro(e.target.checked)} />
          {t("form.pro")}
        </label>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={requestClose} disabled={mutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="button" isLoading={mutation.isPending} disabled={!dirty} onClick={submit}>
            {step === "confirmPro" ? t("info.confirmSave") : t("common.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
