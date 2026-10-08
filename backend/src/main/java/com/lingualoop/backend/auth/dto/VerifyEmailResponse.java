package com.lingualoop.backend.auth.dto;

/** Kết quả xác thực để UI hiện đúng thông báo: vừa xác thực xong, hay email đã được xác thực từ trước. */
public record VerifyEmailResponse(Result result) {

    public enum Result {
        VERIFIED,
        ALREADY_VERIFIED
    }
}
