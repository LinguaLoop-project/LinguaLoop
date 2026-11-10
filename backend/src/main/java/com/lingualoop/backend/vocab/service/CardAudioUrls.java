package com.lingualoop.backend.vocab.service;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.dictionary.service.DictionaryQueryService;

import lombok.RequiredArgsConstructor;

/**
 * Âm thanh của thẻ trong bộ từ vựng. Nguồn seed lưu URL đầy đủ nên dùng nguyên; thẻ chép từ từ điển (từ đã lưu) lưu
 * đường dẫn tương đối nên ghép với kho âm thanh như phần từ điển.
 */
@Component
@RequiredArgsConstructor
class CardAudioUrls {

    private final DictionaryQueryService dictionary;

    String resolve(String path) {
        if (path == null) {
            return null;
        }
        return path.regionMatches(true, 0, "http://", 0, 7) || path.regionMatches(true, 0, "https://", 0, 8)
                ? path
                : dictionary.resolveAudioUrl(path);
    }
}
