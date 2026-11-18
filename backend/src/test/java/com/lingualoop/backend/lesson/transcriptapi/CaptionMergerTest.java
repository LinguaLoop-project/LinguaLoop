package com.lingualoop.backend.lesson.transcriptapi;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.lesson.transcript.TranscriptSegment;
import com.lingualoop.backend.lesson.transcriptapi.TranscriptApiResponse.Caption;

class CaptionMergerTest {

    private static Caption c(String text, double start, double duration) {
        return new Caption(text, start, duration);
    }

    @Test
    void joins_caption_lines_into_sentences_at_punctuation() {
        List<TranscriptSegment> out = CaptionMerger.merge(List.of(
                c("Welcome to the airport.", 0.0, 2.0),
                c("Please have your passport", 2.0, 2.0),
                c("ready for check-in.", 4.0, 1.5),
                c("Thank you!", 5.5, 1.0)));

        assertThat(out).extracting(TranscriptSegment::text).containsExactly(
                "Welcome to the airport.", "Please have your passport ready for check-in.", "Thank you!");
        assertThat(out.get(1).startMs()).isEqualTo(2000);
        assertThat(out.get(1).endMs()).isEqualTo(5500);
    }

    @Test
    void sentence_end_inside_a_line_is_cut_with_an_estimated_time() {
        List<TranscriptSegment> out = CaptionMerger.merge(List.of(
                c("Hello everyone.", 0.0, 2.0),
                c("If you liked it, make sure to like and share. Subscribe to our", 2.0, 6.0),
                c("channel for more videos.", 8.0, 2.0)));

        assertThat(out).extracting(TranscriptSegment::text).containsExactly("Hello everyone.",
                "If you liked it, make sure to like and share.", "Subscribe to our channel for more videos.");
        // mốc chỗ cắt chia theo tỉ lệ ký tự: 46/62 của dòng 6 giây bắt đầu ở giây 2
        assertThat(out.get(1).startMs()).isEqualTo(2000);
        assertThat(out.get(1).endMs()).isEqualTo(6452);
        assertThat(out.get(2).startMs()).isEqualTo(6452);
        assertThat(out.get(2).endMs()).isEqualTo(10_000);
    }

    @Test
    void long_punctuated_sentence_is_not_cut_at_twelve_seconds() {
        List<TranscriptSegment> out = CaptionMerger.merge(List.of(
                c("Subscribe to our channel for more fascinating videos like", 272.0, 4.0),
                c("what your sleep schedule reveals about you and four", 276.0, 4.0),
                c("signs your brain is breaking down and how to fix", 280.0, 4.0),
                c("it. Thanks for watching.", 284.0, 3.0)));

        // không cắt ở 12 giây; chỉ cắt ở dấu chấm giữa dòng cuối
        assertThat(out).extracting(TranscriptSegment::text).containsExactly(
                "Subscribe to our channel for more fascinating videos like what your sleep schedule reveals about you "
                        + "and four signs your brain is breaking down and how to fix it.",
                "Thanks for watching.");
        assertThat(out.get(0).startMs()).isEqualTo(272_000);
        assertThat(out.get(0).endMs()).isEqualTo(284_500);
        assertThat(out.get(1).endMs()).isEqualTo(287_000);
    }

    @Test
    void abbreviations_do_not_end_a_sentence() {
        List<TranscriptSegment> out = CaptionMerger.merge(List.of(
                c("Mr. Smith lives in the U.S. now.", 0.0, 3.0),
                c("He likes it.", 3.0, 1.0)));

        assertThat(out).extracting(TranscriptSegment::text).containsExactly(
                "Mr. Smith lives in the U.S. now.", "He likes it.");
    }

    @Test
    void auto_captions_without_punctuation_split_at_pauses_and_max_length() {
        List<TranscriptSegment> out = CaptionMerger.merge(List.of(
                c("so today we are going", 0.0, 2.0),
                c("to talk about travel", 2.0, 2.0),
                // khoảng lặng 3 giây
                c("first you need a ticket", 7.0, 2.0),
                c("and then", 9.0, 2.0), c("you go", 11.0, 2.0), c("to the gate", 13.0, 2.0),
                c("and wait", 15.0, 2.0), c("for the plane", 17.0, 2.0), c("to arrive", 19.0, 2.0)));

        assertThat(out.get(0).text()).isEqualTo("so today we are going to talk about travel");
        assertThat(out.get(0).endMs()).isEqualTo(4000);
        assertThat(out.get(1).startMs()).isEqualTo(7000);
        assertThat(out).allSatisfy(s -> assertThat(s.durationMs()).isLessThanOrEqualTo(CaptionMerger.MAX_SENTENCE_MS));
        assertThat(out).hasSizeGreaterThanOrEqualTo(3);
    }

    @Test
    void overlapping_auto_captions_end_where_next_line_starts() {
        List<TranscriptSegment> out = CaptionMerger.merge(List.of(
                c("Hello there.", 0.0, 3.0),
                c("How are you?", 1.5, 3.0)));

        assertThat(out.get(0).endMs()).isEqualTo(1500);
        assertThat(out.get(1).startMs()).isEqualTo(1500);
    }

    @Test
    void drops_non_speech_marks_and_decodes_html_entities() {
        List<TranscriptSegment> out = CaptionMerger.merge(List.of(
                c("[Music]", 0.0, 5.0),
                c("♪♪", 5.0, 2.0),
                c(">> I&#39;m here &amp; ready.", 7.0, 2.0),
                c("(applause)", 9.0, 1.0)));

        assertThat(out).extracting(TranscriptSegment::text).containsExactly("I'm here & ready.");
    }

    @Test
    void empty_or_missing_transcript_gives_no_sentences() {
        assertThat(CaptionMerger.merge(null)).isEmpty();
        assertThat(CaptionMerger.merge(List.of(c("[Music]", 0, 10)))).isEmpty();
    }

    @Test
    void english_check_accepts_manual_and_auto_english_only() {
        assertThat(TranscriptApiTranscriber.isEnglish("en")).isTrue();
        assertThat(TranscriptApiTranscriber.isEnglish("en-GB")).isTrue();
        assertThat(TranscriptApiTranscriber.isEnglish("asr-en")).isTrue();
        assertThat(TranscriptApiTranscriber.isEnglish("asr-hi")).isFalse();
        assertThat(TranscriptApiTranscriber.isEnglish("vi")).isFalse();
        assertThat(TranscriptApiTranscriber.isEnglish(null)).isFalse();
    }
}
