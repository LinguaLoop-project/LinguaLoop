package com.lingualoop.backend.user.service;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.config.ConsentProperties;
import com.lingualoop.backend.user.enums.ConsentType;
import com.lingualoop.backend.user.repository.UserConsentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class ConsentServiceImpl implements ConsentService {

    private final UserConsentRepository consents;
    private final ConsentProperties properties;

    @Override
    @Transactional(readOnly = true)
    public boolean hasConsent(UUID userId, ConsentType type) {
        return consents.existsByUserIdAndConsentTypeAndRevokedAtIsNull(userId, type);
    }

    @Override
    @Transactional(readOnly = true)
    public Set<ConsentType> getGrantedTypes(UUID userId) {
        Set<ConsentType> granted = EnumSet.noneOf(ConsentType.class);
        granted.addAll(consents.findActiveTypes(userId));
        return granted;
    }

    @Override
    @Transactional
    public void grant(UUID userId, ConsentType type) {
        consents.insertIfNotActive(userId, type.value(), properties.policyVersion());
    }

    @Override
    @Transactional
    public void revoke(UUID userId, ConsentType type) {
        consents.revokeActive(userId, type.value());
    }
}
