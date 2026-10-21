package com.lingualoop.backend.practice.dto.request;

import com.lingualoop.backend.practice.enums.AttemptOutcome;
import com.lingualoop.backend.practice.enums.AttemptWordClass;

public record AttemptWordRequest(int position, String expectedWord, String actualWord, AttemptOutcome outcome,
        AttemptWordClass expectedWordClass) {
}
