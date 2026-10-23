package com.lingualoop.backend.practice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveNoteRequest(@NotBlank @Size(max = 1000) String content) {
}
