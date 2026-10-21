package com.lingualoop.backend.practice.dto;

/** Số cơ hội (từ được chấm) và số lỗi của một nhóm từ. */
public record ClassCountsView(long opportunities, long errors) {
}
