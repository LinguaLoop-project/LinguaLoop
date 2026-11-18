package com.lingualoop.backend.vocab.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.vocab.dto.CardImportView;
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.CardRequest;
import com.lingualoop.backend.vocab.dto.request.GroupRequest;
import com.lingualoop.backend.vocab.service.VocabDeckContentService.TemplateFormat;
import com.lingualoop.backend.vocab.service.VocabDeckContentServiceImpl.Actor;

import lombok.RequiredArgsConstructor;

/** Cửa vào của học viên: kiểm vai trò rồi giao cho lõi chung với tư cách {@link Actor#LEARNER}. */
@Service
@RequiredArgsConstructor
class MyDeckContentServiceImpl implements MyDeckContentService {

    private final StudentGuard guard;
    private final VocabDeckContentServiceImpl core;
    private final VocabDeckManageService manage;

    @Override
    public DeckManageView.Detail detail(UUID learnerId, UUID deckId) {
        guard.require(learnerId);
        return manage.getForLearner(learnerId, deckId);
    }

    @Override
    public PageResponse<DeckManageView.Card> cards(UUID learnerId, UUID deckId, UUID groupId, String q, int page) {
        guard.require(learnerId);
        return manage.listCardsForLearner(learnerId, deckId, groupId, q, page);
    }

    @Override
    public DeckManageView.Group addGroup(UUID learnerId, UUID deckId, GroupRequest request) {
        guard.require(learnerId);
        return core.addGroup(Actor.LEARNER, learnerId, deckId, request);
    }

    @Override
    public DeckManageView.Group renameGroup(UUID learnerId, UUID deckId, UUID groupId, GroupRequest request) {
        guard.require(learnerId);
        return core.renameGroup(Actor.LEARNER, learnerId, deckId, groupId, request);
    }

    @Override
    public void deleteGroup(UUID learnerId, UUID deckId, UUID groupId) {
        guard.require(learnerId);
        core.deleteGroup(Actor.LEARNER, learnerId, deckId, groupId);
    }

    @Override
    public DeckManageView.Card addCard(UUID learnerId, UUID deckId, UUID groupId, CardRequest request) {
        guard.require(learnerId);
        return core.addCard(Actor.LEARNER, learnerId, deckId, groupId, request);
    }

    @Override
    public DeckManageView.Card updateCard(UUID learnerId, UUID deckId, UUID groupId, UUID cardId,
            CardRequest request) {
        guard.require(learnerId);
        return core.updateCard(Actor.LEARNER, learnerId, deckId, groupId, cardId, request);
    }

    @Override
    public void deleteCard(UUID learnerId, UUID deckId, UUID groupId, UUID cardId) {
        guard.require(learnerId);
        core.deleteCard(Actor.LEARNER, learnerId, deckId, groupId, cardId);
    }

    @Override
    public CardImportView.Preview previewImport(UUID learnerId, UUID deckId, UUID groupId, String filename,
            byte[] content) {
        guard.require(learnerId);
        return core.previewImport(Actor.LEARNER, learnerId, deckId, groupId, filename, content);
    }

    @Override
    public CardImportView.Result importCards(UUID learnerId, UUID deckId, UUID groupId, String filename,
            byte[] content) {
        guard.require(learnerId);
        return core.importCards(Actor.LEARNER, learnerId, deckId, groupId, filename, content);
    }

    @Override
    public byte[] importTemplate(TemplateFormat format) {
        return core.importTemplate(format);
    }
}
