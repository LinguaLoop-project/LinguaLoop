package com.lingualoop.backend.tutor.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lingualoop.backend.tutor.entity.TutorOffer;

public interface TutorOfferRepository extends JpaRepository<TutorOffer, UUID> {

    Optional<TutorOffer> findByIdAndUserId(UUID id, UUID userId);

    /** Lần mời gần nhất của người học trong bài, để tính giãn cách. */
    Optional<TutorOffer> findFirstByUserIdAndLessonIdOrderByCreatedAtDesc(UUID userId, UUID lessonId);
}
