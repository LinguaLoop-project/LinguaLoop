package com.lingualoop.backend.lesson.mapper;

import com.lingualoop.backend.lesson.dto.SentenceResponse;
import com.lingualoop.backend.lesson.entity.Sentence;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface SentenceMapper {

    @Mapping(target = "myBestScore", ignore = true)
    SentenceResponse toResponse(Sentence sentence);
}
