package com.lingualoop.backend.dictation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;
import com.lingualoop.backend.practice.dto.request.DictationAttemptRequest;
import com.lingualoop.backend.practice.enums.DictationLevel;
import com.lingualoop.backend.practice.service.PracticeAttemptService;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class})
class DictationApiIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private DictationTestData data;
    @Autowired private PracticeAttemptService practiceAttempts;
    @Autowired private JdbcTemplate jdbc;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user)));
    }

    private UUID lesson(String name, boolean pro) {
        return data.newLesson(name + "-" + tag, pro, "APPROVED", false);
    }

    // ---------------------------------------------------------------- GET lessons/{slug}

    @Test
    void getLesson_returnsLessonInfoAndSentencesWithWordCountsAndHidesUntouchedText() throws Exception {
        UUID lesson = lesson("info", false);
        UUID first = data.newSentence(lesson, 0, "I'd like a large iced latte.", "Cho tôi một ly latte.");
        data.newSentence(lesson, 1, "Oh wow", "Ồ");
        data.newSentence(lesson, 2, "Could I get that to go?", "Mang đi được không?");

        as(data.newUser(), get("/api/v1/dictation/lessons/info-" + tag))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(lesson.toString()))
                .andExpect(jsonPath("$.data.slug").value("info-" + tag))
                .andExpect(jsonPath("$.data.title").value("Title info-" + tag))
                .andExpect(jsonPath("$.data.sourceType").value("youtube"))
                .andExpect(jsonPath("$.data.sourceUrl").isNotEmpty())
                .andExpect(jsonPath("$.data.pro").value(false))
                .andExpect(jsonPath("$.data.sentences.length()").value(3))
                .andExpect(jsonPath("$.data.sentences[0].id").value(first.toString()))
                .andExpect(jsonPath("$.data.sentences[0].sortOrder").value(0))
                .andExpect(jsonPath("$.data.sentences[0].startMs").value(0))
                .andExpect(jsonPath("$.data.sentences[0].endMs").value(900))
                .andExpect(jsonPath("$.data.sentences[0].wordCount").value(6))
                .andExpect(jsonPath("$.data.sentences[1].wordCount").value(2))
                .andExpect(jsonPath("$.data.sentences[2].wordCount").value(6))
                .andExpect(jsonPath("$.data.sentences[0].text").doesNotExist())
                .andExpect(jsonPath("$.data.sentences[0].textVi").doesNotExist())
                .andExpect(jsonPath("$.data.sentences[0].latest").doesNotExist());
    }

    @Test
    void getLesson_showsLatestResultAndTextOnlyForDoneSentences() throws Exception {
        UUID lesson = lesson("done", false);
        UUID done = data.newSentence(lesson, 0, "Could I get that to go?", "Mang đi được không?");
        data.newSentence(lesson, 1, "Oh wow", "Ồ");
        UUID user = data.newUser();
        practiceAttempts.recordDictationAttempt(new DictationAttemptRequest(user, done, DictationLevel.normal, null,
                0, null, false, false, "could I get that to go", new BigDecimal("80"), List.of()));

        as(user, get("/api/v1/dictation/lessons/done-" + tag))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sentences[0].latest.score").value(80.0))
                .andExpect(jsonPath("$.data.sentences[0].latest.level").value("normal"))
                .andExpect(jsonPath("$.data.sentences[0].latest.gaveUp").value(false))
                .andExpect(jsonPath("$.data.sentences[0].text").value("Could I get that to go?"))
                .andExpect(jsonPath("$.data.sentences[0].textVi").value("Mang đi được không?"))
                .andExpect(jsonPath("$.data.sentences[1].text").doesNotExist())
                .andExpect(jsonPath("$.data.sentences[1].latest").doesNotExist());
    }

    @Test
    void getLesson_blocksProLessonForFreeUserButNotForProUser() throws Exception {
        lesson("paid", true);

        as(data.newUser(), get("/api/v1/dictation/lessons/paid-" + tag))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));
        as(data.newProUser(), get("/api/v1/dictation/lessons/paid-" + tag))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pro").value(true));
    }

    @Test
    void getLesson_unknownDraftOrDeletedLesson_returns404() throws Exception {
        data.newLesson("draft-" + tag, false, "DRAFT", false);
        data.newLesson("deleted-" + tag, false, "APPROVED", true);
        UUID user = data.newUser();

        for (String slug : List.of("missing-" + tag, "draft-" + tag, "deleted-" + tag)) {
            as(user, get("/api/v1/dictation/lessons/" + slug))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        }
    }

    @Test
    void getLesson_withoutToken_returns401() throws Exception {
        lesson("anon", false);

        mockMvc.perform(get("/api/v1/dictation/lessons/anon-" + tag))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    // ---------------------------------------------------------------- GET sentences/{id}/prompt

    private UUID sentence(String name, String text) {
        return data.newSentence(lesson(name, false), 0, text, "dịch");
    }

    private String promptBody(UUID user, UUID sentence, String level) throws Exception {
        return as(user, get("/api/v1/dictation/sentences/" + sentence + "/prompt").param("level", level))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    }

    @Test
    void prompt_hard_returnsOnlyWordCount() throws Exception {
        UUID sentence = sentence("hard", "Could I get that to go?");

        as(data.newUser(), get("/api/v1/dictation/sentences/" + sentence + "/prompt").param("level", "hard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.level").value("hard"))
                .andExpect(jsonPath("$.data.wordCount").value(6))
                .andExpect(jsonPath("$.data.tokens.length()").value(0));
    }

    @Test
    void prompt_normal_returnsWordLengthsWithoutText() throws Exception {
        UUID sentence = sentence("normal", "I'd like a large iced latte.");

        String body = promptBody(data.newUser(), sentence, "normal");

        List<Map<String, Object>> tokens = JsonPath.read(body, "$.data.tokens");
        assertThat(tokens).extracting(t -> t.get("length")).containsExactly(3, 4, 1, 5, 4, 5);
        assertThat(tokens).extracting(t -> t.get("position")).containsExactly(0, 1, 2, 3, 4, 5);
        assertThat(tokens).allSatisfy(t -> assertThat(t.get("display")).isNull());
        assertThat(tokens).allSatisfy(t -> assertThat(t.get("blank")).isEqualTo(true));
        assertThat(body).doesNotContain("latte").doesNotContain("large");
    }

    @Test
    void prompt_easy_hidesBlankWordsAndShowsTheRest() throws Exception {
        String text = "Please bring fresh bread to the table";
        String[] words = text.split(" ");
        UUID sentence = sentence("easy", text);
        UUID user = data.newUser();

        for (int i = 0; i < 30; i++) {
            String body = promptBody(user, sentence, "easy");
            List<Map<String, Object>> tokens = JsonPath.read(body, "$.data.tokens");

            assertThat(tokens).hasSize(7);
            List<Integer> blanks = new ArrayList<>();
            for (Map<String, Object> token : tokens) {
                int position = (Integer) token.get("position");
                if (Boolean.TRUE.equals(token.get("blank"))) {
                    blanks.add(position);
                    assertThat(token.get("display")).isNull();
                    assertThat(token.get("length")).isEqualTo(words[position].length());
                    assertThat(body).doesNotContain("\"display\":\"" + words[position] + "\"");
                } else {
                    assertThat(token.get("display")).isEqualTo(words[position]);
                    assertThat(token.get("length")).isNull();
                }
            }
            assertThat(blanks).hasSizeBetween(1, 3);
            for (int j = 1; j < blanks.size(); j++) {
                assertThat(blanks.get(j) - blanks.get(j - 1)).isGreaterThan(1);
            }
        }
    }

    @Test
    void prompt_easy_sentenceWithoutBlankableWords_returns422ButNormalStillWorks() throws Exception {
        UUID sentence = sentence("noblank", "Oh wow");
        UUID user = data.newUser();

        as(user, get("/api/v1/dictation/sentences/" + sentence + "/prompt").param("level", "easy"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("DICTATION_EASY_UNAVAILABLE"));
        as(user, get("/api/v1/dictation/sentences/" + sentence + "/prompt").param("level", "normal"))
                .andExpect(status().isOk());
    }

    @Test
    void prompt_validatesAccessAndParameters() throws Exception {
        UUID free = data.newUser();
        UUID open = sentence("open", "Could I get that to go?");
        UUID paid = data.newSentence(lesson("paywall", true), 0, "Could I get that to go?", "dịch");
        UUID draft = data.newSentence(data.newLesson("draft-" + tag, false, "DRAFT", false), 0, "Hello there", "x");

        as(free, get("/api/v1/dictation/sentences/" + UUID.randomUUID() + "/prompt").param("level", "hard"))
                .andExpect(status().isNotFound());
        as(free, get("/api/v1/dictation/sentences/" + draft + "/prompt").param("level", "hard"))
                .andExpect(status().isNotFound());
        as(free, get("/api/v1/dictation/sentences/" + paid + "/prompt").param("level", "hard"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));
        mockMvc.perform(get("/api/v1/dictation/sentences/" + open + "/prompt").param("level", "hard"))
                .andExpect(status().isUnauthorized());
        as(free, get("/api/v1/dictation/sentences/" + open + "/prompt").param("level", "expert"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
        as(free, get("/api/v1/dictation/sentences/" + open + "/prompt"))
                .andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------- POST sentences/{id}/attempts

    private ResultActions submit(UUID user, UUID sentence, String json) throws Exception {
        return as(user, post("/api/v1/dictation/sentences/" + sentence + "/attempts")
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private int attemptCount(UUID user) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM sentence_attempts WHERE user_id = ?", Integer.class,
                user);
        return n == null ? 0 : n;
    }

    private void expectInvalid(UUID user, UUID sentence, String json, String field, String code) throws Exception {
        submit(user, sentence, json)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[?(@.field == '" + field + "' && @.code == '" + code + "')]")
                        .isNotEmpty());
    }

    @Test
    void submit_normal_gradesStoresAndReturnsTheResult() throws Exception {
        UUID lesson = lesson("sn", false);
        UUID sentence = data.newSentence(lesson, 0, "Could I get that to go?", "Mang đi được không?");
        UUID user = data.newUser();

        submit(user, sentence, """
                {"level":"normal","typedText":"could I get that to go","playbackRate":0.75,
                 "replayCount":2,"durationMs":4200}""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.attemptId").isNumber())
                .andExpect(jsonPath("$.data.level").value("normal"))
                .andExpect(jsonPath("$.data.score").value(100.0))
                .andExpect(jsonPath("$.data.gaveUp").value(false))
                .andExpect(jsonPath("$.data.words.length()").value(6))
                .andExpect(jsonPath("$.data.words[0].outcome").value("correct"))
                .andExpect(jsonPath("$.data.words[0].wordClass").value("function"))
                .andExpect(jsonPath("$.data.classes[0].wordClass").value("function"))
                .andExpect(jsonPath("$.data.classes[0].total").value(4))
                .andExpect(jsonPath("$.data.classes[0].errors").value(0))
                .andExpect(jsonPath("$.data.classes[1].wordClass").value("content"))
                .andExpect(jsonPath("$.data.classes[1].total").value(2))
                .andExpect(jsonPath("$.data.text").value("Could I get that to go?"))
                .andExpect(jsonPath("$.data.textVi").value("Mang đi được không?"));

        Map<String, Object> row = jdbc.queryForMap("SELECT mode::text AS mode, level, submitted_text, is_retry, "
                + "gave_up, playback_rate, replay_count, duration_ms, score FROM sentence_attempts WHERE user_id = ?",
                user);
        assertThat(row).containsEntry("mode", "dictation").containsEntry("level", "normal")
                .containsEntry("submitted_text", "could I get that to go").containsEntry("is_retry", false)
                .containsEntry("gave_up", false).containsEntry("replay_count", 2)
                .containsEntry("duration_ms", 4200);
        assertThat((BigDecimal) row.get("playback_rate")).isEqualByComparingTo("0.75");
        assertThat((BigDecimal) row.get("score")).isEqualByComparingTo("100");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM sentence_attempt_words w JOIN sentence_attempts a "
                + "ON a.id = w.attempt_id WHERE a.user_id = ?", Integer.class, user)).isEqualTo(6);

        as(user, get("/api/v1/dictation/lessons/sn-" + tag))
                .andExpect(jsonPath("$.data.sentences[0].latest.score").value(100.0));
    }

    @Test
    void submit_hard_withErrors_reportsOutcomesClassesAndHomophone() throws Exception {
        UUID lesson = lesson("sh", false);
        UUID homophone = data.newSentence(lesson, 0, "over there", "ở đằng kia");
        UUID stem = data.newSentence(lesson, 1, "iced tea", "trà đá");
        UUID user = data.newUser();

        submit(user, homophone, "{\"level\":\"hard\",\"typedText\":\"over their\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.words[1].outcome").value("misspelled"))
                .andExpect(jsonPath("$.data.words[1].homophone").value(true))
                .andExpect(jsonPath("$.data.words[1].expectedWord").value("there"))
                .andExpect(jsonPath("$.data.words[1].actualWord").value("their"))
                .andExpect(jsonPath("$.data.classes[0].wordClass").value("function"))
                .andExpect(jsonPath("$.data.classes[0].total").value(2))
                .andExpect(jsonPath("$.data.classes[0].errors").value(1))
                .andExpect(jsonPath("$.data.score").value(50.0));
        submit(user, stem, "{\"level\":\"hard\",\"typedText\":\"ice tea\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.words[0].outcome").value("substituted"))
                .andExpect(jsonPath("$.data.words[0].wordClass").value("inflected"))
                .andExpect(jsonPath("$.data.words[0].homophone").value(false));
    }

    @Test
    void submit_easy_gradesOnlyBlankPositions() throws Exception {
        UUID sentence = data.newSentence(lesson("se", false), 0, "I'd like a large iced latte.", "x");
        UUID user = data.newUser();

        submit(user, sentence, """
                {"level":"easy","blankPositions":[1,4],"blanks":{"1":"like","4":"ice"}}""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.words.length()").value(2))
                .andExpect(jsonPath("$.data.words[0].position").value(1))
                .andExpect(jsonPath("$.data.words[0].outcome").value("correct"))
                .andExpect(jsonPath("$.data.words[1].position").value(4))
                .andExpect(jsonPath("$.data.words[1].outcome").value("substituted"))
                .andExpect(jsonPath("$.data.score").value(50.0));

        assertThat(jdbc.queryForList("SELECT w.position FROM sentence_attempt_words w JOIN sentence_attempts a "
                + "ON a.id = w.attempt_id WHERE a.user_id = ? ORDER BY w.position", Integer.class, user))
                .containsExactly(1, 4);
        Map<String, Object> row = jdbc.queryForMap(
                "SELECT level, submitted_text FROM sentence_attempts WHERE user_id = ?", user);
        assertThat(row).containsEntry("level", "easy").containsEntry("submitted_text", null);
    }

    @Test
    void submit_easy_emptyValueIsOmittedAndRevealedIsMarked() throws Exception {
        UUID sentence = data.newSentence(lesson("sr", false), 0, "I'd like a large iced latte.", "x");

        submit(data.newUser(), sentence, """
                {"level":"easy","blankPositions":[1,4],"blanks":{},"revealedPositions":[4]}""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.words[0].outcome").value("omitted"))
                .andExpect(jsonPath("$.data.words[1].outcome").value("revealed"))
                .andExpect(jsonPath("$.data.score").value(0.0));
    }

    @Test
    void submit_gaveUp_ignoresTypedTextAndScoresZero() throws Exception {
        UUID sentence = data.newSentence(lesson("sg", false), 0, "Could I get that to go?", "x");
        UUID user = data.newUser();

        submit(user, sentence, "{\"level\":\"normal\",\"typedText\":\"could I get that to go\",\"gaveUp\":true}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.gaveUp").value(true))
                .andExpect(jsonPath("$.data.score").value(0.0))
                .andExpect(jsonPath("$.data.words[*].outcome",
                        org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("omitted"))));

        Map<String, Object> row = jdbc.queryForMap(
                "SELECT gave_up, submitted_text FROM sentence_attempts WHERE user_id = ?", user);
        assertThat(row).containsEntry("gave_up", true).containsEntry("submitted_text", null);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM v_user_dictation_stats WHERE user_id = ?",
                Integer.class, user)).isZero();
    }

    @Test
    void submit_retry_isStored() throws Exception {
        UUID sentence = data.newSentence(lesson("rt", false), 0, "Could I get that to go?", "x");
        UUID user = data.newUser();

        submit(user, sentence, "{\"level\":\"normal\",\"typedText\":\"could I\",\"retry\":true}")
                .andExpect(status().isOk());

        assertThat(jdbc.queryForObject("SELECT is_retry FROM sentence_attempts WHERE user_id = ?", Boolean.class,
                user)).isTrue();
    }

    @Test
    void submit_withManyExtraWords_storesInsertedWordsWithUniquePositions() throws Exception {
        UUID sentence = data.newSentence(lesson("sx", false), 0, "Hello there you", "x");
        UUID user = data.newUser();
        String typed = IntStream.range(0, 300).mapToObj(i -> "q" + i).collect(Collectors.joining(" "));

        submit(user, sentence, "{\"level\":\"hard\",\"typedText\":\"" + typed + "\"}")
                .andExpect(status().isOk());

        Map<String, Object> positions = jdbc.queryForMap("SELECT count(*) AS n, count(DISTINCT w.position) AS d, "
                + "max(w.position) AS top FROM sentence_attempt_words w JOIN sentence_attempts a "
                + "ON a.id = w.attempt_id WHERE a.user_id = ?", user);
        assertThat(positions.get("n")).isEqualTo(positions.get("d"));
        assertThat(((Number) positions.get("top")).intValue()).isGreaterThanOrEqualTo(299);
    }

    @Test
    void submit_validation_returns400WithFieldErrorsAndStoresNothing() throws Exception {
        UUID sentence = data.newSentence(lesson("sv", false), 0, "Oh - I like coffee", "x");
        UUID user = data.newUser();

        expectInvalid(user, sentence, "{\"level\":\"easy\"}", "blankPositions", "NotEmpty");
        expectInvalid(user, sentence, "{\"level\":\"easy\",\"blankPositions\":[3,3]}", "blankPositions", "Unique");
        for (int position : new int[] {0, 1, 99}) {
            expectInvalid(user, sentence, "{\"level\":\"easy\",\"blankPositions\":[" + position + "]}",
                    "blankPositions", "InvalidPosition");
        }
        expectInvalid(user, sentence, "{\"level\":\"easy\",\"blankPositions\":[2,3,4]}", "blankPositions", "Size");
        expectInvalid(user, sentence, "{\"level\":\"normal\"}", "typedText", "NotBlank");
        expectInvalid(user, sentence, "{\"level\":\"hard\",\"typedText\":\"   \"}", "typedText", "NotBlank");
        expectInvalid(user, sentence, "{\"level\":\"easy\",\"blankPositions\":[3],\"blanks\":{\"3\":\""
                + "a".repeat(201) + "\"}}", "blanks", "Size");
        expectInvalid(user, sentence, "{\"level\":\"hard\",\"typedText\":\"" + "a".repeat(3000) + "\"}",
                "typedText", "MaxBytes");
        expectInvalid(user, sentence, "{\"level\":\"hard\",\"typedText\":\"x\",\"playbackRate\":5}",
                "playbackRate", "DecimalMax");
        expectInvalid(user, sentence, "{\"level\":\"hard\",\"typedText\":\"x\",\"durationMs\":-1}",
                "durationMs", "Min");
        expectInvalid(user, sentence, "{\"level\":\"hard\",\"typedText\":\"x\",\"replayCount\":-1}",
                "replayCount", "Min");
        expectInvalid(user, sentence, "{\"typedText\":\"x\"}", "level", "NotNull");
        submit(user, sentence, "{\"level\":\"hard\",\"typedText\":\"x\",\"revealedPositions\":[-1]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        for (String broken : List.of("{\"level\":\"expert\"}", "{", "{\"level\":\"hard\",\"replayCount\":\"x\"}")) {
            submit(user, sentence, broken).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
        }

        assertThat(attemptCount(user)).isZero();
    }

    @Test
    void submit_blocksProUnknownDeletedDraftAndAnonymous() throws Exception {
        UUID free = data.newUser();
        UUID paid = data.newSentence(lesson("sp", true), 0, "Could I get that to go?", "x");
        UUID draft = data.newSentence(data.newLesson("sd-" + tag, false, "DRAFT", false), 0, "Hello there", "x");
        UUID deleted = data.newSentence(data.newLesson("sx-" + tag, false, "APPROVED", true), 0, "Hello there", "x");
        String body = "{\"level\":\"hard\",\"typedText\":\"hello\"}";

        submit(free, paid, body).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));
        submit(free, UUID.randomUUID(), body).andExpect(status().isNotFound());
        submit(free, draft, body).andExpect(status().isNotFound());
        submit(free, deleted, body).andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/dictation/sentences/" + paid + "/attempts")
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isUnauthorized());

        assertThat(attemptCount(free)).isZero();
    }

    @Test
    void easyFlow_submittingTheBlanksOfAPromptIsAlwaysAccepted() throws Exception {
        UUID lesson = lesson("flow", false);
        List<String> texts = List.of("I'd like a large iced latte with oat milk, please.", "Could I get that to go?",
                "Please bring fresh bread to the table", "Wait - what is that sound", "Hello", "Thank you");
        UUID user = data.newUser();

        for (int i = 0; i < texts.size(); i++) {
            UUID sentence = data.newSentence(lesson, i, texts.get(i), "x");
            for (int round = 0; round < 10; round++) {
                String body = promptBody(user, sentence, "easy");
                List<Integer> blanks = JsonPath.read(body, "$.data.tokens[?(@.blank == true)].position");

                submit(user, sentence, "{\"level\":\"easy\",\"blankPositions\":" + blanks + "}")
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.data.words.length()").value(blanks.size()));
            }
        }
    }

    // ---------------------------------------------------------------- POST sentences/{id}/reveal

    private ResultActions reveal(UUID user, UUID sentence, String json) throws Exception {
        return as(user, post("/api/v1/dictation/sentences/" + sentence + "/reveal")
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    void reveal_byPosition_returnsThatWordWithoutPunctuationAndKeepsCase() throws Exception {
        UUID sentence = sentence("rv1", "Could I get that to go?");
        UUID user = data.newUser();

        reveal(user, sentence, "{\"position\":2}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.position").value(2))
                .andExpect(jsonPath("$.data.index").value(2))
                .andExpect(jsonPath("$.data.word").value("get"));
        reveal(user, sentence, "{\"position\":0}")
                .andExpect(jsonPath("$.data.word").value("Could"));
        reveal(user, sentence, "{\"position\":5}")
                .andExpect(jsonPath("$.data.word").value("go"));
    }

    @Test
    void reveal_byTypedText_returnsTheWordAfterTheCorrectPrefix() throws Exception {
        UUID sentence = sentence("rv2", "Could I get that to go?");
        UUID user = data.newUser();

        reveal(user, sentence, "{\"typedText\":\"could i get\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.position").value(3))
                .andExpect(jsonPath("$.data.index").value(3))
                .andExpect(jsonPath("$.data.word").value("that"));
        reveal(user, sentence, "{\"typedText\":\"could i give\"}")
                .andExpect(jsonPath("$.data.word").value("get"));
        reveal(user, sentence, "{}")
                .andExpect(jsonPath("$.data.word").value("Could"));
    }

    @Test
    void reveal_whenEverythingIsAlreadyCorrect_returnsNoWord() throws Exception {
        UUID sentence = sentence("rv3", "Oh wow");

        reveal(data.newUser(), sentence, "{\"typedText\":\"oh wow\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.position").doesNotExist())
                .andExpect(jsonPath("$.data.word").doesNotExist());
    }

    @Test
    void reveal_toleratesPunctuationOnlyTokensWhenMappingPositions() throws Exception {
        UUID sentence = sentence("rv4", "Wait - what is that sound");
        UUID user = data.newUser();

        reveal(user, sentence, "{\"typedText\":\"wait\"}")
                .andExpect(jsonPath("$.data.word").value("what"))
                .andExpect(jsonPath("$.data.index").value(1));
    }

    @Test
    void reveal_rejectsPositionsThatAreNotWords() throws Exception {
        UUID sentence = sentence("rv5", "Wait - what is that sound");
        UUID user = data.newUser();

        reveal(user, sentence, "{\"position\":1}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'position' && @.code == 'InvalidPosition')]").isNotEmpty());
        reveal(user, sentence, "{\"position\":99}").andExpect(status().isBadRequest());
        reveal(user, sentence, "{\"position\":-1}").andExpect(status().isBadRequest());
    }

    @Test
    void reveal_blocksProUnknownDeletedDraftAndAnonymous() throws Exception {
        UUID free = data.newUser();
        UUID paid = data.newSentence(lesson("rp", true), 0, "Could I get that to go?", "x");
        UUID draft = data.newSentence(data.newLesson("rd-" + tag, false, "DRAFT", false), 0, "Hello there", "x");

        reveal(free, paid, "{\"position\":0}").andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));
        reveal(free, UUID.randomUUID(), "{\"position\":0}").andExpect(status().isNotFound());
        reveal(free, draft, "{\"position\":0}").andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/dictation/sentences/" + paid + "/reveal")
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isUnauthorized());
    }

    @Test
    void reveal_doesNotStoreAnAttempt() throws Exception {
        UUID sentence = sentence("rv6", "Could I get that to go?");
        UUID user = data.newUser();

        reveal(user, sentence, "{\"position\":1}").andExpect(status().isOk());

        assertThat(attemptCount(user)).isZero();
    }

    @Test
    void openApi_listsDictationEndpoints() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/dictation/lessons/{slug}']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/dictation/sentences/{id}/prompt']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/dictation/sentences/{id}/attempts']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/dictation/sentences/{id}/reveal']").exists());
    }
}
