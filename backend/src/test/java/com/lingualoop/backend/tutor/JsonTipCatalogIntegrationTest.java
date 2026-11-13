package com.lingualoop.backend.tutor;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.shadowing.service.PhonemeTips;

/** Mẹo của gia sư đọc từ tệp pronunciation-tips.json và phải phủ đủ các âm của bảng phonemes (đã nạp bằng migration). */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class JsonTipCatalogIntegrationTest {

    @Autowired private TipCatalog tips;
    @Autowired private PhonemeTips phonemeTips;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void everyPhonemeOfTheTableHasATip_andAnUnknownOneHasNone() {
        for (String symbol : jdbc.queryForList("SELECT symbol FROM phonemes", String.class)) {
            assertThat(tips.tipFor(symbol)).as("mẹo của /%s/", symbol).isPresent();
        }
        assertThat(tips.tipFor("zzz")).isEmpty();
        assertThat(tips.tipFor(null)).isEmpty();
    }

    @Test
    void theTipIsTheOneStoredInTheFile() {
        assertThat(tips.tipFor("θ")).contains(phonemeTips.all().get("θ"));
    }
}
