package com.lingualoop.backend.credit.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.credit.entity.AiWallet;

import jakarta.persistence.LockModeType;

public interface AiWalletRepository extends JpaRepository<AiWallet, UUID> {

    /** Tạo ví rỗng nếu chưa có; an toàn khi hai yêu cầu cùng lúc. */
    @Modifying(flushAutomatically = true)
    @Query(value = """
            INSERT INTO ai_wallets (user_id, balance, resets_at, updated_at) VALUES (:userId, 0, NULL, :now)
            ON CONFLICT (user_id) DO NOTHING""", nativeQuery = true)
    int createIfAbsent(@Param("userId") UUID userId, @Param("now") Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM AiWallet w WHERE w.userId = :userId")
    Optional<AiWallet> findForUpdate(@Param("userId") UUID userId);
}
