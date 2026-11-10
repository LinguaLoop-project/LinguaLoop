package com.lingualoop.backend.credit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lingualoop.backend.credit.entity.AiFeaturePrice;

public interface AiFeaturePriceRepository extends JpaRepository<AiFeaturePrice, String> {
}
