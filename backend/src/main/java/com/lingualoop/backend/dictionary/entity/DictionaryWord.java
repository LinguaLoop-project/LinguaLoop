package com.lingualoop.backend.dictionary.entity;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.lingualoop.backend.common.entity.BaseEntity;
import com.lingualoop.backend.lesson.enums.CefrLevel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "dictionary_words")
public class DictionaryWord extends BaseEntity {

    @Column(nullable = false)
    private String headword;

    @Enumerated(EnumType.STRING)
    @Column(name = "cefr_level", columnDefinition = "cefr_code")
    private CefrLevel cefrLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lemma_id")
    private DictionaryWord lemma;

    @Column(name = "ipa_uk")
    private String ipaUk;

    @Column(name = "ipa_us")
    private String ipaUs;

    @Column(name = "audio_uk")
    private String audioUk;

    @Column(name = "audio_us")
    private String audioUs;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pos_pronunciations")
    private Map<String, PosPronunciation> posPronunciations;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private List<WordMeaning> meanings = new ArrayList<>();

    @Column(nullable = false)
    private String source;
}
