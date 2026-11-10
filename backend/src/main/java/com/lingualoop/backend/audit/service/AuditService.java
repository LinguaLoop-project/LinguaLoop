package com.lingualoop.backend.audit.service;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;

public interface AuditService {

    /**
     * Ghi một dòng nhật ký trong giao dịch của nghiệp vụ đang chạy (bắt buộc có giao dịch, để nghiệp vụ lỗi thì dòng
     * nhật ký cũng bị huỷ). {@code actorId} null ghi nhận là "Hệ thống" với vai trò {@code system}.
     */
    void record(AuditEntryRequest entry);
}
