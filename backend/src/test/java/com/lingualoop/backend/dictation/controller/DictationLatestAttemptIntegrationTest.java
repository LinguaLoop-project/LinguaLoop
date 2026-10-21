package com.lingualoop.backend.dictation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;

/** Mở lại câu đã làm: kết quả từng từ của lượt gần nhất phải giống hệt lúc vừa nộp. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class})
class DictationLatestAttemptIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private DictationTestData data;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user)));
    }

    private String submit(UUID user, UUID sentence, String json) throws Exception {
        return as(user, post("/api/v1/dictation/sentences/" + sentence + "/attempts")
                .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    }

    private ResultActions latest(UUID user, UUID sentence) throws Exception {
        return as(user, get("/api/v1/dictation/sentences/" + sentence + "/attempts/latest"));
    }

    private UUID sentence(String name, String text) {
        return data.newSentence(data.newLesson(name + "-" + tag, false, "APPROVED", false), 0, text, "Bản dịch");
    }

    @Test
    void latest_returnsTheSameResultAsTheSubmitResponse_withErrorsAndHomophones() throws Exception {
        UUID sentence = sentence("l1", "Their cat sleeps over there.");
        UUID user = data.newUser();
        String submitted = submit(user, sentence,
                "{\"level\":\"hard\",\"typedText\":\"there cat sleep over their\"}");

        String fetched = latest(user, sentence).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.text").value("Their cat sleeps over there."))
                .andExpect(jsonPath("$.data.textVi").value("Bản dịch"))
                .andReturn().getResponse().getContentAsString();

        assertThat((Object) JsonPath.read(fetched, "$.data")).isEqualTo(JsonPath.read(submitted, "$.data"));
        assertThat((Boolean) JsonPath.read(fetched, "$.data.words[0].homophone")).isTrue();
    }

    @Test
    void latest_listsInsertedWordsAfterTheSentenceWordsWithoutAPosition() throws Exception {
        UUID sentence = sentence("l1b", "Their cat sleeps over there.");
        UUID user = data.newUser();
        submit(user, sentence, "{\"level\":\"hard\",\"typedText\":\"their cat very sleeps over there\"}");

        latest(user, sentence).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.words.length()").value(6))
                .andExpect(jsonPath("$.data.words[5].outcome").value("inserted"))
                .andExpect(jsonPath("$.data.words[5].actualWord").value("very"))
                .andExpect(jsonPath("$.data.words[5].position").doesNotExist())
                .andExpect(jsonPath("$.data.words[5].wordClass").doesNotExist())
                .andExpect(jsonPath("$.data.words[5].homophone").value(false));
    }

    @Test
    void latest_forEasyReturnsTheBlankWordsAndTheWholeSentenceTokens() throws Exception {
        UUID sentence = sentence("l2", "I'd like a large iced latte.");
        UUID user = data.newUser();
        String submitted = submit(user, sentence,
                "{\"level\":\"easy\",\"blankPositions\":[1,4],\"blanks\":{\"1\":\"like\",\"4\":\"ice\"}}");

        String fetched = latest(user, sentence).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.level").value("easy"))
                .andExpect(jsonPath("$.data.words.length()").value(2))
                .andExpect(jsonPath("$.data.tokens.length()").value(6))
                .andExpect(jsonPath("$.data.tokens[1].position").value(1))
                .andExpect(jsonPath("$.data.tokens[1].display").value("like"))
                .andExpect(jsonPath("$.data.tokens[5].display").value("latte."))
                .andReturn().getResponse().getContentAsString();

        assertThat((Object) JsonPath.read(fetched, "$.data")).isEqualTo(JsonPath.read(submitted, "$.data"));
    }

    @Test
    void submit_forNormalAndHardHasNoTokens() throws Exception {
        UUID sentence = sentence("l3", "Could I get that to go?");
        String body = submit(data.newUser(), sentence, "{\"level\":\"normal\",\"typedText\":\"could i\"}");

        assertThat((java.util.List<?>) JsonPath.read(body, "$.data.tokens")).isEmpty();
    }

    @Test
    void latest_isTheNewestAttemptAndKeepsRetryAndGaveUpFlags() throws Exception {
        UUID sentence = sentence("l4", "Could I get that to go?");
        UUID user = data.newUser();
        submit(user, sentence, "{\"level\":\"normal\",\"typedText\":\"could i get that to go\"}");
        submit(user, sentence, "{\"level\":\"hard\",\"gaveUp\":true,\"retry\":true}");

        latest(user, sentence).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.level").value("hard"))
                .andExpect(jsonPath("$.data.gaveUp").value(true))
                .andExpect(jsonPath("$.data.score").value(0.0))
                .andExpect(jsonPath("$.data.words.length()").value(6))
                .andExpect(jsonPath("$.data.words[0].outcome").value("omitted"));
    }

    @Test
    void latest_withNoAttemptYet_returns404() throws Exception {
        UUID sentence = sentence("l5", "Could I get that to go?");

        latest(data.newUser(), sentence).andExpect(status().isNotFound());
    }

    @Test
    void latest_doesNotShowAnotherUsersAttempt() throws Exception {
        UUID sentence = sentence("l6", "Could I get that to go?");
        submit(data.newUser(), sentence, "{\"level\":\"normal\",\"typedText\":\"could\"}");

        latest(data.newUser(), sentence).andExpect(status().isNotFound());
    }

    @Test
    void latest_blocksProUnknownDraftAndAnonymous() throws Exception {
        UUID free = data.newUser();
        UUID paid = data.newSentence(data.newLesson("lp-" + tag, true, "APPROVED", false), 0, "Could I get that?", "x");
        UUID draft = data.newSentence(data.newLesson("ld-" + tag, false, "DRAFT", false), 0, "Hello there", "x");

        latest(free, paid).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));
        latest(free, UUID.randomUUID()).andExpect(status().isNotFound());
        latest(free, draft).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/dictation/sentences/" + paid + "/attempts/latest"))
                .andExpect(status().isUnauthorized());
    }
}
