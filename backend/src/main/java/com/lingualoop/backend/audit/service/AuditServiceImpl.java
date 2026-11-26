package com.lingualoop.backend.audit.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.entity.AuditLog;
import com.lingualoop.backend.audit.repository.AuditLogQueryRepository;
import com.lingualoop.backend.audit.repository.AuditLogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class AuditServiceImpl implements AuditService {

    /** Tên ghi khi nguồn là hệ thống hoặc không tra được tên người thực hiện. */
    static final String SYSTEM_NAME = "Hệ thống";
    static final String UNKNOWN_NAME = "Không rõ";

    private final AuditLogRepository logs;
    private final AuditLogQueryRepository queries;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(AuditEntryRequest entry) {
        boolean system = entry.actorId() == null;
        String role = system || entry.actorRole() == null ? AuditLog.SYSTEM_ROLE : entry.actorRole().value();
        logs.save(AuditLog.of(entry.actorId(), actorName(entry, system), role, entry.action(), entry.entityType(),
                entry.entityId(), entry.entityName(), entry.diff(), entry.note(), entry.parentType(),
                entry.parentId()));
    }

    /** Tên lưu tại thời điểm ghi (BR-NK-03): người gọi không đưa tên thì tra tên hiển thị hiện tại. */
    private String actorName(AuditEntryRequest entry, boolean system) {
        if (entry.actorName() != null && !entry.actorName().isBlank()) {
            return entry.actorName();
        }
        if (system) {
            return SYSTEM_NAME;
        }
        return queries.findDisplayName(entry.actorId()).orElse(UNKNOWN_NAME);
    }
}
