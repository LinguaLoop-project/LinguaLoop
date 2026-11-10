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

    private static final int SAMPLE_WORDS = 8;

    private final VocabDeckRepository decks;
    private final SubscriptionQueryService subscriptions;
    private final CardAudioUrls audio;

    @Override
    public DeckView.ListResult list(UUID userId) {
        boolean userPro = subscriptions.isPro(userId);
        OverviewRow overview = decks.findOverview(userId, userPro);
        List<DeckView.Summary> summaries = decks.findDecks(userId, null, userPro).stream().map(VocabDeckServiceImpl::toSummary).toList();
        return new DeckView.ListResult(
                new DeckView.Overview((int) overview.getDue(), (int) overview.getLearning(),
                        (int) overview.getReviewing(), (int) overview.getMastered()),
                summaries);
    }

    @Override
    public DeckView.Detail detail(UUID userId, String slug) {
        boolean userPro = subscriptions.isPro(userId);
        DeckRow row = decks.findDecks(userId, slug, userPro).stream().findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND));
        List<DeckView.Part> parts = decks.findParts(userId, row.getId()).stream()
                .map(p -> new DeckView.Part(p.getIdx(), p.getName(), p.getNameVi(), (int) p.getCardCount(),
                        (int) p.getStudiedCount(), isLocked(row.getPro(), userPro)))
                .toList();
        List<DeckView.SampleWord> sample = decks.findSampleCards(row.getId(), SAMPLE_WORDS).stream()
                .map(s -> new DeckView.SampleWord(s.getWord(), s.getPos(), s.getTranslationVi(), s.getIpaUk(),
                        s.getIpaUs(), audio.resolve(s.getAudioUs())))
                .toList();
        return new DeckView.Detail(toSummary(row), parts, sample);
    }

    /**
     * Bộ Pro bị khoá với học viên gói Free: học viên thấy bộ kèm nhãn Pro nhưng không học được phần nào (BR-HT-07,
     * BR-BT-06, BR-PR-14).
     */
    static boolean isLocked(boolean deckPro, boolean userPro) {
        return deckPro && !userPro;
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
