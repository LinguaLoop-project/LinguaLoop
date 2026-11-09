package com.lingualoop.backend.vocab.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;
import com.lingualoop.backend.vocab.dto.DeckView;
import com.lingualoop.backend.vocab.dto.LearnView;
import com.lingualoop.backend.vocab.dto.request.AnswerRequest;
import com.lingualoop.backend.vocab.enums.CardStatus;
import com.lingualoop.backend.vocab.repository.VocabDeckRepository;
import com.lingualoop.backend.vocab.repository.VocabDeckRepository.DeckRow;
import com.lingualoop.backend.vocab.repository.VocabLearnRepository;
import com.lingualoop.backend.vocab.repository.VocabLearnRepository.CardAccess;
import com.lingualoop.backend.vocab.repository.VocabLearnRepository.GroupRow;
import com.lingualoop.backend.vocab.repository.VocabLearnRepository.ProgressRow;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class VocabLearnServiceImpl implements VocabLearnService {

    private final VocabDeckRepository decks;
    private final VocabLearnRepository learn;
    private final SubscriptionQueryService subscriptions;
    private final CardViews cardViews;

    @Override
    public LearnView.PartDetail part(UUID userId, String slug, int partNumber) {
        DeckRow deck = deckOrThrow(userId, slug);
        List<DeckView.Part> parts = partsOf(userId, deck);
        int index = partNumber - 1;
        GroupRow group = openPart(deck, parts, index);
        DeckView.Part current = parts.get(index);
        List<LearnView.Card> cards = learn.findCards(userId, group.id()).stream().map(cardViews::of).toList();
        return new LearnView.PartDetail(new LearnView.DeckRef(deck.getSlug(), deck.getName(), deck.getNameVi(), deck.getPro()),
                index, current.name(), current.nameVi(), parts, cards);
    }

    @Override
    @Transactional
    public LearnView.SessionRef openSession(UUID userId, String slug, int partNumber) {
        DeckRow deck = deckOrThrow(userId, slug);
        List<DeckView.Part> parts = partsOf(userId, deck);
        GroupRow group = openPart(deck, parts, partNumber - 1);
        return new LearnView.SessionRef(learn.openSession(userId, deck.getId(), group.id(), "learn"));
    }

    @Override
    @Transactional
    public LearnView.AnswerResult answer(UUID userId, UUID sessionId, AnswerRequest request) {
        if (!learn.sessionBelongsTo(sessionId, userId)) {
            throw new BusinessException(ErrorCode.VOCAB_SESSION_NOT_FOUND);
        }
        CardAccess access = learn.findCardAccess(request.cardId(), userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_CARD_NOT_FOUND));
        if (access.system() && VocabDeckServiceImpl.isLocked(access.pro(), subscriptions.isPro(userId), access.partIndex())) {
            throw new BusinessException(ErrorCode.VOCAB_PART_LOCKED);
        }

        // Mọi cách học đều chấm theo SM-2 (BR-HT-12): Flashcard do học viên chọn q, các cách khác quy đổi từ kết quả.
        boolean flashcard = request.mode() == AnswerRequest.Mode.FLASHCARD;
        if (flashcard && request.quality() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }
        int quality = flashcard ? request.quality() : Sm2.qualityOf(request.isCorrect(), request.isHintUsed());
        boolean correct = quality >= 3;

        boolean fresh = learn.insertLog(userId, request.cardId(), sessionId, request.answerId(), request.mode().dbValue(),
                correct, quality, request.responseMs());
        ProgressRow progress = learn.lockProgress(userId, request.cardId());
        if (!fresh) {
            return toResult(progress);
        }

        boolean isNew = CardStatus.fromDb(progress.status()) == CardStatus.NEW;
        Sm2.Result result = Sm2.grade(isNew ? Sm2.State.FRESH : stateOf(progress), quality);
        Instant next = Instant.now().plus(result.delay());
        learn.updateSchedule(userId, request.cardId(), result.status().dbValue(), result.state().repetitions(),
                result.state().intervalDays(), result.state().easiness(), next, correct);
        return new LearnView.AnswerResult(result.status(), next, result.state().intervalDays(), quality);
    }

    private DeckRow deckOrThrow(UUID userId, String slug) {
        return decks.findDecks(userId, slug, subscriptions.isPro(userId)).stream().findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND));
    }

    private List<DeckView.Part> partsOf(UUID userId, DeckRow deck) {
        boolean userPro = subscriptions.isPro(userId);
        return decks.findParts(userId, deck.getId()).stream()
                .map(p -> new DeckView.Part(p.getIdx(), p.getName(), p.getNameVi(), (int) p.getCardCount(),
                        (int) p.getStudiedCount(), VocabDeckServiceImpl.isLocked(deck.getPro(), userPro, p.getIdx())))
                .toList();
    }

    /** Phần ở vị trí {@code index}: 404 nếu không có, 403 nếu bị khoá. */
    private GroupRow openPart(DeckRow deck, List<DeckView.Part> parts, int index) {
        if (index < 0 || index >= parts.size()) {
            throw new BusinessException(ErrorCode.VOCAB_PART_NOT_FOUND);
        }
        if (parts.get(index).locked()) {
            throw new BusinessException(ErrorCode.VOCAB_PART_LOCKED);
        }
        return learn.findGroupAt(deck.getId(), index)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_PART_NOT_FOUND));
    }

    private static Sm2.State stateOf(ProgressRow progress) {
        return new Sm2.State(progress.repetitions(), progress.intervalDays(), progress.easiness());
    }

    private static LearnView.AnswerResult toResult(ProgressRow progress) {
        return new LearnView.AnswerResult(CardStatus.fromDb(progress.status()), progress.nextReviewAt(), progress.intervalDays(), null);
    }
}
