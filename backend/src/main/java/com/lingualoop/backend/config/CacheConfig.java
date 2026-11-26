package com.lingualoop.backend.config;

import java.time.Duration;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.lingualoop.backend.stats.service.SystemStatsAdminService;
import com.lingualoop.backend.stats.service.TeacherContentStatsService;

/**
 * Bộ nhớ đệm trong tiến trình. Thống kê hệ thống và thống kê nội dung của giáo viên được tính lại tối đa mỗi giờ
 * (BR-NK-10, BR-TN-06); kết quả luôn kèm thời điểm
 * tính nên màn hình hiển thị đúng lúc số liệu được cập nhật.
 */
@Configuration
@EnableCaching
class CacheConfig {

    static final Duration STATS_TTL = Duration.ofHours(1);

    @Bean
    CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(SystemStatsAdminService.CACHE_OVERVIEW,
                SystemStatsAdminService.CACHE_PRACTICE, SystemStatsAdminService.CACHE_AI,
                TeacherContentStatsService.CACHE_OVERVIEW, TeacherContentStatsService.CACHE_LESSON,
                TeacherContentStatsService.CACHE_DECK);
        // Thống kê giáo viên có một mục cho mỗi giáo viên, bài, bộ và khoảng nên cần nhiều chỗ hơn thống kê hệ thống.
        manager.setCaffeine(Caffeine.newBuilder().expireAfterWrite(STATS_TTL).maximumSize(2_000));
        return manager;
    }
}
