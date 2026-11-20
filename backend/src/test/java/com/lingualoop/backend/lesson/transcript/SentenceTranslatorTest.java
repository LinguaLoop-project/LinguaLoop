package com.lingualoop.backend.lesson.transcript;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.ai.GeminiJsonClient;
import com.lingualoop.backend.ai.GeminiJsonClient.Request;
import com.lingualoop.backend.ai.GeminiJsonClient.Result;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.LessonImportProperties;
import com.lingualoop.backend.lesson.transcript.SentenceTranslator.Outcome;
import com.lingualoop.backend.lesson.transcript.SentenceTranslator.Translation;

/** Gợi ý dịch theo lô (UC-BH-10); Gemini là bản giả. */
class SentenceTranslatorTest {

    private static final Pattern ID = Pattern.compile("\"id\":(\\d+)");
    private static final List<String> SENTENCES = List.of("One.", "Two.", "Three.");

    private final List<Request> requests = new ArrayList<>();

    /** Lô 2 câu để 3 câu thành 2 lần gọi. */
    private SentenceTranslator translator(Function<Request, String> reply) {
        GeminiJsonClient gemini = request -> {
            requests.add(request);
            return new Result(reply.apply(request), 200, 50);
        };
        return new SentenceTranslator(gemini, LessonImportProperties.withBatchSize(2));
    }

    /** Dịch mọi id có trong phần INPUT của prompt thành "vi-<id>". */
    private static String echo(Request request) {
        String input = request.prompt().substring(request.prompt().indexOf("INPUT:"));
        Matcher m = ID.matcher(input);
        List<String> items = new ArrayList<>();
        while (m.find()) {
            items.add("{\"id\":" + m.group(1) + ",\"vi\":\"vi-" + m.group(1) + "\"}");
        }
        return "{\"items\":[" + String.join(",", items) + "]}";
    }

    @Test
    void translates_every_batch_with_previous_translations_as_context() {
        Translation t = translator(SentenceTranslatorTest::echo).translate(SENTENCES);

        assertThat(t.translations()).containsExactly("vi-0", "vi-1", "vi-2");
        assertThat(t.outcome()).isEqualTo(Outcome.COMPLETE);
        assertThat(requests).hasSize(2);
        // lô sau mang theo bản dịch của lô trước để xưng hô nhất quán
        assertThat(requests.get(1).prompt()).contains("Two. => vi-1");
    }

    @Test
    void gemini_error_stops_and_keeps_the_translated_part() {
        int[] calls = {0};
        SentenceTranslator translator = translator(r -> {
            if (calls[0]++ == 1) {
                throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
            }
            return echo(r);
        });

        Translation t = translator.translate(SENTENCES);

        assertThat(t.translations()).containsExactly("vi-0", "vi-1", null);
        assertThat(t.outcome()).isEqualTo(Outcome.AI_FAILED);
    }

    @Test
    void batches_after_a_fallback_answer_go_straight_to_the_fallback_model() {
        List<Request> sent = new ArrayList<>();
        GeminiJsonClient gemini = request -> {
            sent.add(request);
            // lô đầu: model chính quá tải, model dự phòng trả lời
            return new Result(echo(request), 200, 50, sent.size() == 1);
        };
        SentenceTranslator translator = new SentenceTranslator(gemini, LessonImportProperties.withBatchSize(1));

        Translation t = translator.translate(SENTENCES);

        assertThat(t.outcome()).isEqualTo(Outcome.COMPLETE);
        assertThat(sent).extracting(Request::preferFallback).containsExactly(false, true, false);
    }

    @Test
    void sends_the_configured_thinking_level() {
        translator(SentenceTranslatorTest::echo).translate(SENTENCES);

        assertThat(requests).extracting(Request::thinkingLevel).containsOnly("LOW");
    }

    @Test
    void unreadable_reply_is_a_system_error() {
        Translation t = translator(r -> "not json").translate(SENTENCES);

        assertThat(t.outcome()).isEqualTo(Outcome.AI_FAILED);
        assertThat(t.translations()).containsOnlyNulls();
    }

    @Test
    void reply_wrapped_in_markdown_fence_is_read() {
        Translation t = translator(r -> "```json\n" + echo(r) + "\n```").translate(SENTENCES);

        assertThat(t.translations()).containsExactly("vi-0", "vi-1", "vi-2");
    }
}
