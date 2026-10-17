package com.lingualoop.backend.dictation.service;

import java.util.List;

/** Tách và phân loại từ của một câu: bộ tách từ duy nhất cho chọn ô, chấm và chọn câu luyện. */
public interface SentenceTokenService {

    List<SentenceToken> tokenize(String sentenceText);
}
