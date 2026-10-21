package com.lingualoop.backend.shadowing.entity;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Bảng tham chiếu 44 âm vị; shadowing chỉ cần tra {@code id} theo ký hiệu. */
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
}
