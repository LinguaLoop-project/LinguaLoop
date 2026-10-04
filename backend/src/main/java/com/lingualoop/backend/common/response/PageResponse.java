package com.lingualoop.backend.common.response;

import java.util.List;

import org.springframework.data.domain.Page;

/** Một trang dữ liệu; {@code page} đánh số từ 0 giống Spring Data. */
public record PageResponse<T>(List<T> items, int page, int size, long totalElements, int totalPages) {

    public PageResponse {
        items = List.copyOf(items);
    }

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
