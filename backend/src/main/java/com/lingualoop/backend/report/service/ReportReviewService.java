package com.lingualoop.backend.report.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.report.dto.ReportView;
import com.lingualoop.backend.report.dto.request.ReportListQuery;

/**
 * Giáo viên và quản trị viên xem và xử lý báo cáo (UC-XL-01 đến UC-XL-03). Trang đánh số từ 0, 10 dòng mỗi trang. Một
 * thao tác trên báo cáo áp dụng cho cả dòng chứa nó (BR-XL-06). Báo cáo không tồn tại ném {@code REPORT_NOT_FOUND};
 * dòng đã được xử lý ở nơi khác ném {@code REPORT_ALREADY_HANDLED}; thao tác ngoài quyền (BR-XL-02) ném
 * {@code ForbiddenException}; ghi chú hoặc lý do sai ném {@code FieldValidationException} trên trường {@code note}.
 */
public interface ReportReviewService {

    /** Báo cáo lỗi nội dung về nội dung của giáo viên, trừ nội dung đã xóa (BR-XL-03, BR-XL-08). */
    PageResponse<ReportView.Item> listForTeacher(UUID teacherId, ReportListQuery query, int page);

    /** Mọi báo cáo, với các bộ lọc thêm của quản trị viên (BR-XL-03, BR-XL-12, BR-XL-14). */
    PageResponse<ReportView.Item> listForAdmin(ReportListQuery query, int page);

    /** Chi tiết dòng, không có tên người báo (BR-XL-09). Báo cáo không thuộc giáo viên ném {@code ForbiddenException}. */
    ReportView.Detail getForTeacher(UUID teacherId, UUID reportId);

    /** Chi tiết dòng kèm tên và số liệu người báo trong 30 ngày (BR-XL-09, BR-XL-14). */
    ReportView.Detail getForAdmin(UUID reportId);

    /**
     * Giáo viên đánh dấu Đã xử lý (UC-XL-02). Trường cần sửa học viên đã chọn ở báo cáo mới nhất (BR-BC-11), hoặc mọi
     * trường của lý do nếu không chọn, còn giống bản chụp của báo cáo đó ném {@code REPORT_NOT_FIXED} kèm
     * {@code details.fields} (BR-XL-05).
     */
    void resolve(UUID teacherId, UUID reportId, String note);

    /**
     * Giáo viên áp dụng bản sửa đề xuất của một báo cáo trong dòng vào trường học viên đã chọn (UC-XL-02 nhánh 2a,
     * BR-XL-10) và ghi nhật ký như một lần sửa nội dung; dòng vẫn Chờ giáo viên đến khi giáo viên đánh dấu đã xử lý.
     * {@code entryId} không thuộc dòng ném {@code REPORT_NOT_FOUND}; báo cáo không kèm bản sửa ném
     * {@code REPORT_FIX_UNAVAILABLE}; quyền và trạng thái như {@link #resolve}.
     */
    void applyFix(UUID teacherId, UUID reportId, UUID entryId);

    /** Giáo viên từ chối báo cáo lỗi nội dung về nội dung của mình (UC-XL-03). */
    void rejectByTeacher(UUID teacherId, UUID reportId, String reason);

    /**
     * Quản trị viên từ chối báo cáo Chờ quản trị viên, hoặc báo cáo lỗi nội dung không có giáo viên xử lý (UC-XL-03,
     * BR-XL-12). Báo cáo lỗi nội dung của giáo viên đang hoạt động ném {@code ForbiddenException}.
     */
    void rejectByAdmin(UUID adminId, UUID reportId, String reason);

    /** Từ chối mọi báo cáo đang mở của một học viên (UC-XL-03 nhánh 2a, BR-XL-14); trả về số báo cáo đã từ chối. */
    int rejectAllByReporter(UUID adminId, UUID studentId, String reason);

    /** Giáo viên chủ có nội dung bị báo, cho bộ lọc của quản trị viên (UC-XL-01 Bước 5, AC-XL-09). */
    List<ReportView.Owner> listOwners();
}
