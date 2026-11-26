package com.lingualoop.backend.report.repository;

import java.util.UUID;

import com.lingualoop.backend.report.enums.ReportStatus;

/** Một báo cáo vừa được đóng kèm trạng thái trước khi đóng, để nhật ký ghi trạng thái cũ và mới (BR-NK-03). */
public record ClosedReport(UUID id, ReportStatus from) {
}
