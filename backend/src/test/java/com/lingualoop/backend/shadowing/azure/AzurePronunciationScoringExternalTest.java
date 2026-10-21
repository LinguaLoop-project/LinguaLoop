package com.lingualoop.backend.shadowing.azure;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import com.lingualoop.backend.config.AzureSpeechProperties;

/**
 * Gọi Azure thật, tốn quota nên mặc định tắt. Chạy bằng:
 * {@code AZURE_SPEECH_KEY=... SHADOWING_SAMPLE_WAV=duong/dan.wav SHADOWING_SAMPLE_TEXT="the sentence" ./mvnw test -Dtest=AzurePronunciationScoringExternalTest}
 * Tệp WAV phải là PCM 16-bit mono 16 kHz, đọc đúng câu trong {@code SHADOWING_SAMPLE_TEXT}.
 */
@Tag("external")
@EnabledIfEnvironmentVariable(named = "AZURE_SPEECH_KEY", matches = ".+")
@EnabledIfEnvironmentVariable(named = "SHADOWING_SAMPLE_WAV", matches = ".+")
class AzurePronunciationScoringExternalTest {

    @Test
    void realAzure_scoresSampleRecording() throws Exception {
        var properties = new AzureSpeechProperties(System.getenv("AZURE_SPEECH_KEY"),
                System.getenv("AZURE_SPEECH_REGION"));
        var service = new AzurePronunciationScoringService(properties);
        byte[] wav = Files.readAllBytes(Path.of(System.getenv("SHADOWING_SAMPLE_WAV")));
        String text = System.getenv().getOrDefault("SHADOWING_SAMPLE_TEXT", "hello world");

        PronunciationAssessment result = service.assess(wav, text);

        assertThat(result.pronunciationScore()).isBetween(0.0, 100.0);
        assertThat(result.words()).isNotEmpty();
        assertThat(result.words().get(0).phonemes()).isNotEmpty();
        // Mọi âm Azure trả về phải chuyển được sang bảng phonemes (AC-SHADOW-12 với dữ liệu thật)
        result.words().forEach(w -> {
            var azure = w.phonemes().stream().map(PronunciationAssessment.PhonemeResult::symbol).toList();
            assertThat(AzurePhonemeMapper.toTableSymbols(azure)).as("word %s: %s", w.word(), azure).doesNotContainNull();
        });
    }
}
