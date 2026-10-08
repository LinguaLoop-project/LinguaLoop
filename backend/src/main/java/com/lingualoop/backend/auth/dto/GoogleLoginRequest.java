package com.lingualoop.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Authorization code Google trả về cho frontend sau khi người dùng đồng ý; dùng một lần, hết hạn rất nhanh. */
public record GoogleLoginRequest(@NotBlank @Size(max = 2048) String code) {
}
