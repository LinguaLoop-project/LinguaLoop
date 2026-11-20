package com.lingualoop.backend.lesson.youtube;

import java.time.Duration;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.LessonImportProperties;
import com.lingualoop.backend.lesson.youtube.YouTubeVideoListResponse.Item;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Đọc thông tin video bằng YouTube Data API rồi kiểm tra theo BR-BH-07 và BR-BH-17 (UC-BH-03 Bước 6): video phải tồn
 * tại, xem được bằng link (công khai hoặc không công khai), không phát trực tiếp, không giới hạn độ tuổi và không dài
 * quá giới hạn. Đây là API chính thức nên không bị chặn như khi tải trang YouTube từ server.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class YouTubeVideoLookup {

    private static final Set<String> VIEWABLE = Set.of("public", "unlisted");

    private final YouTubeDataClient client;
    private final LessonImportProperties properties;

    /**
     * @throws BusinessException {@code YOUTUBE_VIDEO_UNAVAILABLE} (6a), {@code YOUTUBE_VIDEO_TOO_LONG} (6c),
     *         {@code YOUTUBE_UNAVAILABLE} khi chưa cấu hình khóa API hoặc YouTube không phản hồi (6d)
     */
    public YouTubeVideoInfo fetch(String videoId) {
        if (!properties.youtubeConfigured()) {
            log.error("YouTube Data API chưa cấu hình (YOUTUBE_API_KEY trống)");
            throw new BusinessException(ErrorCode.YOUTUBE_UNAVAILABLE);
        }
        YouTubeVideoListResponse response;
        try {
            response = client.videos(properties.youtubeApiKey(), YouTubeDataClient.PARTS, videoId);
        } catch (FeignException e) {
            log.error("YouTube Data API lỗi cho video {} (mã {}): {}", videoId, e.status(), e.getMessage());
            throw new BusinessException(ErrorCode.YOUTUBE_UNAVAILABLE);
        }
        if (response == null || response.items() == null || response.items().isEmpty()) {
            throw new BusinessException(ErrorCode.YOUTUBE_VIDEO_UNAVAILABLE); // đã gỡ hoặc riêng tư
        }
        return check(videoId, response.items().get(0));
    }

    private YouTubeVideoInfo check(String videoId, Item item) {
        String privacy = item.status() == null ? null : item.status().privacyStatus();
        if (privacy != null && !VIEWABLE.contains(privacy)) {
            throw new BusinessException(ErrorCode.YOUTUBE_VIDEO_UNAVAILABLE);
        }
        String live = item.snippet() == null ? null : item.snippet().liveBroadcastContent();
        if (live != null && !"none".equals(live)) {
            throw new BusinessException(ErrorCode.YOUTUBE_VIDEO_UNAVAILABLE);
        }
        if (item.contentDetails() != null && item.contentDetails().contentRating() != null
                && "ytAgeRestricted".equals(item.contentDetails().contentRating().ytRating())) {
            throw new BusinessException(ErrorCode.YOUTUBE_VIDEO_UNAVAILABLE);
        }

        Duration duration = parseDuration(item.contentDetails() == null ? null : item.contentDetails().duration());
        if (duration == null || duration.isZero()) {
            log.warn("Video {} không có thời lượng hợp lệ", videoId);
            throw new BusinessException(ErrorCode.YOUTUBE_VIDEO_UNAVAILABLE);
        }
        Duration max = properties.maxDuration();
        if (duration.compareTo(max) > 0) {
            throw new BusinessException(ErrorCode.YOUTUBE_VIDEO_TOO_LONG,
                    "Video dài hơn giới hạn " + max.toMinutes() + " phút", Map.of("maxMinutes", max.toMinutes()));
        }
        String title = item.snippet() == null ? null : item.snippet().title();
        return new YouTubeVideoInfo(videoId, title, duration);
    }

    private static Duration parseDuration(String iso) {
        if (iso == null || iso.isBlank()) {
            return null;
        }
        try {
            return Duration.parse(iso);
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}
