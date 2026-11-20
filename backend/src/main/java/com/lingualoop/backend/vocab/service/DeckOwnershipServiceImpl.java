package com.lingualoop.backend.vocab.service;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.vocab.dto.OwnedDeckView;
import com.lingualoop.backend.vocab.repository.DeckOwnershipRepository;
import com.lingualoop.backend.vocab.repository.DeckOwnershipRepository.OwnedRow;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
class DeckOwnershipServiceImpl implements DeckOwnershipService {

    private final DeckOwnershipRepository repository;

    @Override
    public List<OwnedDeckView> lockLibraryDecks(Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        return repository.lockLibraryByIds(ids).stream().map(DeckOwnershipServiceImpl::toView).toList();
    }

    @Override
    public List<OwnedDeckView> lockLibraryDecksOf(UUID ownerId) {
        return repository.lockLibraryByOwner(ownerId).stream().map(DeckOwnershipServiceImpl::toView).toList();
    }

    @Override
    public Set<String> activeNamesLower(UUID ownerId) {
        return new HashSet<>(repository.activeNamesLower(ownerId));
    }

    @Override
    public int changeOwner(Collection<UUID> deckIds, UUID newOwnerId) {
        if (deckIds.isEmpty()) {
            return 0;
        }
        return repository.changeOwner(deckIds, newOwnerId);
    }

    private static OwnedDeckView toView(OwnedRow row) {
        return new OwnedDeckView(row.getId(), row.getName(), row.getOwnerId(), row.getStatus());
    }
}
