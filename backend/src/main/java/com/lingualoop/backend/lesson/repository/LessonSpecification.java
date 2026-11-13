package com.lingualoop.backend.lesson.repository;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import com.lingualoop.backend.lesson.enums.LessonState;
import com.lingualoop.backend.lesson.enums.LessonStatus;

import jakarta.persistence.criteria.Predicate;

public final class LessonSpecification {

    private LessonSpecification() {
    }

    /**
     * Bộ lọc thư viện bài. Luôn chỉ lấy bài của thư viện chung đã xuất bản và chưa xoá mềm.
     *
     * @param state          lọc theo tiến độ của người dùng; null = không lọc
     * @param attemptedIds   bài người dùng đã có lượt làm, cần khi {@code state != null}
     * @param completedIds   bài người dùng đã hoàn thành, cần khi {@code state != null}
     */
    public static Specification<Lesson> filterLessons(String q, UUID topicId, String cefrLevel, Boolean free,
                                                      LessonState state, Collection<UUID> attemptedIds,
                                                      Collection<UUID> completedIds) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("kind"), Lesson.KIND_LIBRARY));
            predicates.add(cb.equal(root.get("status"), LessonStatus.PUBLISHED));
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (q != null && !q.trim().isEmpty()) {
                String pattern = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.like(cb.lower(root.get("title")), pattern));
            }

            if (topicId != null) {
                predicates.add(cb.equal(root.get("topic").get("id"), topicId));
            }

            if (cefrLevel != null && !cefrLevel.trim().isEmpty()) {
                List<Predicate> levels = new ArrayList<>();
                for (String level : cefrLevel.split(",")) {
                    try {
                        levels.add(cb.equal(root.get("cefrLevel"), CefrLevel.valueOf(level.trim().toUpperCase(Locale.ROOT))));
                    } catch (IllegalArgumentException ignored) {
                        // mức không hợp lệ thì bỏ qua, các mức còn lại vẫn áp dụng
                    }
                }
                if (!levels.isEmpty()) {
                    predicates.add(cb.or(levels.toArray(new Predicate[0])));
                }
            }

            if (Boolean.TRUE.equals(free)) {
                predicates.add(cb.equal(root.get("pro"), false));
            }

            if (state != null) {
                predicates.add(stateMatches(state, attemptedIds, completedIds, root.get("id"), cb));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Predicate stateMatches(LessonState state, Collection<UUID> attemptedIds,
                                          Collection<UUID> completedIds,
                                          jakarta.persistence.criteria.Path<UUID> id,
                                          jakarta.persistence.criteria.CriteriaBuilder cb) {
        return switch (state) {
            case TODO -> attemptedIds.isEmpty() ? cb.conjunction() : cb.not(id.in(attemptedIds));
            case DONE -> completedIds.isEmpty() ? cb.disjunction() : id.in(completedIds);
            case DOING -> {
                if (attemptedIds.isEmpty()) {
                    yield cb.disjunction();
                }
                Predicate attempted = id.in(attemptedIds);
                yield completedIds.isEmpty() ? attempted : cb.and(attempted, cb.not(id.in(completedIds)));
            }
        };
    }
}
