package com.lingualoop.backend.practice.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import com.lingualoop.backend.practice.dto.ClassCountsView;

/** Số liệu lỗi nghe chép theo nhóm từ, dùng để chọn ô trống ở mức Easy. */
public interface DictationStatsQueryService {

    Map<String, ClassCountsView> countsByWordClass(UUID userId, Instant since);
}
