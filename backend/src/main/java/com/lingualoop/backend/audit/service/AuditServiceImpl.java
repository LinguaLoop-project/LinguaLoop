package com.lingualoop.backend.audit.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.entity.ContentAuditLog;
import com.lingualoop.backend.audit.repository.ContentAuditLogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class AuditServiceImpl implements AuditService {

    private final ContentAuditLogRepository logs;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(AuditEntryRequest entry) {
        logs.save(ContentAuditLog.of(entry.actorId(), entry.actorRole(), entry.action(), entry.entityType(),
                entry.entityId(), entry.diff()));
    }
}
