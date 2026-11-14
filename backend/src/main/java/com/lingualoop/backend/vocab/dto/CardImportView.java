package com.lingualoop.backend.vocab.dto;

/** Kết quả kiểm tra và nhập thẻ từ tệp Excel/CSV (UC-NT-07). */
public final class CardImportView {

    private CardImportView() {
    }

    /** Tóm tắt trước khi nhập: số thẻ sẽ được thêm (UC-NT-07 bước 7). */
    public record Preview(int cardCount) {
    }

    /** Số thẻ đã thêm vào cuối nhóm (UC-NT-07 bước 9). */
    public record Result(int addedCount) {
    }
}
