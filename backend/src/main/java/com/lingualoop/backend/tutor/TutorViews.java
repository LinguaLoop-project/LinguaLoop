package com.lingualoop.backend.tutor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.shadowing.repository.PhonemeRepository;
import com.lingualoop.backend.tutor.dto.TutorDtos;
import com.lingualoop.backend.tutor.entity.TutorSession;
import com.lingualoop.backend.tutor.entity.TutorSessionWord;

import lombok.RequiredArgsConstructor;

/** Dựng dữ liệu hiển thị của phiên (từ, âm, mẹo) từ các dòng đã lưu. */
@Component
@RequiredArgsConstructor
class TutorViews {

    private final PhonemeRepository phonemes;
    private final TipCatalog tipCatalog;

    TutorDtos.WordView word(TutorSessionWord w, Map<Short, String> symbolById) {
        String phoneme = w.getFocusPhonemeId() == null ? null : symbolById.get(w.getFocusPhonemeId());
        return new TutorDtos.WordView(w.getWord(), phoneme, w.getScoreBefore().doubleValue(), w.best(), w.getAttempts(),
                TutorDtos.wire(w.getStatus()), phoneme == null ? null : tipCatalog.tipFor(phoneme).orElse(null));
    }

    List<TutorDtos.WordView> words(TutorSession session) {
        Map<Short, String> symbolById = symbolById();
        return session.getWords().stream().map(w -> word(w, symbolById)).toList();
    }

    Map<Short, String> symbolById() {
        Map<Short, String> map = new HashMap<>();
        phonemes.findAll().forEach(p -> map.put(p.getId(), p.getSymbol()));
        return map;
    }
}
