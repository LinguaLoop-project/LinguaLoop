package com.lingualoop.backend.tutor;

import java.time.Clock;
import java.util.UUID;
import java.util.function.Function;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.tutor.entity.TutorSession;
import com.lingualoop.backend.tutor.repository.TutorSessionRepository;

import lombok.RequiredArgsConstructor;

/**
 * Chạy một thao tác trên phiên với dòng đã khoá (khoá bi quan) trong một transaction ngắn, để hai yêu cầu đồng thời
 * không ghi chồng nhau (vd người học đổi từ trong lúc Azure đang chấm từ cũ). Phiên quá hạn 15 giây chưa started được
 * đóng ngay khi chạm tới và việc đóng đó được lưu kể cả khi thao tác bị từ chối.
 */
@Component
@RequiredArgsConstructor
class LockedSessions {

    private final TutorSessionRepository sessions;
    private final TransactionTemplate tx;
    private final Clock clock;

    private record Result<T>(T value, String conflict) {
    }

    /**
     * @throws NotFoundException phiên không phải của người gọi
     * @throws BusinessException {@code TUTOR_SESSION_CONFLICT} khi phiên đã kết thúc hoặc thao tác không hợp lệ ở
     *         trạng thái hiện tại (thông báo là chỉ dẫn cho gia sư); lỗi nghiệp vụ khác của thao tác được giữ nguyên
     */
    <T> T run(UUID userId, UUID sessionId, Function<TutorSession, T> action) {
        Result<T> result = tx.execute(status -> {
            TutorSession session = sessions.lockByIdAndUserId(sessionId, userId)
                    .orElseThrow(() -> new NotFoundException("Session not found"));
            session.expireIfNotStarted(clock.instant());
            try {
                return new Result<>(action.apply(session), null);
            } catch (IllegalStateException e) {
                // Các phương thức của TutorSession kiểm tra trước khi đổi gì nên chưa có thay đổi dở dang; commit để
                // giữ việc đóng phiên quá hạn ở trên
                return new Result<>(null, e.getMessage());
            }
        });
        if (result.conflict() != null) {
            throw new BusinessException(ErrorCode.TUTOR_SESSION_CONFLICT, result.conflict());
        }
        return result.value();
    }
}
