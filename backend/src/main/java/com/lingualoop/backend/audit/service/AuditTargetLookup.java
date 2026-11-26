package com.lingualoop.backend.audit.service;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.lingualoop.backend.audit.enums.AuditEntityType;

/**
 * Tra tên hiện tại và tình trạng của đối tượng có thể bị xóa (bài học, bộ thẻ) cho chi tiết nhật ký: tên đối tượng
 * chứa và lựa chọn "Mở đối tượng" (UC-NK-01 luồng 6a, BR-NK-17). Feature sở hữu đối tượng cài đặt interface này nên
 * {@code audit} không phụ thuộc feature nào.
 */
public interface AuditTargetLookup {

    /** Các loại đối tượng lookup này phụ trách. */
    Set<AuditEntityType> supports();

    /** Thông tin hiện tại; {@code empty} khi đối tượng không còn trong hệ thống. */
    Optional<Info> find(AuditEntityType type, UUID id);

    /** @param deleted đã bị xóa (xóa mềm) */
    record Info(String name, boolean deleted) {
    }
}
