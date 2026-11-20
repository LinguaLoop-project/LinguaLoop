package com.lingualoop.backend.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

/** Chuẩn hóa nhận xét AI dạng JSON: bỏ điều bịa, giới hạn số lỗi, gắn mẹo khẩu hình của hệ thống. */
class StructuredFeedbackTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private static FeedbackRequest request() {
        return new FeedbackRequest("Watch it without them", 55, 50.0, 70.0, 80.0, null, List.of(
                new FeedbackRequest.Word("Watch", 43, "mispronounced", List.of(new FeedbackRequest.Phoneme("w", null, 40))),
                new FeedbackRequest.Word("it", 90, "correct", List.of()),
                new FeedbackRequest.Word("without", 50, "mispronounced",
                        List.of(new FeedbackRequest.Phoneme("d", "ð", 35))),
                new FeedbackRequest.Word("them", 0, "omitted", List.of())),
                new FeedbackRequest.Previous(61, Map.of("watch", 60.0)),
                Map.of("w", "Hai môi chụm tròn rồi mở ra.", "ð", "Đặt đầu lưỡi giữa hai hàm răng.", "d", "Đặt đầu lưỡi giữa hai hàm răng."));
    }

    private static JsonNode normalize(String raw) throws Exception {
        return JSON.readTree(StructuredFeedback.normalize(raw, request()));
    }

    @Test
    void keepsAValidAnswerAndAttachesTheSystemTipForTheSound() throws Exception {
        JsonNode out = normalize("""
                {"summary": "Bạn đọc khá liền mạch.", "strengths": ["Từ it đọc đúng."],
                 "issues": [{"words": ["without"], "phonemes": ["d"], "problem": "without: /ð/ nghe giống /d/."}],
                 "omitted": ["them"], "next": {"action": "listen_word", "word": "without"}}""");

        assertThat(out.path("v").asInt()).isEqualTo(2);
        assertThat(out.path("summary").asText()).isEqualTo("Bạn đọc khá liền mạch.");
        assertThat(out.path("issues")).hasSize(1);
        assertThat(out.path("issues").get(0).path("words").get(0).asText()).isEqualTo("without");
        // mẹo lấy từ kho của hệ thống theo âm đích /ð/, dù AI nêu âm Azure báo /d/
        JsonNode tip = out.path("issues").get(0).path("tips").get(0);
        assertThat(tip.path("phoneme").asText()).isEqualTo("ð");
        assertThat(tip.path("text").asText()).isEqualTo("Đặt đầu lưỡi giữa hai hàm răng.");
        assertThat(out.path("omitted").get(0).asText()).isEqualTo("them");
        assertThat(out.path("next").path("action").asText()).isEqualTo("listen_word");
        assertThat(out.path("next").path("word").asText()).isEqualTo("without");
    }

    @Test
    void whenTheAnswerLeavesSoundsEmptyTakesThemFromTheWeakSoundsOfThoseWords() throws Exception {
        JsonNode out = normalize("""
                {"summary": "Tổng quan.",
                 "issues": [{"words": ["without"], "phonemes": [], "problem": "without bị đọc nhầm."}]}""");

        JsonNode issue = out.path("issues").get(0);
        assertThat(issue.path("phonemes")).hasSize(1);
        assertThat(issue.path("phonemes").get(0).asText()).isEqualTo("ð"); // âm đích, không phải âm Azure báo
        assertThat(issue.path("tips").get(0).path("text").asText()).isEqualTo("Đặt đầu lưỡi giữa hai hàm răng.");
    }

    @Test
    void dropsWordsAndSoundsThatAreNotInTheData() throws Exception {
        JsonNode out = normalize("""
                {"summary": "Tổng quan.",
                 "issues": [{"words": ["banana"], "phonemes": ["θ"], "problem": "Bịa."},
                            {"words": ["watch", "banana"], "phonemes": ["θ", "w"], "problem": "Watch bị sai âm /w/."}],
                 "omitted": ["it", "banana"], "next": {"action": "retry"}}""");

        assertThat(out.path("issues")).hasSize(1); // lỗi chỉ nói về từ không có trong câu bị bỏ
        JsonNode issue = out.path("issues").get(0);
        assertThat(issue.path("words")).hasSize(1);
        assertThat(issue.path("words").get(0).asText()).isEqualTo("Watch"); // viết đúng như trong câu mẫu
        assertThat(issue.path("phonemes")).hasSize(1);
        assertThat(issue.path("phonemes").get(0).asText()).isEqualTo("w");
        assertThat(out.path("omitted")).isEmpty(); // "it" đọc đúng, không phải bỏ sót
    }

    @Test
    void keepsAtMostThreeIssuesAndTwoStrengths() throws Exception {
        String issue = "{\"words\": [\"watch\"], \"problem\": \"Lỗi.\"}";
        JsonNode out = normalize("{\"summary\": \"Tổng quan.\", \"strengths\": [\"a\", \"b\", \"c\"], \"issues\": ["
                + String.join(",", issue, issue, issue, issue, issue) + "]}");

        assertThat(out.path("issues")).hasSize(StructuredFeedback.MAX_ISSUES);
        assertThat(out.path("strengths")).hasSize(2);
    }

    @Test
    void fallsBackToASafeNextStepWhenTheActionIsInvalidOrHasNoWord() throws Exception {
        assertThat(normalize("{\"summary\": \"T.\", \"next\": {\"action\": \"dance\"}}").path("next").path("action").asText())
                .isEqualTo("keep_going"); // không có lỗi nào
        assertThat(normalize("{\"summary\": \"T.\", \"issues\": [{\"words\": [\"watch\"], \"problem\": \"L.\"}],"
                + " \"next\": {\"action\": \"dance\"}}").path("next").path("action").asText()).isEqualTo("retry");
        JsonNode noWord = normalize("{\"summary\": \"T.\", \"next\": {\"action\": \"listen_word\", \"word\": \"x\"}}");
        assertThat(noWord.path("next").path("action").asText()).isEqualTo("retry"); // không có từ nào để nghe
        JsonNode otherWord = normalize("{\"summary\": \"T.\", \"issues\": [{\"words\": [\"watch\"], \"problem\": \"L.\"}],"
                + " \"next\": {\"action\": \"listen_word\", \"word\": \"zebra\"}}");
        assertThat(otherWord.path("next").path("word").asText()).isEqualTo("Watch"); // từ lạ thì dùng từ có lỗi đầu tiên
    }

    @Test
    void acceptsAnswersWrappedInACodeFence() throws Exception {
        JsonNode out = normalize("```json\n{\"summary\": \"Tổng quan.\"}\n```");

        assertThat(out.path("summary").asText()).isEqualTo("Tổng quan.");
        assertThat(out.path("issues")).isEmpty();
    }

    @Test
    void rejectsAnswersThatAreNotJsonOrHaveNoSummary() {
        for (String bad : List.of("không phải json", "{\"issues\": []}", "{\"summary\": \"  \"}")) {
            assertThatThrownBy(() -> StructuredFeedback.normalize(bad, request()))
                    .isInstanceOfSatisfying(BusinessException.class,
                            e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AI_FEEDBACK_UNAVAILABLE));
        }
    }
}
