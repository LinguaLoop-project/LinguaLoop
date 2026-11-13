package com.lingualoop.backend.lesson.entity;

import java.time.Instant;

import com.lingualoop.backend.common.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Một câu của bài; thứ tự câu theo {@code startMs}. */
@Entity
@Table(name = "sentences")
@Getter
@Setter
public class Sentence extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(name = "text_en", nullable = false)
    private String textEn;

    @Column(name = "text_vi")
    private String textVi;

    /** Phiên âm Mỹ, nguồn của âm đích khi chấm. */
    @Column(name = "ipa_us")
    private String ipaUs;

    /** Phiên âm Anh, chỉ để hiển thị, không dùng để chấm. */
    @Column(name = "ipa_uk")
    private String ipaUk;

    @Column(name = "start_ms", nullable = false)
    private Integer startMs;

    @Column(name = "end_ms", nullable = false)
    private Integer endMs;

    /** Xoá mềm để giữ lịch sử lượt làm. */
    @Column(name = "deleted_at")
    private Instant deletedAt;
}
