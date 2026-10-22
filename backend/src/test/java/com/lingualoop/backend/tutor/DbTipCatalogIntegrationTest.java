package com.lingualoop.backend.tutor;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;

/** Mẹo của gia sư đọc từ bảng phoneme_confusions (đã nạp bằng migration). */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class DbTipCatalogIntegrationTest {

    @Autowired private TipCatalog tips;
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
    void theTipIsTheOneStoredInTheTable() {
        String stored = jdbc.queryForObject("""
                SELECT c.tip_vi FROM phoneme_confusions c JOIN phonemes p ON p.id = c.target_phoneme_id
                WHERE p.symbol = 'θ' AND c.l1 = 'vi' AND c.produced_phoneme_id IS NULL""", String.class);

        assertThat(tips.tipFor("θ")).contains(stored);
    }
}
