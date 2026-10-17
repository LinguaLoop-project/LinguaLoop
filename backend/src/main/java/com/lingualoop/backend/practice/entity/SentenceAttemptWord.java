package com.lingualoop.backend.practice.entity;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.lingualoop.backend.practice.enums.AttemptOutcome;
import com.lingualoop.backend.practice.enums.AttemptWordClass;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "sentence_attempt_words")
@Getter
@Setter
public class SentenceAttemptWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "position", nullable = false)
    private Integer position;

    @Column(name = "expected_word")
    private String expectedWord;

    @Column(name = "actual_word")
    private String actualWord;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", nullable = false)
    private AttemptOutcome outcome;

    @Enumerated(EnumType.STRING)
    @Column(name = "expected_word_class")
    private AttemptWordClass expectedWordClass;
}
