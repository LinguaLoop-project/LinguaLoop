package com.lingualoop.backend.audit.service;

import java.time.Clock;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.dto.AuditLogView;
import com.lingualoop.backend.audit.dto.AuditLogView.Link;
import com.lingualoop.backend.audit.entity.AuditLog;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditActorRole;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.enums.AuditPeriod;
import com.lingualoop.backend.audit.repository.AuditLogQueryRepository;
import com.lingualoop.backend.audit.repository.AuditLogQueryRepository.Filter;
import com.lingualoop.backend.audit.repository.AuditLogRepository;
import com.lingualoop.backend.audit.service.AuditTargetLookup.Info;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.common.util.LikePatterns;

@Service
class AuditAdminServiceImpl implements AuditAdminService {

    static final int PAGE_SIZE = 50;

    private final AuditLogRepository logs;
    private final AuditLogQueryRepository queries;
    private final Map<AuditEntityType, AuditTargetLookup> lookups;
    private final Clock clock;

    AuditAdminServiceImpl(AuditLogRepository logs, AuditLogQueryRepository queries, List<AuditTargetLookup> lookups,
            Clock clock) {
        this.logs = logs;
        this.queries = queries;
        this.clock = clock;
        this.lookups = new EnumMap<>(AuditEntityType.class);
        for (AuditTargetLookup lookup : lookups) {
            lookup.supports().forEach(type -> {
                if (this.lookups.putIfAbsent(type, lookup) != null) {
                    throw new IllegalStateException("Hai AuditTargetLookup cùng phụ trách " + type);
                }
            });
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AuditLogView.Row> list(AuditAction action, AuditEntityType targetType,
            AuditActorRole actorRole, AuditPeriod period, String q, int page) {
        AuditPeriod effective = period == null ? AuditPeriod.D7 : period;
        Filter filter = new Filter(action, targetType, actorRole, effective.since(clock.instant()).orElse(null),
                LikePatterns.containsLower(q));
        int safePage = Math.max(page, 0);
        List<AuditLogView.Row> rows = queries.find(filter, PAGE_SIZE, (long) safePage * PAGE_SIZE);
        return PageResponse.of(rows, safePage, PAGE_SIZE, queries.count(filter));
    }

    @Override
    @Transactional(readOnly = true)
    public AuditLogView.Detail detail(long id) {
        AuditLog log = logs.findById(id).orElseThrow(NotFoundException::new);
        Optional<Info> parent = log.getParentId() == null ? Optional.empty()
                : lookup(log.getParentType(), log.getParentId());
        return new AuditLogView.Detail(rowOf(log), log.getChanges(), log.getNote(),
                parent.map(Info::name).orElse(null), open(log, parent));
    }

    /**
     * "Mở đối tượng" (BR-NK-17): báo cáo mở bài học hoặc bộ thẻ chứa nội dung bị báo cáo; bài học, bộ thẻ mở chính nó;
     * tài khoản, gói Pro, cấu hình credit, chủ đề, danh mục không bị xóa nên luôn mở được. Đối tượng đã bị xóa thì không mở.
     */
    private Link open(AuditLog log, Optional<Info> parent) {
        AuditEntityType type = log.getTargetType();
        return switch (type) {
            case REPORT -> log.getParentId() != null && parent.filter(p -> !p.deleted()).isPresent()
                    ? new Link(log.getParentType(), log.getParentId()) : null;
            case LESSON, DECK -> lookup(type, log.getTargetId()).filter(t -> !t.deleted()).isPresent()
                    ? new Link(type, log.getTargetId()) : null;
            case USER, PLAN, SETTINGS, TOPIC, CATEGORY -> new Link(type, log.getTargetId());
            default -> null;
        };
    }

    private Optional<Info> lookup(AuditEntityType type, UUID id) {
        AuditTargetLookup lookup = lookups.get(type);
        return lookup == null || id == null ? Optional.empty() : lookup.find(type, id);
    }

    private static AuditLogView.Row rowOf(AuditLog log) {
        return new AuditLogView.Row(log.getId(), log.getAction(), log.getTargetType(), log.getTargetId(),
                log.getTargetName(), log.getParentType(), log.getParentId(), log.getActorId(), log.getActorName(),
                log.getActorRole(), log.getChanges() != null, log.getCreatedAt());
    }
}
