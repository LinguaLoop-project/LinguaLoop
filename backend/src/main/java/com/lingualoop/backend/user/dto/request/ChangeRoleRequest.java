package com.lingualoop.backend.user.dto.request;

import com.lingualoop.backend.security.Role;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** Vai trò mới, chỉ {@code student} hoặc {@code teacher} (BR-QT-02). */
public record ChangeRoleRequest(
        @NotNull @Pattern(regexp = "student|teacher", message = "Vai trò chỉ đổi giữa Học viên và Giáo viên")
        String role) {

    /** Gọi sau khi request đã qua kiểm tra hợp lệ. */
    public Role targetRole() {
        return Role.fromValue(role).orElseThrow();
    }
}
