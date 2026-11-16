# Truy vết AC → test: XL-xu-ly-bao-cao

> Nguồn AC: `docs/srs/XL-xu-ly-bao-cao/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng`. Quay lại [mục lục](../TRACEABILITY-AC-TEST.md).

Tổng hợp: 61 AC, 0 đã có test, 39 một phần, 22 thiếu.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-XL-01 | Giáo viên chỉ thấy báo cáo lỗi nội dung của mình | UC-XL-01 | D, A | ReportReviewApiIntegrationTest.list_teacher_seesOnlyOwnContentErrorsWaitingTeacher_AC_XL_01; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-02 | Quản trị viên thấy mọi báo cáo | UC-XL-01 |  |  | Thiếu |
| AC-XL-03 | Lọc theo lý do và trạng thái | UC-XL-01 |  |  | Thiếu |
| AC-XL-04 | Tìm theo tên bài học hoặc bộ thẻ | UC-XL-01 |  |  | Thiếu |
| AC-XL-05 | Sắp xếp chờ lâu nhất | UC-XL-01 |  |  | Thiếu |
| AC-XL-06 | Phân trang danh sách báo cáo | UC-XL-01 |  |  | Thiếu |
| AC-XL-07 | Gộp báo cáo trùng và xem chi tiết cả nhóm | UC-XL-01 | D | ReportReviewApiIntegrationTest.list_groupsDuplicatesAndDetailShowsSnapshot_AC_XL_07; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-08 | Chỉ Quản trị viên thấy tên người báo | UC-XL-01 | D, A | ReportReviewApiIntegrationTest.detail_onlyAdminSeesReporterNameAndStats_AC_XL_08_AC_XL_10; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-09 | Quản trị viên lọc theo giáo viên chủ | UC-XL-01 | D | ReportReviewApiIntegrationTest.list_adminFiltersByOwner_andListsOwners_AC_XL_09 (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-10 | Quản trị viên phát hiện và lọc theo học viên đã báo | UC-XL-01 | D | ReportReviewApiIntegrationTest.detail_onlyAdminSeesReporterNameAndStats_AC_XL_08_AC_XL_10; ReportReviewApiIntegrationTest.list_adminFrequentRejectedFilter_needsFiveRejected_AC_XL_10; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-11 | Nhãn và bộ lọc "Quá hạn" | UC-XL-01 | D | ReportReviewApiIntegrationTest.list_overdueAfterSevenDays_AC_XL_11; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-12 | Chưa có báo cáo cần xử lý | UC-XL-01 |  |  | Thiếu |
| AC-XL-13 | Không có kết quả phù hợp | UC-XL-01 |  |  | Thiếu |
| AC-XL-14 | Xem nội dung bị báo | UC-XL-01 |  |  | Thiếu |
| AC-XL-15 | Báo cáo lỗi không có giáo viên xử lý | UC-XL-01 | D | ReportReviewApiIntegrationTest.list_adminNoHandlerFilter_includesLockedTeachersReports_AC_XL_15; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-16 | Bài học chứa nội dung bị báo đã bị xóa | UC-XL-01 |  |  | Thiếu |
| AC-XL-17 | Sửa theo báo cáo thành công | UC-XL-02 | D | ReportReviewApiIntegrationTest.resolve_afterFixingField_closesWholeGroup_AC_XL_17_AC_XL_18; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-18 | Xử lý cả các báo cáo trùng | UC-XL-02 | D | ReportReviewApiIntegrationTest.resolve_afterFixingField_closesWholeGroup_AC_XL_17_AC_XL_18; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-19 | Áp dụng bản sửa đề xuất | UC-XL-02 | D | ReportReviewApiIntegrationTest.applyFix_sentence_writesChosenFieldAndAudits_thenResolves_AC_XL_19; ReportReviewApiIntegrationTest.applyFix_card_validatesLikeCardEdit_AC_XL_19 (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-20 | Chọn một trong nhiều bản sửa của nhóm báo cáo trùng | UC-XL-02 | D | ReportReviewApiIntegrationTest.applyFix_choosesOneFixOfDuplicateGroup_AC_XL_20 (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-21 | Báo cáo không có bản sửa và hủy áp dụng | UC-XL-02 | A | ReportReviewApiIntegrationTest.applyFix_withoutFixOrOutsideGroupOrNotOwn_isRejected_AC_XL_21 (E2E chưa viết: chưa có Playwright; nút Hủy chỉ có ở giao diện) | Một phần |
| AC-XL-22 | Rời màn hình sửa mà không lưu | UC-XL-02 |  |  | Thiếu |
| AC-XL-23 | Báo cáo không thuộc quyền | UC-XL-02 | A | ReportReviewApiIntegrationTest.resolve_notOwnOrOffensive_isForbidden_AC_XL_23; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-24 | Báo cáo đã được xử lý | UC-XL-02 | A | ReportReviewApiIntegrationTest.resolve_alreadyHandled_returnsConflict_AC_XL_24; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-25 | Thiếu hoặc quá dài ghi chú xử lý | UC-XL-02 | A, B | ReportReviewApiIntegrationTest.resolve_noteMissingOrTooLong_isRejected_AC_XL_25; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-26 | Nội dung chưa được sửa | UC-XL-02 | A | ReportReviewApiIntegrationTest.resolve_withoutChangingField_isRejected_AC_XL_26_AC_XL_27; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-27 | Sửa sai trường, sửa rồi sửa lại, hoặc chưa sửa theo báo cáo mới nhất | UC-XL-02 | A | ReportReviewApiIntegrationTest.resolve_withoutChangingField_isRejected_AC_XL_26_AC_XL_27; ReportReviewApiIntegrationTest.resolve_onlyChosenFixFieldCounts_AC_XL_27; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-28 | Mất kết nối khi lưu | UC-XL-02 |  |  | Thiếu |
| AC-XL-29 | Giáo viên từ chối báo cáo lỗi nội dung | UC-XL-03 | D | ReportReviewApiIntegrationTest.reject_byTeacher_closesWithReason_AC_XL_29; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-30 | Quản trị viên từ chối báo cáo Phản cảm | UC-XL-03 | D | ReportReviewApiIntegrationTest.reject_byAdmin_offensiveOrNoHandler_butNotActiveTeachersError_AC_XL_30_31_33; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-31 | Quản trị viên từ chối báo cáo lỗi không có giáo viên xử lý | UC-XL-03 | D | ReportReviewApiIntegrationTest.reject_byAdmin_offensiveOrNoHandler_butNotActiveTeachersError_AC_XL_30_31_33; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-32 | Từ chối tất cả báo cáo của một học viên | UC-XL-03 | D | ReportReviewApiIntegrationTest.rejectAll_byReporter_onlyThatStudentsOpenReports_AC_XL_32; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-33 | Báo cáo không thuộc quyền | UC-XL-03 | A | ReportReviewApiIntegrationTest.reject_byAdmin_offensiveOrNoHandler_butNotActiveTeachersError_AC_XL_30_31_33; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-34 | Báo cáo đã được xử lý | UC-XL-03 |  |  | Thiếu |
| AC-XL-35 | Thiếu hoặc quá dài lý do | UC-XL-03 |  |  | Thiếu |
| AC-XL-36 | Hủy từ chối | UC-XL-03 |  |  | Thiếu |
| AC-XL-37 | Mất kết nối khi lưu | UC-XL-03 |  |  | Thiếu |
| AC-XL-38 | Gỡ bộ thẻ và đóng báo cáo Phản cảm | UC-XL-04 | D | ReportModerationApiIntegrationTest.takedown_offensiveCard_unpublishesDeckAndClosesReport_AC_XL_38; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-39 | Gỡ bài học đóng mọi báo cáo Phản cảm của bài | UC-XL-04 | D | ReportModerationApiIntegrationTest.takedown_lesson_closesAllOffensiveButKeepsErrorReports_AC_XL_39; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-40 | Gỡ nội dung đóng cả báo cáo trùng | UC-XL-04 |  |  | Thiếu |
| AC-XL-41 | Gỡ nội dung khi báo cáo lỗi quá 30 ngày | UC-XL-04 | D | ReportModerationApiIntegrationTest.takedown_contentErrorOnlyAfterThirtyDays_AC_XL_41_AC_XL_43; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-42 | Bộ thẻ đã không còn xuất bản | UC-XL-04 | D | ReportModerationApiIntegrationTest.takedown_draftDeck_onlyMarksAndBlocksTeacherPublish_AC_XL_42; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-43 | Báo cáo không được gỡ | UC-XL-04 | A | ReportModerationApiIntegrationTest.takedown_contentErrorOnlyAfterThirtyDays_AC_XL_41_AC_XL_43; ReportModerationApiIntegrationTest.takedown_closedOrMissingReason_isRejected_AC_XL_43_AC_XL_46; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-44 | Báo cáo đã được xử lý | UC-XL-04 |  |  | Thiếu |
| AC-XL-45 | Hủy gỡ | UC-XL-04 |  |  | Thiếu |
| AC-XL-46 | Thiếu hoặc quá dài lý do gỡ | UC-XL-04 | A | ReportModerationApiIntegrationTest.takedown_closedOrMissingReason_isRejected_AC_XL_43_AC_XL_46; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-47 | Mất kết nối khi lưu | UC-XL-04 |  |  | Thiếu |
| AC-XL-48 | Duyệt xuất bản lại | UC-XL-05 | D | ReportModerationApiIntegrationTest.republish_requiresFixThenApprovalOnce_AC_BT_74_75_AC_XL_48; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-49 | So sánh nội dung lúc gỡ và hiện tại | UC-XL-05 | D | ReportModerationApiIntegrationTest.republish_requiresFixThenApprovalOnce_AC_BT_74_75_AC_XL_48; ReportModerationApiIntegrationTest.republish_deletedCardCountsAsFixed_andDetailShowsDeleted_AC_XL_49; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-50 | Từ chối yêu cầu xuất bản lại | UC-XL-05 | D, A | ReportModerationApiIntegrationTest.republish_rejectKeepsDraftAndAllowsResend_AC_XL_50; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-51 | Không có yêu cầu nào | UC-XL-05 |  |  | Thiếu |
| AC-XL-52 | Yêu cầu không còn hiệu lực | UC-XL-05 |  |  | Thiếu |
| AC-XL-53 | Không còn đủ điều kiện xuất bản | UC-XL-05 | A | ReportModerationApiIntegrationTest.approve_lessonMissingTranslation_isNotPublishable_AC_XL_53; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-54 | Mất kết nối khi duyệt | UC-XL-05 |  |  | Thiếu |
| AC-XL-55 | Nhắc giáo viên khi báo cáo quá 7 ngày | UC-XL-06 | D | ReportModerationApiIntegrationTest.maintenance_remindsOnceAfterSevenDays_AC_XL_55_56; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-56 | Mỗi dòng chỉ được nhắc một lần | UC-XL-06 | D | ReportModerationApiIntegrationTest.maintenance_remindsOnceAfterSevenDays_AC_XL_55_56; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-57 | Không có dòng nào mới quá hạn hoặc dòng đang bị ẩn | UC-XL-06 | A | ReportModerationApiIntegrationTest.maintenance_noHandlerAndDeletedLesson_areNotNotified_AC_XL_57_58; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-58 | Dòng quá hạn không có giáo viên xử lý | UC-XL-06 | D | ReportModerationApiIntegrationTest.maintenance_noHandlerAndDeletedLesson_areNotNotified_AC_XL_57_58; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-59 | Xóa thẻ có báo cáo đang mở | UC-XL-06 | D | ReportModerationApiIntegrationTest.deletingCard_closesItsReportsInBothFlows_AC_XL_59; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-60 | Xóa rồi khôi phục bài học | UC-XL-06 | D | ReportReviewApiIntegrationTest.list_teacher_hidesReportsOfDeletedLesson_AC_XL_60; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
| AC-XL-61 | Bài học bị xóa vĩnh viễn | UC-XL-06 | D | ReportModerationApiIntegrationTest.maintenance_closesReportsOfDeletedSentenceAndPurgedLesson_AC_XL_61; `frontend/src/features/report/reportForm.test.ts` (E2E chưa viết: chưa có Playwright) | Một phần |
