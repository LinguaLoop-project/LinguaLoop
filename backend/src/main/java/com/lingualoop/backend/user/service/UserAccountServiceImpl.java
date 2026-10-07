package com.lingualoop.backend.user.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.entity.User;
import com.lingualoop.backend.user.mapper.UserMapper;
import com.lingualoop.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserAccountServiceImpl implements UserAccountService {

    private final UserRepository userRepository;
    private final Clock clock;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public Optional<UserAccount> findByEmail(String email) {
        return userRepository.findByEmail(email).map(userMapper::toUserAccount);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserAccount> findById(UUID id) {
        return userRepository.findById(id).map(userMapper::toUserAccount);
    }

    @Override
    @Transactional
    public UserAccount createLocal(String email, String displayName, String passwordHash) {
        User user = User.createLocal(email, displayName, passwordHash, Instant.now(clock));
        return userMapper.toUserAccount(userRepository.saveAndFlush(user));
    }

    @Override
    @Transactional
    public void markEmailVerified(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));
        user.markEmailVerified();
    }
}
