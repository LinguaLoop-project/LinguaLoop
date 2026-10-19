package com.lingualoop.backend.shadowing.entity;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Mẹo sửa cho một âm đích. {@code producedPhonemeId} null là mẹo chung cho âm đó (Azure không cho biết người học đọc
 * nhầm thành âm gì); khác null là mẹo riêng cho cặp "đọc A thành B", chưa dùng ở lát B.
 */
@Getter
@Entity
@Immutable
@Table(name = "phoneme_confusions")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhonemeConfusion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "l1", nullable = false)
    private String l1;

    @Column(name = "target_phoneme_id", nullable = false)
    private Short targetPhonemeId;

    @Column(name = "produced_phoneme_id")
    private Short producedPhonemeId;

    @Column(name = "tip_vi", nullable = false)
    private String tipVi;
}
