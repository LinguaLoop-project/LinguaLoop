package com.lingualoop.backend.config;

import java.time.ZoneId;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bind từ {@code app.credit}: {@code zone} quyết định lúc ví Free đặt lại (00:00 giờ Việt Nam, BR-GA-03);
 * {@code tutorSessionCost} là credit cố định của một phiên gia sư.
 */
@ConfigurationProperties("app.credit")
public record CreditProperties(ZoneId zone, Integer tutorSessionCost) {

    public CreditProperties {
        zone = zone == null ? ZoneId.of("Asia/Ho_Chi_Minh") : zone;
        tutorSessionCost = tutorSessionCost == null ? Integer.valueOf(3) : tutorSessionCost;
    }
}
