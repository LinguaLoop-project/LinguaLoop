package com.lingualoop.backend.vocab.service;

import java.time.Instant;
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

    private final VocabSuggestionRepository repository;
    private final SubscriptionQueryService subscriptions;

    @Override
    public Optional<NewWordsSuggestion> nextNewWords(UUID userId) {
        return pick(repository.findParts(userId, subscriptions.isPro(userId)));
    }

    /**
     * Chọn phần gợi ý từ các phần đã xếp theo thứ tự bộ rồi thứ tự phần. Ưu tiên bộ học viên đang học (chấm thẻ gần
     * nhất) còn thẻ Mới; không có thì bộ hệ thống đầu tiên còn thẻ Mới, rồi tới bộ của giáo viên.
     */
    static Optional<NewWordsSuggestion> pick(List<PartCandidate> parts) {
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
            chosen = parts.stream().filter(p -> p.newCards() > 0 && p.systemDeck()).findFirst()
                    .or(() -> parts.stream().filter(p -> p.newCards() > 0).findFirst())
                    .orElse(null);
        }
        if (chosen == null) {
            return Optional.empty();
        }
        return Optional.of(new NewWordsSuggestion(chosen.deckId(), chosen.deckName(), chosen.partNumber(),
                chosen.partName(), Math.min(ROUND_SIZE, chosen.newCards()), continuing));
    }

    private static PartCandidate firstWithNewCards(List<PartCandidate> parts, UUID deckId) {
        return parts.stream().filter(p -> p.deckId().equals(deckId) && p.newCards() > 0).findFirst().orElseThrow();
    }
}
