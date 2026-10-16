package com.lingualoop.backend.audit.service;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;

public interface AuditService {

    void record(AuditEntryRequest entry);
}
