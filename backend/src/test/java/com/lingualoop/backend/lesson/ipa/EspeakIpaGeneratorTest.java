package com.lingualoop.backend.lesson.ipa;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.BiFunction;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.config.LessonImportProperties;

/** Process espeak-ng được thay bằng bản giả; không cần cài espeak-ng để chạy test. */
class EspeakIpaGeneratorTest {

    private static final Map<String, String> DICTIONARY = Map.ofEntries(
            Map.entry("There's", "ðɛɹz"),
            Map.entry("new", "nˈuː"),
            Map.entry("reporting", "ɹᵻpˈɔːɹɾɪŋ"),
            Map.entry("On", "ˌɔn"),
            Map.entry("60", "sˈɪksti"),
            Map.entry("20-somethings", "twˈɛnti sˈʌmθɪŋz"),
            Map.entry("I've", "ˈaɪv"),
            Map.entry("seen", "sˈiːn"),
            Map.entry("it", "ɪt"),
            Map.entry("Hello", "həlˈoʊ"),
            Map.entry("world", "wˈɜːld"),
            Map.entry("Weird", "ʘʘ"));

    private final List<List<String>> calls = new ArrayList<>();

    private EspeakIpaGenerator generator() {
        BiFunction<String, List<String>, List<String>> fake = (voice, lines) -> {
            if (EspeakIpaGenerator.VOICE_US.equals(voice)) {
                calls.add(lines);
            }
            return lines.stream().map(l -> DICTIONARY.getOrDefault(l, "")).toList();
        };
        return new EspeakIpaGenerator(fake);
    }

    /** IPA Mỹ của từng câu; các khẳng định dưới đây kiểm giọng Mỹ, nguồn âm đích khi chấm. */
    private static List<String> us(List<IpaGenerator.SentenceIpa> result) {
        return result.stream().map(IpaGenerator.SentenceIpa::us).toList();
    }

    @Test
    void one_ipa_cluster_per_word() {
        List<String> ipa = us(generator().generate(List.of("There's new reporting")));

        assertThat(ipa).hasSize(1);
        assertThat(ipa.get(0).split(" ")).hasSize(3);
        assertThat(ipa.get(0)).isEqualTo("ðɛɹz nu ɹɪˈpɔɹtɪŋ");
    }

    @Test
    void token_with_punctuation_or_hyphen_stays_one_cluster() {
        String sentence = "On 60, 20-somethings, I've seen it.";

        List<String> ipa = us(generator().generate(List.of(sentence)));

        // espeak chỉ nhận token đã bỏ dấu câu ở hai đầu, mỗi token một dòng
        assertThat(calls.get(0)).containsExactlyInAnyOrder("On", "60", "20-somethings", "I've", "seen", "it");
        assertThat(ipa.get(0).split(" ")).hasSize(sentence.split(" ").length);
        // "20-somethings" được espeak đọc thành hai phần nhưng ghép lại thành một cụm
        assertThat(ipa.get(0)).contains("ˈtwɛntiˈsʌmθɪŋz").contains("ˈsɪksti");
    }

    @Test
    void sentence_with_invalid_symbol_returns_null_for_that_sentence_only() {
        List<String> ipa = us(generator().generate(List.of("Hello world", "Hello Weird", "seen it")));

        assertThat(ipa).hasSize(3);
        assertThat(ipa.get(0)).isNotNull();
        assertThat(ipa.get(1)).isNull();
        assertThat(ipa.get(2)).isNotNull();
    }

    @Test
    void returns_same_size_and_null_for_unreadable_sentences() {
        // "-" không còn gì sau khi bỏ dấu câu; "unknownword" espeak giả không trả gì
        List<String> ipa = us(generator().generate(List.of("Hello - world", "unknownword", "", "  ")));

        assertThat(ipa).containsExactly(null, null, null, null);
    }

    @Test
    void asks_for_each_distinct_token_once_in_one_call() {
        us(generator().generate(List.of("Hello world", "Hello world Hello", "world")));

        assertThat(calls).hasSize(1);
        assertThat(calls.get(0)).containsExactlyInAnyOrder("Hello", "world");
    }

    @Test
    void result_passes_expected_phonemes_without_null_symbols() {
        List<String> ipa = us(generator().generate(List.of("There's new reporting")));

        assertThat(com.lingualoop.backend.shadowing.azure.ExpectedPhonemes.ofSentence("There's new reporting", ipa.get(0)))
                .isNotNull().doesNotContainNull();
    }

    @Test
    void failure_of_espeak_gives_null_for_every_sentence() {
        EspeakIpaGenerator broken = new EspeakIpaGenerator((voice, lines) -> {
            throw new IllegalStateException("espeak-ng not installed");
        });

        assertThat(us(broken.generate(List.of("Hello world", "seen it")))).containsExactly(null, null);
    }

    @Test
    void empty_list_returns_empty_list() {
        assertThat(us(generator().generate(List.of()))).isEmpty();
        assertThat(calls).isEmpty();
    }

    // ---- Chạy process thật bằng một chương trình Java giả danh espeak-ng, để kiểm đường ống stdin/stdout ----

    /** Giả espeak-ng: mỗi dòng vào ra một dòng chữ hoa; dòng có dấu phẩy ra hai dòng (như espeak cắt theo mệnh đề). */
    public static final class FakeEspeak {
        public static void main(String[] args) throws IOException {
            BufferedReader in = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
            PrintStream out = new PrintStream(System.out, true, StandardCharsets.UTF_8);
            String line;
            while ((line = in.readLine()) != null) {
                if (line.contains(",")) {
                    String[] parts = line.split(",", 2);
                    out.println(parts[0].toLowerCase());
                    out.println(parts[1].toLowerCase());
                } else {
                    out.println(line.toLowerCase());
                }
            }
        }
    }

    private static EspeakIpaGenerator generatorBackedByFakeProcess() {
        String java = Path.of(System.getProperty("java.home"), "bin", "java").toString();
        String classes = System.getProperty("java.class.path");
        return new EspeakIpaGenerator(LessonImportProperties.defaults(),
                List.of(java, "-cp", classes, FakeEspeak.class.getName()));
    }

    @Test
    void real_process_roundtrip_through_stdin_and_stdout() {
        // lowercase của "tɛst" cũng là "tɛst": dùng token ASCII hợp lệ làm IPA ("p", "t", "k"...)
        List<String> ipa = us(generatorBackedByFakeProcess().generate(List.of("P T", "K")));

        assertThat(ipa).containsExactly("p t", "k");
    }

    @Test
    void real_process_falls_back_to_one_call_per_line_when_line_count_differs() {
        // token "a,b" làm giả process ra 2 dòng; khi số dòng lệch phải gọi từng dòng rồi ghép lại thành một cụm
        List<String> ipa = us(generatorBackedByFakeProcess().generate(List.of("P K P,T")));

        assertThat(ipa).containsExactly("p k pt");
    }
}
