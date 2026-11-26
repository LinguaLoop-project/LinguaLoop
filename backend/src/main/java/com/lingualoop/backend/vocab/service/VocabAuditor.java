package com.lingualoop.backend.vocab.service;

import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditService;
import com.lingualoop.backend.security.Role;

import lombok.RequiredArgsConstructor;

/**
 * Ghi nhật ký các mốc lớn của bộ thẻ thư viện: tạo, xuất bản, gỡ xuất bản, xóa, khôi phục, nhập thẻ từ tệp
 * (BR-NK-18). Bộ cá nhân của học viên, nhóm thẻ và thẻ không ghi. Mỗi lệnh chạy trong giao dịch của nghiệp vụ; lệnh
 * tạo bộ không bọc giao dịch (vì gọi S3) thì nhật ký có giao dịch riêng ngay sau khi lưu.
 */
@Component
@RequiredArgsConstructor
class VocabAuditor {

    private final AuditService auditService;

    @Transactional
    void deck(UUID teacherId, AuditAction action, UUID deckId, String deckName, Map<String, Object> diff,
            String note) {
        auditService.record(entry(teacherId, action, AuditEntityType.DECK, deckId, deckName, diff, note));
    }

    private static AuditEntryRequest entry(UUID teacherId, AuditAction action, AuditEntityType type, UUID id,
            String name, Map<String, Object> diff, String note) {
        return new AuditEntryRequest(teacherId, null, Role.TEACHER, action, type, id, name, diff, note);
    }
}
