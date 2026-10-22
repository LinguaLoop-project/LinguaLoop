package com.lingualoop.backend.shadowing.azure;

import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.resilience.ExternalCallGuard;
import com.lingualoop.backend.config.ScoringGuardProperties;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;

/**
 * Bọc dịch vụ chấm bằng circuit breaker. Azure chậm hoặc sập thì sau vài lượt lỗi mạch mở: các lượt chấm tiếp theo
 * báo {@code SHADOWING_SCORING_UNAVAILABLE} ngay (và được hoàn lượt như mọi lỗi chấm khác) thay vì mỗi người học
 * phải chờ hết thời gian chờ của Azure. Lỗi do người học (không nghe thấy lời nói) không tính là lỗi dịch vụ.
 *
 * <p>Số lời gọi chạy cùng lúc bị giới hạn (gói Azure miễn phí giới hạn số yêu cầu đồng thời): lời gọi thừa chờ một lúc
 * ngắn rồi báo {@code SHADOWING_SCORING_BUSY}. Báo bận, dù do giới hạn này hay do Azure trả "quá nhiều yêu cầu", không
 * tính là lỗi dịch vụ nên không làm mở mạch: quá tải chỉ là tạm thời, còn mở mạch sẽ chặn cả những người học khác.
 */
@Primary
@Service
class GuardedPronunciationScoringService implements PronunciationScoringService {

    private final PronunciationScoringService delegate;
    private final ExternalCallGuard guard;
    private final Semaphore permits;
    private final long queueWaitNanos;

    GuardedPronunciationScoringService(
            @Qualifier("azurePronunciationScoringService") PronunciationScoringService delegate,
            ScoringGuardProperties properties) {
        this.delegate = delegate;
        this.permits = new Semaphore(properties.maxConcurrent(), true);
        this.queueWaitNanos = properties.queueWait().toNanos();
        this.guard = new ExternalCallGuard("azure-scoring", properties.windowSize(), properties.minimumCalls(),
                properties.failureRatePercent(), properties.openFor(),
                GuardedPronunciationScoringService::isServiceFailure);
    }

    @Override
    public PronunciationAssessment assess(byte[] wav, String referenceText) {
        acquire();
        try {
            return guard.call(() -> delegate.assess(wav, referenceText),
                    () -> new BusinessException(ErrorCode.SHADOWING_SCORING_UNAVAILABLE));
        } finally {
            permits.release();
        }
    }

    private void acquire() {
        try {
            if (!permits.tryAcquire(queueWaitNanos, TimeUnit.NANOSECONDS)) {
                throw new BusinessException(ErrorCode.SHADOWING_SCORING_BUSY);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(ErrorCode.SHADOWING_SCORING_UNAVAILABLE);
        }
    }

    CircuitBreaker.State state() {
        return guard.state();
    }

    /** Chỉ lỗi phía dịch vụ mới làm mở mạch; các lỗi nghiệp vụ khác (vd không có lời nói) thì Azure vẫn trả lời bình thường. */
    private static boolean isServiceFailure(Throwable error) {
        return !(error instanceof BusinessException business)
                || business.getErrorCode() == ErrorCode.SHADOWING_SCORING_UNAVAILABLE;
    }
}
