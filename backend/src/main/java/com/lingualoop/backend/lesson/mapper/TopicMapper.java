package com.lingualoop.backend.lesson.mapper;

import com.lingualoop.backend.lesson.dto.TopicResponse;
import com.lingualoop.backend.lesson.entity.Topic;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface TopicMapper {

    @Mapping(target = "totalLessons", ignore = true)
    @Mapping(target = "completedLessons", ignore = true)
    TopicResponse toResponse(Topic topic);
}
