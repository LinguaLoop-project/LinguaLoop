package com.lingualoop.backend.stats.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Một dòng của Lịch sử luyện tập (UC-TH-02, BR-TH-06). Các trường không áp dụng cho loại dòng đó là null.
 *
 * @param type          {@code practice} (Buổi luyện Nghe chép hoặc Shadowing), {@code vocab} (phiên học/ôn thẻ) hoặc
 *                      {@code ai} (phiên Thực hành với AI)
 * @param mode          {@code dictation} hoặc {@code shadowing} với {@code practice}; {@code learn} hoặc {@code review}
 *                      với {@code vocab}; {@code live} hoặc {@code text} với {@code ai}
 * @param title         tên bài học hoặc bộ từ; null với phiên ôn chung nhiều bộ
 * @param available     nội dung gốc còn mở lại được
 * @param lessonId      bài của dòng {@code practice} và {@code ai}
 * @param deckId        bộ của dòng {@code vocab}
 * @param deckKind      loại bộ của dòng {@code vocab}: {@code library}, {@code personal} hoặc {@code saved}
 * @param day           ngày của Buổi luyện, để xin danh sách lượt
 * @param sentences     số câu khác nhau của Buổi luyện
 * @param averageScore  điểm trung bình của điểm cao nhất mỗi câu trong Buổi luyện
 * @param retries       số lượt làm lại của Buổi luyện
 * @param gaveUps       số lượt bỏ cuộc của Buổi luyện
 * @param answered      số câu trả lời của phiên vocab hoặc ai
 * @param correct       số câu trả lời đúng của phiên vocab
 */
public record HistoryView(String type, String mode, Instant at, String title, boolean available, UUID lessonId,
        UUID deckId, String deckKind, LocalDate day, Integer sentences, BigDecimal averageScore, Integer retries,
        Integer gaveUps, Integer answered, Integer correct) {
}
