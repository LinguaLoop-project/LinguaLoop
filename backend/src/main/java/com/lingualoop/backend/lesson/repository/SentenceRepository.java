package com.lingualoop.backend.lesson.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.lesson.entity.Sentence;

import jakarta.persistence.LockModeType;

@Repository
public interface SentenceRepository extends JpaRepository<Sentence, UUID> {

    /** Câu chưa xoá của bài, theo thứ tự thời gian. */
    List<Sentence> findByLessonIdAndDeletedAtIsNullOrderByStartMsAsc(UUID lessonId);

    /** Số câu chưa xoá của bài đứng trước mốc {@code startMs}; cộng 1 là vị trí của câu trong bài. */
    long countByLessonIdAndDeletedAtIsNullAndStartMsLessThan(UUID lessonId, Integer startMs);

    /** Câu chưa xoá, khóa dòng tới hết transaction để ghi bản sửa đề xuất (UC-XL-02 nhánh 2a). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Sentence s WHERE s.id = :id AND s.deletedAt IS NULL")
    Optional<Sentence> findActiveForUpdate(@Param("id") UUID id);
}
