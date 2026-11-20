package com.lingualoop.backend.lesson.transcript;

/** Một câu lời thoại với mốc tính bằng mili giây từ đầu video. */
public record TranscriptSegment(int startMs, int endMs, String text) {

    public int durationMs() {
        return endMs - startMs;
    }
}
