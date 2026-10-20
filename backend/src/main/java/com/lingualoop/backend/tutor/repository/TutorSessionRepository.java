package com.lingualoop.backend.tutor.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.tutor.entity.TutorSession;

import jakarta.persistence.LockModeType;

public interface TutorSessionRepository extends JpaRepository<TutorSession, UUID> {

    Optional<TutorSession> findByIdAndUserId(UUID id, UUID userId);

    /**
     * Khoá dòng phiên để ghi: đổi từ, chấm và đếm lạc đề có thể đến đồng thời (vd người học đổi từ trong lúc Azure
     * đang chấm), nên mọi thay đổi trạng thái phải qua đây.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM TutorSession s WHERE s.id = :id AND s.userId = :userId")
    Optional<TutorSession> lockByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    /** Như {@link #lockByIdAndUserId} nhưng không theo người dùng: chỉ cho job dọn. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM TutorSession s WHERE s.id = :id")
    Optional<TutorSession> lockById(@Param("id") UUID id);

    /**
     * Phiên còn mở đã quá hạn: chưa started mà tạo trước {@code unstartedCutoff} (connect_failed), hoặc đã started
     * trước {@code startedCutoff} (timeout). Job dọn kết thúc chúng.
     */
    @Query("""
            SELECT s FROM TutorSession s
            WHERE s.endedAt IS NULL AND ((s.startedAt IS NULL AND s.createdAt < :unstartedCutoff)
                OR (s.startedAt IS NOT NULL AND s.startedAt <= :startedCutoff))""")
    List<TutorSession> findOverdue(@Param("unstartedCutoff") Instant unstartedCutoff,
            @Param("startedCutoff") Instant startedCutoff);
}
