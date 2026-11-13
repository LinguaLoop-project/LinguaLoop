package com.lingualoop.backend.vocab.entity;

import com.lingualoop.backend.common.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Một bộ từ: bộ thư viện ({@code kind = library}, bộ hệ thống khi {@code owner_id} trống), bộ cá nhân ({@code personal})
 * hoặc bộ "Từ đã lưu" của một học viên ({@code saved}). Các màn học viên đọc bộ bằng SQL; entity có để màn soạn bộ dùng.
 */
@Getter
@NoArgsConstructor
@Entity
@Table(name = "vocab_decks")
public class VocabDeck extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String kind;
}
