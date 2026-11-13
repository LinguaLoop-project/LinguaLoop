package com.lingualoop.backend.practice.mapper;

import java.util.Comparator;
import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import com.lingualoop.backend.practice.dto.AttemptWordView;
import com.lingualoop.backend.practice.dto.DictationAttemptDetailView;
import com.lingualoop.backend.practice.dto.DictationAttemptView;
import com.lingualoop.backend.practice.dto.request.AttemptWordRequest;
import com.lingualoop.backend.practice.dto.request.DictationAttemptRequest;
import com.lingualoop.backend.practice.entity.SentenceAttempt;
import com.lingualoop.backend.practice.entity.SentenceAttemptWord;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface SentenceAttemptMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "mode", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "listenCount", source = "replayCount")
    @Mapping(target = "totalScore", source = "score")
    @Mapping(target = "accuracyScore", ignore = true)
    @Mapping(target = "fluencyScore", ignore = true)
    @Mapping(target = "completenessScore", ignore = true)
    @Mapping(target = "prosodyScore", ignore = true)
    SentenceAttempt toEntity(DictationAttemptRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "attemptId", ignore = true)
    @Mapping(target = "accuracyScore", ignore = true)
    @Mapping(target = "phonemes", ignore = true)
    @Mapping(target = "homophone", ignore = true)
    @Mapping(target = "wordClass", source = "expectedWordClass")
    SentenceAttemptWord toEntity(AttemptWordRequest word);

    @Mapping(target = "attemptId", source = "id")
    @Mapping(target = "score", source = "totalScore")
    @Mapping(target = "attemptedAt", source = "createdAt")
    DictationAttemptView toView(SentenceAttempt attempt);

    List<DictationAttemptView> toViews(List<SentenceAttempt> attempts);

    AttemptWordView toWordView(SentenceAttemptWord word);

    /** Các từ xếp theo vị trí, vì bảng lưu không bảo đảm thứ tự. */
    default DictationAttemptDetailView toDetailView(SentenceAttempt attempt) {
        List<AttemptWordView> words = attempt.getWords().stream()
                .sorted(Comparator.comparing(SentenceAttemptWord::getPosition))
                .map(this::toWordView).toList();
        return new DictationAttemptDetailView(attempt.getId(), attempt.getSentenceId(), attempt.getLevel(),
                attempt.getTotalScore(), attempt.isRetry(), attempt.isGaveUp(), attempt.getCreatedAt(), words);
    }

    default List<Integer> toBlankPositions(SentenceAttempt attempt) {
        return attempt.getWords().stream().map(SentenceAttemptWord::getPosition).sorted().toList();
    }
}
