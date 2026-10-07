package com.lingualoop.backend.user.service;

import java.util.Optional;
import java.util.UUID;

import com.lingualoop.backend.user.dto.UserAccount;

/** Cổng duy nhất để feature khác (auth) đọc/ghi tài khoản */
public interface UserAccountService {

    Optional<UserAccount> findByEmail(String email);

    Optional<UserAccount> findById(UUID id);

    UserAccount createLocal(String email, String displayName, String passwordHash);

    void markEmailVerified(UUID userId);
}
