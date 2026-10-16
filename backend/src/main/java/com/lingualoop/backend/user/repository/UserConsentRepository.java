package com.lingualoop.backend.user.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.user.entity.UserConsent;
import com.lingualoop.backend.user.enums.ConsentType;

public interface UserConsentRepository extends JpaRepository<UserConsent, UUID> {

    boolean existsByUserIdAndConsentTypeAndRevokedAtIsNull(UUID userId, ConsentType consentType);

    @Query("select c.consentType from UserConsent c where c.userId = :userId and c.revokedAt is null")
    List<ConsentType> findActiveTypes(@Param("userId") UUID userId);

    /** Thêm bản ghi đang hiệu lực; trùng với bản ghi chưa thu hồi thì bỏ qua (an toàn khi request trùng). */
    @Modifying
    @Query(value = """
            INSERT INTO user_consents (user_id, consent_type, policy_version)
            VALUES (:userId, :consentType, :policyVersion)
            ON CONFLICT (user_id, consent_type) WHERE revoked_at IS NULL DO NOTHING
            """, nativeQuery = true)
    int insertIfNotActive(@Param("userId") UUID userId, @Param("consentType") String consentType,
            @Param("policyVersion") String policyVersion);

    @Modifying
    @Query(value = """
            UPDATE user_consents SET revoked_at = now()
            WHERE user_id = :userId AND consent_type = :consentType AND revoked_at IS NULL
            """, nativeQuery = true)
    int revokeActive(@Param("userId") UUID userId, @Param("consentType") String consentType);
}
