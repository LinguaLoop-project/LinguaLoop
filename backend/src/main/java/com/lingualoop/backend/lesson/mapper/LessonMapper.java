package com.lingualoop.backend.lesson.mapper;

import com.lingualoop.backend.lesson.dto.response.LessonDetailResponse;
import com.lingualoop.backend.lesson.dto.response.LessonSummaryResponse;
import com.lingualoop.backend.lesson.dto.LessonView;
import com.lingualoop.backend.lesson.entity.Lesson;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface LessonMapper {

    @Mapping(target = "locked", ignore = true)
    @Mapping(target = "sentenceCount", ignore = true)
    @Mapping(target = "progress", ignore = true)
    LessonSummaryResponse toSummary(Lesson lesson);

    @Mapping(target = "locked", ignore = true)
    @Mapping(target = "sentenceCount", ignore = true)
    @Mapping(target = "progress", ignore = true)
    @Mapping(target = "relatedLessons", ignore = true)
    @Mapping(target = "topic", ignore = true)
    LessonDetailResponse toDetail(Lesson lesson);

    /** Dạng gọn cho feature dictation/shadowing (SentenceQueryService). */
    LessonView toView(Lesson lesson);
}
