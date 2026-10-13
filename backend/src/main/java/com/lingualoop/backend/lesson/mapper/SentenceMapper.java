package com.lingualoop.backend.lesson.mapper;

import com.lingualoop.backend.lesson.dto.SentenceResponse;
import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.lesson.entity.Sentence;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface SentenceMapper {

    // TODO(contract): điền myBestScore từ v_user_sentence_stats khi feature dictation/shadowing có dữ liệu.
    @Mapping(target = "myBestScore", ignore = true)
    SentenceResponse toResponse(Sentence sentence);

    /** Dạng gọn cho feature dictation/shadowing (SentenceQueryService). */
    @Mapping(target = "lessonId", source = "lesson.id")
    SentenceView toView(Sentence sentence);
}
