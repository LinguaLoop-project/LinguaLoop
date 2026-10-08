package com.lingualoop.backend.auth.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Bộ đếm đăng nhập sai theo email (kể cả email không có tài khoản). Ghi qua câu lệnh upsert nguyên tử. */
@Getter
@Entity
@Table(name = "auth_login_attempts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LoginAttempt {

    @Id
    @Column(columnDefinition = "citext")
    private String email;

    @Column(name = "failed_count", nullable = false)
    private short failedCount;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
