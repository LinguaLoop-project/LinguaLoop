package com.lingualoop.backend.report.dto.request;

/** Ghi chú xử lý hoặc lý do từ chối, bắt buộc, 1 đến 500 ký tự (BR-XL-04). */
public record HandleReportRequest(String note) {
}
