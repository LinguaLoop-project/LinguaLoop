package com.lingualoop.backend.lesson.transcriptapi;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.LessonImportProperties;
import com.lingualoop.backend.lesson.transcript.Transcript;
import com.lingualoop.backend.lesson.transcript.TranscriptSegment;
import com.lingualoop.backend.lesson.transcript.VideoTranscriber;
import com.lingualoop.backend.lesson.youtube.YouTubeVideoInfo;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Lấy lời thoại từ phụ đề tiếng Anh của video qua TranscriptAPI (UC-BH-03 Bước 7), rồi ghép các dòng phụ đề thành câu.
 * Ưu tiên phụ đề do người làm, không có thì phụ đề tự động của YouTube. Video không có phụ đề tiếng Anh thì trả rỗng
 * (7a).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TranscriptApiTranscriber implements VideoTranscriber {

    static final String LANGUAGE = "en";
    static final int MAX_RETRIES = 2;
    static final long[] BACKOFF_MS = {1000, 2000};
    private static final Set<Integer> RETRYABLE = Set.of(408, 429, 503);
    /** Mã 404 nghĩa là video không có phụ đề tiếng Anh. */
    private static final Set<String> NO_CAPTIONS = Set.of("no_captions", "no_transcript_for_requested_languages");
    /** Mã 404 nghĩa là video không xem được. */
    private static final Set<String> UNAVAILABLE = Set.of("video_unavailable", "age_restricted", "live_not_started");
    private static final ObjectMapper JSON = new ObjectMapper();

    private final TranscriptApiClient client;
    private final LessonImportProperties properties;

    @Override
    public Transcript transcribe(YouTubeVideoInfo video) {
        if (!properties.transcriptApiConfigured()) {
            log.error("TranscriptAPI chưa cấu hình (TRANSCRIPT_API_KEY trống)");
            throw new BusinessException(ErrorCode.LESSON_TRANSCRIPT_UNAVAILABLE);
        }
        TranscriptApiResponse response = fetch(video.videoId());
        if (response == null) {
            log.info("Video {} không có phụ đề tiếng Anh", video.videoId());
            return Transcript.none();
        }
        // Từ đây TranscriptAPI đã trả phụ đề nên đã tính phí lần lấy này (ADR 0012)
        if (!isEnglish(response.language())) {
            log.info("Video {} không có phụ đề tiếng Anh (ngôn ngữ nhận được: {})", video.videoId(),
                    response.language());
            return new Transcript(List.of(), true);
        }
        List<TranscriptSegment> sentences = CaptionMerger.merge(response.transcript());
        log.info("TranscriptAPI: video {} có {} dòng phụ đề ({}, {}), {}, ghép thành {} câu", video.videoId(),
                response.transcript() == null ? 0 : response.transcript().size(), response.language(),
                response.language() != null && response.language().startsWith("asr") ? "tự động" : "người làm",
                CaptionMerger.isPunctuated(response.transcript()) ? "có dấu câu" : "không dấu câu",
                sentences.size());
        return new Transcript(sentences, true);
    }

    private TranscriptApiResponse fetch(String videoId) {
        String bearer = "Bearer " + properties.transcriptApiKey();
        for (int attempt = 0; ; attempt++) {
            try {
                return client.transcript(bearer, videoId, LANGUAGE);
            } catch (FeignException e) {
                int status = e.status();
                String code = errorCode(e);
                if (status == 404 && NO_CAPTIONS.contains(code)) {
                    return null;
                }
                if (status == 404 && UNAVAILABLE.contains(code)) {
                    throw new BusinessException(ErrorCode.YOUTUBE_VIDEO_UNAVAILABLE);
                }
                if (RETRYABLE.contains(status) && attempt < MAX_RETRIES) {
                    log.warn("TranscriptAPI tạm lỗi cho video {} (mã {}), thử lại lần {}", videoId, status,
                            attempt + 1);
                    pause(BACKOFF_MS[attempt]);
                    continue;
                }
                log.error("TranscriptAPI lỗi cho video {} (mã {}, code {}){}", videoId, status, code,
                        status == 402 ? ": hết credit hoặc chưa có gói TranscriptAPI" : "");
                throw new BusinessException(ErrorCode.LESSON_TRANSCRIPT_UNAVAILABLE);
            }
        }
    }

    /** {@code en}, {@code en-GB} (phụ đề người làm) hoặc {@code asr-en} (phụ đề tự động). */
    static boolean isEnglish(String language) {
        if (language == null) {
            return false;
        }
        String lang = language.toLowerCase(Locale.ROOT);
        if (lang.startsWith("asr-")) {
            lang = lang.substring(4);
        }
        return lang.equals("en") || lang.startsWith("en-");
    }

    /** Trường {@code code} của thân lỗi {@code {"detail": ..., "code": ...}}; không đọc được thì rỗng. */
    private static String errorCode(FeignException e) {
        try {
            JsonNode body = JSON.readTree(e.contentUTF8());
            return body == null ? "" : body.path("code").asText("");
        } catch (Exception ignored) {
            return "";
        }
    }

    private static void pause(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(ErrorCode.LESSON_TRANSCRIPT_UNAVAILABLE);
        }
    }
}
