package com.lingualoop.backend.subscription.service;

import java.time.Clock;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.subscription.dto.ActiveProOrder;
import com.lingualoop.backend.subscription.repository.ProOrderRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class SubscriptionQueryServiceImpl implements SubscriptionQueryService {

    private final ProOrderRepository orders;
    private final Clock clock;

    @Override
    public boolean isPro(UUID userId) {
        return activeOrder(userId).isPresent();
    }

    @Override
    public Optional<ActiveProOrder> activeOrder(UUID userId) {
        if (userId == null) {
            return Optional.empty();
        }
        return orders.findActive(userId, clock.instant())
                .map(o -> new ActiveProOrder(o.getCreditsPerMonth(), o.getStartsAt(), o.getEndsAt()));
    }
}
