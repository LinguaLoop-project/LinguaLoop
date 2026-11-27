package com.lingualoop.backend.lesson.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.lesson.dto.ShowcaseView;
import com.lingualoop.backend.lesson.repository.ShowcaseRepository;
import com.lingualoop.backend.lesson.service.LessonShowcaseService;

/** Bài học giới thiệu trên trang chủ công khai (BR-TC-20) trên Postgres thật. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class PublicLessonShowcaseIntegrationTest {

    private static final String URL = "/api/v1/public/lessons/showcase";

    @Autowired private MockMvc mockMvc;
    @Autowired private LessonFixtures fixtures;
    @Autowired private ShowcaseRepository repository;
    @Autowired private CacheManager cacheManager;
    @Autowired private JdbcTemplate jdbc;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    @BeforeEach
    void clearCache() {
        cacheManager.getCache(LessonShowcaseService.CACHE).clear();
    }

    @Test
    void guestWithoutToken_getsOnlyVisibleLessonsWithCardFields_atMostThreePerLevel_AC_TC_44() throws Exception {
        UUID topic = fixtures.topic("showcase " + tag);
        UUID shown = fixtures.publishedLesson(topic, tag + " shown");
        fixtures.sentence(shown, 0, "Hello there.");

        String body = mockMvc.perform(get(URL))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=600, public"))
                .andReturn().getResponse().getContentAsString();

        List<Map<String, Object>> lessons = JsonPath.read(body, "$.data.lessons");
        assertThat(lessons).isNotEmpty();
        // Chỉ thông tin của thẻ bài: không có lời thoại hay trạng thái của học viên
        assertThat(lessons.get(0).keySet()).containsExactlyInAnyOrder("id", "title", "youtubeId", "durationSec",
                "cefrLevel", "topicName", "sentenceCount", "pro");
        for (Map<String, Object> lesson : lessons) {
            UUID id = UUID.fromString((String) lesson.get("id"));
            assertThat(jdbc.queryForObject("""
                    SELECT count(*) FROM lessons l WHERE l.id = ? AND l.kind = 'library' AND l.status = 'published'
                      AND l.deleted_at IS NULL
                      AND EXISTS (SELECT 1 FROM sentences s WHERE s.lesson_id = l.id AND s.deleted_at IS NULL)""",
                    Integer.class, id)).as("bài %s phải đang hiển thị", id).isEqualTo(1);
        }
        Map<Object, Long> perLevel = lessons.stream()
                .collect(Collectors.groupingBy(l -> l.get("cefrLevel"), Collectors.counting()));
        assertThat(perLevel.values()).allMatch(n -> n <= LessonShowcaseService.PER_LEVEL);
        List<String> topics = JsonPath.read(body, "$.data.topics");
        assertThat(topics).hasSizeLessThanOrEqualTo(LessonShowcaseService.TOPICS);
    }

    @Test
    void hidesDraftDeletedPersonalAndSilentLessons_andTopicsWithoutVisibleLessons_AC_TC_44() {
        UUID topic = fixtures.topic("showcase " + tag);
        UUID shown = fixtures.publishedLesson(topic, tag + " shown");
        fixtures.sentence(shown, 0, "Hello there.");
        fixtures.sentence(shown, 1, "Second line.");
        UUID draft = fixtures.lesson(topic, tag + " draft", false, "draft", "A1", 0, false);
        fixtures.sentence(draft, 0, "x");
        UUID deleted = fixtures.lesson(topic, tag + " deleted", false, "published", "A1", 0, true);
        fixtures.sentence(deleted, 0, "x");
        UUID personal = fixtures.publishedLesson(topic, tag + " personal");
        jdbc.update("UPDATE lessons SET kind = 'personal' WHERE id = ?", personal);
        fixtures.sentence(personal, 0, "x");
        UUID silent = fixtures.publishedLesson(topic, tag + " silent");
        UUID hiddenTopic = fixtures.topic("showcase hidden " + tag);
        fixtures.sentence(fixtures.lesson(hiddenTopic, tag + " only draft", false, "draft", "B1", 0, false), 0, "x");

        // Lấy đủ mọi bài để kiểm tra điều kiện lọc, không phụ thuộc cách chọn ngẫu nhiên theo ngày
        List<ShowcaseView.Lesson> all = repository.lessons("any", 100_000);
        List<UUID> ids = all.stream().map(ShowcaseView.Lesson::id).toList();

        assertThat(ids).contains(shown).doesNotContain(draft, deleted, personal, silent);
        ShowcaseView.Lesson card = all.get(ids.indexOf(shown));
        assertThat(card.sentenceCount()).isEqualTo(2);
        assertThat(card.topicName()).isEqualTo("showcase " + tag);
        assertThat(repository.topics(100_000)).contains("showcase " + tag).doesNotContain("showcase hidden " + tag);
    }

    @Test
    void sameSeedKeepsTheSamePick_andAtMostThreePerLevel_AC_TC_44() {
        UUID topic = fixtures.topic("showcase " + tag);
        for (int i = 0; i < 5; i++) {
            fixtures.sentence(fixtures.publishedLesson(topic, tag + " l" + i), 0, "Line " + i);
        }

        List<ShowcaseView.Lesson> first = repository.lessons("2026-11-27", LessonShowcaseService.PER_LEVEL);
        assertThat(repository.lessons("2026-11-27", LessonShowcaseService.PER_LEVEL)).isEqualTo(first);
        assertThat(first.stream().collect(Collectors.groupingBy(ShowcaseView.Lesson::cefrLevel, Collectors.counting()))
                .values()).allMatch(n -> n <= LessonShowcaseService.PER_LEVEL);
    }

    @Test
    void onlyReadingIsPublic_AC_TC_44() throws Exception {
        mockMvc.perform(post(URL)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/lessons")).andExpect(status().isUnauthorized());
    }
}
