package com.lingualoop.backend.support;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * Đồng hồ chỉnh được cho test: mặc định chạy theo giờ thật, {@link #advance} cộng thêm độ lệch,
 * {@link #fixAt} dừng đồng hồ ở một thời điểm cố định.
 */
public class MutableClock extends Clock {

    private volatile Duration offset = Duration.ZERO;
    private volatile Instant fixed;

    @Override
    public ZoneId getZone() {
        return ZoneOffset.UTC;
    }

    @Override
    public Clock withZone(ZoneId zone) {
        return this;
    }

    @Override
    public Instant instant() {
        Instant pinned = fixed;
        return pinned != null ? pinned : Instant.now().plus(offset);
    }

    public void advance(Duration duration) {
        offset = offset.plus(duration);
    }

    /** Dừng đồng hồ ở đúng thời điểm này cho tới khi {@link #reset}. */
    public void fixAt(Instant instant) {
        fixed = instant;
    }

    public void reset() {
        offset = Duration.ZERO;
        fixed = null;
    }
}
