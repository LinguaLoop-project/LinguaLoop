package com.lingualoop.backend.dictation.service.prompt;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.random.RandomGenerator;
import java.util.stream.IntStream;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.dictation.service.SentenceToken;
import com.lingualoop.backend.dictation.service.WordClass;
import com.lingualoop.backend.practice.dto.ClassCountsView;

/** Chọn các ô trống cho mức Easy. */
@Component
public class BlankPicker {

    private static final double BLANK_RATIO = 0.4;
    private static final int MIN_BLANKS = 1;
    private static final int MAX_BLANKS = 3;

    /** Từ khoét được: có chữ và không thuộc nhóm other hay proper. */
    public boolean isBlankable(SentenceToken token) {
        return !token.normalized().isEmpty()
                && token.wordClass() != WordClass.other
                && token.wordClass() != WordClass.proper;
    }

    /** Số ô tối đa: 40% số từ, giới hạn 1–3 và không vượt số từ khoét được. */
    public int blankCount(List<SentenceToken> tokens) {
        long words = tokens.stream().filter(t -> !t.normalized().isEmpty()).count();
        long blankable = tokens.stream().filter(this::isBlankable).count();
        long wanted = Math.max(MIN_BLANKS, Math.min(MAX_BLANKS, Math.round(BLANK_RATIO * words)));
        return (int) Math.min(wanted, blankable);
    }

    /**
     * Trả vị trí token của các ô trống, tăng dần; rỗng nếu câu không có từ nào khoét được.
     * Ô đầu chọn theo độ yếu của nhóm từ; các ô sau ưu tiên đủ hai loại từ rồi từ dài. Không có hai ô kề nhau,
     * và cố tránh các ô đã khoét ở lượt trước.
     */
    public List<Integer> pick(List<SentenceToken> tokens, Map<String, ClassCountsView> countsByClass,
            List<List<Integer>> recentBlankPositions, RandomGenerator random) {
        List<SentenceToken> words = tokens.stream().filter(t -> !t.normalized().isEmpty()).toList();
        List<Integer> eligible = IntStream.range(0, words.size()).filter(i -> isBlankable(words.get(i)))
                .boxed().toList();
        int wanted = blankCount(tokens);
        if (wanted == 0) {
            return List.of();
        }
        Set<Integer> recent = recentIndices(words, recentBlankPositions);
        List<Integer> chosen = new ArrayList<>();
        chosen.add(weightedFirst(words, eligible, recent, countsByClass, random));
        while (chosen.size() < wanted) {
            List<Integer> valid = eligible.stream()
                    .filter(i -> !chosen.contains(i) && chosen.stream().noneMatch(c -> Math.abs(c - i) == 1))
                    .toList();
            if (valid.isEmpty()) {
                break;
            }
            chosen.add(longest(words, narrow(words, eligible, chosen, valid, recent), random));
        }
        return chosen.stream().map(i -> words.get(i).position()).sorted().toList();
    }

    /** Đổi vị trí token của các ô gần đây thành chỉ số trong danh sách từ; bỏ giá trị không hợp lệ. */
    private static Set<Integer> recentIndices(List<SentenceToken> words, List<List<Integer>> recentBlankPositions) {
        Set<Integer> recent = new HashSet<>();
        if (recentBlankPositions == null) {
            return recent;
        }
        for (List<Integer> positions : recentBlankPositions) {
            if (positions == null) {
                continue;
            }
            for (Integer position : positions) {
                for (int i = 0; i < words.size(); i++) {
                    if (position != null && words.get(i).position() == position) {
                        recent.add(i);
                    }
                }
            }
        }
        return recent;
    }

