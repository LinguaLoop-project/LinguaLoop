package com.lingualoop.backend.lesson.youtube;

import java.time.Duration;

/** Thông tin cơ bản của một video đã qua kiểm tra BR-BH-07 và BR-BH-17. */
public record YouTubeVideoInfo(String videoId, String title, Duration duration) {

    public String watchUrl() {
        return "https://www.youtube.com/watch?v=" + videoId;
    }
}
