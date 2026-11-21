package com.lingualoop.backend.aichat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.lingualoop.backend.ai.GeminiJsonClient;
import com.lingualoop.backend.ai.GeminiJsonClient.Request;
import com.lingualoop.backend.ai.GeminiJsonClient.Result;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.GeminiProperties;

/** Đọc kết quả JSON của Gemini cho gia sư AI (UC-AI-01) và dựng yêu cầu kèm lời thoại. */
class GeminiLessonChatAiTest {

    private static final LessonChatAi.Lesson LESSON = new LessonChatAi.Lesson("Morning", "B1", "I woke up early.");
    private static final List<LessonChatAi.Line> HISTORY = List.of(new LessonChatAi.Line(true, "Who is talking?"));

    private final GeminiJsonClient gemini = mock(GeminiJsonClient.class);
    private final GeminiLessonChatAi ai = new GeminiLessonChatAi(gemini,
            new GeminiProperties("key", "model", "", Duration.ofSeconds(20)));

    @Test
    void reply_readsFeedbackAndNextQuestionAndReportsTokens_AC_AI_02() {
        when(gemini.generate(any())).thenReturn(new Result("""
                ```json
                {"heard": true, "transcript": "ignored for typed", "feedback": "Tốt lắm.", "better": "A man is talking.",
                 "nextQuestion": "Where is he?"}
                ```""", 120, 45));

        var generated = ai.reply(LESSON, HISTORY, "A man talk.", false);

        assertThat(generated.value().feedback()).isEqualTo("Tốt lắm.");
        assertThat(generated.value().nextQuestion()).isEqualTo("Where is he?");
        assertThat(generated.inputTokens()).isEqualTo(120);
        assertThat(generated.outputTokens()).isEqualTo(45);
    }

    @Test
    void reply_onTheLastTurnNeedsNoNextQuestion_AC_AI_05() {
        when(gemini.generate(any())).thenReturn(new Result("{\"feedback\": \"Xong.\", \"better\": \"\"}", 10, 2));

        var generated = ai.reply(LESSON, HISTORY, "Fine.", true);

        assertThat(generated.value().nextQuestion()).isEmpty();
    }

    @Test
    void reply_failsWhenThereIsNoNextQuestionBeforeTheLastTurn_AC_AI_11() {
        when(gemini.generate(any())).thenReturn(new Result("{\"feedback\": \"Ok.\"}", 10, 2));

        assertThatThrownBy(() -> ai.reply(LESSON, HISTORY, "Fine.", false))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AI_FEEDBACK_UNAVAILABLE));
    }

    @Test
    void malformedJson_failsInsteadOfStoringGarbage_AC_AI_11() {
        when(gemini.generate(any())).thenReturn(new Result("not json at all", 10, 2));

        assertThatThrownBy(() -> ai.open(LESSON)).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> ai.hint(LESSON, HISTORY)).isInstanceOf(BusinessException.class);
    }

    @Test
    void longTranscript_isClippedBeforeSending_AC_AI_01() {
        when(gemini.generate(any())).thenReturn(new Result("{\"question\": \"Q?\"}", 10, 2));
        var huge = new LessonChatAi.Lesson("Long", "B2", "x".repeat(LessonChatPrompts.MAX_TRANSCRIPT_CHARS + 5000));

        assertThat(ai.open(huge).value()).isEqualTo("Q?");

        ArgumentCaptor<Request> request = ArgumentCaptor.forClass(Request.class);
        verify(gemini).generate(request.capture());
        assertThat(request.getValue().systemInstruction().length())
                .isLessThan(LessonChatPrompts.MAX_TRANSCRIPT_CHARS + 2000);
    }
}
