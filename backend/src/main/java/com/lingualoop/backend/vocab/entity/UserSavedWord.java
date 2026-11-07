package com.lingualoop.backend.vocab.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Một nghĩa của một mục từ mà học viên đã lưu; {@code cardId} là thẻ của nó trong bộ "Từ đã lưu" (ADR 0008). */
@Getter
@NoArgsConstructor
@Entity
@Table(name = "user_saved_words")
public class UserSavedWord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "word_id", nullable = false, updatable = false)
    private UUID wordId;

    @Column(name = "meaning_no", updatable = false)
    private Integer meaningNo;

    @Column(name = "sentence_id", updatable = false)
    private UUID sentenceId;

    /** Giá trị của {@code SavedWordSource}; cột có CHECK nên lưu dạng chữ thường. */
    @Column(nullable = false, updatable = false)
    private String source;

    @Column(name = "card_id", updatable = false)
    private UUID cardId;

    /** Cột có mặc định {@code now()} ở DB nên không ghi từ ứng dụng. */
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    public UserSavedWord(UUID userId, UUID wordId, Integer meaningNo, UUID sentenceId, String source, UUID cardId) {
        this.userId = userId;
        this.wordId = wordId;
        this.meaningNo = meaningNo;
        this.sentenceId = sentenceId;
        this.source = source;
        this.cardId = cardId;
    }
}
