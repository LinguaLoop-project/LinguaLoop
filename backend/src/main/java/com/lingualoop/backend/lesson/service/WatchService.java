package com.lingualoop.backend.lesson.service;

import java.util.UUID;

import com.lingualoop.backend.lesson.dto.WatchView;

/** Học thụ động (UC-TC-04): luồng video ngắn, thích video và lưu câu. */
public interface WatchService {

    /** Bài dài tối đa bấy nhiêu giây mới vào luồng. */
    int MAX_DURATION_SEC = 180;

    /** Số video mỗi trang. */
    int PAGE_SIZE = 10;

    /**
     * Một trang của luồng, thứ tự cố định theo {@code seed} trong một phiên xem. {@code start} là bài mở từ trang chi tiết
     * bài học, đứng đầu luồng; bỏ qua khi bài không còn hiển thị hoặc học viên không có quyền xem.
     */
    WatchView.Feed feed(UUID userId, String seed, int page, UUID start);

    /** Thích video; đã thích thì giữ nguyên (BR-TC-16). */
    WatchView.Like like(UUID userId, UUID lessonId);

    /** Bỏ thích video; chưa thích thì giữ nguyên (BR-TC-16). */
    WatchView.Like unlike(UUID userId, UUID lessonId);

    /** Lưu câu vào Câu cần ôn chế độ Shadowing (BR-TC-17). */
    WatchView.Saved saveSentence(UUID userId, UUID sentenceId);

    /** Gỡ câu khỏi Câu cần ôn chế độ Shadowing. */
    WatchView.Saved unsaveSentence(UUID userId, UUID sentenceId);
}
