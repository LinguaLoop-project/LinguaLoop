package com.lingualoop.backend.dictation.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.ValueMapping;

import com.lingualoop.backend.dictation.dto.response.AttemptResultResponse.GradedWordResponse;
import com.lingualoop.backend.dictation.dto.response.DictationLessonResponse.LatestResult;
import com.lingualoop.backend.dictation.service.token.WordClass;
import com.lingualoop.backend.dictation.service.grading.GradedWord;
import com.lingualoop.backend.dictation.service.grading.WordOutcome;
import com.lingualoop.backend.practice.dto.DictationAttemptView;
import com.lingualoop.backend.practice.dto.request.AttemptWordRequest;
import com.lingualoop.backend.practice.enums.AttemptOutcome;
import com.lingualoop.backend.practice.enums.AttemptWordClass;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface DictationMapper {

    GradedWordResponse toResponse(GradedWord word);

    /** Từ thừa không có vị trí trong câu nên service truyền vào vị trí lưu. */
    default AttemptWordRequest toAttemptWord(GradedWord word, int storedPosition) {
        return new AttemptWordRequest(storedPosition, word.expectedWord(), word.actualWord(),
                toOutcome(word.outcome()), toWordClass(word.wordClass()));
    }

    AttemptOutcome toOutcome(WordOutcome outcome);

    AttemptWordClass toWordClass(WordClass wordClass);

    /** Nghe chép không đọc lượt shadowing, nên từ "đọc sai" (chỉ của shadowing) không bao giờ tới đây. */
    @ValueMapping(source = "mispronounced", target = MappingConstants.THROW_EXCEPTION)
    WordOutcome toOutcome(AttemptOutcome outcome);

    WordClass toWordClass(AttemptWordClass wordClass);

    LatestResult toLatest(DictationAttemptView view);
}
