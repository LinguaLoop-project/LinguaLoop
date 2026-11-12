package com.lingualoop.backend.tutor.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lingualoop.backend.tutor.entity.TutorLessonEvent;

public interface TutorLessonEventRepository extends JpaRepository<TutorLessonEvent, Long> {
}
