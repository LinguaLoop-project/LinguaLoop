package com.lingualoop.backend.tutor;

/** Kết quả từng từ trong một Phiên gia sư. */
public enum WordStatus {
    /** Chưa luyện, hoặc đang luyện và còn lượt. */
    PENDING,
    /** Đạt từ 80 điểm. */
    PASSED,
    /** Hết 3 Lượt chấm mà chưa đạt. */
    NEEDS_PRACTICE
}
