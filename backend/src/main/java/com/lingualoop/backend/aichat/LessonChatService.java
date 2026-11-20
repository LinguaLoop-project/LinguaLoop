package com.lingualoop.backend.aichat;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.aichat.LessonChatView.HistoryItem;
import com.lingualoop.backend.aichat.LessonChatView.Credit;
import com.lingualoop.backend.aichat.LessonChatView.Hint;
import com.lingualoop.backend.aichat.LessonChatView.LiveStart;
import com.lingualoop.backend.aichat.LessonChatView.Session;
import com.lingualoop.backend.aichat.LessonChatView.Turn;

/** Thực hành với AI theo bài (UC-AI-01). Mọi thao tác chỉ trên cuộc trò chuyện của chính người gọi (BR-AI-03). */
public interface LessonChatService {

    // ── Chế độ giọng nói (Gemini Live) ─────────────────────────────────────────────

    /**
     * Mở phiên giọng nói: đóng cuộc đang mở của bài (giữ trong lịch sử, BR-AI-05), cấp token Gemini Live. Chỉ kiểm tra
     * điều kiện vào, chưa trừ credit (BR-AI-04); không cấp được token thì phiên đóng ở trạng thái lỗi.
     *
     * @throws com.lingualoop.backend.common.exception.BusinessException {@code AI_CHAT_LIVE_UNAVAILABLE} khi không cấp
     *         được token
     */
    LiveStart startLive(UUID userId, UUID lessonId);

    /**
     * Gia sư đã nói câu đầu: trừ credit cố định một lần và bắt đầu tính 15 phút. Gọi lặp không trừ thêm. Ví không đủ
     * thì phiên đóng ở trạng thái lỗi và báo {@code QUOTA_EXCEEDED}.
     */
    Credit liveStarted(UUID userId, UUID lessonId, UUID conversationId);

    /** Ghi câu hỏi mới của gia sư (tool {@code next_question}); tối đa 5 câu (BR-AI-11). */
    Session liveQuestion(UUID userId, UUID lessonId, UUID conversationId, String question);

    /** Ghi câu trả lời và nhận xét của câu hỏi đang chờ (tool {@code give_feedback}). */
    Session liveFeedback(UUID userId, UUID lessonId, UUID conversationId, String answer, String feedback,
            String better);

    /**
     * Kết thúc phiên giọng nói. Đã trả lời ít nhất một câu thì tạo nhận xét tổng quát (không trừ thêm credit); chưa có
     * câu nào thì đóng không có nhận xét. Không tạo được nhận xét thì phiên vẫn mở để thử lại.
     */
    Turn liveFinish(UUID userId, UUID lessonId, UUID conversationId);

    // ── Chế độ chat chữ (dự phòng) ─────────────────────────────────────────────────

    /**
     * Bắt đầu cuộc chat chữ mới; cuộc đang mở của bài (nếu có) được đóng và giữ trong lịch sử (BR-AI-05). Trừ credit của
     * lượt mở đầu; lỗi khởi tạo thì phiên đóng ở trạng thái {@code error} và không trừ credit (BR-AI-04).
     */
    Turn start(UUID userId, UUID lessonId);

    /**
     * Gửi câu trả lời gõ chữ (1 đến 1000 ký tự). Sau câu trả lời thứ 5 hoặc khi phiên quá 15 phút, hệ thống tạo nhận xét
     * tổng quát và đóng phiên (BR-AI-11).
     */
    Turn answer(UUID userId, UUID lessonId, UUID conversationId, String text);

    /** Gợi ý trả lời cho câu hỏi hiện tại; tạo một lần rồi lưu, không trừ credit (BR-AI-08). */
    Hint hint(UUID userId, UUID lessonId, UUID conversationId);

    /** Kết thúc sớm cuộc chat chữ và tạo nhận xét tổng quát; cần đã trả lời ít nhất một câu (BR-AI-09). */
    Turn finish(UUID userId, UUID lessonId, UUID conversationId);

    /** Lịch sử các cuộc trò chuyện của học viên trong bài, mới nhất trước; xem miễn phí. */
    List<HistoryItem> history(UUID userId, UUID lessonId);

    /** Xem lại đầy đủ một cuộc trò chuyện của chính học viên; miễn phí. */
    Session detail(UUID userId, UUID lessonId, UUID conversationId);
}
