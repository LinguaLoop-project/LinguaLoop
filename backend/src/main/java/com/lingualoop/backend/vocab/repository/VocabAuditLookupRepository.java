package com.lingualoop.backend.vocab.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.audit.service.AuditTargetLookup.Info;

import lombok.RequiredArgsConstructor;

/** Tên và tình trạng hiện tại của bộ thẻ cho chi tiết nhật ký (UC-NK-01). Chỉ đọc. */
@Repository
@RequiredArgsConstructor
public class VocabAuditLookupRepository {

    private final JdbcClient jdbc;

    public Optional<Info> findDeck(UUID id) {
        return jdbc.sql("SELECT name, deleted_at IS NOT NULL AS deleted FROM vocab_decks WHERE id = :id")
                .param("id", id)
                .query((rs, n) -> new Info(rs.getString("name"), rs.getBoolean("deleted")))
                .optional();
    }
}
