package com.lingualoop.backend.practice.entity;

import java.io.Serializable;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class SentenceReviewId implements Serializable {
    private UUID userId;
    private UUID sentenceId;
    private PracticeMode mode;
}
