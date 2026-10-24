package com.lingualoop.backend.dictionary.service;

import java.util.List;
import java.util.Optional;

import com.lingualoop.backend.dictionary.dto.WordView;

public interface DictionaryQueryService {

    int MAX_LIMIT = 30;

    Optional<WordView> lookup(String word);

    List<WordView> search(String query, int limit);
}
