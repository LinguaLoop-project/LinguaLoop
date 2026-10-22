package com.lingualoop.backend.shadowing.azure;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.config.AzureSpeechProperties;

/**
 * Dò giới hạn đồng thời của khoá Azure đang dùng, để chọn {@code app.shadowing.scoring.max-concurrent}. Gọi Azure
 * thật và tốn quota (mỗi mức gửi đúng ngần ấy lời gọi) nên mặc định tắt. Chạy bằng:
 * {@code AZURE_SPEECH_KEY=... SHADOWING_SAMPLE_WAV=duong/dan.wav AZURE_PROBE_LEVELS=1,2,5,10 ./mvnw test -Dtest=AzureConcurrencyProbeExternalTest}
 * Kết quả in ra từng mức: số lời gọi thành công, bị báo bận (Azure trả "quá nhiều yêu cầu"), lỗi khác và độ trễ trung
 * bình. Mức đầu tiên mà có lời gọi bị báo bận là ngưỡng đồng thời thực của khoá; đặt {@code max-concurrent} thấp hơn nó.
 */
@Tag("external")
@EnabledIfEnvironmentVariable(named = "AZURE_SPEECH_KEY", matches = ".+")
@EnabledIfEnvironmentVariable(named = "SHADOWING_SAMPLE_WAV", matches = ".+")
class AzureConcurrencyProbeExternalTest {

    @Test
    void probe_reportsHowManyConcurrentCallsTheKeyAccepts() throws Exception {
        var service = new AzurePronunciationScoringService(new AzureSpeechProperties(
                System.getenv("AZURE_SPEECH_KEY"), System.getenv("AZURE_SPEECH_REGION")));
        byte[] wav = Files.readAllBytes(Path.of(System.getenv("SHADOWING_SAMPLE_WAV")));
        String text = System.getenv().getOrDefault("SHADOWING_SAMPLE_TEXT", "hello world");
        int[] levels = Arrays.stream(System.getenv().getOrDefault("AZURE_PROBE_LEVELS", "1,2,5,10").split(","))
                .map(String::trim).mapToInt(Integer::parseInt).toArray();

        // một lời gọi đơn lẻ phải thành công, nếu không thì kết quả các mức sau không có nghĩa
        assertThat(service.assess(wav, text).words()).isNotEmpty();

        for (int level : levels) {
            Outcome outcome = fire(service, wav, text, level);
            System.out.printf("[azure-probe] concurrent=%d ok=%d busy=%d unavailable=%d other=%d avgMs=%d%n",
                    level, outcome.ok, outcome.busy, outcome.unavailable, outcome.other, outcome.avgMs);
        }
    }

    private static Outcome fire(AzurePronunciationScoringService service, byte[] wav, String text, int level)
            throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(level);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Object[]>> futures = new ArrayList<>();
        try {
            for (int i = 0; i < level; i++) {
                futures.add(pool.submit(() -> {
                    start.await();
                    long begin = System.nanoTime();
                    Object result;
                    try {
                        service.assess(wav, text);
                        result = "ok";
                    } catch (BusinessException e) {
                        result = e.getErrorCode().name();
                    } catch (RuntimeException e) {
                        result = "other";
                    }
                    return new Object[] {result, (System.nanoTime() - begin) / 1_000_000};
                }));
            }
            start.countDown();
            Outcome outcome = new Outcome();
            long totalMs = 0;
            for (Future<Object[]> f : futures) {
                Object[] r = f.get();
                totalMs += (Long) r[1];
                switch ((String) r[0]) {
                    case "ok" -> outcome.ok++;
                    case "SHADOWING_SCORING_BUSY" -> outcome.busy++;
                    case "SHADOWING_SCORING_UNAVAILABLE" -> outcome.unavailable++;
                    default -> outcome.other++;
                }
            }
            outcome.avgMs = totalMs / level;
            return outcome;
        } finally {
            pool.shutdownNow();
        }
    }

    private static final class Outcome {
        int ok;
        int busy;
        int unavailable;
        int other;
        long avgMs;
    }
}
