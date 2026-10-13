package com.lingualoop.backend.lesson;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.dto.LessonView;
import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.Sentence;
import com.lingualoop.backend.lesson.entity.Topic;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import com.lingualoop.backend.lesson.enums.LessonStatus;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.lesson.repository.TopicRepository;
import com.lingualoop.backend.lesson.service.SentenceQueryService;
import com.lingualoop.backend.user.service.UserAccountService;

/** Hợp đồng đọc bài/câu mà feature dictation và shadowing dùng (planning/README.md §4). */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class SentenceQueryServiceIntegrationTest {

    @Autowired private SentenceQueryService sentenceQueryService;
    @Autowired private TopicRepository topics;
    @Autowired private LessonRepository lessons;
    @Autowired private SentenceRepository sentences;
    @Autowired private UserAccountService userAccountService;
    @Autowired private JdbcTemplate jdbc;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    @Test
    void findLesson_returnsApprovedLessonAndHidesOthers_AC_LESSON_11() {
        Lesson approved = lesson("approved", false, LessonStatus.APPROVED);
        Lesson draft = lesson("draft", false, LessonStatus.DRAFT);

        LessonView view = sentenceQueryService.findLesson(approved.getId()).orElseThrow();
        assertThat(view.slug()).isEqualTo(approved.getSlug());
        assertThat(view.difficulty()).isEqualTo("B1");
        assertThat(view.sourceType()).isEqualTo("youtube");
        assertThat(view.pro()).isFalse();
        assertThat(sentenceQueryService.findLesson(draft.getId())).isEmpty();
        assertThat(sentenceQueryService.findLesson(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findLessonBySlug_hidesSoftDeletedLesson_AC_LESSON_11() {
        Lesson deleted = lesson("deleted", false, LessonStatus.APPROVED);
        assertThat(sentenceQueryService.findLessonBySlug(deleted.getSlug())).isPresent();

        deleted.setDeletedAt(Instant.now());
        lessons.save(deleted);

        assertThat(sentenceQueryService.findLessonBySlug(deleted.getSlug())).isEmpty();
    }

    @Test
    void findSentences_returnsSentencesInOrderAndFindSentenceByIdMapsLessonId_AC_LESSON_11() {
        Lesson lesson = lesson("sentences", false, LessonStatus.APPROVED);
        Sentence second = sentence(lesson, 1, "second");
        sentence(lesson, 0, "first");

        List<SentenceView> list = sentenceQueryService.findSentences(lesson.getId());

        assertThat(list).extracting(SentenceView::text).containsExactly("first", "second");
        assertThat(list.get(0).lessonId()).isEqualTo(lesson.getId());
        assertThat(list.get(0).cefrLevel()).isEqualTo("A1");

        SentenceView one = sentenceQueryService.findSentence(second.getId()).orElseThrow();
        assertThat(one.text()).isEqualTo("second");
        assertThat(one.lessonId()).isEqualTo(lesson.getId());
        assertThat(one.sortOrder()).isEqualTo(1);
        assertThat(sentenceQueryService.findSentence(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findSentence_ofUnapprovedLesson_isHidden_AC_LESSON_11() {
        Lesson draft = lesson("hidden", false, LessonStatus.DRAFT);
        Sentence s = sentence(draft, 0, "x");

        assertThat(sentenceQueryService.findSentence(s.getId())).isEmpty();
    }

    @Test
    void assertCanPractice_checksVisibilityAndProPlan_AC_LESSON_12() {
        UUID free = userAccountService.createLocal("p-" + UUID.randomUUID() + "@x.com", "A", "h").id();
        UUID pro = userAccountService.createLocal("p-" + UUID.randomUUID() + "@x.com", "B", "h").id();
        jdbc.update("INSERT INTO user_subscriptions (user_id, status, expires_at) "
                + "VALUES (?, 'active', now() + interval '10 days')", pro);
        Lesson open = lesson("open", false, LessonStatus.APPROVED);
        Lesson paid = lesson("paid", true, LessonStatus.APPROVED);
        Lesson draft = lesson("draft2", false, LessonStatus.DRAFT);

        assertThatCode(() -> sentenceQueryService.assertCanPractice(free, open.getId())).doesNotThrowAnyException();
        assertThatCode(() -> sentenceQueryService.assertCanPractice(pro, paid.getId())).doesNotThrowAnyException();
        assertThatThrownBy(() -> sentenceQueryService.assertCanPractice(free, paid.getId()))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.LESSON_PRO_REQUIRED));
        assertThatThrownBy(() -> sentenceQueryService.assertCanPractice(pro, draft.getId()))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
    }

    private Lesson lesson(String name, boolean pro, LessonStatus status) {
        Topic topic = new Topic();
        topic.setSlug(name + "-t-" + tag);
        topic.setName(name + " topic");
        topic = topics.save(topic);

        Lesson l = new Lesson();
        l.setTopic(topic);
        l.setSlug(name + "-" + tag);
        l.setTitle(name + " " + tag);
        l.setDifficulty(CefrLevel.B1);
        l.setPro(pro);
        l.setStatus(status);
        return lessons.save(l);
    }

    private Sentence sentence(Lesson lesson, int order, String text) {
        Sentence s = new Sentence();
        s.setLesson(lesson);
        s.setSortOrder(order);
        s.setText(text);
        s.setStartMs(order * 1000);
        s.setEndMs(order * 1000 + 900);
        s.setCefrLevel(CefrLevel.A1);
        return sentences.save(s);
    }
}
