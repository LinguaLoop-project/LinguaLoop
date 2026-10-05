package com.lingualoop.backend.auth.service;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.auth.entity.EmailToken;
import com.lingualoop.backend.auth.repository.EmailTokenRepository;
import com.lingualoop.backend.config.AuthProperties;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailTokenRepository emailTokenRepository;
    private final AuthProperties authProperties;
    private final Clock clock;

    /** Tạo token xác thực email mới và trả về token thô (chỉ DB giữ hash). Gọi trong transaction của caller. */
    public String issueToken(UUID userId) {
        String raw = SecureTokens.generate();
        Instant now = Instant.now(clock);
        emailTokenRepository.save(EmailToken.issue(userId, EmailToken.VERIFY_EMAIL, SecureTokens.sha256(raw), now,
                now.plus(authProperties.verifyTtl())));
        return raw;
    }
}
