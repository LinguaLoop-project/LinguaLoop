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

/** Lịch sử lượt làm của một câu: mọi lượt, mới nhất trước, mở lại được kết quả từng từ của từng lượt. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class})
class DictationAttemptHistoryIntegrationTest {

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

    private UUID sentence(String name) {
        return data.newSentence(data.newLesson(name + "-" + tag, false, "APPROVED", false), 0,
                "Their cat sleeps over there.", "Bản dịch");
    }

    @Test
    void history_listsEveryAttemptNewestFirst_withRetryAndGaveUpFlags() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("h1");
        submit(user, sentence, "{\"level\":\"hard\",\"typedText\":\"their cat\"}");
        submit(user, sentence, "{\"level\":\"normal\",\"typedText\":\"their cat sleeps over there\",\"retry\":true}");
        submit(user, sentence, "{\"level\":\"hard\",\"gaveUp\":true}");

        as(user, get("/api/v1/dictation/sentences/" + sentence + "/attempts")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[0].gaveUp").value(true))
                .andExpect(jsonPath("$.data[0].score").value(0.0))
                .andExpect(jsonPath("$.data[1].retry").value(true))
                .andExpect(jsonPath("$.data[1].level").value("normal"))
                .andExpect(jsonPath("$.data[1].score").value(100.0))
                .andExpect(jsonPath("$.data[2].gaveUp").value(false))
                .andExpect(jsonPath("$.data[2].retry").value(false));
    }

    @Test
    void history_isEmptyForASentenceTheUserNeverDid() throws Exception {
        as(data.newUser(), get("/api/v1/dictation/sentences/" + sentence("h2") + "/attempts"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void attempt_returnsTheSameResultAsTheSubmitResponse_notOnlyTheLatest() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("h3");
        String first = submit(user, sentence, "{\"level\":\"hard\",\"typedText\":\"there cat sleep over their\"}");
        submit(user, sentence, "{\"level\":\"hard\",\"typedText\":\"their cat sleeps over there\"}");
        long firstId = ((Number) JsonPath.read(first, "$.data.attemptId")).longValue();

        String fetched = as(user, get("/api/v1/dictation/sentences/" + sentence + "/attempts/" + firstId))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        assertThat((Object) JsonPath.read(fetched, "$.data")).isEqualTo(JsonPath.read(first, "$.data"));
    }

    @Test
    void attempt_isNotFoundForAnotherUsersAttemptOrAnotherSentence() throws Exception {
        UUID owner = data.newUser();
        UUID other = data.newUser();
        UUID sentence = sentence("h4");
        UUID elsewhere = sentence("h4b");
        String submitted = submit(owner, sentence, "{\"level\":\"hard\",\"typedText\":\"their cat\"}");
        long id = ((Number) JsonPath.read(submitted, "$.data.attemptId")).longValue();

        as(other, get("/api/v1/dictation/sentences/" + sentence + "/attempts/" + id))
                .andExpect(status().isNotFound());
        as(owner, get("/api/v1/dictation/sentences/" + elsewhere + "/attempts/" + id))
                .andExpect(status().isNotFound());
        as(owner, get("/api/v1/dictation/sentences/" + sentence + "/attempts/999999999"))
                .andExpect(status().isNotFound());
    }
}
