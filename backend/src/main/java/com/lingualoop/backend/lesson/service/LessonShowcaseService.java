package com.lingualoop.backend.lesson.service;

import com.lingualoop.backend.lesson.dto.ShowcaseView;

/** Bài học giới thiệu trên trang chủ công khai, không cần đăng nhập (BR-TC-20). */
public interface LessonShowcaseService {

    /** Tên bộ nhớ đệm: mọi khách nhận cùng kết quả nên chỉ tính lại theo thời hạn của {@code CacheConfig}. */
    String CACHE = "lessonShowcase";

    /** Số bài tối đa mỗi trình độ A1 đến C2. */
    int PER_LEVEL = 3;

    /** Số chủ đề tối đa. */
    int TOPICS = 12;

    ShowcaseView showcase();
}
