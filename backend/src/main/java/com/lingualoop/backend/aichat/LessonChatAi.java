package com.lingualoop.backend.aichat;

import java.util.List;

/**
 * Gia sư AI chế độ chat chữ của Thực hành với AI theo bài (UC-AI-01); chế độ giọng nói chạy trên Gemini Live,
 * trình duyệt nối thẳng. Tách interface để test thay bằng bản giả, không gọi Gemini thật.
 * Mọi lần gọi trả kèm số token để trừ credit theo chi phí thật (BR-AI-10).
 */
public interface LessonChatAi {

    /** Bài học làm nền cho cả cuộc trò chuyện: gia sư chỉ được hỏi và nhận xét trong phạm vi này (BR-AI-07). */
    record Lesson(String title, String cefrLevel, String transcript) {
    }

    /** Một dòng của hội thoại đã lưu. */
    record Line(boolean tutor, String text) {
    }

    /** Kết quả một lần gọi cùng token đã dùng. */
    record Generated<T>(T value, long inputTokens, long outputTokens) {
    }

    /**
     * Lượt gia sư trả lời một câu trả lời gõ chữ.
     *
     * @param feedback     nhận xét tiếng Việt bám sát nội dung bài
     * @param better       cách nói tiếng Anh tự nhiên hơn; có thể rỗng
     * @param nextQuestion câu hỏi kế tiếp; rỗng khi lượt này là lượt cuối
     */
    record Reply(String feedback, String better, String nextQuestion) {
    }

    /** Câu hỏi mở đầu. */
    Generated<String> open(Lesson lesson);

    /**
     * @param history  hội thoại trước câu trả lời này, câu hỏi hiện tại nằm cuối
     * @param finalTurn đây là câu hỏi cuối của phiên: không đặt câu hỏi kế tiếp
     */
    Generated<Reply> reply(Lesson lesson, List<Line> history, String answer, boolean finalTurn);

    /** Gợi ý trả lời câu hỏi cuối của {@code history}: từ vựng và cấu trúc câu mẫu từ lời thoại (BR-AI-08). */
    Generated<String> hint(Lesson lesson, List<Line> history);

    /** Nhận xét tổng quát cuối phiên (BR-AI-09). */
    Generated<String> summarize(Lesson lesson, List<Line> history);
}
