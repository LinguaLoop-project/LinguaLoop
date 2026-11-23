package com.lingualoop.backend.user.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Cấp credit cho giáo viên (UC-GA-07, BR-GA-11). */
public record GrantCreditRequest(
        @NotNull @Min(1) @Max(1_000_000) Integer credits,
        @NotBlank @Size(max = 500) String note) {
}
