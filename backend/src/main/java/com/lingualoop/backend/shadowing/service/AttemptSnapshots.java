package com.lingualoop.backend.shadowing.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.shadowing.dto.AttemptSnapshot;

/** Đọc kết quả đã lưu của các Lượt shadowing cho module khác (Phiên gia sư). */
public interface AttemptSnapshots {

    /** @throws com.lingualoop.backend.common.exception.NotFoundException lượt không có, không phải của người gọi, hoặc không phải lượt shadowing */
    AttemptSnapshot load(UUID userId, long attemptId);

    /** Tối đa {@code limit} lượt của người học trong cùng bài, trước lượt {@code attemptId}, lượt gần nhất đứng đầu. */
    List<AttemptSnapshot> previous(UUID userId, long attemptId, int limit);

    /** Số lượt của người học trong bài có mã lớn hơn {@code afterAttemptId} và không quá {@code uptoAttemptId}. */
    int countSince(UUID userId, UUID lessonId, long afterAttemptId, long uptoAttemptId);
}
