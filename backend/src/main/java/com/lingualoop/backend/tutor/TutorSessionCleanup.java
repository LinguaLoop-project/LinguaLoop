package com.lingualoop.backend.tutor;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.tutor.entity.TutorSession;
import com.lingualoop.backend.tutor.repository.TutorSessionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Dọn các phiên tạo xong mà không bao giờ {@code started}: quá 15 giây thì kết thúc {@code connect_failed}, không bị
 * trừ lượt (BR-TUTOR-06). Phiên cũng được đóng khi có ai chạm tới nó; job này chỉ để số liệu không còn phiên treo.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TutorSessionCleanup {

    private final TutorSessionRepository sessions;
    private final TransactionTemplate tx;
    private final Clock clock;

    @Scheduled(fixedDelayString = "${app.tutor.cleanup-interval:PT10S}")
    public void scheduled() {
        int ended = sweep();
        if (ended > 0) {
            log.info("Đã đóng {} phiên gia sư không kết nối được", ended);
        }
    }

    /** @return số phiên vừa được kết thúc */
    public int sweep() {
        Instant now = clock.instant();
        List<TutorSession> stale = sessions.findUnstartedBefore(now.minusSeconds(TutorThresholds.START_TIMEOUT_SECONDS));
        int ended = 0;
        for (UUID id : stale.stream().map(TutorSession::getId).toList()) {
            Boolean closed = tx.execute(status -> sessions.lockById(id).map(s -> {
                boolean open = s.open();
                s.expireIfNotStarted(now);
                return open && !s.open();
            }).orElse(false));
            if (Boolean.TRUE.equals(closed)) {
                ended++;
            }
        }
        return ended;
    }
}
