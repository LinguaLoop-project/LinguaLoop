package com.lingualoop.backend.shadowing.azure;

import com.lingualoop.backend.common.exception.ErrorCode;
import com.microsoft.cognitiveservices.speech.CancellationErrorCode;

/** Đổi mã huỷ của Azure Speech SDK thành lỗi cho người học: bị giới hạn tốc độ khác với dịch vụ hỏng (BR-SHADOW-14). */
final class AzureCancellation {

    private AzureCancellation() {
    }

    /** Azure từ chối vì quá nhiều yêu cầu thì báo bận (thử lại sau được); mọi mã khác là dịch vụ không dùng được. */
    static ErrorCode toErrorCode(CancellationErrorCode code) {
        return code == CancellationErrorCode.TooManyRequests
                ? ErrorCode.SHADOWING_SCORING_BUSY
                : ErrorCode.SHADOWING_SCORING_UNAVAILABLE;
    }

    /** Hết quota hoặc sai khoá: người học thử lại cũng không được, cần người vận hành xử lý nên phải ghi log mức ERROR. */
    static boolean needsOperator(CancellationErrorCode code) {
        return code == CancellationErrorCode.Forbidden || code == CancellationErrorCode.AuthenticationFailure;
    }
}
