package com.lingualoop.backend.lesson.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.lesson.entity.Topic;
import com.lingualoop.backend.lesson.enums.LessonStatus;

@Repository
public interface TopicRepository extends JpaRepository<Topic, UUID> {

    List<Topic> findByStatusOrderBySortOrderAsc(LessonStatus status);

    Optional<Topic> findBySlugAndStatus(String slug, LessonStatus status);
}
