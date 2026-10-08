package com.lingualoop.backend.auth.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.auth.entity.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /** Thu hồi mọi token chưa thu hồi của một chuỗi xoay vòng. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update RefreshToken t set t.revokedAt = :now where t.familyId = :familyId and t.revokedAt is null")
    int revokeFamily(@Param("familyId") UUID familyId, @Param("now") Instant now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update RefreshToken t set t.revokedAt = :now where t.userId = :userId and t.revokedAt is null")
    int revokeAllByUser(@Param("userId") UUID userId, @Param("now") Instant now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update RefreshToken t set t.revokedAt = :now "
            + "where t.userId = :userId and t.familyId <> :keepFamilyId and t.revokedAt is null")
    int revokeAllByUserExceptFamily(@Param("userId") UUID userId, @Param("keepFamilyId") UUID keepFamilyId,
            @Param("now") Instant now);

    @Query("select count(t) > 0 from RefreshToken t "
            + "where t.familyId = :familyId and t.revokedAt is null and t.expiresAt > :now")
    boolean hasActiveToken(@Param("familyId") UUID familyId, @Param("now") Instant now);
}
