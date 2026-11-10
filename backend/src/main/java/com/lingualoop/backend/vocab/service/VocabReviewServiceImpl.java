package com.lingualoop.backend.vocab.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;
import com.lingualoop.backend.vocab.dto.LearnView;
import com.lingualoop.backend.vocab.dto.ReviewView;
import com.lingualoop.backend.vocab.repository.VocabDeckRepository;
import com.lingualoop.backend.vocab.repository.VocabDeckRepository.DeckRow;
import com.lingualoop.backend.vocab.repository.VocabLearnRepository;
import com.lingualoop.backend.vocab.repository.VocabReviewRepository;
import com.lingualoop.backend.vocab.repository.VocabReviewRepository.DueCard;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class VocabReviewServiceImpl implements VocabReviewService {

    private final VocabDeckRepository decks;
    private final VocabReviewRepository review;
    private final VocabLearnRepository learn;
    private final SubscriptionQueryService subscriptions;
    private final CardViews cardViews;

    @Override
    public ReviewView.Queue queue(UUID userId, String deckSlug) {
        boolean userPro = subscriptions.isPro(userId);
        DeckRow deck = deckSlug == null ? null : deckOrThrow(userId, deckSlug, userPro);
        List<LearnView.Card> cards = review.findDue(userId, deckSlug, userPro).stream().map(this::toCard).toList();
        int dueTotal = review.countDue(userId, deckSlug, userPro);
        return new ReviewView.Queue(
                deck == null ? null : new LearnView.DeckRef(deck.getSlug(), deck.getName(), deck.getNameVi(), deck.getPro()),
                cards, dueTotal, review.findNextDueAt(userId, deckSlug, userPro));
    }

    @Override
    @Transactional
    public LearnView.SessionRef openSession(UUID userId, String deckSlug) {
        DeckRow deck = deckSlug == null ? null : deckOrThrow(userId, deckSlug, subscriptions.isPro(userId));
        return new LearnView.SessionRef(learn.openSession(userId, deck == null ? null : deck.getId(), null, "review"));
    }

    private DeckRow deckOrThrow(UUID userId, String slug, boolean userPro) {
        return decks.findDecks(userId, slug, userPro).stream().findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND));
    }

    private LearnView.Card toCard(DueCard due) {
        LearnView.LessonRef lesson = due.lessonSlug() == null ? null : new LearnView.LessonRef(due.lessonSlug(), due.lessonTitle());
        return cardViews.of(due.card(), due.contextEn(), due.contextVi(), lesson);
    }
}
