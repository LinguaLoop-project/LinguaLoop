package com.lingualoop.backend.shadowing.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.shadowing.entity.AttemptPhoneme;

public interface AttemptPhonemeRepository extends JpaRepository<AttemptPhoneme, Long> {

    /** Âm vị của mọi từ trong nhiều lượt, trong một truy vấn (tránh N+1), theo từ rồi theo vị trí. */
    @Query("""
            SELECT p FROM AttemptPhoneme p
            WHERE p.word.attempt.id IN :attemptIds
            ORDER BY p.word.id, p.position""")
    List<AttemptPhoneme> findByAttemptIds(@Param("attemptIds") Collection<Long> attemptIds);
}
