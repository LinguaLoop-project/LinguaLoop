package com.lingualoop.backend.shadowing.service;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.shadowing.dto.ShadowingAttemptResponse.MouthVideo;
import com.lingualoop.backend.shadowing.entity.Phoneme;
import com.lingualoop.backend.shadowing.repository.PhonemeRepository;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;

import lombok.RequiredArgsConstructor;

/**
 * Mẹo sửa và video khẩu hình cho các âm của lượt (bấm âm nào cũng xem được). Mẹo lấy từ {@link PhonemeTips} (tệp {@code pronunciation-tips.json}),
 * âm chưa có mẹo thì không hiện (mô tả chung của bảng {@code phonemes} soạn theo giọng Anh, có thể trái bài giọng Mỹ); video chỉ mở
 * cho gói có tính năng {@code mouth_video} (hạn mức 0 thì khoá ở server: không bao giờ trả đường dẫn cho Free).
 */
@Service
@RequiredArgsConstructor
class PronunciationHints {

    record Hint(String tip, MouthVideo mouthVideo) {
    }

    private final PhonemeRepository phonemes;
    private final SubscriptionQueryService subscriptionQueryService;
    private final PhonemeTips tips;

    /** @param symbols ký hiệu theo bảng phonemes; âm không có mẹo cũng không có video thì không có trong kết quả */
    @Transactional(readOnly = true)
    public Map<String, Hint> hintsFor(UUID userId, Collection<String> symbols) {
        if (symbols.isEmpty()) {
            return Map.of();
        }
        Map<String, Phoneme> bySymbol = new HashMap<>();
        for (Phoneme p : phonemes.findAll()) {
            if (symbols.contains(p.getSymbol())) {
                bySymbol.put(p.getSymbol(), p);
            }
        }
        boolean locked = !subscriptionQueryService.isPro(userId);

        Map<String, Hint> result = new HashMap<>();
        for (Phoneme p : bySymbol.values()) {
            MouthVideo video = p.getMouthVideoUrl() == null ? null
                    : new MouthVideo(locked ? null : p.getMouthVideoUrl(), locked);
            String tip = tips.tipFor(p.getSymbol()).orElse(null);
            if (tip != null || video != null) {
                result.put(p.getSymbol(), new Hint(tip, video));
            }
        }
        return result;
    }
}
