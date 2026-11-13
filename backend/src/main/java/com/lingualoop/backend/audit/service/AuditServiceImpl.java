package com.lingualoop.backend.audit.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.entity.AuditLog;
import com.lingualoop.backend.audit.repository.AuditLogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class AuditServiceImpl implements AuditService {

    /** Tên ghi khi nguồn là hệ thống hoặc người gọi không cung cấp tên. */
    private static final String SYSTEM_NAME = "Hệ thống";
    private static final String UNKNOWN_NAME = "Không rõ";

    private final AuditLogRepository logs;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(AuditEntryRequest entry) {
        boolean system = entry.actorId() == null;
        String role = system || entry.actorRole() == null ? AuditLog.SYSTEM_ROLE : entry.actorRole().value();
        String name = entry.actorName() != null && !entry.actorName().isBlank() ? entry.actorName()
                : system ? SYSTEM_NAME : UNKNOWN_NAME;
        logs.save(AuditLog.of(entry.actorId(), name, role, entry.action(), entry.entityType(), entry.entityId(),
                entry.entityName(), entry.diff(), entry.note()));
    }
}
