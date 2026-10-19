import { AxiosError } from "axios";
import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/lesson/types";
import { parseSseEvents } from "../sse";
import type { AiFeedback, AttemptResponse, LatestAttempt } from "../types";

export const shadowingService = {
  /** Gửi bản ghi WAV (16 kHz mono) của một câu đi chấm. */
  assess: async (sentenceId: string, wav: Blob): Promise<AttemptResponse> => {
    const form = new FormData();
    form.append("audio", wav, "recording.wav");
    const response = await axiosClient.post<ApiResponse<AttemptResponse>>(
      `/sentences/${sentenceId}/shadowing-attempts`,
      form,
    );
    return response.data.data;
  },

  /** Nhận xét AI cho một lượt; lượt đã có nhận xét thì server trả lại bản đã lưu. */
  getAiFeedback: async (attemptId: number): Promise<AiFeedback> => {
    const response = await axiosClient.post<ApiResponse<AiFeedback>>(`/shadowing-attempts/${attemptId}/ai-feedback`);
    return response.data.data;
  },

  /**
   * Như {@link getAiFeedback} nhưng nhận chữ dần: `onText` được gọi mỗi khi AI viết thêm một đoạn, để giao diện hiện
   * chữ chạy ra ngay. Dùng axiosClient (giữ nguyên đăng nhập và tự làm mới token): XHR cho đọc phần phản hồi đã nhận
   * qua `onDownloadProgress` trong lúc server còn đang gửi.
   */
  streamAiFeedback: async (attemptId: number, onText: (piece: string) => void): Promise<AiFeedback> => {
    let rest = "";
    let seen = 0;
    let done: AiFeedback | null = null;

    // Mỗi lần gọi chỉ xử lý phần mới nhận thêm; sự kiện chưa đủ được giữ lại cho lần sau
    const consume = (received: string) => {
      const parsed = parseSseEvents(rest + received.slice(seen));
      seen = received.length;
      rest = parsed.rest;
      for (const { event, data } of parsed.events) {
        const body = data as { text?: string; code?: string; message?: string };
        if (event === "delta" && body.text) onText(body.text);
        else if (event === "done") done = data as AiFeedback;
        else if (event === "error") {
          // Cùng dạng lỗi axios với lỗi HTTP thường để toApiError đọc được mã lỗi
          throw new AxiosError(body.message, "ERR_STREAM", undefined, undefined, {
            status: 502,
            statusText: "",
            headers: {},
            config: {} as never,
            data: { code: body.code, message: body.message },
          });
        }
      }
    };

    const response = await axiosClient.post<string>(`/shadowing-attempts/${attemptId}/ai-feedback/stream`, null, {
      responseType: "text",
      // Lỗi HTTP vẫn là JSON thường: chuyển về object để toApiError đọc; phản hồi 200 là luồng chữ nên giữ nguyên
      transformResponse: (data: unknown, _headers, status) => {
        if (typeof data === "string" && status !== undefined && status >= 400) {
          try {
            return JSON.parse(data);
          } catch {
            return data;
          }
        }
        return data;
      },
      onDownloadProgress: (progress) => {
        const target = progress.event?.target as XMLHttpRequest | undefined;
        if (target?.responseText) consume(target.responseText);
      },
    });
    consume(response.data); // phần còn lại nếu sự kiện cuối chưa kịp đi qua onDownloadProgress
    if (!done) throw new Error("AI feedback stream ended without a result");
    return done;
  },

  getLatest: async (lessonSlug: string): Promise<LatestAttempt[]> => {
    const response = await axiosClient.get<ApiResponse<LatestAttempt[]>>(
      `/lessons/${lessonSlug}/shadowing-attempts/latest`,
    );
    return response.data.data;
  },
};
