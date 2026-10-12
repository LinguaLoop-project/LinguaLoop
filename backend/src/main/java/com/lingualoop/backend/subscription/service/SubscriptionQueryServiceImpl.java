package com.lingualoop.backend.subscription.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.subscription.repository.UserPlanRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubscriptionQueryServiceImpl implements SubscriptionQueryService {

    private final UserPlanRepository userPlanRepository;

    @Override
    public boolean isPro(UUID userId) {
        return userId != null && userPlanRepository.isPro(userId);
    }
}
