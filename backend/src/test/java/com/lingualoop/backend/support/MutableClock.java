package com.lingualoop.backend.support;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** Đồng hồ chỉnh được cho test: mặc định chạy theo giờ thật, {@link #advance} cộng thêm độ lệch. */
public class MutableClock extends Clock {

    private volatile Duration offset = Duration.ZERO;

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
        return Instant.now().plus(offset);
    }

    public void advance(Duration duration) {
        offset = offset.plus(duration);
    }

    public void reset() {
        offset = Duration.ZERO;
    }
}
