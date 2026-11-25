package com.lingualoop.backend.vocab.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.subscription.service.SubscriptionQueryService;
import com.lingualoop.backend.vocab.dto.NewWordsSuggestion;
import com.lingualoop.backend.vocab.repository.VocabSuggestionRepository;
import com.lingualoop.backend.vocab.repository.VocabSuggestionRepository.PartCandidate;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class VocabSuggestionServiceImpl implements VocabSuggestionService {

    /** Số thẻ của một lượt học từ mới (BR-HT-19). */
    static final int ROUND_SIZE = 10;

    /** Các cấp độ CEFR từ thấp lên cao; vị trí trong danh sách là thứ hạng khi so khoảng cách giữa hai cấp. */
    private static final List<String> LEVELS = List.of("A1", "A2", "B1", "B2", "C1", "C2");

    private final VocabSuggestionRepository repository;
    private final SubscriptionQueryService subscriptions;

    @Override
    public Optional<NewWordsSuggestion> nextNewWords(UUID userId, String currentLevel) {
        return pick(repository.findParts(userId, subscriptions.isPro(userId)), currentLevel);
    }

    /**
     * Chọn phần gợi ý từ các phần đã xếp theo thứ tự bộ rồi thứ tự phần (BR-HT-32). Ưu tiên bộ học viên đang học (chấm
     * thẻ gần nhất) còn thẻ Mới; không có thì {@link #starterDeckPart bộ khởi đầu theo cấp độ}.
     */
    static Optional<NewWordsSuggestion> pick(List<PartCandidate> parts, String currentLevel) {
        Map<UUID, Instant> lastStudied = new HashMap<>();
        for (PartCandidate part : parts) {
            if (part.lastStudied() != null) {
                lastStudied.merge(part.deckId(), part.lastStudied(), (a, b) -> a.isAfter(b) ? a : b);
            }
        }

        PartCandidate chosen = null;
        boolean continuing = false;
        for (PartCandidate part : parts) {
            Instant last = lastStudied.get(part.deckId());
            if (part.newCards() > 0 && last != null
                    && (chosen == null || last.isAfter(lastStudied.get(chosen.deckId())))) {
                chosen = firstWithNewCards(parts, part.deckId());
                continuing = true;
            }
        }
        if (chosen == null) {
            chosen = starterDeckPart(parts, currentLevel);
        }
        if (chosen == null) {
            return Optional.empty();
        }
        return Optional.of(new NewWordsSuggestion(chosen.deckId(), chosen.deckName(), chosen.partNumber(),
                chosen.partName(), Math.min(ROUND_SIZE, chosen.newCards()), continuing));
    }

    /**
     * Phần đầu tiên còn thẻ Mới của bộ khởi đầu: bộ cùng cấp độ với học viên, không có thì bộ gần nhất ở dưới, rồi gần nhất
     * ở trên, cuối cùng bộ chưa gắn cấp độ; cùng mức thì bộ hệ thống trước bộ của giáo viên, rồi theo thứ tự hiển thị.
     */
    private static PartCandidate starterDeckPart(List<PartCandidate> parts, String currentLevel) {
        int current = Math.max(0, levelIndex(currentLevel));
        Comparator<PartCandidate> byLevel = Comparator
                .comparingInt((PartCandidate p) -> levelRank(p.cefrLevel(), current))
                .thenComparingInt(p -> levelDistance(p.cefrLevel(), current))
                .thenComparingInt(p -> p.systemDeck() ? 0 : 1);
        PartCandidate best = parts.stream().filter(p -> p.newCards() > 0).min(byLevel).orElse(null);
        // Trong bộ được chọn lấy phần đầu tiên còn thẻ Mới, không phải phần đầu của bộ khác cùng thứ hạng.
        return best == null ? null : firstWithNewCards(parts, best.deckId());
    }

    /** 0 cùng cấp, 1 thấp hơn, 2 cao hơn, 3 chưa gắn cấp độ. */
    private static int levelRank(String level, int current) {
        int index = levelIndex(level);
        if (index < 0) {
            return 3;
        }
        return index == current ? 0 : index < current ? 1 : 2;
    }

    private static int levelDistance(String level, int current) {
        int index = levelIndex(level);
        return index < 0 ? 0 : Math.abs(index - current);
    }

    /** Vị trí của cấp độ trong {@link #LEVELS}; -1 khi trống hoặc không hợp lệ ({@code List.of} ném lỗi với null). */
    private static int levelIndex(String level) {
        return level == null ? -1 : LEVELS.indexOf(level);
    }

    private static PartCandidate firstWithNewCards(List<PartCandidate> parts, UUID deckId) {
        return parts.stream().filter(p -> p.deckId().equals(deckId) && p.newCards() > 0).findFirst().orElseThrow();
    }
}
