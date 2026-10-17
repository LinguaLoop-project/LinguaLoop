package com.lingualoop.backend.shadowing.azure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.AzureSpeechProperties;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment.ErrorType;

class AzurePronunciationScoringServiceTest {

    @Test
    void parseWords_readsWordsPhonemesAndErrorTypes() {
        String json = """
                {"NBest":[{"Words":[
                  {"Word":"hello","PronunciationAssessment":{"AccuracyScore":91.0,"ErrorType":"None"},
                   "Phonemes":[{"Phoneme":"h","PronunciationAssessment":{"AccuracyScore":99}},
                               {"Phoneme":"oʊ","PronunciationAssessment":{"AccuracyScore":80.5}}]},
                  {"Word":"the","PronunciationAssessment":{"AccuracyScore":0,"ErrorType":"Omission"},"Phonemes":[]},
                  {"Word":"uh","PronunciationAssessment":{"AccuracyScore":0,"ErrorType":"Insertion"}},
                  {"Word":"world","PronunciationAssessment":{"AccuracyScore":40,"ErrorType":"Mispronunciation"}}
                ]}]}""";

        List<PronunciationAssessment.WordResult> words = AzurePronunciationScoringService.parseWords(json);

        assertThat(words).extracting(PronunciationAssessment.WordResult::word)
                .containsExactly("hello", "the", "uh", "world");
        assertThat(words).extracting(PronunciationAssessment.WordResult::errorType)
                .containsExactly(ErrorType.NONE, ErrorType.OMISSION, ErrorType.INSERTION, ErrorType.MISPRONUNCIATION);
        assertThat(words.get(0).phonemes()).extracting(PronunciationAssessment.PhonemeResult::symbol)
                .containsExactly("h", "oʊ");
        assertThat(words.get(0).phonemes().get(1).accuracyScore()).isEqualTo(80.5);
        assertThat(words.get(2).phonemes()).isEmpty();
    }

    @Test
    void parseWords_toleratesMissingOrEmptyJson() {
        assertThat(AzurePronunciationScoringService.parseWords(null)).isEmpty();
        assertThat(AzurePronunciationScoringService.parseWords(" ")).isEmpty();
        assertThat(AzurePronunciationScoringService.parseWords("{}")).isEmpty();
    }

    @Test
    void unknownErrorType_isTreatedAsNone() {
        assertThat(ErrorType.fromAzure("UnexpectedBreak")).isEqualTo(ErrorType.NONE);
        assertThat(ErrorType.fromAzure(null)).isEqualTo(ErrorType.NONE);
    }

    @Test
    void withoutKey_reportsScoringUnavailableInsteadOfCrashing() {
        var service = new AzurePronunciationScoringService(new AzureSpeechProperties("", "southeastasia"));

        assertThatThrownBy(() -> service.assess(new byte[100], "hello"))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.SHADOWING_SCORING_UNAVAILABLE));
    }
}
