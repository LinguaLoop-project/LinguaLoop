# Truy vết AC → test: BC-bao-cao-noi-dung

> Nguồn AC: `docs/srs/BC-bao-cao-noi-dung/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng` (định nghĩa ở [mục lục](../TRACEABILITY-AC-TEST.md#định-nghĩa-trạng-thái)).

Tổng hợp: 8 AC, 3 đã có test, 3 một phần, 2 thiếu.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-BC-01 | Gửi báo cáo lỗi bản dịch của một câu kèm bản sửa đúng | UC-BC-01 | D | ReportSubmitApiIntegrationTest.submit_translationWithFix_savesWaitingTeacherWithSnapshot_AC_BC_01; `frontend/src/features/report/reportForm.test.ts` (chưa test thông báo gửi thành công ở giao diện; chưa test lý do Sai phụ đề tiếng Anh và Sai phiên âm) | Một phần |
| AC-BC-02 | Gửi báo cáo sai nghĩa của một thẻ kèm bản sửa đúng | UC-BC-01 | D | ReportSubmitApiIntegrationTest.submit_cardMeaningWithFix_savesWaitingTeacher_AC_BC_02 | Đã có |
| AC-BC-03 | Từ chối khi thiếu nội dung bắt buộc, bản sửa giống hệt hoặc nhập quá 500 ký tự | UC-BC-01 | A, B | ReportSubmitApiIntegrationTest.submit_missingOrInvalidFields_rejectsWithFieldError_AC_BC_03; `frontend/src/features/report/reportForm.test.ts` | Đã có |
| AC-BC-04 | Chặn cùng một học viên gửi lặp báo cáo trùng chưa được xử lý xong | UC-BC-01 | A | ReportSubmitApiIntegrationTest.submit_sameReasonWhileOpen_rejectsDuplicate_AC_BC_04; `frontend/src/features/report/reportForm.test.ts` | Đã có |
| AC-BC-05 | Từ chối báo cáo đối với câu hoặc thẻ không tồn tại hoặc không còn hiển thị | UC-BC-01 | A | ReportSubmitApiIntegrationTest.submit_draftOrMissingContent_returnsNotFound_AC_BC_05 (chưa test thông báo không tìm thấy nội dung ở giao diện) | Một phần |
| AC-BC-06 | Hủy hộp thoại báo cáo không tạo báo cáo mới | UC-BC-01 |  |  | Thiếu |
| AC-BC-07 | Giữ nguyên dữ liệu nhập khi mất kết nối mạng lúc gửi báo cáo | UC-BC-01 |  |  | Thiếu |
| AC-BC-08 | Báo cáo Phản cảm đi thẳng đến quản trị viên | UC-BC-01 | D | ReportSubmitApiIntegrationTest.submit_offensive_goesToAdmin_AC_BC_08 (chưa kiểm quản trị viên thấy và giáo viên không thấy báo cáo trong hàng đợi) | Một phần |
