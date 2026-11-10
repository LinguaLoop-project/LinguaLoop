package com.lingualoop.backend.lesson.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.lesson.dto.response.SentenceResponse;
import com.lingualoop.backend.lesson.entity.Sentence;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface SentenceMapper {

    /** myBestScore do LessonQueryService điền sau, từ PracticeProgressQueryService. */
    @Mapping(target = "myBestScore", ignore = true)
    SentenceResponse toResponse(Sentence sentence);

    /** Dạng gọn cho feature dictation/shadowing; {@code sortOrder} là vị trí câu trong bài (từ 1). */
    default SentenceView toView(Sentence s, int sortOrder) {
        return new SentenceView(s.getId(), s.getLesson().getId(), sortOrder, s.getTextEn(), s.getTextVi(),
                s.getIpaUs(), s.getIpaUk(), s.getStartMs(), s.getEndMs());
    }
}
