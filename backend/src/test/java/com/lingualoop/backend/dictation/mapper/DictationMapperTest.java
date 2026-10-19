package com.lingualoop.backend.dictation.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import com.lingualoop.backend.dictation.dto.request.SubmitAttemptRequest;
import com.lingualoop.backend.dictation.dto.response.DictationLessonResponse.LatestResult;
import com.lingualoop.backend.dictation.dto.response.AttemptResultResponse.GradedWordResponse;
import com.lingualoop.backend.dictation.service.WordClass;
import com.lingualoop.backend.dictation.service.grading.GradedWord;
import com.lingualoop.backend.dictation.service.grading.WordOutcome;
import com.lingualoop.backend.practice.dto.DictationAttemptView;
import com.lingualoop.backend.practice.dto.request.AttemptWordRequest;
import com.lingualoop.backend.practice.enums.AttemptOutcome;
import com.lingualoop.backend.practice.enums.AttemptWordClass;
import com.lingualoop.backend.practice.enums.DictationLevel;

class DictationMapperTest {

    private final DictationMapper mapper = Mappers.getMapper(DictationMapper.class);

    @Test
    void toResponse_copiesEveryField() {
        GradedWord word = new GradedWord(3, "milk,", "milk", "mlik", WordClass.content, WordOutcome.misspelled, false);

        GradedWordResponse response = mapper.toResponse(word);

        assertThat(response).isEqualTo(new GradedWordResponse(3, "milk,", "milk", "mlik", WordClass.content,
                WordOutcome.misspelled, false));
    }

    @Test
    void toAttemptWord_usesStoredPositionAndConvertsEnums() {
        GradedWord word = new GradedWord(3, "milk,", "milk", "mlik", WordClass.content, WordOutcome.misspelled, false);
        GradedWord inserted = new GradedWord(null, null, null, "very", null, WordOutcome.inserted, false);

        assertThat(mapper.toAttemptWord(word, 3)).isEqualTo(
                new AttemptWordRequest(3, "milk", "mlik", AttemptOutcome.misspelled, AttemptWordClass.content));
        assertThat(mapper.toAttemptWord(inserted, 12)).isEqualTo(
                new AttemptWordRequest(12, null, "very", AttemptOutcome.inserted, null));
    }

    @Test
    void toLatest_mapsView() {
        Instant now = Instant.now();
        DictationAttemptView view = new DictationAttemptView(42L, UUID.randomUUID(), DictationLevel.easy,
                new BigDecimal("66.67"), true, false, now);

        assertThat(mapper.toLatest(view)).isEqualTo(
                new LatestResult(42L, DictationLevel.easy, new BigDecimal("66.67"), false, true, now));
    }

    @Test
    void submitAttemptRequest_normalizesNullCollections() {
        SubmitAttemptRequest request = new SubmitAttemptRequest(DictationLevel.easy, null, null, null, null, false,
                false, null, 0, null);

        assertThat(request.blanks()).isEmpty();
        assertThat(request.blankPositions()).isEmpty();
        assertThat(request.revealedPositions()).isEmpty();
    }
}
