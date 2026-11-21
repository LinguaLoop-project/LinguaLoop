package com.lingualoop.backend.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class FeedbackPromptBuilderTest {

    private static FeedbackRequest request() {
        return new FeedbackRequest("Think about it", 72.5, 70.0, 80.0, 100.0, null, List.of(
                new FeedbackRequest.Word("think", 45, "mispronounced", List.of(
                        new FeedbackRequest.Phoneme("θ", null, 30), new FeedbackRequest.Phoneme("ŋ", null, 52))),
                new FeedbackRequest.Word("about", 0, "omitted", List.of()),
                new FeedbackRequest.Word("uh", 0, "inserted", List.of())));
    }

    @Test
    void userPrompt_listsSentenceScoresAndEachWordWithItsWeakSounds() {
        String prompt = FeedbackPromptBuilder.userPrompt(request());

        assertThat(prompt).contains("Câu mẫu: Think about it");
        assertThat(prompt).contains("Điểm tổng: 73/100"); // 72.5 làm tròn lên
        assertThat(prompt).contains("ngữ điệu: không có"); // không có điểm ngữ điệu thì nói rõ, không bịa số
        assertThat(prompt).contains("- think: 45 điểm, đọc sai, âm yếu: /θ/ 30, /ŋ/ 52");
        assertThat(prompt).contains("- about: 0 điểm, bị bỏ sót");
        assertThat(prompt).contains("- uh: 0 điểm, từ thừa");
    }

    @Test
    void userPrompt_forAFlawlessWordHasNoWeakSoundList() {
        String prompt = FeedbackPromptBuilder.userPrompt(new FeedbackRequest("Hi", 95, 95.0, 95.0, 100.0, 90.0,
                List.of(new FeedbackRequest.Word("hi", 95, "correct", List.of()))));

        assertThat(prompt).contains("- hi: 95 điểm, đọc đúng\n");
        assertThat(prompt).doesNotContain("âm yếu");
    }

    @Test
    void userPrompt_includesThePreviousAttemptOfTheSameSentence() {
        FeedbackRequest r = new FeedbackRequest("Think about it", 72.5, 70.0, 80.0, 100.0, null, List.of(
                new FeedbackRequest.Word("think", 45, "mispronounced", List.of()),
                new FeedbackRequest.Word("about", 90, "correct", List.of())),
                new FeedbackRequest.Previous(61.0, java.util.Map.of("think", 30.0)), java.util.Map.of());

        String prompt = FeedbackPromptBuilder.userPrompt(r);

        assertThat(prompt).contains("Lượt trước của câu này: 61/100");
        assertThat(prompt).contains("- think: 45 điểm, đọc sai, lượt trước 30");
        assertThat(prompt).contains("- about: 90 điểm, đọc đúng\n"); // từ không có trong lượt trước thì không bịa số
    }

    @Test
    void userPrompt_withoutAPreviousAttemptHasNoComparison() {
        assertThat(FeedbackPromptBuilder.userPrompt(request())).doesNotContain("Lượt trước");
    }

    @Test
    void systemInstruction_asksForGroupedPrioritizedJsonAndForbidsInventedMouthTips() {
        String system = FeedbackPromptBuilder.systemInstruction();

        assertThat(system).contains("tiếng Việt", "không bịa", "TỐI ĐA 3 lỗi", "GOM theo âm", "JSON");
        assertThat(system).contains("từ chức năng", "KHÔNG viết cách đặt lưỡi", "keep_going", "listen_word", "ask_tutor", "retry");
        assertThat(FeedbackPromptBuilder.VERSION).isEqualTo("shadowing-feedback-v2");
    }
}
