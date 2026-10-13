package com.lingualoop.backend.lesson.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.UserLessonProgress;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import com.lingualoop.backend.lesson.enums.LessonState;
import com.lingualoop.backend.lesson.enums.LessonStatus;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

public final class LessonSpecification {

    private LessonSpecification() {
    }

    /**
     * Bộ lọc thư viện bài. Luôn chỉ lấy bài APPROVED chưa xoá mềm.
     *
     * @param state  lọc theo tiến độ của {@code userId}; null = không lọc
     * @param userId người dùng hiện tại, cần khi {@code state != null}
     */
    public static Specification<Lesson> filterLessons(String q, String topicSlug, String difficulty,
                                                      Boolean free, LessonState state, UUID userId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("status"), LessonStatus.APPROVED));
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (q != null && !q.trim().isEmpty()) {
                String pattern = "%" + q.trim().toLowerCase() + "%";
                Predicate matchTitle = cb.like(cb.lower(root.get("title")), pattern);
                Predicate matchTitleVi = cb.like(cb.lower(root.get("titleVi")), pattern);
                predicates.add(cb.or(matchTitle, matchTitleVi));
            }

            if (topicSlug != null && !topicSlug.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("topic").get("slug"), topicSlug));
            }

            if (difficulty != null && !difficulty.trim().isEmpty()) {
                List<Predicate> diffPredicates = new ArrayList<>();
                for (String level : difficulty.split(",")) {
                    try {
                        diffPredicates.add(cb.equal(root.get("difficulty"),
                                CefrLevel.valueOf(level.trim().toUpperCase())));
                    } catch (IllegalArgumentException ignored) {
                        // mức không hợp lệ thì bỏ qua, các mức còn lại vẫn áp dụng
                    }
                }
                if (!diffPredicates.isEmpty()) {
                    predicates.add(cb.or(diffPredicates.toArray(new Predicate[0])));
                }
            }

            if (Boolean.TRUE.equals(free)) {
                predicates.add(cb.equal(root.get("pro"), false));
            }

            if (state != null && userId != null) {
                predicates.add(stateMatches(state, userId, root, query.subquery(Integer.class), cb));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Predicate stateMatches(LessonState state, UUID userId, Root<Lesson> lesson,
                                          Subquery<Integer> sub, CriteriaBuilder cb) {
        Root<UserLessonProgress> progress = sub.from(UserLessonProgress.class);
        List<Predicate> where = new ArrayList<>();
        where.add(cb.equal(progress.get("lessonId"), lesson.get("id")));
        where.add(cb.equal(progress.get("userId"), userId));
        if (state == LessonState.DOING) {
            where.add(cb.isNull(progress.get("completedAt")));
        } else if (state == LessonState.DONE) {
            where.add(cb.isNotNull(progress.get("completedAt")));
        }
        sub.select(cb.literal(1)).where(where.toArray(new Predicate[0]));
        return state == LessonState.TODO ? cb.not(cb.exists(sub)) : cb.exists(sub);
    }
}
