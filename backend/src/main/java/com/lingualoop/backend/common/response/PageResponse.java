package com.lingualoop.backend.common.response;

import java.util.List;

import org.springframework.data.domain.Page;

/** Một trang dữ liệu; {@code page} đánh số từ 0 giống Spring Data. */
public record PageResponse<T>(List<T> items, int page, int size, long totalElements, int totalPages) {

    public PageResponse {
        items = List.copyOf(items);
    }

    /** Trang tự phân trang bằng LIMIT/OFFSET: tính {@code totalPages} từ tổng số dòng. */
    public static <T> PageResponse<T> of(List<T> items, int page, int size, long totalElements) {
        return new PageResponse<>(items, page, size, totalElements, (int) ((totalElements + size - 1) / size));
    }

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
