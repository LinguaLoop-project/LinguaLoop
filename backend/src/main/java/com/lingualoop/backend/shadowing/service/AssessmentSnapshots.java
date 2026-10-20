package com.lingualoop.backend.shadowing.service;

import java.util.ArrayList;
import java.util.List;

import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.shadowing.azure.AzurePhonemeMapper;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment;
import com.lingualoop.backend.shadowing.dto.AttemptSnapshot;

/**
 * Đổi một kết quả chấm vừa nhận từ Azure (chưa lưu) sang dạng theo âm đích như {@link AttemptSnapshot}, dùng cho Lượt
 * chấm của Phiên gia sư: chấm một từ hay cả câu nhưng vẫn so với âm đích lấy từ phiên âm mẫu.
 */
public final class AssessmentSnapshots {

    private AssessmentSnapshots() {
    }

    /**
     * @param referenceText lời mẫu đã gửi cho Azure (một từ hoặc cả câu)
     * @param referenceIpa  phiên âm mẫu của lời mẫu, cách nhau bởi khoảng trắng theo từ; null nếu không có
     */
    public static List<AttemptSnapshot.Word> words(String referenceText, String referenceIpa,
            PronunciationAssessment assessment) {
        SentenceView reference = new SentenceView(null, null, 0, referenceText, null, referenceIpa, 0, 0, null);
        List<List<String>> targets = PhonemeTargets.forAssessment(reference, assessment);
        List<AttemptSnapshot.Word> result = new ArrayList<>();
        for (int w = 0; w < assessment.words().size(); w++) {
            PronunciationAssessment.WordResult word = assessment.words().get(w);
            List<String> mapped = AzurePhonemeMapper.toTableSymbols(
                    word.phonemes().stream().map(PronunciationAssessment.PhonemeResult::symbol).toList());
            List<AttemptSnapshot.Phoneme> phonemes = new ArrayList<>();
            for (int i = 0; i < word.phonemes().size(); i++) {
                PronunciationAssessment.PhonemeResult p = word.phonemes().get(i);
                String heard = mapped.get(i) != null ? mapped.get(i) : p.symbol();
                String target = targets.get(w).get(i);
                phonemes.add(new AttemptSnapshot.Phoneme(target != null ? target : heard, p.accuracyScore(),
                        PhonemeRules.needsFix(p.accuracyScore(), heard, target), PhonemeRules.mismatch(heard, target)));
            }
            result.add(new AttemptSnapshot.Word(word.word(), word.accuracyScore(),
                    ShadowingAttemptRecorder.outcomeOf(word.errorType()), phonemes));
        }
        return result;
    }
}
