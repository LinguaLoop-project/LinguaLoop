package com.lingualoop.backend.lesson.transcript;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Component;

/**
 * Đưa các câu Gemini trả về về đúng BR-BH-09 trước khi lưu, để không vướng ràng buộc của bảng {@code sentences}
 * ({@code chk_sentence_len}, {@code ex_sentence_overlap}): mốc nằm trong độ dài video, câu sau không chồng lên câu trước,
 * mỗi câu dài ít nhất {@value #MIN_DURATION_MS} ms và câu tiếng Anh không quá {@value #MAX_TEXT} ký tự.
 * <p>
 * Câu ngắn hơn mức tối thiểu được nới về sau nếu còn chỗ, không thì gộp vào câu trước (hoặc câu sau nếu là câu đầu).
 */
@Component
public class SegmentSanitizer {

    static final int MIN_DURATION_MS = 500;
    static final int MAX_TEXT = 500;

    public List<TranscriptSegment> sanitize(List<TranscriptSegment> segments, int videoDurationMs) {
        List<TranscriptSegment> sorted = segments.stream()
                .filter(s -> s.text() != null && !s.text().isBlank())
                .map(s -> new TranscriptSegment(s.startMs(), s.endMs(), clean(s.text())))
                .sorted(Comparator.comparingInt(TranscriptSegment::startMs))
                .toList();

        List<TranscriptSegment> out = new ArrayList<>(sorted.size());
        for (int i = 0; i < sorted.size(); i++) {
            TranscriptSegment s = sorted.get(i);
            int previousEnd = out.isEmpty() ? 0 : out.get(out.size() - 1).endMs();
            int nextStart = i + 1 < sorted.size()
                    ? Math.min(sorted.get(i + 1).startMs(), videoDurationMs) : videoDurationMs;
            int start = Math.max(Math.max(s.startMs(), previousEnd), 0);
            int rawEnd = Math.min(s.endMs(), videoDurationMs);
            int end = rawEnd;
            if (end - start < MIN_DURATION_MS) {
                end = Math.min(start + MIN_DURATION_MS, Math.max(nextStart, end));
            }
            if (start >= videoDurationMs) {
                appendToPrevious(out, s.text(), previousEnd);
                continue;
            }
            if (end - start >= MIN_DURATION_MS) {
                out.add(new TranscriptSegment(start, end, s.text()));
            } else if (!out.isEmpty()) {
                appendToPrevious(out, s.text(), Math.max(rawEnd, previousEnd));
            } else if (i + 1 < sorted.size()) {
                // câu đầu quá ngắn: ghép vào đầu câu sau
                TranscriptSegment next = sorted.get(i + 1);
                sorted = replace(sorted, i + 1,
                        new TranscriptSegment(start, next.endMs(), join(s.text(), next.text())));
            }
        }
        return out.stream().map(s -> new TranscriptSegment(s.startMs(), s.endMs(), truncate(s.text()))).toList();
    }

    private static void appendToPrevious(List<TranscriptSegment> out, String text, int end) {
        if (out.isEmpty()) {
            return;
        }
        TranscriptSegment previous = out.remove(out.size() - 1);
        out.add(new TranscriptSegment(previous.startMs(), Math.max(previous.endMs(), end),
                join(previous.text(), text)));
    }

    private static List<TranscriptSegment> replace(List<TranscriptSegment> list, int index, TranscriptSegment value) {
        List<TranscriptSegment> copy = new ArrayList<>(list);
        copy.set(index, value);
        return copy;
    }

    private static String join(String a, String b) {
        return a + " " + b;
    }

    private static String clean(String text) {
        return text.replace(' ', ' ').replaceAll("\\s+", " ").strip();
    }

    /** Cắt ở khoảng trắng gần nhất trước giới hạn để không cắt đôi một từ. */
    private static String truncate(String text) {
        if (text.length() <= MAX_TEXT) {
            return text;
        }
        int cut = text.lastIndexOf(' ', MAX_TEXT);
        return (cut > 0 ? text.substring(0, cut) : text.substring(0, MAX_TEXT)).strip();
    }
}
