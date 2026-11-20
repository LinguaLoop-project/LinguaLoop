package com.lingualoop.backend.aichat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.credit.dto.CreditBalance;

/** Dữ liệu trả về của Thực hành với AI theo bài (UC-AI-01). */
public final class LessonChatView {

    private LessonChatView() {
    }

    /**
     * Một dòng hội thoại. Dòng của gia sư mang câu hỏi và gợi ý đã tạo; dòng của học viên mang câu trả lời, nhận xét và
     * cách nói tự nhiên hơn.
     */
    public record Message(long id, String role, String text, String feedback, String better, String hint, boolean voice,
            Instant at) {
    }

    /**
     * @param mode            {@code live} (giọng nói, Gemini Live) hoặc {@code text} (chat chữ dự phòng)
     * @param status          {@code active}, {@code completed} hoặc {@code error}
     * @param expiresAt       mốc hết 15 phút (BR-AI-11)
     * @param answered        số câu đã trả lời
     * @param maxQuestions    số câu hỏi tối đa của một phiên (BR-AI-11)
     * @param awaitingSummary đã trả lời đủ câu cuối nhưng nhận xét tổng quát chưa tạo được: gọi kết thúc để tạo lại
     * @param summary         nhận xét tổng quát; null nếu phiên dừng giữa chừng hoặc lỗi
     */
    public record Session(UUID id, String mode, String status, Instant startedAt, Instant endedAt, Instant expiresAt, int answered,
            int maxQuestions, boolean awaitingSummary, String summary, List<Message> messages) {
    }

    /** Credit đã trừ cho yêu cầu này và số dư còn lại (BR-AI-10); không có ước tính trước. */
    public record Credit(int charged, CreditBalance balance) {
    }

    /** Kết quả một yêu cầu có gọi AI. {@code expired}: phiên đã quá 15 phút nên câu trả lời không được nhận. */
    public record Turn(Session session, Credit credit, boolean expired) {
    }

    /** Giới hạn của phiên giọng nói để trình duyệt tự thực thi cùng server (BR-AI-11). */
    public record Limits(int maxQuestions, int maxSeconds, int wrapUpAtSeconds, int startTimeoutSeconds,
            int idleAskSeconds, int idleEndSeconds) {
    }

    /**
     * Phiên giọng nói vừa tạo: token Gemini Live dùng một lần và giới hạn. Chưa trừ credit; credit được trừ khi gia sư
     * nói câu đầu ({@code started}).
     *
     * @param cost credit sẽ trừ khi phiên bắt đầu
     */
    public record LiveStart(UUID id, String token, String model, Instant tokenExpiresAt, Limits limits, int cost,
            CreditBalance balance) {
    }

    public record Hint(String hint, boolean cached) {
    }

    public record HistoryItem(UUID id, String status, Instant startedAt, Instant endedAt, int answered,
            boolean hasSummary) {
    }
}
