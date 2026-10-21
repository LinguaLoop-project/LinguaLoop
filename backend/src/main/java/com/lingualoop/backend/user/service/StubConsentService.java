package com.lingualoop.backend.user.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

/** Bản tạm của {@link ConsentService}: luôn coi là đã đồng ý. Xoá khi Kế làm bản đọc {@code user_consents}. */
@Service
class StubConsentService implements ConsentService {

    @Override
    public boolean hasConsent(UUID userId, ConsentType type) {
        return true;
    }
}
