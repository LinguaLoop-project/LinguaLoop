package com.lingualoop.backend.lesson.youtube;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * YouTube Data API v3, chỉ dùng {@code videos.list} (1 unit hạn mức mỗi lần gọi). Khóa API đi trong header
 * {@code X-goog-api-key}, không đi trong URL để không lộ trong log truy cập.
 */
@FeignClient(name = "youtube-data", url = "${app.lesson-import.youtube-api-url:https://www.googleapis.com/youtube/v3}")
interface YouTubeDataClient {

    String PARTS = "snippet,contentDetails,status";

    @GetMapping("/videos")
    YouTubeVideoListResponse videos(@RequestHeader("X-goog-api-key") String apiKey,
            @RequestParam("part") String part, @RequestParam("id") String id);
}
