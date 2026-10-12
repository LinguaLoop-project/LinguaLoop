package com.lingualoop.backend.lesson.entity;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserLessonModeProgressId implements Serializable {
    private UUID userId;
    private UUID lessonId;
    private PracticeMode mode;
}
