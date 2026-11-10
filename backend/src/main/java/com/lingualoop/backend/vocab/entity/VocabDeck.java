package com.lingualoop.backend.vocab.entity;

import com.lingualoop.backend.common.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Một bộ từ: bộ hệ thống ({@code visibility = system}), bộ "Từ đã lưu" của một học viên ({@code kind = saved}) hoặc
 * bộ học viên tự tạo. Lát này chỉ đọc bộ hệ thống bằng SQL; entity có để các lát sau thêm cột cần dùng.
 */
@Getter
@NoArgsConstructor
@Entity
@Table(name = "vocab_decks")
public class VocabDeck extends BaseEntity {

    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String kind;
}
