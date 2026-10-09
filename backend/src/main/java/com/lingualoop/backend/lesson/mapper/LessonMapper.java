package com.lingualoop.backend.lesson.mapper;

import com.lingualoop.backend.lesson.dto.LessonDetail;
import com.lingualoop.backend.lesson.dto.LessonSummary;
import com.lingualoop.backend.lesson.entity.Lesson;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface LessonMapper {

    @Mapping(target = "locked", ignore = true)
    @Mapping(target = "sentenceCount", ignore = true)
    @Mapping(target = "progress", ignore = true)
    LessonSummary toSummary(Lesson lesson);

    @Mapping(target = "locked", ignore = true)
    @Mapping(target = "sentenceCount", ignore = true)
    @Mapping(target = "progress", ignore = true)
    @Mapping(target = "relatedLessons", ignore = true)
    LessonDetail toDetail(Lesson lesson);
}
