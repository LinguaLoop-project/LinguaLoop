package com.lingualoop.backend.vocab.dto;

import java.util.List;
import java.util.UUID;

/** Dữ liệu trả về cho danh sách bộ và chi tiết một bộ (UC-VOCAB-03, UC-VOCAB-04). */
public final class DeckView {

    private DeckView() {
    }

    /** Số thẻ của người học ở từng trạng thái trong một bộ; {@code newCount} là thẻ chưa học lần nào. */
    public record Progress(int mastered, int reviewing, int learning, int newCount) {
    }

    /** Một bộ kèm tiến độ của người học; {@code dueCount} là số thẻ của bộ đã đến hạn ôn (BR-VOCAB-09). */
    public record Summary(
            UUID id,
            String slug,
            String name,
            String nameVi,
            String cefrLevel,
            boolean pro,
            int cardCount,
            int groupCount,
            Progress progress,
            int dueCount) {
    }

    /** Số thẻ của người học ở từng trạng thái trên mọi bộ, kể cả bộ "Từ đã lưu"; {@code due} gồm cả thẻ Đã thuộc đến hạn. */
    public record Overview(int due, int learning, int reviewing, int mastered) {
    }

    public record ListResult(Overview overview, List<Summary> decks) {
    }

    /**
     * Một phần của bộ. {@code index} tính từ 0 và là số trong đường dẫn học phần. {@code locked} khi bộ là Pro và
     * người học dùng gói Free ở phần từ thứ ba trở đi (BR-VOCAB-05).
     */
    public record Part(int index, String name, String nameVi, int cardCount, int studiedCount, boolean locked) {
    }

    /** Một từ mẫu của bộ để xem trước; {@code audioUs} là URL phát được. */
    public record SampleWord(String word, String pos, String translationVi, String ipaUk, String ipaUs,
            String audioUs) {
    }

    public record Detail(Summary deck, List<Part> parts, List<SampleWord> sampleWords) {
    }
}
