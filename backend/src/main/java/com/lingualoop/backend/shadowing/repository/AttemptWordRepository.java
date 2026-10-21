package com.lingualoop.backend.shadowing.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.practice.entity.SentenceAttemptWord;

public interface AttemptWordRepository extends JpaRepository<SentenceAttemptWord, Long> {

    /** Từ của nhiều lượt trong một truy vấn (tránh N+1), theo lượt rồi theo vị trí. */
    @Query("""
            SELECT w FROM SentenceAttemptWord w
            WHERE w.attemptId IN :attemptIds
            ORDER BY w.attemptId, w.position""")
    List<SentenceAttemptWord> findByAttemptIds(@Param("attemptIds") Collection<Long> attemptIds);
}
