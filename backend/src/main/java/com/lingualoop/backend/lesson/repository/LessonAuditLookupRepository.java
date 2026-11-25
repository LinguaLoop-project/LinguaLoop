package com.lingualoop.backend.lesson.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.audit.service.AuditTargetLookup.Info;

import lombok.RequiredArgsConstructor;

/** Tên và tình trạng hiện tại của bài học cho chi tiết nhật ký (UC-NK-01). Chỉ đọc. */
@Repository
@RequiredArgsConstructor
public class LessonAuditLookupRepository {

    private final JdbcClient jdbc;

    public Optional<Info> findLesson(UUID id) {
        return jdbc.sql("SELECT title, deleted_at IS NOT NULL AS deleted FROM lessons WHERE id = :id")
                .param("id", id)
                .query((rs, n) -> new Info(rs.getString("title"), rs.getBoolean("deleted")))
                .optional();
    }
}
