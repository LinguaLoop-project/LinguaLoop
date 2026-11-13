package com.lingualoop.backend.credit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lingualoop.backend.credit.entity.AiUsageLog;

public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, Long> {
}
