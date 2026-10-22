package com.lingualoop.backend.shadowing.azure;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.common.exception.ErrorCode;
import com.microsoft.cognitiveservices.speech.CancellationErrorCode;

/** Mã huỷ của Azure → lỗi cho người học (BR-SHADOW-14). */
class AzureCancellationTest {

    @Test
    void throttling_isBusy_everythingElseIsUnavailable() {
        assertThat(AzureCancellation.toErrorCode(CancellationErrorCode.TooManyRequests))
                .isEqualTo(ErrorCode.SHADOWING_SCORING_BUSY);
        for (CancellationErrorCode code : CancellationErrorCode.values()) {
            if (code != CancellationErrorCode.TooManyRequests) {
                assertThat(AzureCancellation.toErrorCode(code)).as(code.name())
                        .isEqualTo(ErrorCode.SHADOWING_SCORING_UNAVAILABLE);
            }
        }
    }

    @Test
    void quotaAndKeyErrors_needAnOperator_throttlingDoesNot() {
        assertThat(AzureCancellation.needsOperator(CancellationErrorCode.Forbidden)).isTrue();
        assertThat(AzureCancellation.needsOperator(CancellationErrorCode.AuthenticationFailure)).isTrue();
        assertThat(AzureCancellation.needsOperator(CancellationErrorCode.TooManyRequests)).isFalse();
        assertThat(AzureCancellation.needsOperator(CancellationErrorCode.ConnectionFailure)).isFalse();
    }
}
