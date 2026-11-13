package com.lingualoop.backend.credit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lingualoop.backend.credit.entity.AiSettings;

public interface AiSettingsRepository extends JpaRepository<AiSettings, Short> {
}
