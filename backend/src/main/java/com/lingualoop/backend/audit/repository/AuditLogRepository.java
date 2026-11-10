package com.lingualoop.backend.audit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lingualoop.backend.audit.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
