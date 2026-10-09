package com.lingualoop.backend.lesson.repository;

import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import com.lingualoop.backend.lesson.enums.LessonStatus;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class LessonSpecification {

    public static Specification<Lesson> filterLessons(String q, String topicSlug, String difficulty, Boolean free) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Mặc định luôn lọc APPROVED và chưa bị xóa mềm
            predicates.add(cb.equal(root.get("status"), LessonStatus.APPROVED));
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (q != null && !q.trim().isEmpty()) {
                // Trigram search trên title (tạm dùng LIKE)
                String pattern = "%" + q.trim().toLowerCase() + "%";
                Predicate matchTitle = cb.like(cb.lower(root.get("title")), pattern);
                Predicate matchTitleVi = cb.like(cb.lower(root.get("titleVi")), pattern);
                predicates.add(cb.or(matchTitle, matchTitleVi));
            }

            if (topicSlug != null && !topicSlug.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("topic").get("slug"), topicSlug));
            }

            if (difficulty != null && !difficulty.trim().isEmpty()) {
                String[] levels = difficulty.split(",");
                List<Predicate> diffPredicates = new ArrayList<>();
                for (String level : levels) {
                    try {
                        diffPredicates.add(cb.equal(root.get("difficulty"), CefrLevel.valueOf(level.trim().toUpperCase())));
                    } catch (IllegalArgumentException ignored) {}
                }
                if (!diffPredicates.isEmpty()) {
                    predicates.add(cb.or(diffPredicates.toArray(new Predicate[0])));
                }
            }

            if (Boolean.TRUE.equals(free)) {
                predicates.add(cb.equal(root.get("pro"), false));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
