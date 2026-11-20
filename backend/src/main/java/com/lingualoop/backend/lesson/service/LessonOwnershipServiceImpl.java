package com.lingualoop.backend.lesson.service;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.lesson.dto.OwnedLessonView;
import com.lingualoop.backend.lesson.repository.LessonOwnershipRepository;
import com.lingualoop.backend.lesson.repository.LessonOwnershipRepository.OwnedRow;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
class LessonOwnershipServiceImpl implements LessonOwnershipService {

    private final LessonOwnershipRepository repository;

    @Override
    public List<OwnedLessonView> lockLibraryLessons(Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        return repository.lockLibraryByIds(ids).stream().map(LessonOwnershipServiceImpl::toView).toList();
    }

    @Override
    public List<OwnedLessonView> lockLibraryLessonsOf(UUID ownerId) {
        return repository.lockLibraryByOwner(ownerId).stream().map(LessonOwnershipServiceImpl::toView).toList();
    }

    @Override
    public Set<String> activeTitlesLower(UUID ownerId) {
        return new HashSet<>(repository.activeTitlesLower(ownerId));
    }

    @Override
    public int changeOwner(Collection<UUID> lessonIds, UUID newOwnerId) {
        if (lessonIds.isEmpty()) {
            return 0;
        }
        return repository.changeOwner(lessonIds, newOwnerId);
    }

    private static OwnedLessonView toView(OwnedRow row) {
        return new OwnedLessonView(row.getId(), row.getTitle(), row.getOwnerId(), row.getStatus());
    }
}
