package com.lingualoop.backend.vocab.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.vocab.enums.CardStatus;

/** Dữ liệu cho màn học một phần và kết quả của một câu trả lời (UC-HT-02). */
public final class LearnView {

    private LearnView() {
    }

    /** Khoảng chờ tới lần ôn tới nếu chấm flashcard với {@code quality} (1 Quên, 3 Khó, 4 Được, 5 Dễ). */
    public record Preview(int quality, long minutes) {
    }

    /**
     * Một thẻ của phần hoặc của hàng đợi ôn. {@code audioUs} và {@code audioUk} là URL phát được. {@code previews} chỉ để
     * hiện khoảng ôn trên bốn nút của Flashcard; lịch ôn do server tính (BR-HT-10, BR-HT-11). {@code contextEn},
     * {@code contextVi} và {@code lesson} có khi thẻ là từ lưu từ bài học (BR-HT-03); {@code lesson} trống nếu bài đó không
     * còn xem được.
     */
    public record Card(
            UUID id,
            String word,
            String pos,
            String translationVi,
            String explanationEn,
            String explanationVi,
            String exampleEn,
            String exampleVi,
            String imageUrl,
            String ipaUk,
            String ipaUs,
            String audioUk,
            String audioUs,
            CardStatus status,
            List<Preview> previews,
            String contextEn,
            String contextVi,
            LessonRef lesson) {
    }

    /** Bài học mà từ được lưu, để mặt sau thẻ dẫn về bài (BR-HT-03). */
    public record LessonRef(String slug, String title) {
    }

    /** Bộ chứa phần, để hiện tiêu đề và nút quay lại. */
    public record DeckRef(String slug, String name, String nameVi, boolean pro) {
    }

    /**
     * Một phần kèm toàn bộ thẻ (vài chục thẻ); màn học tự chia thành các lượt 10 thẻ. {@code parts} là danh sách phần của
     * bộ để hiện bên cạnh, kèm tiến độ và khoá Pro.
     */
    public record PartDetail(
            DeckRef deck,
            int index,
            String name,
            String nameVi,
            List<DeckView.Part> parts,
            List<Card> cards) {
    }

    public record SessionRef(UUID id) {
    }

    /**
     * Trạng thái và lịch ôn của thẻ sau câu trả lời. {@code quality} là mức q server đã chấm (1 Quên, 3 Khó, 4 Được, 5 Dễ);
     * giao diện dùng nó để đưa thẻ q dưới 3 xuống cuối lượt (BR-HT-14). Trống khi câu trả lời được gửi lại và không chấm lần nữa.
     */
    public record AnswerResult(CardStatus status, Instant nextReviewAt, int intervalDays, Integer quality) {
    }
}
