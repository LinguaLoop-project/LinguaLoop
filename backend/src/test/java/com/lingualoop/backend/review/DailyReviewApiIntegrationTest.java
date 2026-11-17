package com.lingualoop.backend.review;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.practice.AttemptTestData;
import com.lingualoop.backend.vocab.VocabTestData;

/**
 * Phiên Ôn tập hằng ngày (UC-HT-05) trên Postgres thật: định mức theo mục tiêu ngày (BR-HT-24), cách chọn câu
 * (BR-HT-20) và đánh dấu "đã ôn hôm nay" (BR-HT-21). Mỗi test dùng học viên và bài riêng nên không đụng nhau.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class, AttemptTestData.class, VocabTestData.class})
class DailyReviewApiIntegrationTest {

    private static final String PLAN = "/api/v1/review/daily-plan";

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DictationTestData users;
    @Autowired private AttemptTestData attempts;
    @Autowired private VocabTestData vocab;
    @Autowired private LessonFixtures lessonFixtures;

    private final String base = "zz" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    private int deckSeq;

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + users.tokenFor(user)));
    }

    private UUID student(int dailyMinutes) {
        UUID user = users.newUser();
        jdbc.update("UPDATE users SET daily_minutes = ? WHERE id = ?", dailyMinutes, user);
        return user;
    }

    private UUID sentenceIn(UUID lesson, int order) {
        return users.newSentence(lesson, order, "sentence " + order, "câu " + order);
    }

    private UUID lesson(boolean pro, String status, boolean deleted) {
        return users.newLesson(base, pro, status, deleted);
    }

    /** Đưa câu vào danh sách Câu cần ôn với một lượt cũ có điểm {@code score}; thêm vào {@code addedAgo} trước. */
    private void list(UUID user, UUID sentence, String mode, String score, String addedAgo) {
        long attempt = attempts.insertAttempt(user, sentence, mode, "dictation".equals(mode) ? "normal" : null, false,
                false, Instant.now().minusSeconds(86_400));
        attempts.setScore(attempt, score);
        jdbc.update("INSERT INTO user_sentence_review (user_id, sentence_id, mode, reason, created_at) "
                + "VALUES (?, ?, ?, 'manual', now() - ?::interval)", user, sentence, mode, addedAgo);
    }

    private List<UUID> dueCards(UUID user, int count) {
        String prefix = base + "d" + (++deckSeq);
        List<UUID> cards = vocab.fill(vocab.deck(prefix, false), 1, count, prefix);
        for (UUID card : cards) {
            vocab.progress(user, card, 2, 6, "now() - interval '5 minutes'");
        }
        return cards;
    }

    @Test
    void plan_quotaFollowsTheDailyGoal_AC_HT_36() throws Exception {
        UUID lesson = lesson(false, "published", false);
        List<UUID> sentences = new ArrayList<>();
        for (int i = 0; i < 16; i++) {
            sentences.add(sentenceIn(lesson, i));
        }
        int[][] expected = {{10, 15, 1}, {15, 20, 2}, {20, 30, 2}, {30, 40, 3}};
        for (int[] row : expected) {
            UUID user = student(row[0]);
            dueCards(user, 45);
            for (int i = 0; i < 8; i++) {
                list(user, sentences.get(i), "dictation", "50", "1 hour");
                list(user, sentences.get(8 + i), "shadowing", "50", "1 hour");
            }

            as(user, get(PLAN)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.dailyMinutes").value(row[0]))
                    .andExpect(jsonPath("$.data.cardQuota").value(row[1]))
                    .andExpect(jsonPath("$.data.cardsDue").value(45))
                    .andExpect(jsonPath("$.data.cardsInPlan").value(row[1]))
                    .andExpect(jsonPath("$.data.sentenceQuotaPerMode").value(row[2]))
                    .andExpect(jsonPath("$.data.sentencesPending").value(16))
                    .andExpect(jsonPath("$.data.sentences.length()").value(row[2] * 2))
                    // thứ tự: các câu Nghe chép trước rồi tới Shadowing
                    .andExpect(jsonPath("$.data.sentences[0].mode").value("dictation"))
                    .andExpect(jsonPath("$.data.sentences[" + (row[2] * 2 - 1) + "].mode").value("shadowing"));
        }
    }

    @Test
    void plan_defaultGoalWith35Cards_takesTwentyCardsAndTwoPlusTwoSentences_AC_HT_36() throws Exception {
        UUID user = student(15);
        dueCards(user, 35);
        UUID lesson = lesson(false, "published", false);
        for (int i = 0; i < 5; i++) {
            list(user, sentenceIn(lesson, i), "dictation", "40", "1 hour");
        }
        for (int i = 0; i < 4; i++) {
            list(user, sentenceIn(lesson, 10 + i), "shadowing", "40", "1 hour");
        }

        as(user, get(PLAN)).andExpect(jsonPath("$.data.cardsInPlan").value(20))
                .andExpect(jsonPath("$.data.cardsDue").value(35))
                .andExpect(jsonPath("$.data.sentences.length()").value(4))
                .andExpect(jsonPath("$.data.sentencesPending").value(9));
    }

    @Test
    void plan_picksLowestScoreFirst_thenTheEarlierAddedSentence_BR_HT_20() throws Exception {
        UUID user = student(15);
        UUID lesson = lesson(false, "published", false);
        UUID low = sentenceIn(lesson, 0);
        UUID midOlder = sentenceIn(lesson, 1);
        UUID midNewer = sentenceIn(lesson, 2);
        UUID high = sentenceIn(lesson, 3);
        list(user, high, "dictation", "90", "5 hours");
        list(user, midNewer, "dictation", "60", "1 hour");
        list(user, midOlder, "dictation", "60", "3 hours");
        list(user, low, "dictation", "20", "30 minutes");

        as(user, get(PLAN)).andExpect(jsonPath("$.data.sentences.length()").value(2))
                .andExpect(jsonPath("$.data.sentences[0].sentenceId").value(low.toString()))
                .andExpect(jsonPath("$.data.sentences[1].sentenceId").value(midOlder.toString()));
    }

    @Test
    void plan_aModeWithFewerSentences_isNotToppedUpFromTheOther_BR_HT_20() throws Exception {
        UUID user = student(20);
        UUID lesson = lesson(false, "published", false);
        list(user, sentenceIn(lesson, 0), "dictation", "10", "1 hour");
        for (int i = 1; i <= 5; i++) {
            list(user, sentenceIn(lesson, i), "shadowing", "10", "1 hour");
        }

        as(user, get(PLAN)).andExpect(jsonPath("$.data.sentences.length()").value(3))
                .andExpect(jsonPath("$.data.sentences[0].mode").value("dictation"))
                .andExpect(jsonPath("$.data.sentences[1].mode").value("shadowing"))
                .andExpect(jsonPath("$.data.sentences[2].mode").value("shadowing"));
    }

    @Test
    void plan_leavesOutDraftDeletedAndProSentences_butProLearnersKeepThem_BR_HT_20() throws Exception {
        UUID free = student(15);
        UUID pro = users.newProUser();
        UUID ok = sentenceIn(lesson(false, "published", false), 0);
        UUID draft = sentenceIn(lesson(false, "draft", false), 0);
        UUID deleted = sentenceIn(lesson(false, "published", true), 0);
        UUID proLesson = sentenceIn(lesson(true, "published", false), 0);
        for (UUID user : List.of(free, pro)) {
            list(user, ok, "dictation", "10", "1 hour");
            list(user, draft, "dictation", "20", "1 hour");
            list(user, deleted, "dictation", "30", "1 hour");
            list(user, proLesson, "dictation", "40", "1 hour");
        }

        as(free, get(PLAN)).andExpect(jsonPath("$.data.sentencesPending").value(1))
                .andExpect(jsonPath("$.data.sentences[0].sentenceId").value(ok.toString()));
        as(pro, get(PLAN)).andExpect(jsonPath("$.data.sentencesPending").value(2));
    }

    @Test
    void plan_hidesSentencesReviewedTodayInTheLearnersTimezone_BR_HT_21() throws Exception {
        UUID user = student(15);
        jdbc.update("UPDATE users SET timezone = 'Pacific/Auckland' WHERE id = ?", user);
        UUID lesson = lesson(false, "published", false);
        UUID reviewedToday = sentenceIn(lesson, 0);
        UUID reviewedYesterday = sentenceIn(lesson, 1);
        list(user, reviewedToday, "dictation", "10", "1 hour");
        list(user, reviewedYesterday, "dictation", "20", "1 hour");
        Instant dayStart = Instant.now().atZone(ZoneId.of("Pacific/Auckland")).toLocalDate()
                .atStartOfDay(ZoneId.of("Pacific/Auckland")).toInstant();
        jdbc.update("UPDATE user_sentence_review SET last_reviewed_at = ? WHERE user_id = ? AND sentence_id = ?",
                java.sql.Timestamp.from(dayStart.plusSeconds(60)), user, reviewedToday);
        jdbc.update("UPDATE user_sentence_review SET last_reviewed_at = ? WHERE user_id = ? AND sentence_id = ?",
                java.sql.Timestamp.from(dayStart.minusSeconds(60)), user, reviewedYesterday);

        as(user, get(PLAN)).andExpect(jsonPath("$.data.sentencesPending").value(1))
                .andExpect(jsonPath("$.data.sentences[0].sentenceId").value(reviewedYesterday.toString()));
    }

    // ── Gợi ý việc hôm nay khi không còn gì để ôn ──

    @Test
    void plan_withSomethingToReview_hasNoSuggestions() throws Exception {
        UUID user = student(15);
        dueCards(user, 2);

        as(user, get(PLAN)).andExpect(jsonPath("$.data.cardsInPlan").value(2))
                .andExpect(jsonPath("$.data.suggestions").doesNotExist());
    }

    @Test
    void plan_nothingToReview_suggestsTheNextNewWordsOfTheDeckBeingLearned() throws Exception {
        UUID user = student(15);
        UUID deck = vocab.deck(base + "next", false);
        UUID part1 = vocab.group(deck, 1);
        UUID part2 = vocab.group(deck, 2);
        List<UUID> first = List.of(vocab.card(part1, 1, base + "a"), vocab.card(part1, 2, base + "b"));
        for (int i = 1; i <= 12; i++) {
            vocab.card(part2, i, base + "n" + i);
        }
        for (UUID card : first) {
            vocab.progress(user, card, 2, 6, "now() + interval '3 days'");   // đã học hết phần 1, chưa đến hạn
        }

        as(user, get(PLAN)).andExpect(jsonPath("$.data.cardsInPlan").value(0))
                .andExpect(jsonPath("$.data.suggestions.newWords.deckId").value(deck.toString()))
                .andExpect(jsonPath("$.data.suggestions.newWords.partNumber").value(2))
                .andExpect(jsonPath("$.data.suggestions.newWords.newCards").value(10))
                .andExpect(jsonPath("$.data.suggestions.newWords.continuing").value(true));
    }

    @Test
    void plan_nothingToReview_neverStudied_suggestsAFirstPartToStartWith() throws Exception {
        UUID user = student(15);
        vocab.fill(vocab.deck(base + "start", false), 1, 3, base + "s");

        as(user, get(PLAN)).andExpect(jsonPath("$.data.suggestions.newWords.deckId").isNotEmpty())
                .andExpect(jsonPath("$.data.suggestions.newWords.partNumber").value(1))
                .andExpect(jsonPath("$.data.suggestions.newWords.continuing").value(false));
    }

    @Test
    void plan_nothingToReview_suggestsAnUnpracticedDictationLessonOfTheLowestLevel() throws Exception {
        UUID user = student(15);
        UUID topic = lessonFixtures.topic("Suggest " + base);
        UUID easy = lessonFixtures.lesson(topic, "Easy " + base, false, "published", "A1", 1_000_000, false);
        lessonFixtures.sentence(easy, 0, "Hello there.");
        lessonFixtures.sentence(easy, 1, "How are you.");

        as(user, get(PLAN)).andExpect(jsonPath("$.data.suggestions.dictationLesson.id").value(easy.toString()))
                .andExpect(jsonPath("$.data.suggestions.dictationLesson.cefrLevel").value("A1"))
                .andExpect(jsonPath("$.data.suggestions.dictationLesson.sentenceCount").value(2));

        // luyện nghe chép bài đó rồi thì không gợi ý lại
        UUID sentence = jdbc.queryForObject("SELECT id FROM sentences WHERE lesson_id = ? ORDER BY start_ms LIMIT 1",
                UUID.class, easy);
        attempts.insertAttempt(user, sentence, "dictation", "normal", false, false, Instant.now());
        as(user, get(PLAN)).andExpect(jsonPath("$.data.suggestions.dictationLesson.id").value(
                org.hamcrest.Matchers.not(easy.toString())));
    }

    @Test
    void plan_nothingToReview_skipsProLessonsForFreeLearners() throws Exception {
        UUID free = student(15);
        UUID pro = users.newProUser();
        UUID topic = lessonFixtures.topic("Pro suggest " + base);
        UUID proLesson = lessonFixtures.lesson(topic, "Pro " + base, true, "published", "A1", 2_000_000, false);
        lessonFixtures.sentence(proLesson, 0, "Pro sentence one.");

        as(free, get(PLAN)).andExpect(jsonPath("$.data.suggestions.dictationLesson.id").value(
                org.hamcrest.Matchers.not(proLesson.toString())));
        as(pro, get(PLAN)).andExpect(jsonPath("$.data.suggestions.dictationLesson.id").value(proLesson.toString()));
    }

    @Test
    void plan_carriesWhatThePlayerNeeds() throws Exception {
        UUID user = student(15);
        UUID lesson = lesson(false, "published", false);
        UUID sentence = sentenceIn(lesson, 2);
        list(user, sentence, "shadowing", "55", "1 hour");

        as(user, get(PLAN)).andExpect(jsonPath("$.data.sentences[0].lessonId").value(lesson.toString()))
                .andExpect(jsonPath("$.data.sentences[0].youtubeId").isNotEmpty())
                .andExpect(jsonPath("$.data.sentences[0].startMs").isNumber())
                .andExpect(jsonPath("$.data.sentences[0].endMs").isNumber())
                .andExpect(jsonPath("$.data.sentences[0].text").value("sentence 2"))
                .andExpect(jsonPath("$.data.sentences[0].lastScore").value(55.0));
    }

    @Test
    void plan_nothingToReview_returnsEmptyPlanAndNextDueTime_AC_HT_40() throws Exception {
        UUID user = student(15);
        List<UUID> cards = vocab.fill(vocab.deck(base + "later", false), 1, 2, base + "later");
        vocab.progress(user, cards.get(0), 2, 6, "now() + interval '2 days'");

        as(user, get(PLAN)).andExpect(jsonPath("$.data.cardsDue").value(0))
                .andExpect(jsonPath("$.data.cardsInPlan").value(0))
                .andExpect(jsonPath("$.data.sentences.length()").value(0))
                .andExpect(jsonPath("$.data.sentencesPending").value(0))
                .andExpect(jsonPath("$.data.nextCardDueAt").isNotEmpty());
    }

    @Test
    void sentencePlan_takesTwoPerModeByDefault_andTheNextGroupAfterMarking_BR_HT_20() throws Exception {
        UUID user = student(10);                          // mục tiêu ngày không ảnh hưởng phiên Ôn câu riêng
        UUID lesson = lesson(false, "published", false);
        List<UUID> dictation = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            UUID s = sentenceIn(lesson, i);
            dictation.add(s);
            list(user, s, "dictation", String.valueOf(10 + i), "1 hour");
        }
        UUID shadow = sentenceIn(lesson, 9);
        list(user, shadow, "shadowing", "30", "1 hour");

        as(user, get("/api/v1/review/sentence-plan")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[0].sentenceId").value(dictation.get(0).toString()))
                .andExpect(jsonPath("$.data[1].sentenceId").value(dictation.get(1).toString()))
                .andExpect(jsonPath("$.data[2].sentenceId").value(shadow.toString()));

        attempts.insertAttempt(user, dictation.get(0), "dictation", "normal", true, false, Instant.now());
        as(user, post(reviewed(dictation.get(0), "dictation"))).andExpect(status().isOk());

        as(user, get("/api/v1/review/sentence-plan")).andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[0].sentenceId").value(dictation.get(1).toString()))
                .andExpect(jsonPath("$.data[1].sentenceId").value(dictation.get(2).toString()));
        as(user, get("/api/v1/review/sentence-plan").param("perMode", "1"))
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    void plan_withoutToken_returns401() throws Exception {
        mockMvc.perform(get(PLAN)).andExpect(status().isUnauthorized());
    }

    // ── Đánh dấu "đã ôn hôm nay" ──

    private String reviewed(UUID sentence, String mode) {
        return "/api/v1/review/" + mode + "/sentences/" + sentence + "/reviewed";
    }

    @Test
    void markReviewed_afterARealAttempt_removesTheSentenceFromTheNextPlan_AC_HT_38() throws Exception {
        UUID user = student(15);
        UUID lesson = lesson(false, "published", false);
        UUID sentence = sentenceIn(lesson, 0);
        UUID other = sentenceIn(lesson, 1);
        list(user, sentence, "dictation", "10", "2 hours");
        list(user, other, "dictation", "30", "2 hours");
        long attempt = attempts.insertAttempt(user, sentence, "dictation", "normal", true, false, Instant.now());
        attempts.setScore(attempt, "85");

        as(user, post(reviewed(sentence, "dictation"))).andExpect(status().isOk());
        as(user, post(reviewed(sentence, "dictation"))).andExpect(status().isOk());   // gọi lại không đổi gì

        as(user, get(PLAN)).andExpect(jsonPath("$.data.sentencesPending").value(1))
                .andExpect(jsonPath("$.data.sentences[0].sentenceId").value(other.toString()));
        Long marked = jdbc.queryForObject("SELECT count(*) FROM user_sentence_review "
                + "WHERE user_id = ? AND last_reviewed_at IS NOT NULL", Long.class, user);
        org.assertj.core.api.Assertions.assertThat(marked).isEqualTo(1);
    }

    @Test
    void markReviewed_withoutARecentAttempt_isRefusedAndNothingIsMarked_BR_HT_21() throws Exception {
        UUID user = student(15);
        UUID sentence = sentenceIn(lesson(false, "published", false), 0);
        list(user, sentence, "dictation", "10", "2 hours");     // lượt của list() đã cũ hơn 1 giờ

        as(user, post(reviewed(sentence, "dictation"))).andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PRACTICE_SENTENCE_NOT_PRACTICED"));
        as(user, get(PLAN)).andExpect(jsonPath("$.data.sentencesPending").value(1));
    }

    @Test
    void markReviewed_aGaveUpAttemptDoesNotCount_BR_HT_21() throws Exception {
        UUID user = student(15);
        UUID sentence = sentenceIn(lesson(false, "published", false), 0);
        list(user, sentence, "dictation", "10", "2 hours");
        attempts.insertAttempt(user, sentence, "dictation", "normal", true, true, Instant.now());

        as(user, post(reviewed(sentence, "dictation"))).andExpect(status().isUnprocessableEntity());
    }

    @Test
    void markReviewed_sentenceNotInTheList_orInTheOtherMode_returns404() throws Exception {
        UUID user = student(15);
        UUID sentence = sentenceIn(lesson(false, "published", false), 0);
        list(user, sentence, "dictation", "10", "2 hours");
        attempts.insertAttempt(user, sentence, "shadowing", null, false, false, Instant.now());

        as(user, post(reviewed(sentence, "shadowing"))).andExpect(status().isNotFound());
        as(users.newUser(), post(reviewed(sentence, "dictation"))).andExpect(status().isNotFound());
    }

    @Test
    void markReviewed_withoutToken_returns401() throws Exception {
        mockMvc.perform(post(reviewed(UUID.randomUUID(), "dictation"))).andExpect(status().isUnauthorized());
    }
}
