package com.lingualoop.backend.stats.repository;

import java.sql.Timestamp;
import java.time.Instant;

/**
 * Tiện ích chung của các truy vấn thống kê. Câu SQL luôn là hằng (không ghép chuỗi lúc chạy), mọi giá trị lọc truyền
 * bằng tham số. Quy ước lặp lại trong các câu: ngày theo giờ Việt Nam là
 * {@code (cot AT TIME ZONE 'Asia/Ho_Chi_Minh')::date} (BR-NK-07); khoảng là {@code [:from, :to)}; Pro tại một thời
 * điểm là có đơn {@code pro_orders} đã thanh toán còn hiệu lực lúc đó (BR-NK-12).
 */
final class StatsSql {

    private StatsSql() {
    }

    static Timestamp ts(Instant instant) {
        return Timestamp.from(instant);
    }
}
