package com.lingualoop.backend.lesson.transcriptapi;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;


@FeignClient(name = "transcript-api", url = "${app.lesson-import.transcript-api-url:https://transcriptapi.com/api/v2}")
interface TranscriptApiClient {

    /**
     * @param videoUrl mã video 11 ký tự hoặc link
     * @param language thứ tự ưu tiên ngôn ngữ; {@code en} lấy phụ đề tiếng Anh do người làm, không có thì phụ đề tự
     *                 động
     */
    @GetMapping("/youtube/transcript?format=json&include_timestamp=true&send_metadata=false")
    TranscriptApiResponse transcript(@RequestHeader("Authorization") String bearer,
            @RequestParam("video_url") String videoUrl, @RequestParam("language") String language);
}
