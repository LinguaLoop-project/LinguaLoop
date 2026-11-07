package com.lingualoop.backend.vocab.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;
import com.lingualoop.backend.vocab.dto.DeckView;
import com.lingualoop.backend.vocab.repository.VocabDeckRepository;
import com.lingualoop.backend.vocab.repository.VocabDeckRepository.DeckRow;
import com.lingualoop.backend.vocab.repository.VocabDeckRepository.OverviewRow;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class VocabDeckServiceImpl implements VocabDeckService {

    /** Số phần đầu của bộ Pro mà gói Free học được (BR-VOCAB-05). */
    static final int FREE_PARTS_OF_PRO_DECK = 2;
    private static final int SAMPLE_WORDS = 8;

    private final VocabDeckRepository decks;
    private final SubscriptionQueryService subscriptions;
    private final CardAudioUrls audio;

    @Override
    public DeckView.ListResult list(UUID userId) {
        OverviewRow overview = decks.findOverview(userId);
        List<DeckView.Summary> summaries = decks.findDecks(userId, null).stream().map(VocabDeckServiceImpl::toSummary).toList();
        return new DeckView.ListResult(
                new DeckView.Overview((int) overview.getDue(), (int) overview.getLearning(),
                        (int) overview.getReviewing(), (int) overview.getMastered()),
                summaries);
    }

    @Override
    public DeckView.Detail detail(UUID userId, String slug) {
        DeckRow row = decks.findDecks(userId, slug).stream().findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND));
        boolean userPro = subscriptions.isPro(userId);
        List<DeckView.Part> parts = decks.findParts(userId, row.getId()).stream()
                .map(p -> new DeckView.Part(p.getIdx(), p.getName(), p.getNameVi(), (int) p.getCardCount(),
                        (int) p.getStudiedCount(), isLocked(row.getPro(), userPro, p.getIdx())))
                .toList();
        List<DeckView.SampleWord> sample = decks.findSampleCards(row.getId(), SAMPLE_WORDS).stream()
                .map(s -> new DeckView.SampleWord(s.getWord(), s.getPos(), s.getTranslationVi(), s.getIpaUk(),
                        s.getIpaUs(), audio.resolve(s.getAudioUs())))
                .toList();
        return new DeckView.Detail(toSummary(row), parts, sample);
    }

    /** Phần bị khoá khi bộ là Pro, người học dùng gói Free và phần (tính từ 0) nằm sau các phần miễn phí (BR-VOCAB-05). */
    static boolean isLocked(boolean deckPro, boolean userPro, int partIndex) {
        return deckPro && !userPro && partIndex >= FREE_PARTS_OF_PRO_DECK;
    }

    private static DeckView.Category toCategory(DeckRow row) {
        return row.getCategorySlug() == null ? null
                : new DeckView.Category(row.getCategorySlug(), row.getCategoryName(), row.getCategoryNameVi());
    }

    private static DeckView.Summary toSummary(DeckRow row) {
        int cards = (int) row.getCardCount();
        int mastered = (int) row.getMastered();
        int reviewing = (int) row.getReviewing();
        int learning = (int) row.getLearning();
        return new DeckView.Summary(row.getId(), row.getSlug(), row.getName(), row.getNameVi(), row.getCefrLevel(),
                row.getPro(), row.getThumbnailUrl(), toCategory(row), cards, (int) row.getGroupCount(),
                new DeckView.Progress(mastered, reviewing, learning, cards - mastered - reviewing - learning),
                (int) row.getDue());
    }
}
