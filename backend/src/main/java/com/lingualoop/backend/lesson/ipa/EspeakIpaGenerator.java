package com.lingualoop.backend.lesson.ipa;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.function.BiFunction;
import java.util.function.UnaryOperator;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.config.LessonImportProperties;
import com.lingualoop.backend.shadowing.azure.ExpectedPhonemes;

import lombok.extern.slf4j.Slf4j;

/**
 * Tạo IPA Mỹ bằng {@code espeak-ng -q --ipa -v en-us} và IPA Anh bằng {@code -v en-gb}, như cách seed sinh hai cột
 * (ADR 0007). Mỗi token (từ tách theo khoảng trắng) là một dòng stdin, nhờ đó số cụm IPA luôn bằng số từ của câu dù token
 * là số, từ ghép hay có dấu nháy. Dấu câu ở hai đầu token bị bỏ trước khi đọc; phần còn lại ({@code 20-somethings},
 * {@code I've}, {@code 3,500}) espeak tự đọc, các phần của một token được ghép thành một cụm. Text đi qua stdin, không qua
 * tham số dòng lệnh.
 * <p>
 * IPA Anh chỉ để hiển thị nên chỉ tạo cho câu đã có IPA Mỹ; câu nào thiếu thì để trống, không đoán.
 * <p>
 * Mỗi token được đọc riêng nên espeak ra dạng đầy đủ của từ chức năng ("a" thành "ˈeɪ", "to" thành "tˈuː"); dạng yếu chưa
 * làm ở giai đoạn này.
 */
@Slf4j
@Component
class EspeakIpaGenerator implements IpaGenerator {

    static final String VOICE_US = "en-us";
    static final String VOICE_UK = "en-gb";

    private static final String EDGE_PUNCTUATION = "^[^\\p{L}\\p{N}]+|[^\\p{L}\\p{N}]+$";

    private final BiFunction<String, List<String>, List<String>> espeak;

    @Autowired
    EspeakIpaGenerator(LessonImportProperties properties) {
        this(properties, List.of(properties.espeakPath()));
    }

    /** {@code baseCommand} là lệnh chạy espeak (chưa gồm tham số); test dùng một chương trình giả. */
    EspeakIpaGenerator(LessonImportProperties properties, List<String> baseCommand) {
        this((voice, lines) -> runEspeak(baseCommand, voice, properties.espeakTimeout(), lines));
    }

    /** Nhận giọng và cả lô dòng, trả đúng số dòng IPA thô theo thứ tự; test thay process bằng hàm này. */
    EspeakIpaGenerator(BiFunction<String, List<String>, List<String>> espeak) {
        this.espeak = espeak;
    }

    @Override
    public List<SentenceIpa> generate(List<String> sentences) {
        List<SentenceIpa> result = new ArrayList<>(Collections.nCopies(sentences.size(), SentenceIpa.NONE));
        List<List<String>> tokensOf = new ArrayList<>(sentences.size());
        Set<String> distinct = new LinkedHashSet<>();
        for (String sentence : sentences) {
            List<String> tokens = tokenize(sentence);
            tokensOf.add(tokens);
            if (tokens != null) {
                distinct.addAll(tokens);
            }
        }
        if (distinct.isEmpty()) {
            return result;
        }

        List<String> words = new ArrayList<>(distinct);
        Map<String, String> usOf = readClusters(VOICE_US, words, IpaNormalizer::normalize);
        if (usOf == null) {
            return result;
        }
        String[] us = new String[sentences.size()];
        for (int i = 0; i < sentences.size(); i++) {
            List<String> tokens = tokensOf.get(i);
            us[i] = tokens == null ? null : assembleUs(sentences.get(i), tokens, usOf);
        }

        Map<String, String> ukOf = readClusters(VOICE_UK, words, IpaNormalizer::normalizeUk);
        for (int i = 0; i < sentences.size(); i++) {
            String uk = us[i] == null || ukOf == null ? null : join(tokensOf.get(i), ukOf);
            result.set(i, new SentenceIpa(us[i], uk));
        }
        return result;
    }

    /** @return các token đã bỏ dấu câu hai đầu, hoặc null nếu câu rỗng hay có token chỉ gồm dấu câu */
    private static List<String> tokenize(String sentence) {
        if (sentence == null || sentence.isBlank()) {
            return null;
        }
        List<String> tokens = new ArrayList<>();
        for (String raw : sentence.trim().split("\\s+")) {
            String token = raw.replace('’', '\'').replaceAll(EDGE_PUNCTUATION, "");
            if (token.isEmpty()) {
                return null;
            }
            tokens.add(token);
        }
        return tokens;
    }

