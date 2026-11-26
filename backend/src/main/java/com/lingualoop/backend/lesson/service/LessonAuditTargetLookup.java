package com.lingualoop.backend.lesson.service;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditTargetLookup;
import com.lingualoop.backend.lesson.repository.LessonAuditLookupRepository;

import lombok.RequiredArgsConstructor;

/** Bài học cho chi tiết nhật ký (UC-NK-01, BR-NK-17). */
@Component
@RequiredArgsConstructor
class LessonAuditTargetLookup implements AuditTargetLookup {

    private final LessonAuditLookupRepository repository;

    @Override
    public Set<AuditEntityType> supports() {
        return Set.of(AuditEntityType.LESSON);
    }

    @Override
    public Optional<Info> find(AuditEntityType type, UUID id) {
        return repository.findLesson(id);
    }
}
