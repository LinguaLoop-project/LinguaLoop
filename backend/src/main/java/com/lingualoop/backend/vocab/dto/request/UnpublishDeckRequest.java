package com.lingualoop.backend.vocab.dto.request;

/**
 * Lý do quản trị viên gỡ xuất bản (BR-BT-08). Được kiểm ở service vì lý do chỉ có nghĩa sau khi cắt khoảng trắng hai
 * đầu: bắt buộc, tối đa 500 ký tự.
 */
public record UnpublishDeckRequest(String reason) {
}
