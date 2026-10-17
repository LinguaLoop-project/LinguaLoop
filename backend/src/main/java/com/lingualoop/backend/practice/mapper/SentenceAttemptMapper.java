package com.lingualoop.backend.practice.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import com.lingualoop.backend.practice.dto.DictationAttemptView;
import com.lingualoop.backend.practice.dto.request.AttemptWordRequest;
import com.lingualoop.backend.practice.dto.request.DictationAttemptRequest;
import com.lingualoop.backend.practice.entity.SentenceAttempt;
import com.lingualoop.backend.practice.entity.SentenceAttemptWord;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface SentenceAttemptMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "mode", ignore = true)
    @Mapping(target = "attemptedAt", ignore = true)
    SentenceAttempt toEntity(DictationAttemptRequest request);

    @Mapping(target = "id", ignore = true)
    SentenceAttemptWord toEntity(AttemptWordRequest word);

    @Mapping(target = "attemptId", source = "id")
    DictationAttemptView toView(SentenceAttempt attempt);

    List<DictationAttemptView> toViews(List<SentenceAttempt> attempts);

    default List<Integer> toBlankPositions(SentenceAttempt attempt) {
        return attempt.getWords().stream().map(SentenceAttemptWord::getPosition).sorted().toList();
    }
}
