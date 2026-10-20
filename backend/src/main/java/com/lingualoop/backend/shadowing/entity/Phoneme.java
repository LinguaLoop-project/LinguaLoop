package com.lingualoop.backend.shadowing.entity;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Bảng tham chiếu 44 âm vị: ký hiệu, hướng dẫn phát âm và video khẩu hình (nội dung Pro). */
@Getter
@Entity
@Immutable
@Table(name = "phonemes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Phoneme {

    @Id
    private Short id;

    @Column(name = "symbol", nullable = false)
    private String symbol;

    @Column(name = "description_vi")
    private String descriptionVi;

    @Column(name = "mouth_video_url")
    private String mouthVideoUrl;
}
