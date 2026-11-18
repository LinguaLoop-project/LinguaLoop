package com.lingualoop.backend.vocab.dto.request;

/**
 * Tên bộ cá nhân khi thêm hoặc đổi tên (UC-HT-08). Không gắn Bean Validation: tên được cắt khoảng trắng hai đầu rồi mới
 * kiểm tra độ dài (BR-HT-25), nên service kiểm tra và trả lỗi theo trường {@code name}.
 */
public record MyDeckRequest(String name) {
}
