package com.lingualoop.backend.auth.google;

/** Thông tin người dùng lấy từ userinfo của Google (đã qua kiểm tra email_verified). {@code name} và {@code picture} có thể null. */
public record GoogleIdentity(String sub, String email, String name, String picture) {
}
