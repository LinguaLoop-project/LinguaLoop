package com.lingualoop.backend.auth.google;

/** Thông tin lấy từ ID token Google đã xác minh. {@code name} và {@code picture} có thể null. */
public record GoogleIdentity(String sub, String email, String name, String picture) {
}
