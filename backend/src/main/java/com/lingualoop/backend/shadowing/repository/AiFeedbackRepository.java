package com.lingualoop.backend.shadowing.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lingualoop.backend.shadowing.entity.AiFeedback;

public interface AiFeedbackRepository extends JpaRepository<AiFeedback, Long> {

    Optional<AiFeedback> findByAttemptId(Long attemptId);

    List<AiFeedback> findByAttemptIdIn(Collection<Long> attemptIds);
}
