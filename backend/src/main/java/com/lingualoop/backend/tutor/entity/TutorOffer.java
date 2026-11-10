package com.lingualoop.backend.tutor.entity;

import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.tutor.TutorOfferPolicy;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Một Lời mời gia sư đã đưa ra sau một Lượt shadowing. Schema MVP chỉ lưu việc đã mời (để giãn cách lời mời); nhận
 * hay bỏ qua không được ghi.
 */
@Getter
@Entity
@Table(name = "tutor_offers")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TutorOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "lesson_id", nullable = false, updatable = false)
    private UUID lessonId;

    @Column(name = "attempt_id", nullable = false, updatable = false)
    private Long attemptId;

    /** Cột có mặc định {@code now()} ở DB nên không ghi từ ứng dụng. */
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    public static TutorOffer of(UUID userId, UUID lessonId, long attemptId) {
        TutorOffer offer = new TutorOffer();
        offer.userId = userId;
        offer.lessonId = lessonId;
        offer.attemptId = attemptId;
        return offer;
    }
}
