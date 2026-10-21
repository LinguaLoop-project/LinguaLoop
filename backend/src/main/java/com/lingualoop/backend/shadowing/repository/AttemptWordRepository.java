package com.lingualoop.backend.shadowing.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.shadowing.entity.AttemptWord;

public interface AttemptWordRepository extends JpaRepository<AttemptWord, Long> {

    /** Từ của nhiều lượt trong một truy vấn (tránh N+1), theo lượt rồi theo vị trí. */
    @Query("""
            SELECT w FROM AttemptWord w
            WHERE w.attempt.id IN :attemptIds
            ORDER BY w.attempt.id, w.position""")
    List<AttemptWord> findByAttemptIds(@Param("attemptIds") Collection<Long> attemptIds);
}
