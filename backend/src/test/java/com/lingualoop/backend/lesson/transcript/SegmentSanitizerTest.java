package com.lingualoop.backend.lesson.transcript;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

/** Hậu kiểm câu Gemini trả về theo BR-BH-09 trước khi lưu. */
class SegmentSanitizerTest {

    private static final int VIDEO_MS = 60_000;

    private final SegmentSanitizer sanitizer = new SegmentSanitizer();

    private static TranscriptSegment seg(int start, int end, String text) {
        return new TranscriptSegment(start, end, text);
    }

    @Test
    void keeps_valid_segments_sorted_by_start() {
        List<TranscriptSegment> out = sanitizer.sanitize(List.of(
                seg(5_000, 8_000, "Second."), seg(1_000, 4_000, "First.")), VIDEO_MS);

        assertThat(out).containsExactly(seg(1_000, 4_000, "First."), seg(5_000, 8_000, "Second."));
    }

    @Test
    void overlapping_segment_starts_where_previous_ends() {
        List<TranscriptSegment> out = sanitizer.sanitize(List.of(
                seg(1_000, 5_000, "One."), seg(4_200, 9_000, "Two.")), VIDEO_MS);

        assertThat(out).containsExactly(seg(1_000, 5_000, "One."), seg(5_000, 9_000, "Two."));
    }

    @Test
    void short_segment_is_extended_to_half_a_second_when_there_is_room() {
        List<TranscriptSegment> out = sanitizer.sanitize(List.of(
                seg(1_000, 1_200, "Hi."), seg(3_000, 6_000, "Next.")), VIDEO_MS);

        assertThat(out.get(0)).isEqualTo(seg(1_000, 1_500, "Hi."));
    }

    @Test
    void short_segment_without_room_is_merged_into_previous() {
        List<TranscriptSegment> out = sanitizer.sanitize(List.of(
                seg(1_000, 4_000, "Hello there,"), seg(4_000, 4_200, "friend."), seg(4_300, 8_000, "Next.")),
                VIDEO_MS);

        assertThat(out).containsExactly(seg(1_000, 4_200, "Hello there, friend."), seg(4_300, 8_000, "Next."));
    }

    @Test
    void short_first_segment_without_room_is_merged_into_next() {
        List<TranscriptSegment> out = sanitizer.sanitize(List.of(
                seg(1_000, 1_100, "Well,"), seg(1_200, 4_000, "here we go.")), VIDEO_MS);

        assertThat(out).containsExactly(seg(1_000, 4_000, "Well, here we go."));
    }

    @Test
    void end_is_clamped_to_video_length_and_segments_after_it_join_the_last_one() {
        List<TranscriptSegment> out = sanitizer.sanitize(List.of(
                seg(55_000, 61_000, "Thanks for watching."), seg(60_500, 62_000, "Bye.")), VIDEO_MS);

        assertThat(out).containsExactly(seg(55_000, 60_000, "Thanks for watching. Bye."));
    }

    @Test
    void blank_text_is_dropped_and_whitespace_is_normalised() {
        List<TranscriptSegment> out = sanitizer.sanitize(List.of(
                seg(1_000, 3_000, "   "), seg(4_000, 6_000, " Too   many spaces ")), VIDEO_MS);

        assertThat(out).containsExactly(seg(4_000, 6_000, "Too many spaces"));
    }

    @Test
    void long_text_is_cut_at_a_word_boundary_within_500_characters() {
        String text = "word ".repeat(150).strip(); // 749 ký tự

        String kept = sanitizer.sanitize(List.of(seg(1_000, 9_000, text)), VIDEO_MS).get(0).text();

        assertThat(kept).hasSizeLessThanOrEqualTo(SegmentSanitizer.MAX_TEXT).endsWith("word");
    }

    @Test
    void every_result_satisfies_the_sentence_constraints() {
        List<TranscriptSegment> out = sanitizer.sanitize(List.of(
                seg(0, 100, "A."), seg(50, 400, "B."), seg(300, 2_000, "C."), seg(1_900, 1_950, "D."),
                seg(59_900, 70_000, "E.")), VIDEO_MS);

        int previousEnd = 0;
        for (TranscriptSegment s : out) {
            assertThat(s.durationMs()).isGreaterThanOrEqualTo(SegmentSanitizer.MIN_DURATION_MS);
            assertThat(s.startMs()).isGreaterThanOrEqualTo(previousEnd);
            assertThat(s.endMs()).isLessThanOrEqualTo(VIDEO_MS);
            previousEnd = s.endMs();
        }
        assertThat(String.join(" ", out.stream().map(TranscriptSegment::text).toList())).isEqualTo("A. B. C. D. E.");
    }
}
