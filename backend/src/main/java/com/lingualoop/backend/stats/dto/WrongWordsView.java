package com.lingualoop.backend.stats.dto;

import java.util.List;

import com.lingualoop.backend.practice.dto.WrongWordView;

/** Tối đa 10 từ nghe sai nhiều nhất trong khoảng đã chọn (BR-TH-16), nhiều lần sai nhất trước. */
public record WrongWordsView(String range, List<WrongWordView> words) {

    public WrongWordsView {
        words = List.copyOf(words);
    }
}
