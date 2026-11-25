package com.lingualoop.backend.stats.service;

import com.lingualoop.backend.stats.dto.AiUsageStatsView;
import com.lingualoop.backend.stats.dto.OverviewStatsView;
import com.lingualoop.backend.stats.dto.PlanFilter;
import com.lingualoop.backend.stats.dto.PracticeStatsView;
import com.lingualoop.backend.stats.dto.StatsPeriod;

/**
 * Thống kê hệ thống cho quản trị viên (UC-NK-02 đến 04). Số liệu được giữ trong bộ nhớ đệm tối đa 1 giờ và luôn kèm
 * thời điểm tính (BR-NK-10).
 */
public interface SystemStatsAdminService {

    String CACHE_OVERVIEW = "statsOverview";
    String CACHE_PRACTICE = "statsPractice";
    String CACHE_AI = "statsAi";

    OverviewStatsView overview(StatsPeriod period);

    PracticeStatsView practice(StatsPeriod period, PlanFilter plan);

    AiUsageStatsView aiUsage(StatsPeriod period);
}
