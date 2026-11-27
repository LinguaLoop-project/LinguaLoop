package com.lingualoop.backend.user.service;

import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.user.dto.response.NotificationsResponse;
import com.lingualoop.backend.user.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository repository;
    private final Clock clock;

    @Override
    @Transactional
    public void send(UUID userId, String message) {
        repository.insert(userId, message);
    }

    @Override
    @Transactional
    public boolean send(UUID userId, NotificationType type, String message, String link, Map<String, String> params,
            String dedupeKey) {
        if (type.configurable() && !repository.isEnabled(userId, type.name())) {
            return false;
        }
        return repository.insert(userId, type.name(), message, link, params, dedupeKey);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<NotificationType, Boolean> preferences(UUID userId) {
        Map<String, Boolean> saved = repository.preferences(userId);
        Map<NotificationType, Boolean> result = new LinkedHashMap<>();
        for (NotificationType type : NotificationType.configurableTypes()) {
            result.put(type, saved.getOrDefault(type.name(), true));
        }
        return result;
    }

    @Override
    @Transactional
    public void setPreference(UUID userId, NotificationType type, boolean enabled) {
        if (!type.configurable()) {
            throw new FieldValidationException("type", "NotConfigurable");
        }
        repository.setPreference(userId, type.name(), enabled);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationsResponse latest(UUID userId, int limit) {
        return new NotificationsResponse(repository.findLatest(userId, limit), repository.countUnread(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationsResponse.Item> page(UUID userId, boolean unreadOnly, int page, int size) {
        int safePage = Math.max(page, 0);
        return PageResponse.of(repository.findPage(userId, unreadOnly, size, (long) safePage * size), safePage, size,
                repository.countAll(userId, unreadOnly));
    }

    @Override
    @Transactional
    public void markRead(UUID userId, UUID notificationId) {
        if (!repository.markRead(userId, notificationId, clock.instant())) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
    }

    @Override
    @Transactional
    public void markAllRead(UUID userId) {
        repository.markAllRead(userId, clock.instant());
    }
}
