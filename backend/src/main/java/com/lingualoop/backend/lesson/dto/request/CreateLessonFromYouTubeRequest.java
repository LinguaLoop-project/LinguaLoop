package com.lingualoop.backend.lesson.dto.request;

import java.util.UUID;

import com.lingualoop.backend.lesson.enums.CefrLevel;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Form tạo bài từ link YouTube (UC-BH-03 Bước 2, BR-BH-08). Tiêu đề để trống thì lấy tên video.
 *
 * @param pro "Yêu cầu gói Pro", mặc định không
 */
public record CreateLessonFromYouTubeRequest(
        @NotBlank String youtubeUrl,
        @Size(max = 100) String title,
        @NotNull UUID topicId,
        @NotNull CefrLevel cefrLevel,
        boolean pro) {
}
