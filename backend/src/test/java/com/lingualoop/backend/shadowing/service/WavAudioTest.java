package com.lingualoop.backend.shadowing.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.support.WavFixtures;

class WavAudioTest {

    @Test
    void validWav_returnsDuration() {
        assertThat(WavAudio.parse(WavFixtures.valid(2_000)).durationMs()).isEqualTo(2_000);
    }

    @Test
    void boundaries_areInclusive_AC_SHADOW_07() {
        assertThat(WavAudio.parse(WavFixtures.valid(500)).durationMs()).isEqualTo(500);
        assertThat(WavAudio.parse(WavFixtures.valid(30_000)).durationMs()).isEqualTo(30_000);
    }

    @Test
    void tooShortTooLongAndEmpty_areRejected_AC_SHADOW_07() {
        assertInvalid(WavFixtures.valid(499), "too_short");
        assertInvalid(WavFixtures.valid(30_001), "too_long");
        assertInvalid(new byte[0], "empty");
        assertInvalid(null, "empty");
    }

    @Test
    void notWav_isRejected_AC_SHADOW_07() {
        assertInvalid("this is not a wav file at all".getBytes(), "not_wav");
        assertInvalid(new byte[8], "not_wav");
    }

    @Test
    void wrongFormat_isRejected_AC_SHADOW_07() {
        assertInvalid(WavFixtures.wav(2, 16_000, 16, 64_000), "bad_format");
        assertInvalid(WavFixtures.wav(1, 44_100, 16, 64_000), "bad_format");
        assertInvalid(WavFixtures.wav(1, 16_000, 8, 32_000), "bad_format");
    }

    @Test
    void oversizedFile_isRejectedBeforeParsing_AC_SHADOW_07() {
        assertInvalid(new byte[WavAudio.MAX_BYTES + 1], "too_large");
    }

    @Test
    void streamingHeaderWithZeroDataSize_usesActualBytes() {
        byte[] wav = WavFixtures.valid(1_000);
        // Bản ghi dạng luồng: kích thước khối data khai báo 0xFFFFFFFF
        wav[40] = wav[41] = wav[42] = wav[43] = (byte) 0xFF;
        assertThat(WavAudio.parse(wav).durationMs()).isEqualTo(1_000);
    }

    private static void assertInvalid(byte[] bytes, String reason) {
        assertThatThrownBy(() -> WavAudio.parse(bytes)).isInstanceOfSatisfying(BusinessException.class, e -> {
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.SHADOWING_AUDIO_INVALID);
            assertThat(e.getDetails()).containsEntry("reason", reason);
        });
    }
}
