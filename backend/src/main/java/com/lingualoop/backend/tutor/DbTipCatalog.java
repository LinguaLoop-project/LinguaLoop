package com.lingualoop.backend.tutor;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.shadowing.entity.Phoneme;
import com.lingualoop.backend.shadowing.entity.PhonemeConfusion;
import com.lingualoop.backend.shadowing.repository.PhonemeConfusionRepository;
import com.lingualoop.backend.shadowing.repository.PhonemeRepository;

import lombok.RequiredArgsConstructor;

/**
 * Mẹo đọc từ {@code phoneme_confusions} (mẹo chung theo âm đích, tiếng mẹ đẻ Việt). Là dữ liệu tham chiếu nạp bằng
 * migration nên đọc một lần rồi giữ trong bộ nhớ.
 */
@Component
@RequiredArgsConstructor
class DbTipCatalog implements TipCatalog {

    private static final String L1 = "vi";

    private final PhonemeRepository phonemes;
    private final PhonemeConfusionRepository confusions;
    private volatile Map<String, String> tips;

    @Override
    public Optional<String> tipFor(String phoneme) {
        return phoneme == null ? Optional.empty() : Optional.ofNullable(tips().get(phoneme));
    }

    private Map<String, String> tips() {
        Map<String, String> loaded = tips;
        if (loaded == null) {
            synchronized (this) {
                if (tips == null) {
                    tips = load();
                }
                loaded = tips;
            }
        }
        return loaded;
    }

    private Map<String, String> load() {
        Map<Short, String> symbolById = new HashMap<>();
        for (Phoneme p : phonemes.findAll()) {
            symbolById.put(p.getId(), p.getSymbol());
        }
        Map<String, String> result = new HashMap<>();
        for (PhonemeConfusion c : confusions.findGeneralTips(L1, symbolById.keySet())) {
            result.put(symbolById.get(c.getTargetPhonemeId()), c.getTipVi());
        }
        return Map.copyOf(result);
    }
}
