package com.lingualoop.backend.aichat;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.aichat.LessonChatView.HistoryItem;
import com.lingualoop.backend.aichat.LessonChatView.Hint;
import com.lingualoop.backend.aichat.LessonChatView.Session;
import com.lingualoop.backend.aichat.LessonChatView.Turn;

/** Thực hành với AI theo bài (UC-AI-01). Mọi thao tác chỉ trên cuộc trò chuyện của chính người gọi (BR-AI-03). */
public interface LessonChatService {

    /**
     * Bắt đầu cuộc trò chuyện mới; cuộc đang mở của bài (nếu có) được đóng và giữ trong lịch sử (BR-AI-05). Trừ credit của
     * lượt mở đầu; lỗi khởi tạo thì phiên đóng ở trạng thái {@code error} và không trừ credit (BR-AI-04).
     */
    Turn start(UUID userId, UUID lessonId);

    /** Cuộc trò chuyện đang mở của bài để học viên tiếp tục; quá 15 phút thì được đóng và trả {@code null}. */
    Session active(UUID userId, UUID lessonId);

    /**
     * Gửi câu trả lời, đúng một trong {@code text} (1 đến 1000 ký tự) hoặc {@code wav} (bản ghi 0,5 đến 30 giây).
     * Sau câu trả lời thứ 5 hoặc khi phiên quá 15 phút, hệ thống tạo nhận xét tổng quát và đóng phiên (BR-AI-11).
     */
    Turn answer(UUID userId, UUID lessonId, UUID conversationId, String text, byte[] wav);

    /** Gợi ý trả lời cho câu hỏi hiện tại; tạo một lần rồi lưu, không trừ credit (BR-AI-08). */
    Hint hint(UUID userId, UUID lessonId, UUID conversationId);

    /** Kết thúc sớm và tạo nhận xét tổng quát; cần đã trả lời ít nhất một câu (BR-AI-09). */
    Turn finish(UUID userId, UUID lessonId, UUID conversationId);

    /** Lịch sử các cuộc trò chuyện của học viên trong bài, mới nhất trước; xem miễn phí. */
    List<HistoryItem> history(UUID userId, UUID lessonId);

    /** Xem lại đầy đủ một cuộc trò chuyện của chính học viên; miễn phí. */
    Session detail(UUID userId, UUID lessonId, UUID conversationId);
}
