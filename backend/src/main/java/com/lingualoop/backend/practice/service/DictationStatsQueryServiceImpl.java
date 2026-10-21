package com.lingualoop.backend.practice.service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.practice.dto.ClassCountsView;
import com.lingualoop.backend.practice.repository.DictationStatsRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class DictationStatsQueryServiceImpl implements DictationStatsQueryService {

    private final DictationStatsRepository stats;

    @Override
    @Transactional(readOnly = true)
    public Map<String, ClassCountsView> countsByWordClass(UUID userId, Instant since) {
        Map<String, ClassCountsView> counts = new HashMap<>();
        for (Object[] row : stats.sumByWordClass(userId, since.atZone(ZoneOffset.UTC).toLocalDate())) {
            counts.put((String) row[0], new ClassCountsView(((Number) row[1]).longValue(), ((Number) row[2]).longValue()));
        }
        return counts;
    }
}
