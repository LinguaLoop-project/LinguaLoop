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
    public ReviewView.Queue queue(UUID userId, UUID deckId) {
        boolean userPro = subscriptions.isPro(userId);
        DeckRow deck = deckId == null ? null : deckOrThrow(userId, deckId, userPro);
        List<LearnView.Card> cards = review.findDue(userId, deckId, userPro).stream().map(this::toCard).toList();
        int dueTotal = review.countDue(userId, deckId, userPro);
        return new ReviewView.Queue(
                deck == null ? null : new LearnView.DeckRef(deck.getId(), deck.getName(), deck.getPro()),
                cards, dueTotal, review.findNextDueAt(userId, deckId, userPro));
    }

    @Override
    @Transactional
    public LearnView.SessionRef openSession(UUID userId, UUID deckId) {
        DeckRow deck = deckId == null ? null : deckOrThrow(userId, deckId, subscriptions.isPro(userId));
        return new LearnView.SessionRef(learn.openSession(userId, deck == null ? null : deck.getId(), "review"));
    }

    private DeckRow deckOrThrow(UUID userId, UUID deckId, boolean userPro) {
        return decks.findDecks(userId, deckId, userPro).stream().findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND));
    }

    private LearnView.Card toCard(DueCard due) {
        LearnView.LessonRef lesson = due.lessonId() == null ? null : new LearnView.LessonRef(due.lessonId(), due.lessonTitle());
        return cardViews.of(due.card(), due.contextEn(), due.contextVi(), lesson);
    }
}
