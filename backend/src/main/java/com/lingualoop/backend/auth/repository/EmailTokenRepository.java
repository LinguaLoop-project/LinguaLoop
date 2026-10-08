package com.lingualoop.backend.auth.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.auth.entity.EmailToken;

public interface EmailTokenRepository extends JpaRepository<EmailToken, UUID> {

    Optional<EmailToken> findByTokenHashAndPurpose(String tokenHash, String purpose);

    Optional<EmailToken> findFirstByUserIdAndPurposeOrderByCreatedAtDesc(UUID userId, String purpose);

    /** Vô hiệu mọi token chưa dùng của user (khi cấp token mới thay thế). */
    @Modifying
    @Query("update EmailToken t set t.usedAt = :now where t.userId = :userId and t.purpose = :purpose and t.usedAt is null")
    int markAllUsed(@Param("userId") UUID userId, @Param("purpose") String purpose, @Param("now") Instant now);
}
