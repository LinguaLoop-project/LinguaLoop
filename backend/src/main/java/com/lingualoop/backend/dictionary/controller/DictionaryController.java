package com.lingualoop.backend.dictionary.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.dictionary.dto.WordView;
import com.lingualoop.backend.dictionary.service.DictionaryQueryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/dictionary")
@RequiredArgsConstructor
public class DictionaryController {

    private final DictionaryQueryService dictionaryQueryService;

    /** Tra một từ khi bấm vào chữ trong bài học. */
    @GetMapping("/word/{word}")
    public ApiResponse<WordView> lookup(@PathVariable String word) {
        return ApiResponse.ok(dictionaryQueryService.lookup(word)
                .orElseThrow(() -> new BusinessException(ErrorCode.DICTIONARY_WORD_NOT_FOUND)));
    }

    /** Tìm trong kho từ điển ở ô tìm kiếm; không có kết quả thì trả mảng rỗng. */
    @GetMapping("/search")
    public ApiResponse<List<WordView>> search(
            @RequestParam String word,
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok(dictionaryQueryService.search(word, limit));
    }
}
