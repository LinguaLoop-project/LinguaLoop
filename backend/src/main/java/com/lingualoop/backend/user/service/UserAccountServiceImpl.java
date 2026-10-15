package com.lingualoop.backend.user.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.dto.response.MeResponse;
import com.lingualoop.backend.user.entity.User;
import com.lingualoop.backend.user.mapper.UserMapper;
import com.lingualoop.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class UserAccountServiceImpl implements UserAccountService {

    private static final int DISPLAY_NAME_MAX = 50;

    private final UserRepository userRepository;
    private final Clock clock;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public Optional<UserAccountView> findByEmail(String email) {
        return userRepository.findByEmail(email).map(userMapper::toUserAccountView);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserAccountView> findById(UUID id) {
        return userRepository.findById(id).map(userMapper::toUserAccountView);
    }

    @Override
    @Transactional
    public UserAccountView createLocal(String email, String displayName, String passwordHash) {
        User user = User.createLocal(email, displayName, passwordHash, Instant.now(clock));
        return userMapper.toUserAccountView(userRepository.saveAndFlush(user));
    }

    @Override
    @Transactional
    public void markEmailVerified(UUID userId) {
        load(userId).markEmailVerified();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserAccountView> findByGoogleSub(String sub) {
        return userRepository.findByAuthUid(sub).map(userMapper::toUserAccountView);
    }

    @Override
    @Transactional
    public UserAccountView createFromGoogle(String sub, String email, String name, String pictureUrl) {
        User user = User.createFromGoogle(sub, email, googleDisplayName(name, email), pictureUrl);
        return userMapper.toUserAccountView(userRepository.saveAndFlush(user));
    }

    @Override
    @Transactional
    public boolean linkGoogle(UUID userId, String sub) {
        return load(userId).linkGoogle(sub);
    }

    @Override
    @Transactional
    public void updatePasswordHash(UUID userId, String passwordHash) {
        load(userId).changePassword(passwordHash);
    }

    private User load(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));
    }

    /** Tên Google, cắt còn 50 ký tự; trống thì lấy phần trước @ của email. */
    private static String googleDisplayName(String name, String email) {
        String base = name == null ? "" : name.strip();
        if (base.isEmpty()) {
            int at = email.indexOf('@');
            base = at < 0 ? email : email.substring(0, at);
        }
        return base.codePointCount(0, base.length()) <= DISPLAY_NAME_MAX
                ? base
                : base.substring(0, base.offsetByCodePoints(0, DISPLAY_NAME_MAX));
    }

    @Override
    public MeResponse toMe(UserAccountView account) {
        return userMapper.toMe(account);
    }
}
