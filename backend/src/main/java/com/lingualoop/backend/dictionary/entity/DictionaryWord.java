package com.lingualoop.backend.dictionary.entity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
public class DictionaryWord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String headword;

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
    @Column(nullable = false)
    private List<WordMeaning> meanings = new ArrayList<>();
}
