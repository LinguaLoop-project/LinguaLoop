package com.lingualoop.backend.lesson.ipa;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import com.lingualoop.backend.shadowing.azure.ExpectedPhonemes;

class IpaNormalizerTest {

    @Test
    void flap_becomes_t() {
        assertThat(IpaNormalizer.normalize("bˈɛɾɚ")).isEqualTo("ˈbɛtɚ");
    }

    @Test
    void barred_i_becomes_short_i() {
        assertThat(IpaNormalizer.normalize("bᵻfˈɔːɹ")).isEqualTo("bɪˈfɔɹ");
    }

    @Test
    void turned_a_becomes_schwa() {
        assertThat(IpaNormalizer.normalize("ɐlˈaɪv")).isEqualTo("əˈlaɪv");
    }

    @Test
    void long_er_loses_length_mark() {
        assertThat(IpaNormalizer.normalize("wˈɜːld")).isEqualTo("wɜld");
    }

    @Test
    void glottal_stop_and_syllabic_n() {
        assertThat(IpaNormalizer.normalize("bˈʌʔn̩")).isEqualTo("ˈbʌtən");
    }

    @Test
    void o_with_length_mark_before_r_becomes_open_o() {
        assertThat(IpaNormalizer.normalize("fˈoːɹ")).isEqualTo("fɔɹ");
    }

    @Test
    void keeps_turned_r_and_stress_marks() {
        assertThat(IpaNormalizer.normalize("ɹˈɛdˈaɪ")).isEqualTo("ˈɹɛˈdaɪ");
    }

    @Test
    void joins_parts_and_removes_linking_marks() {
        assertThat(IpaNormalizer.normalize("θɹˈiː θˈaʊzənd")).isEqualTo("ˈθɹiˈθaʊzənd");
        assertThat(IpaNormalizer.normalize("t_ʃˈɪp")).isEqualTo("tʃɪp");
        assertThat(IpaNormalizer.normalize("dʒ͡ʌst")).isEqualTo("dʒʌst");
    }

    @Test
    void r_coloured_vowel_is_tokenized_like_azure() {
        String ipa = IpaNormalizer.normalize("pˈɑːɹk");

        assertThat(ipa).isEqualTo("pɑɹk");
        // "park" = p + ɑ (đã gộp với r) + k: ba âm, giống số âm Azure nghe được
        assertThat(ExpectedPhonemes.ofSentence("park", ipa)).containsExactly(List.of("p", "ɑ", "k"));
    }

    @Test
    void stress_moves_to_syllable_start() {
        assertThat(IpaNormalizer.normalize("ɪntˈɛlɪdʒəns")).isEqualTo("ɪnˈtɛlɪdʒəns");
        assertThat(IpaNormalizer.normalize("tɹɐdˈɪʃənəl")).isEqualTo("tɹəˈdɪʃənəl");
        assertThat(IpaNormalizer.normalize("kˌɑːɹɪspˈɑːndənt")).isEqualTo("ˌkɑɹɪˈspɑndənt");
        assertThat(IpaNormalizer.normalize("ˈaɪv")).isEqualTo("aɪv");
    }

    /** Mẫu đầu ra thật của espeak-ng 1.50 (-v en-us) cho 1.944 từ lấy từ các câu trong DB local. */
    @Test
    void every_real_espeak_word_in_the_sample_passes_expected_phonemes() throws IOException {
        String tsv = new String(new ClassPathResource("ipa/espeak-en-us-sample.tsv").getInputStream().readAllBytes(),
                StandardCharsets.UTF_8);
        List<String> failures = new ArrayList<>();
        int rows = 0;
        for (String line : tsv.split("\n")) {
            if (line.isBlank()) {
                continue;
            }
            rows++;
            String[] cols = line.split("\t");
            String ipa = IpaNormalizer.normalize(cols[1]);
            List<List<String>> parsed = ExpectedPhonemes.ofSentence("word", ipa);
            if (parsed == null || parsed.contains(null)) {
                failures.add(cols[0] + " -> " + cols[1] + " -> " + ipa);
            }
        }

        assertThat(rows).isGreaterThan(1500);
        assertThat(failures).isEmpty();
    }
}