    /** @return IPA đã chuẩn hoá của từng token theo {@code voice}; null nếu không chạy được espeak */
    private Map<String, String> readClusters(String voice, List<String> distinct, UnaryOperator<String> normalize) {
        List<String> lines;
        try {
            lines = espeak.apply(voice, distinct);
        } catch (RuntimeException e) {
            log.error("Không tạo được IPA {} bằng espeak-ng: {}", voice, e.toString());
            return null;
        }
        if (lines.size() != distinct.size()) {
            log.error("espeak-ng {} trả {} dòng cho {} token", voice, lines.size(), distinct.size());
            return null;
        }
        Map<String, String> clusters = new HashMap<>();
        for (int i = 0; i < distinct.size(); i++) {
            clusters.put(distinct.get(i), normalize.apply(lines.get(i)));
        }
        return clusters;
    }

    /** Ghép các cụm thành IPA của câu; null nếu thiếu cụm của một từ nào đó. */
    private static String join(List<String> tokens, Map<String, String> clusterOf) {
        List<String> clusters = new ArrayList<>(tokens.size());
        for (String token : tokens) {
            String cluster = clusterOf.get(token);
            if (cluster == null || cluster.isEmpty()) {
                return null;
            }
            clusters.add(cluster);
        }
        return String.join(" ", clusters);
    }

    /** IPA Mỹ của câu; null nếu thiếu cụm hoặc có ký hiệu ngoài bảng phonemes (shadowing sẽ bỏ cả câu). */
    private static String assembleUs(String sentence, List<String> tokens, Map<String, String> clusterOf) {
        String ipa = join(tokens, clusterOf);
        if (ipa == null) {
            return null;
        }
        List<List<String>> parsed = ExpectedPhonemes.ofSentence(sentence, ipa);
        if (parsed == null || parsed.contains(null)) {
            log.warn("IPA của một câu có ký hiệu ngoài bảng phonemes, bỏ qua câu đó");
            return null;
        }
        return ipa;
    }

    /**
     * Chạy espeak-ng một lần cho cả lô. espeak cắt dòng ở dấu câu bên trong token (ví dụ "e.g.") nên nếu số dòng ra
     * không bằng số dòng vào thì chạy lại từng dòng một và ghép các dòng ra thành một.
     */
    private static List<String> runEspeak(List<String> baseCommand, String voice, Duration timeout,
            List<String> lines) {
        List<String> out = exec(baseCommand, voice, timeout, lines);
        if (out.size() == lines.size()) {
            return out;
        }
        log.warn("espeak-ng {} trả {} dòng cho {} dòng, chạy lại từng dòng", voice, out.size(), lines.size());
        List<String> perLine = new ArrayList<>(lines.size());
        for (String line : lines) {
            perLine.add(String.join(" ", exec(baseCommand, voice, timeout, List.of(line))));
        }
        return perLine;
    }

    private static List<String> exec(List<String> baseCommand, String voice, Duration timeout, List<String> lines) {
        List<String> command = new ArrayList<>(baseCommand);
        command.addAll(List.of("-q", "--ipa", "-v", voice));
        Process process;
        try {
            process = new ProcessBuilder(command).redirectError(ProcessBuilder.Redirect.DISCARD).start();
        } catch (IOException e) {
            throw new IllegalStateException("Không chạy được " + baseCommand.get(0), e);
        }

        // Ghi stdin và đọc stdout ở hai luồng riêng để không tắc khi bộ đệm của ống đầy
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        Thread writer = Thread.ofVirtual().start(() -> {
            try (OutputStream in = process.getOutputStream()) {
                in.write((String.join("\n", lines) + "\n").getBytes(StandardCharsets.UTF_8));
            } catch (IOException ignored) {
                // tiến trình đã dừng sớm; lỗi được báo qua mã thoát
            }
        });
        Thread reader = Thread.ofVirtual().start(() -> {
            try {
                process.getInputStream().transferTo(stdout);
            } catch (IOException ignored) {
                // tiến trình đã bị dừng
            }
        });
        try {
            if (!process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS)) {
                process.destroyForcibly();
                throw new IllegalStateException("espeak-ng quá " + timeout);
            }
            writer.join(TimeUnit.SECONDS.toMillis(2));
            reader.join(TimeUnit.SECONDS.toMillis(2));
        } catch (InterruptedException e) {
            process.destroyForcibly();
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Bị ngắt khi chờ espeak-ng", e);
        }
        if (process.exitValue() != 0) {
            throw new IllegalStateException("espeak-ng thoát với mã " + process.exitValue());
        }

        List<String> out = new ArrayList<>(List.of(stdout.toString(StandardCharsets.UTF_8).split("\n", -1)));
        if (!out.isEmpty() && out.get(out.size() - 1).isEmpty()) {
            out.remove(out.size() - 1);
        }
        out.replaceAll(l -> l.endsWith("\r") ? l.substring(0, l.length() - 1) : l);
        return out;
    }
}
