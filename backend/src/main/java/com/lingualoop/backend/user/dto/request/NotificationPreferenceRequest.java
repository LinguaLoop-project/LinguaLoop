package com.lingualoop.backend.user.dto.request;

import jakarta.validation.constraints.NotNull;

/** Bật hoặc tắt một loại thông báo tùy chọn (BR-TK-23). */
public record NotificationPreferenceRequest(@NotNull Boolean enabled) {
}
