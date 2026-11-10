package com.lingualoop.backend.tutor;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.shadowing.entity.Phoneme;
import com.lingualoop.backend.shadowing.repository.PhonemeRepository;

import lombok.RequiredArgsConstructor;

/**
 * Mẹo đọc từ cột {@code phonemes.tip_vi} (tiếng mẹ đẻ Việt). Là dữ liệu tham chiếu nạp bằng
 * migration nên đọc một lần rồi giữ trong bộ nhớ.
 */
@Component
@RequiredArgsConstructor
class DbTipCatalog implements TipCatalog {

    private final PhonemeRepository phonemes;
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
        Map<String, String> result = new HashMap<>();
        for (Phoneme p : phonemes.findAll()) {
            if (p.getTipVi() != null) {
                result.put(p.getSymbol(), p.getTipVi());
            }
        }
        return Map.copyOf(result);
    }
}
