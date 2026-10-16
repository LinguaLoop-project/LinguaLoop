package com.lingualoop.backend.audit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lingualoop.backend.audit.entity.ContentAuditLog;

public interface ContentAuditLogRepository extends JpaRepository<ContentAuditLog, Long> {
}
