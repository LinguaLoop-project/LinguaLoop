package com.lingualoop.backend.vocab.service;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditTargetLookup;
import com.lingualoop.backend.vocab.repository.VocabAuditLookupRepository;

import lombok.RequiredArgsConstructor;

/** Bộ thẻ cho chi tiết nhật ký (UC-NK-01, BR-NK-17). */
@Component
@RequiredArgsConstructor
class VocabAuditTargetLookup implements AuditTargetLookup {

    private final VocabAuditLookupRepository repository;

    @Override
    public Set<AuditEntityType> supports() {
        return Set.of(AuditEntityType.DECK);
    }

    @Override
    public Optional<Info> find(AuditEntityType type, UUID id) {
        return repository.findDeck(id);
    }
}
