package com.lingualoop.backend.lesson.youtube;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

class YouTubeVideoIdTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "https://www.youtube.com/watch?v=UBcWImI_IT0",
            "https://www.youtube.com/watch?feature=share&v=UBcWImI_IT0&t=12s",
            "https://youtu.be/UBcWImI_IT0?si=abc",
            "https://www.youtube.com/embed/UBcWImI_IT0",
            "https://www.youtube.com/shorts/UBcWImI_IT0",
            "  https://m.youtube.com/watch?v=UBcWImI_IT0  ",
            "youtu.be/UBcWImI_IT0" })
    void parses_valid_links(String url) {
        assertThat(YouTubeVideoId.parse(url)).isEqualTo("UBcWImI_IT0");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
            "not a link",
            "https://example.com/watch?v=UBcWImI_IT0",
            "https://www.youtube.com/watch?v=UBcWImI_IT0123",
            "https://www.youtube.com/watch?v=UBcWImI_IT",
            "https://www.youtube.com/watch?v=UBcWImI$IT0",
            "https://www.youtube.com/watch?v=;rm -rf /",
            "https://youtu.be/UBcWImI_IT0123",
            "https://www.youtube.com/playlist?list=PL1234567890",
            "https://evil.com/?u=https://www.youtube.com/watch?v=UBcWImI_IT0" })
    void rejects_invalid_links(String url) {
        assertThatThrownBy(() -> YouTubeVideoId.parse(url))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.YOUTUBE_LINK_INVALID));
    }

    @Test
    void accepts_id_starting_with_dash() {
        // ký tự "-" hợp lệ trong ID; yt-dlp vẫn an toàn vì ID luôn đi sau "--"
        assertThat(YouTubeVideoId.parse("https://youtu.be/-abcdefghij")).isEqualTo("-abcdefghij");
    }
}
