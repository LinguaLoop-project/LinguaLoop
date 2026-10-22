package com.lingualoop.backend.shadowing.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.shadowing.entity.PhonemeConfusion;

public interface PhonemeConfusionRepository extends JpaRepository<PhonemeConfusion, Integer> {

    /** Mẹo chung (không gắn với âm bị nhầm thành) của các âm đích, cho người học có tiếng mẹ đẻ {@code l1}. */
    @Query("""
            SELECT c FROM PhonemeConfusion c
            WHERE c.l1 = :l1 AND c.producedPhonemeId IS NULL AND c.targetPhonemeId IN :phonemeIds""")
    List<PhonemeConfusion> findGeneralTips(@Param("l1") String l1, @Param("phonemeIds") Collection<Short> phonemeIds);
}
