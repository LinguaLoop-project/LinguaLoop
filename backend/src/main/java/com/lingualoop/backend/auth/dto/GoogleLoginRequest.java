package com.lingualoop.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** ID token (JWT) do Google Identity Services trả về ở frontend. */
public record GoogleLoginRequest(@NotBlank @Size(max = 8192) String idToken) {
}
