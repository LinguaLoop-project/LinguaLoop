package com.lingualoop.backend.lesson.youtube;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Phần cần dùng trong phản hồi {@code videos.list} của YouTube Data API v3. */
@JsonIgnoreProperties(ignoreUnknown = true)
record YouTubeVideoListResponse(List<Item> items) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Item(String id, Snippet snippet, ContentDetails contentDetails, Status status) {
    }

    /** {@code liveBroadcastContent}: none, live hoặc upcoming. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record Snippet(String title, String liveBroadcastContent) {
    }

    /** {@code duration} dạng ISO-8601, ví dụ {@code PT4M46S}; video đang phát trực tiếp có {@code P0D}. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record ContentDetails(String duration, ContentRating contentRating) {
    }

    /** {@code ytRating = ytAgeRestricted} là video bị giới hạn độ tuổi. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record ContentRating(String ytRating) {
    }

    /** {@code privacyStatus}: public, unlisted hoặc private. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record Status(String privacyStatus, String uploadStatus) {
    }
}
