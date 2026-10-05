package com.lingualoop.backend.auth.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lingualoop.backend.auth.entity.EmailToken;

public interface EmailTokenRepository extends JpaRepository<EmailToken, UUID> {
}
