package com.lingualoop.backend.ai;

import java.time.Duration;

/**
 * Gọi Gemini để lấy kết quả dạng JSON (nghe một đoạn video YouTube, dịch câu...). Tách interface để test thay bằng bản
 * giả, không gọi Gemini thật.
 */
public interface GeminiJsonClient {

    /**
     * Một đoạn video YouTube gửi kèm yêu cầu. Gemini tự tải video từ YouTube nên server không cần tải gì.
     *
     * @param fileUri link video YouTube công khai hoặc không công khai
     * @param start   mốc bắt đầu của đoạn, tính từ đầu video
     * @param end     mốc kết thúc của đoạn, tính từ đầu video
     * @param fps     số khung hình mỗi giây Gemini lấy mẫu; {@code null} = mặc định (1). Chỉ cần nghe tiếng thì đặt thấp
     *                để giảm token hình
     */
    record VideoClip(String fileUri, Duration start, Duration end, Double fps) {
    }

    /** Bản ghi âm gửi kèm yêu cầu để Gemini vừa nghe vừa trả lời trong một lần gọi. */
    record AudioClip(byte[] data, String mimeType) {
    }

    /**
     * @param systemInstruction hướng dẫn cố định cho mọi lần gọi, có thể {@code null}
     * @param prompt            nội dung của lần gọi này
     * @param video             đoạn video đi kèm, {@code null} nếu chỉ gửi chữ
     * @param timeout           thời gian chờ tối đa cho lần gọi này
     * @param thinkingLevel     mức suy nghĩ nội bộ ({@code LOW}, {@code MEDIUM}...); {@code null} = để model tự quyết
     * @param audio             bản ghi âm đi kèm, {@code null} nếu không có
     * @param preferFallback    gọi model dự phòng trước: lần gọi trước trong cùng một việc đã phải dùng nó vì model
     *                          chính quá tải
     */
    record Request(String systemInstruction, String prompt, VideoClip video, AudioClip audio, Duration timeout,
            String thinkingLevel, boolean preferFallback) {

        public Request(String systemInstruction, String prompt, VideoClip video, Duration timeout,
                String thinkingLevel, boolean preferFallback) {
            this(systemInstruction, prompt, video, null, timeout, thinkingLevel, preferFallback);
        }

        public static Request text(String prompt, Duration timeout, String thinkingLevel) {
            return new Request(null, prompt, null, null, timeout, thinkingLevel, false);
        }

        /** Bản sao gọi model dự phòng trước (nếu có cấu hình). */
        public Request preferringFallback() {
            return new Request(systemInstruction, prompt, video, audio, timeout, thinkingLevel, true);
        }
    }

    /**
     * JSON Gemini trả về và số token đã dùng, để trừ credit theo đơn giá của tính năng (BR-GA-06).
     *
     * @param byFallback kết quả do model dự phòng trả: model chính đang quá tải, lần gọi sau nên gọi thẳng model dự phòng
     */
    record Result(String json, long inputTokens, long outputTokens, boolean byFallback) {

        public Result(String json, long inputTokens, long outputTokens) {
            this(json, inputTokens, outputTokens, false);
        }

        Result fromFallback() {
            return new Result(json, inputTokens, outputTokens, true);
        }
    }

    /**
     * @throws com.lingualoop.backend.common.exception.BusinessException {@code AI_FEEDBACK_UNAVAILABLE} khi chưa cấu hình,
     *         lỗi hoặc quá thời gian chờ; {@code AI_FEEDBACK_BUSY} khi Gemini quá tải sau một lần thử lại (thử lại bằng
     *         model còn lại trong cặp chính/dự phòng)
     */
    Result generate(Request request);
}
