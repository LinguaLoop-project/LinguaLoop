package com.lingualoop.backend.tutor;

import java.util.Optional;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.shadowing.service.PhonemeTips;

import lombok.RequiredArgsConstructor;

/** Mẹo của gia sư lấy từ tệp tĩnh {@code pronunciation-tips.json}, cùng nguồn với mẹo hiện sau lượt đọc. */
@Component
@RequiredArgsConstructor
class JsonTipCatalog implements TipCatalog {

    private final PhonemeTips tips;

    @Override
    public Optional<String> tipFor(String phoneme) {
        return tips.tipFor(phoneme);
    }
}