    /** Ô đầu: chọn nhóm theo trọng số độ yếu, rồi chọn ngẫu nhiên một từ trong nhóm (ưu tiên từ chưa khoét gần đây). */
    private static int weightedFirst(List<SentenceToken> words, List<Integer> eligible, Set<Integer> recent,
            Map<String, ClassCountsView> countsByClass, RandomGenerator random) {
        List<Integer> fresh = eligible.stream().filter(i -> !recent.contains(i)).toList();
        List<Integer> pool = fresh.isEmpty() ? eligible : fresh;
        List<WordClass> classes = Arrays.stream(WordClass.values())
                .filter(c -> pool.stream().anyMatch(i -> words.get(i).wordClass() == c)).toList();
        double total = classes.stream().mapToDouble(c -> weakness(countsByClass, c)).sum();
        double target = random.nextDouble() * total;
        WordClass picked = classes.get(classes.size() - 1);
        double cumulative = 0;
        for (WordClass c : classes) {
            cumulative += weakness(countsByClass, c);
            if (target < cumulative) {
                picked = c;
                break;
            }
        }
        WordClass pickedClass = picked;
        List<Integer> inClass = pool.stream().filter(i -> words.get(i).wordClass() == pickedClass).toList();
        return inClass.get(random.nextInt(inClass.size()));
    }

    /** Độ yếu (lỗi + 1) / (cơ hội + 2); thiếu số liệu thì 0,5. Luôn nằm trong (0, 1]. */
    private static double weakness(Map<String, ClassCountsView> countsByClass, WordClass wordClass) {
        ClassCountsView counts = countsByClass == null ? null : countsByClass.get(wordClass.name());
        if (counts == null) {
            return 0.5;
        }
        long opportunities = Math.max(0, counts.opportunities());
        long errors = Math.min(Math.max(0, counts.errors()), opportunities);
        return (errors + 1.0) / (opportunities + 2.0);
    }

    /**
     * Thu hẹp ứng viên cho ô tiếp theo. Thứ tự ưu tiên: loại từ còn thiếu và chưa khoét gần đây, loại từ còn thiếu,
     * chưa khoét gần đây, rồi bất kỳ. Loại từ còn thiếu thắng việc tránh ô gần đây.
     */
    private static List<Integer> narrow(List<SentenceToken> words, List<Integer> eligible, List<Integer> chosen,
            List<Integer> valid, Set<Integer> recent) {
        List<Integer> fresh = valid.stream().filter(i -> !recent.contains(i)).toList();
        MissingKind missing = missingKind(words, eligible, chosen);
        if (missing != MissingKind.NONE) {
            boolean needFunction = missing == MissingKind.FUNCTION;
            List<Integer> freshKind = fresh.stream().filter(i -> isFunction(words.get(i)) == needFunction).toList();
            if (!freshKind.isEmpty()) {
                return freshKind;
            }
            List<Integer> kind = valid.stream().filter(i -> isFunction(words.get(i)) == needFunction).toList();
            if (!kind.isEmpty()) {
                return kind;
            }
        }
        return fresh.isEmpty() ? valid : fresh;
    }

    private enum MissingKind { FUNCTION, CONTENT, NONE }

    /** Loại từ cần thêm để các ô có đủ từ chức năng lẫn từ nội dung. */
    private static MissingKind missingKind(List<SentenceToken> words, List<Integer> eligible, List<Integer> chosen) {
        boolean sentenceHasFunction = eligible.stream().anyMatch(i -> isFunction(words.get(i)));
        boolean sentenceHasContent = eligible.stream().anyMatch(i -> !isFunction(words.get(i)));
        if (!sentenceHasFunction || !sentenceHasContent) {
            return MissingKind.NONE;
        }
        boolean chosenFunction = chosen.stream().anyMatch(i -> isFunction(words.get(i)));
        boolean chosenContent = chosen.stream().anyMatch(i -> !isFunction(words.get(i)));
        if (chosenFunction && chosenContent) {
            return MissingKind.NONE;
        }
        return chosenFunction ? MissingKind.CONTENT : MissingKind.FUNCTION;
    }

    /** Từ dài nhất trong ứng viên; hòa thì chọn ngẫu nhiên. */
    private static int longest(List<SentenceToken> words, List<Integer> candidates, RandomGenerator random) {
        int max = candidates.stream().mapToInt(i -> words.get(i).normalized().length()).max().orElseThrow();
        List<Integer> longest = candidates.stream().filter(i -> words.get(i).normalized().length() == max).toList();
        return longest.get(random.nextInt(longest.size()));
    }

    private static boolean isFunction(SentenceToken token) {
        return token.wordClass() == WordClass.function;
    }
}
