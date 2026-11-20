package com.lingualoop.backend.lesson.transcriptapi;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

import com.lingualoop.backend.lesson.transcript.TranscriptSegment;
import com.lingualoop.backend.lesson.transcriptapi.TranscriptApiResponse.Caption;

final class CaptionMerger {

    static final int PAUSE_MS = 1500;
    static final int LONG_PAUSE_MS = 3000;
    static final int MAX_SENTENCE_MS = 12_000;
    static final int MAX_CHARS = 250;
    static final int MAX_PUNCTUATED_CHARS = 450;
    /** Từ 2 dấu hết câu trên 100 từ trở lên thì coi phụ đề là có dấu câu. */
    static final double PUNCTUATED_PER_100_WORDS = 2.0;

    private static final Pattern SENTENCE_END = Pattern.compile("[.?!…][\"'”’)\\]]*$");
    /** Ký hiệu không phải lời: [Music], (applause), ♪♪. */
    private static final Pattern NON_SPEECH = Pattern.compile("\\[[^\\]]*\\]|\\([^)]*\\)|[♪♫]+");
    /** Viết tắt có dấu chấm nhưng không phải hết câu. */
    private static final Set<String> ABBREVIATIONS = Set.of("mr.", "mrs.", "ms.", "dr.", "prof.", "st.", "vs.",
            "etc.", "e.g.", "i.e.", "u.s.", "u.k.", "a.m.", "p.m.", "no.", "jr.", "sr.");

    private CaptionMerger() {
    }

    /** Phụ đề có dấu câu hay không, theo cùng ngưỡng {@link #merge} dùng để chọn cách cắt. */
    static boolean isPunctuated(List<Caption> captions) {
        return isPunctuatedLines(toLines(captions));
    }

    static List<TranscriptSegment> merge(List<Caption> captions) {
        List<Line> raw = toLines(captions);
        boolean punctuated = isPunctuatedLines(raw);
        List<Line> lines = new ArrayList<>();
        raw.forEach(line -> lines.addAll(splitAtSentenceEnds(line)));

        List<TranscriptSegment> out = new ArrayList<>();
        StringBuilder text = new StringBuilder();
        int start = 0;
        for (int i = 0; i < lines.size(); i++) {
            Line line = lines.get(i);
            if (text.isEmpty()) {
                start = line.start();
            } else {
                text.append(' ');
            }
            text.append(line.text());

            Line next = i + 1 < lines.size() ? lines.get(i + 1) : null;
            int end = next == null ? line.end() : Math.min(line.end(), Math.max(next.start(), line.start()));
            if (next == null || shouldClose(line, next, text.length(), end - start, punctuated)) {
                out.add(new TranscriptSegment(start, Math.max(end, start), text.toString()));
                text.setLength(0);
            }
        }
        return out;
    }

    /**
     * Tách một dòng sau mỗi từ kết thúc câu nằm giữa dòng. Mốc tại chỗ tách chia theo tỉ lệ ký tự đã qua trên tổng ký tự
     * của dòng.
     */
    static List<Line> splitAtSentenceEnds(Line line) {
        String[] words = line.text().split(" ");
        List<Line> pieces = new ArrayList<>();
        int total = line.text().length();
        int duration = line.end() - line.start();
        int pieceStart = line.start();
        StringBuilder piece = new StringBuilder();
        int consumed = 0;
        for (int k = 0; k < words.length; k++) {
            if (!piece.isEmpty()) {
                piece.append(' ');
            }
            piece.append(words[k]);
            consumed += words[k].length() + (k + 1 < words.length ? 1 : 0);
            if (k + 1 < words.length && endsSentence(words[k])) {
                int cut = line.start() + (int) Math.round((double) duration * consumed / total);
                pieces.add(new Line(pieceStart, cut, piece.toString()));
                piece.setLength(0);
                pieceStart = cut;
            }
        }
        pieces.add(new Line(pieceStart, line.end(), piece.toString()));
        return pieces;
    }

    private static boolean shouldClose(Line line, Line next, int chars, int durationMs, boolean punctuated) {
        int pause = next.start() - line.end();
        if (punctuated) {
            return endsSentence(line.text()) || pause >= LONG_PAUSE_MS || chars >= MAX_PUNCTUATED_CHARS;
        }
        return endsSentence(line.text()) || pause >= PAUSE_MS || durationMs >= MAX_SENTENCE_MS || chars >= MAX_CHARS;
    }

    /** Dòng kết thúc bằng dấu hết câu, trừ khi từ cuối là viết tắt ({@code Mr.}, {@code U.S.}). */
    static boolean endsSentence(String text) {
        if (!SENTENCE_END.matcher(text).find()) {
            return false;
        }
        String lastWord = text.substring(text.lastIndexOf(' ') + 1).toLowerCase(Locale.ROOT);
        return !ABBREVIATIONS.contains(lastWord);
    }

    private static boolean isPunctuatedLines(List<Line> lines) {
        long words = 0;
        long ends = 0;
        for (Line line : lines) {
            for (String word : line.text().split(" ")) {
                words++;
                if (endsSentence(word)) {
                    ends++;
                }
            }
        }
        return words > 0 && ends * 100.0 / words >= PUNCTUATED_PER_100_WORDS;
    }

    private static List<Line> toLines(List<Caption> captions) {
        List<Line> lines = new ArrayList<>();
        for (Caption c : captions == null ? List.<Caption>of() : captions) {
            if (c == null || c.text() == null || c.start() == null) {
                continue;
            }
            String text = clean(c.text());
            if (text.isEmpty()) {
                continue;
            }
            int start = (int) Math.round(c.start() * 1000);
            int duration = c.duration() == null ? 0 : (int) Math.max(0, Math.round(c.duration() * 1000));
            lines.add(new Line(start, start + duration, text));
        }
        return lines;
    }

    /** Bỏ ký hiệu không phải lời, giải mã thực thể HTML hay gặp trong phụ đề, gộp khoảng trắng. */
    static String clean(String raw) {
        String text = raw.replace("&amp;", "&").replace("&#39;", "'").replace("&quot;", "\"")
                .replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ");
        text = NON_SPEECH.matcher(text).replaceAll(" ");
        text = text.replaceAll("^\\s*(>>|-)\\s*", "");
        return text.replaceAll("\\s+", " ").strip();
    }

    /** Một dòng phụ đề, hoặc một mảnh của dòng sau khi tách tại dấu hết câu. */
    record Line(int start, int end, String text) {
    }
}
