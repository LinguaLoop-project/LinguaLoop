package com.lingualoop.backend.dictionary.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.dictionary.dto.WordView;
import com.lingualoop.backend.dictionary.entity.DictionaryWord;
import com.lingualoop.backend.dictionary.mapper.WordViewMapper;
import com.lingualoop.backend.dictionary.repository.DictionaryWordRepository;
import com.lingualoop.backend.dictionary.util.WordNormalizer;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class DictionaryQueryServiceImpl implements DictionaryQueryService {

    private final DictionaryWordRepository repository;
    private final WordViewMapper mapper;

    @Override
    public Optional<WordView> lookup(String word) {
        return WordNormalizer.normalize(word)
                .flatMap(repository::findByHeadwordWithLemma)
                .filter(DictionaryQueryServiceImpl::hasContent)
                .map(mapper::toView);
    }

    @Override
    public List<WordView> search(String query, int limit) {
        Optional<String> q = WordNormalizer.normalize(query);
        if (q.isEmpty()) {
            return List.of();
        }
        int capped = Math.clamp(limit, 1, MAX_LIMIT);
        List<UUID> ids = repository.searchIds(q.get(), WordNormalizer.escapeLike(q.get()) + "%", capped);
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<UUID, DictionaryWord> byId = repository.findAllWithLemmaByIdIn(ids).stream()
                .collect(Collectors.toMap(DictionaryWord::getId, Function.identity()));
        return ids.stream().map(byId::get).map(mapper::toView).toList();
    }

    private static boolean hasContent(DictionaryWord w) {
        return !w.getMeanings().isEmpty() || w.getLemma() != null;
    }
}
