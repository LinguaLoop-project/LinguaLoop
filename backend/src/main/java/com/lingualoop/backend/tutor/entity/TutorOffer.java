package com.lingualoop.backend.tutor.entity;

import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.tutor.TutorOfferPolicy;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Một Lời mời gia sư đã đưa ra sau một Lượt shadowing; trả lời đúng một lần (nhận hoặc bỏ qua). */
@Getter
@Entity
@Table(name = "tutor_offers")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TutorOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "lesson_id", nullable = false, updatable = false)
    private UUID lessonId;

    @Column(name = "attempt_id", nullable = false, updatable = false)
    private Long attemptId;

    /** {@code LOW_WORD_SCORE} hoặc {@code REPEATED_PHONEME_ERROR} (đúng giá trị CHECK của DB). */
    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false, updatable = false)
    private TutorOfferPolicy.Reason reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "declined_at")
    private Instant declinedAt;

    public static TutorOffer of(UUID userId, UUID lessonId, long attemptId, TutorOfferPolicy.Reason reason, Instant now) {
        TutorOffer offer = new TutorOffer();
        offer.userId = userId;
        offer.lessonId = lessonId;
        offer.attemptId = attemptId;
        offer.reason = reason;
        offer.createdAt = now;
        return offer;
    }

    public boolean pending() {
        return acceptedAt == null && declinedAt == null;
    }

    /** Học viên nhận lời (hoặc đếm ngược xong): chỉ ghi lần đầu, gọi lại không đổi gì. */
    public void accept(Instant now) {
        if (pending()) {
            acceptedAt = now;
        }
    }

    /** Học viên bỏ qua: chỉ ghi lần đầu, gọi lại hay đã nhận lời thì không đổi gì. */
    public void decline(Instant now) {
        if (pending()) {
            declinedAt = now;
        }
    }
}
