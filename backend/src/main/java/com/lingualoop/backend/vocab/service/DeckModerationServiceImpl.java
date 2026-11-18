package com.lingualoop.backend.vocab.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.vocab.entity.VocabDeck;
import com.lingualoop.backend.vocab.repository.VocabDeckManageRepository;
import com.lingualoop.backend.vocab.repository.VocabDeckManageRepository.DeckStateRow;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class DeckModerationServiceImpl implements DeckModerationService {

    private final VocabDeckManageRepository repository;

    @Override
    @Transactional
    public void unpublishForReport(UUID deckId, String reason) {
        repository.lockState(deckId)
                .filter(d -> VocabDeck.KIND_LIBRARY.equals(d.getKind()) && d.getDeletedAt() == null)
                .filter(d -> VocabDeck.STATUS_PUBLISHED.equals(d.getStatus()))
                .ifPresent(d -> repository.updateStatus(deckId, VocabDeck.STATUS_DRAFT, reason));
    }

    @Override
    @Transactional
    public void publishApproved(UUID deckId) {
        DeckStateRow deck = repository.lockState(deckId)
                .filter(d -> VocabDeck.KIND_LIBRARY.equals(d.getKind()) && d.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException(ErrorCode.VOCAB_DECK_NOT_FOUND));
        boolean noGroups = repository.countGroups(deck.getId()) == 0;
        List<String> emptyGroups = repository.findEmptyGroupNames(deck.getId());
        if (noGroups || !emptyGroups.isEmpty()) {
            throw new BusinessException(ErrorCode.VOCAB_DECK_NOT_PUBLISHABLE,
                    Map.of("noGroups", noGroups, "emptyGroups", emptyGroups));
        }
        repository.updateStatus(deck.getId(), VocabDeck.STATUS_PUBLISHED, null);
    }
}
