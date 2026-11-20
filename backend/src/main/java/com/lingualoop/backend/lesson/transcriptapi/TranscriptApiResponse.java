package com.lingualoop.backend.lesson.transcriptapi;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Phản hồi 200 của {@code GET /youtube/transcript} với {@code format=json&include_timestamp=true}.
 *
 * @param language {@code en} là phụ đề do người làm, {@code asr-en} là phụ đề tự động
 */
@JsonIgnoreProperties(ignoreUnknown = true)
record TranscriptApiResponse(
        @JsonProperty("video_id") String videoId,
        String language,
        List<Caption> transcript,
        @JsonProperty("length_seconds") Integer lengthSeconds) {

    /** Một mảnh phụ đề; {@code start} và {@code duration} tính bằng giây. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record Caption(String text, Double start, Double duration) {
    }
}
