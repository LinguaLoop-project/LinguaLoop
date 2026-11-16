package com.lingualoop.backend.report.service;

import java.util.UUID;

import com.lingualoop.backend.report.dto.request.SubmitReportRequest;

/** Học viên gửi báo cáo về một câu hoặc một thẻ (UC-BC-01). */
public interface ReportSubmitService {

    /**
     * Lưu báo cáo kèm bản chụp nội dung (BR-BC-10), định tuyến theo lý do: Phản cảm vào Chờ quản trị viên, các lý do
     * khác vào Chờ giáo viên (BR-BC-03). Loại nội dung, lý do, bản sửa hay mô tả sai ném {@code FieldValidationException}
     * (BR-BC-05, 06); nội dung không còn hiển thị cho học viên ném {@code REPORT_TARGET_NOT_FOUND} (BR-BC-01); báo cáo
     * trùng còn mở của chính học viên ném {@code REPORT_DUPLICATE} (BR-BC-08).
     */
    void submit(UUID studentId, SubmitReportRequest request);
}
