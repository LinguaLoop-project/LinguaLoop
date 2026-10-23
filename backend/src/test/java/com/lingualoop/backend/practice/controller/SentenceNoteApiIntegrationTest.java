package com.lingualoop.backend.practice.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;

/** Ghi chú câu: mỗi người một ghi chú cho một câu, chỉ ghi chú được câu đã làm, tối đa 1000 ký tự. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class})
class SentenceNoteApiIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private DictationTestData data;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user)));
    }

    private ResultActions saveNote(UUID user, UUID sentence, String content) throws Exception {
        return as(user, put("/api/v1/sentences/" + sentence + "/note").contentType(MediaType.APPLICATION_JSON)
                .content("{\"content\":\"" + content + "\"}"));
    }

    private void practice(UUID user, UUID sentence) throws Exception {
        as(user, post("/api/v1/dictation/sentences/" + sentence + "/attempts")
                .contentType(MediaType.APPLICATION_JSON).content("{\"level\":\"hard\",\"typedText\":\"hello\"}"))
                .andExpect(status().isOk());
    }

    private UUID sentence(String slug) {
        return data.newSentence(data.newLesson(slug + "-" + tag, false, "APPROVED", false), 0, "Hello there.", "Xin chào");
    }

    @Test
    void save_requiresAnAttemptOnTheSentence() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("n1");

        saveNote(user, sentence, "nghe chưa rõ").andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PRACTICE_SENTENCE_NOT_PRACTICED"));
    }

    @Test
    void save_twiceKeepsASingleNote_withTheLatestContent() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("n2");
        practice(user, sentence);

        saveNote(user, sentence, "lần một").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value("lần một"));
        saveNote(user, sentence, "lần hai").andExpect(status().isOk());

        as(user, get("/api/v1/sentences/" + sentence + "/note")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value("lần hai"));
        as(user, get("/api/v1/notes")).andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void get_returnsNullWhenThereIsNoNote() throws Exception {
        UUID user = data.newUser();

        as(user, get("/api/v1/sentences/" + sentence("n3") + "/note")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void delete_removesTheNote_andIsIdempotent() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("n4");
        practice(user, sentence);
        saveNote(user, sentence, "xoá tôi").andExpect(status().isOk());

        as(user, delete("/api/v1/sentences/" + sentence + "/note")).andExpect(status().isOk());
        as(user, delete("/api/v1/sentences/" + sentence + "/note")).andExpect(status().isOk());

        as(user, get("/api/v1/notes")).andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void save_rejectsBlankAndTooLongContent_butAcceptsExactlyTheLimit() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("n5");
        practice(user, sentence);

        saveNote(user, sentence, "   ").andExpect(status().isBadRequest());
        saveNote(user, sentence, "a".repeat(1001)).andExpect(status().isBadRequest());
        saveNote(user, sentence, "a".repeat(1000)).andExpect(status().isOk());
    }

    @Test
    void notes_arePrivateToEachUser() throws Exception {
        UUID owner = data.newUser();
        UUID other = data.newUser();
        UUID sentence = sentence("n6");
        practice(owner, sentence);
        practice(other, sentence);
        saveNote(owner, sentence, "của chủ").andExpect(status().isOk());

        as(other, get("/api/v1/sentences/" + sentence + "/note")).andExpect(jsonPath("$.data").doesNotExist());
        as(other, delete("/api/v1/sentences/" + sentence + "/note")).andExpect(status().isOk());
        as(owner, get("/api/v1/sentences/" + sentence + "/note")).andExpect(jsonPath("$.data.content").value("của chủ"));
    }

    @Test
    void list_carriesTheSentenceAndLesson_andFiltersByLessonSlug() throws Exception {
        UUID user = data.newUser();
        UUID first = sentence("n7a");
        UUID second = sentence("n7b");
        practice(user, first);
        practice(user, second);
        saveNote(user, first, "ghi chú a").andExpect(status().isOk());
        saveNote(user, second, "ghi chú b").andExpect(status().isOk());

        as(user, get("/api/v1/notes")).andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].content").value("ghi chú b"))
                .andExpect(jsonPath("$.data[0].text").value("Hello there."));
        as(user, get("/api/v1/notes").param("lessonSlug", "n7a-" + tag))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].sentenceId").value(first.toString()))
                .andExpect(jsonPath("$.data[0].lessonSlug").value("n7a-" + tag));
    }

    @Test
    void lessonResponse_carriesTheNoteOfEachSentence() throws Exception {
        UUID user = data.newUser();
        UUID lesson = data.newLesson("n8-" + tag, false, "APPROVED", false);
        UUID noted = data.newSentence(lesson, 0, "Hello there.", "Xin chào");
        data.newSentence(lesson, 1, "Hello there.", "Xin chào");
        practice(user, noted);
        saveNote(user, noted, "nhớ cách nối âm").andExpect(status().isOk());

        as(user, get("/api/v1/dictation/lessons/n8-" + tag))
                .andExpect(jsonPath("$.data.sentences[0].note").value("nhớ cách nối âm"))
                .andExpect(jsonPath("$.data.sentences[1].note").doesNotExist());
    }
}
