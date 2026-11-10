package com.lingualoop.backend.lesson.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.lesson.dto.LessonView;
import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.user.service.UserAccountService;

/** Hợp đồng đọc bài/câu mà feature dictation và shadowing dùng (planning/README.md §4). */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class SentenceQueryServiceIntegrationTest {

    @Autowired private SentenceQueryService sentenceQueryService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private LessonFixtures fixtures;
    @Autowired private JdbcTemplate jdbc;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    @Test
    void findLesson_returnsPublishedLessonAndHidesOthers_AC_LESSON_11() {
        UUID published = lesson("published", false, "published");
        UUID draft = lesson("draft", false, "draft");

        LessonView view = sentenceQueryService.findLesson(published).orElseThrow();
        assertThat(view.title()).isEqualTo(tag + " published");
        assertThat(view.cefrLevel()).isEqualTo("B1");
        assertThat(view.youtubeId()).hasSize(11);
        assertThat(view.pro()).isFalse();
        assertThat(sentenceQueryService.findLesson(draft)).isEmpty();
        assertThat(sentenceQueryService.findLesson(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findLesson_hidesSoftDeletedLesson_AC_LESSON_11() {
        UUID deleted = lesson("deleted", false, "published");
        assertThat(sentenceQueryService.findLesson(deleted)).isPresent();

        jdbc.update("UPDATE lessons SET deleted_at = now() WHERE id = ?", deleted);

        assertThat(sentenceQueryService.findLesson(deleted)).isEmpty();
    }

    @Test
    void findSentences_returnsSentencesInTimeOrderAndFindSentenceMapsPosition_AC_LESSON_11() {
        UUID lesson = lesson("sentences", false, "published");
        UUID second = fixtures.sentence(lesson, 1, "second");
        fixtures.sentence(lesson, 0, "first");
        UUID removed = fixtures.sentence(lesson, 2, "removed");
        jdbc.update("UPDATE sentences SET deleted_at = now() WHERE id = ?", removed);

        List<SentenceView> list = sentenceQueryService.findSentences(lesson);

        assertThat(list).extracting(SentenceView::text).containsExactly("first", "second");
        assertThat(list).extracting(SentenceView::sortOrder).containsExactly(1, 2);
        assertThat(list.get(0).lessonId()).isEqualTo(lesson);

        SentenceView one = sentenceQueryService.findSentence(second).orElseThrow();
        assertThat(one.text()).isEqualTo("second");
        assertThat(one.lessonId()).isEqualTo(lesson);
        assertThat(one.sortOrder()).isEqualTo(2);
        assertThat(sentenceQueryService.findSentence(removed)).isEmpty();
        assertThat(sentenceQueryService.findSentence(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findSentence_ofDraftLesson_isHidden_AC_LESSON_11() {
        UUID draft = lesson("hidden", false, "draft");
        UUID sentence = fixtures.sentence(draft, 0, "x");

        assertThat(sentenceQueryService.findSentence(sentence)).isEmpty();
    }

    @Test
    void assertCanPractice_checksVisibilityAndProPlan_AC_LESSON_12() {
        UUID free = userAccountService.createLocal("p-" + UUID.randomUUID() + "@x.com", "A", "h").id();
        UUID pro = userAccountService.createLocal("p-" + UUID.randomUUID() + "@x.com", "B", "h").id();
        fixtures.grantPro(pro);
        UUID open = lesson("open", false, "published");
        UUID paid = lesson("paid", true, "published");
        UUID draft = lesson("draft2", false, "draft");

        assertThatCode(() -> sentenceQueryService.assertCanPractice(free, open)).doesNotThrowAnyException();
        assertThatCode(() -> sentenceQueryService.assertCanPractice(pro, paid)).doesNotThrowAnyException();
        assertThatThrownBy(() -> sentenceQueryService.assertCanPractice(free, paid))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.LESSON_PRO_REQUIRED));
        assertThatThrownBy(() -> sentenceQueryService.assertCanPractice(pro, draft))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
    }

    private UUID lesson(String name, boolean pro, String status) {
        UUID topic = fixtures.topic(name + " topic " + tag);
        return fixtures.lesson(topic, tag + " " + name, pro, status, "B1", 0, false);
    }
}
