import type { QueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { parseYouTubeId } from "@/lib/youtube";
import { lessonManageApi } from "./api";
import { lessonManageKeys } from "./hooks";
import type { CreatedLesson, CreateLessonInput, LessonApiError } from "./types";

/**
 * Các lượt tạo bài từ YouTube đang chạy (UC-BH-03). Lượt tạo bài sống ở mức ứng dụng, không gắn vào trang: giáo viên rời
 * trang danh sách hay đi trang khác trong ứng dụng thì yêu cầu vẫn chạy, xong vẫn báo và danh sách vẫn hiện "Đang tạo".
 * Đóng tab hoặc tải lại trang thì giao diện mất dấu (server vẫn tạo xong bài), nên trình duyệt hỏi lại trước khi rời.
 */
export interface CreateJob {
  key: string;
  input: CreateLessonInput;
  youtubeId: string | null;
  topicName: string | null;
  startedAt: number;
  status: "running" | "failed";
  error: LessonApiError | null;
}

export interface CreateCallbacks {
  onDone: (created: CreatedLesson) => void;
  onFailed: (job: CreateJob) => void;
}

interface CreateJobsState {
  jobs: CreateJob[];
}

export const useCreateJobs = create<CreateJobsState>(() => ({ jobs: [] }));

let sequence = 0;

const update = (key: string, patch: Partial<CreateJob>) =>
  useCreateJobs.setState((s) => ({ jobs: s.jobs.map((j) => (j.key === key ? { ...j, ...patch } : j)) }));

export const dismissJob = (key: string) => useCreateJobs.setState((s) => ({ jobs: s.jobs.filter((j) => j.key !== key) }));

/** Video đang được tạo bài ở một lượt khác chưa xong (server cũng chặn, BR-BH-18; chặn sớm để khỏi chờ). */
export const isCreating = (youtubeId: string | null) =>
  youtubeId !== null && useCreateJobs.getState().jobs.some((j) => j.status === "running" && j.youtubeId === youtubeId);

function run(job: CreateJob, callbacks: CreateCallbacks, queryClient: QueryClient) {
  lessonManageApi
    .create(job.input)
    .then((created) => {
      dismissJob(job.key);
      callbacks.onDone(created);
    })
    .catch((error: LessonApiError) => {
      const failed = { ...job, status: "failed" as const, error };
      update(job.key, { status: "failed", error });
      callbacks.onFailed(failed);
    })
    .finally(() => void queryClient.invalidateQueries({ queryKey: lessonManageKeys.all }));
}

export function startCreate(
  input: CreateLessonInput,
  topicName: string | null,
  callbacks: CreateCallbacks,
  queryClient: QueryClient,
): CreateJob {
  sequence += 1;
  const job: CreateJob = {
    key: `create-${Date.now()}-${sequence}`,
    input,
    youtubeId: parseYouTubeId(input.youtubeUrl),
    topicName,
    startedAt: Date.now(),
    status: "running",
    error: null,
  };
  useCreateJobs.setState((s) => ({ jobs: [job, ...s.jobs] }));
  run(job, callbacks, queryClient);
  return job;
}

export function retryJob(key: string, callbacks: CreateCallbacks, queryClient: QueryClient) {
  const job = useCreateJobs.getState().jobs.find((j) => j.key === key);
  if (!job || job.status !== "failed") return;
  const again = { ...job, status: "running" as const, error: null, startedAt: Date.now() };
  update(key, again);
  run(again, callbacks, queryClient);
}

// Còn lượt đang tạo thì hỏi trước khi đóng tab hoặc tải lại trang.
const warnBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
let warning = false;
useCreateJobs.subscribe(({ jobs }) => {
  const running = jobs.some((j) => j.status === "running");
  if (running === warning) return;
  warning = running;
  if (running) window.addEventListener("beforeunload", warnBeforeUnload);
  else window.removeEventListener("beforeunload", warnBeforeUnload);
});
