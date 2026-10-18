package com.lingualoop.backend.shadowing.repository;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lingualoop.backend.shadowing.entity.Phoneme;

public interface PhonemeRepository extends JpaRepository<Phoneme, Short> {

    /** Bảng ký hiệu → id (dữ liệu tham chiếu, ít đổi). */
    default Map<String, Short> idsBySymbol() {
        Map<String, Short> ids = new HashMap<>();
        findAll().forEach(p -> ids.put(p.getSymbol(), p.getId()));
        return ids;
    }
}
