# Truy vết AC → test: QT-quan-tri-tai-khoan

> Nguồn AC: `docs/srs/QT-quan-tri-tai-khoan/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng` (định nghĩa ở [mục lục](../TRACEABILITY-AC-TEST.md#định-nghĩa-trạng-thái)).

Tổng hợp: 55 AC, 36 đã có test, 5 một phần, 14 thiếu.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-QT-01 | Xem danh sách tài khoản | UC-QT-01 | D | AdminUserApiIntegrationTest.list_returnsNewestFirstWithPlanOnlyForStudents_AC_QT_01 | Đã có |
| AC-QT-02 | Tìm kiếm và lọc | UC-QT-01 | D | AdminUserApiIntegrationTest.list_filtersByRolePlanStatusAndKeyword_AC_QT_02 | Đã có |
| AC-QT-03 | Xem chi tiết tài khoản | UC-QT-01 | D | AdminUserApiIntegrationTest.detail_teacher_showsContentCountsAndCredit_AC_QT_03 | Đã có |
| AC-QT-04 | Không có tài khoản phù hợp | UC-QT-01 | A | AdminUserApiIntegrationTest.list_noMatch_returnsEmpty_AC_QT_04; `frontend/src/features/user/adminUsers.test.ts` | Đã có |
| AC-QT-05 | Khóa tài khoản học viên | UC-QT-02 | D | AdminUserApiIntegrationTest.lock_student_endsSessionsAndRecordsReason_AC_QT_05 (chưa kiểm lần đăng nhập sau bị từ chối với thông báo tài khoản đã bị khóa) | Một phần |
| AC-QT-06 | Khóa giáo viên còn nội dung | UC-QT-02 | D | AdminUserApiIntegrationTest.lock_teacherWithContent_keepsPublishedContentAndReports_AC_QT_06 (chưa kiểm báo cáo hiện ở bộ lọc "Không có giáo viên xử lý"; dữ liệu 1 bài, 1 bộ thay vì 4 bài, 2 bộ) | Một phần |
| AC-QT-07 | Giao lại nội dung ngay sau khi khóa | UC-QT-02 | D |  | Thiếu |
| AC-QT-08 | Tài khoản đã bị khóa | UC-QT-02 | A | AdminUserApiIntegrationTest.lock_alreadyLocked_conflictWithoutNewEntry_AC_QT_08 | Đã có |
| AC-QT-09 | Tài khoản không được phép khóa | UC-QT-02 | A | AdminUserApiIntegrationTest.lock_selfOrOtherAdmin_forbidden_AC_QT_09 | Đã có |
| AC-QT-10 | Thiếu lý do | UC-QT-02 | A | AdminUserApiIntegrationTest.lock_blankReason_rejected_AC_QT_10; `frontend/src/features/user/adminUsers.test.ts` | Đã có |
| AC-QT-11 | Hủy khóa | UC-QT-02 | A |  | Thiếu |
| AC-QT-12 | Mất kết nối khi lưu | UC-QT-02 | A | `frontend/src/features/user/adminUsers.test.ts` (chỉ kiểm chọn thông báo lỗi; chưa kiểm hộp giữ lý do đã nhập) | Một phần |
| AC-QT-47 | Lý do quá dài | UC-QT-02 | A, B | AdminUserApiIntegrationTest.lock_reasonTooLong_rejected_AC_QT_47; `frontend/src/features/user/adminUsers.test.ts` | Đã có |
| AC-QT-48 | Khóa học viên đang có gói Pro | UC-QT-02 | D | AdminUserApiIntegrationTest.lockAndUnlock_proStudent_keepsProEndDate_AC_QT_48 | Đã có |
| AC-QT-13 | Mở khóa tài khoản | UC-QT-03 | D | AdminUserApiIntegrationTest.unlock_lockedStudent_activeAgain_AC_QT_13 (chưa kiểm tiến độ học trước khi khóa vẫn còn) | Một phần |
| AC-QT-14 | Mở khóa giáo viên đã được giao lại nội dung | UC-QT-03 | D |  | Thiếu |
| AC-QT-15 | Tài khoản không còn bị khóa | UC-QT-03 | A | AdminUserApiIntegrationTest.unlock_alreadyActive_conflictWithoutNewEntry_AC_QT_15 | Đã có |
| AC-QT-16 | Hủy mở khóa | UC-QT-03 | A |  | Thiếu |
| AC-QT-17 | Mất kết nối khi lưu | UC-QT-03 | A |  | Thiếu |
| AC-QT-18 | Cấp quyền giáo viên cho học viên | UC-QT-04 | D | AdminUserApiIntegrationTest.changeRole_studentToTeacher_takesEffectImmediately_AC_QT_18 | Đã có |
| AC-QT-19 | Đổi giáo viên không còn nội dung thành học viên | UC-QT-04 | D | AdminUserApiIntegrationTest.changeRole_teacherWithoutContentToStudent_AC_QT_19 | Đã có |
| AC-QT-20 | Giáo viên còn nội dung | UC-QT-04 | A | AdminUserApiIntegrationTest.changeRole_teacherWithContent_rejectedWithCounts_AC_QT_20 | Đã có |
| AC-QT-21 | Tài khoản đang bị khóa | UC-QT-04 | A | AdminUserApiIntegrationTest.changeRole_lockedAccount_rejected_AC_QT_21 | Đã có |
| AC-QT-22 | Tài khoản không được phép đổi vai trò | UC-QT-04 | A | AdminUserApiIntegrationTest.changeRole_selfOrOtherAdmin_forbidden_AC_QT_22 | Đã có |
| AC-QT-23 | Hủy đổi vai trò | UC-QT-04 | A |  | Thiếu |
| AC-QT-24 | Mất kết nối khi lưu | UC-QT-04 | A |  | Thiếu |
| AC-QT-49 | Học viên đang có gói Pro | UC-QT-04 | A | AdminUserApiIntegrationTest.changeRole_studentWithActivePro_rejected_AC_QT_49 | Đã có |
| AC-QT-50 | Hủy số dư credit khi đổi giáo viên thành học viên | UC-QT-04 | D | AdminUserApiIntegrationTest.changeRole_teacherToStudent_cancelsTeacherCredit_AC_QT_50 | Đã có |
| AC-QT-54 | Nội dung cá nhân không chặn đổi vai trò | UC-QT-04 | D | AdminUserApiIntegrationTest.changeRole_personalContentDoesNotBlock_AC_QT_54 | Đã có |
| AC-QT-25 | Xem nội dung cần giao | UC-QT-05 | D | AdminContentTransferApiIntegrationTest.items_onlyPublishedContentOfLockedTeachers_AC_QT_25 | Đã có |
| AC-QT-26 | Tìm kiếm và lọc | UC-QT-05 | D | AdminContentTransferApiIntegrationTest.items_filterByOwnerAndType_AC_QT_26 | Đã có |
| AC-QT-27 | Xem trước nội dung | UC-QT-05 | D |  | Thiếu |
| AC-QT-28 | Không có nội dung cần giao | UC-QT-05 | A | `frontend/src/features/user/adminUsers.test.ts` (chỉ kiểm phân biệt danh sách rỗng với lọc không ra; chưa kiểm API khi không có nội dung cần giao) | Một phần |
| AC-QT-51 | Không có nội dung phù hợp | UC-QT-05 | A | AdminContentTransferApiIntegrationTest.items_noMatch_returnsEmpty_AC_QT_51; `frontend/src/features/user/adminUsers.test.ts` | Đã có |
| AC-QT-52 | Bộ thẻ chưa gán chủ trong danh sách | UC-QT-05 | D | AdminContentTransferApiIntegrationTest.items_systemDeckListedAsSystem_AC_QT_52 | Đã có |
| AC-QT-29 | Giao nội dung đã chọn thành công | UC-QT-06 | D | AdminContentTransferApiIntegrationTest.transferSelected_movesOnlyChosenItemsAndNotifies_AC_QT_29 | Đã có |
| AC-QT-30 | Báo cáo đang mở chuyển theo nội dung | UC-QT-06 | D | AdminContentTransferApiIntegrationTest.transferSelected_openReportFollowsContent_AC_QT_30 | Đã có |
| AC-QT-31 | Chưa chọn nội dung nào | UC-QT-06 | A | AdminContentTransferApiIntegrationTest.transferSelected_nothingSelected_rejected_AC_QT_31 | Đã có |
| AC-QT-32 | Không có giáo viên nhận | UC-QT-06 | A |  | Thiếu |
| AC-QT-33 | Hủy giao | UC-QT-06 | A |  | Thiếu |
| AC-QT-34 | Giáo viên nhận không còn hợp lệ | UC-QT-06 | A | AdminContentTransferApiIntegrationTest.transferSelected_recipientJustLocked_rejectedAndHiddenFromRecipients_AC_QT_34 | Đã có |
| AC-QT-35 | Trùng tên với nội dung của giáo viên nhận | UC-QT-06 | A | AdminContentTransferApiIntegrationTest.transferSelected_nameConflictCaseInsensitive_movesNothing_AC_QT_35; `frontend/src/features/user/adminUsers.test.ts` | Đã có |
| AC-QT-36 | Nội dung đã thay đổi chủ | UC-QT-06 | A | AdminContentTransferApiIntegrationTest.transferSelected_itemAlreadyMoved_movesNothing_AC_QT_36; AdminContentTransferApiIntegrationTest.transferSelected_ownerUnlockedMeanwhile_movesNothing_UC_QT_06_7c | Đã có |
| AC-QT-37 | Mất kết nối khi lưu | UC-QT-06 | A |  | Thiếu |
| AC-QT-46 | Giao nội dung từ chi tiết báo cáo | UC-QT-06 | D | AdminContentTransferApiIntegrationTest.transferSelected_systemDeckFromReport_AC_QT_46; `frontend/src/features/user/adminUsers.test.ts` | Đã có |
| AC-QT-38 | Giao toàn bộ nội dung thành công | UC-QT-07 | D | AdminContentTransferApiIntegrationTest.transferAll_movesLibraryContentIncludingDrafts_AC_QT_38 | Đã có |
| AC-QT-39 | Giao nội dung của giáo viên đang hoạt động rồi đổi vai trò | UC-QT-07 | D | AdminContentTransferApiIntegrationTest.transferAll_activeTeacherThenChangeRole_AC_QT_39 | Đã có |
| AC-QT-40 | Giáo viên không còn nội dung | UC-QT-07 | A | AdminContentTransferApiIntegrationTest.transferAll_noContent_rejected_AC_QT_40 | Đã có |
| AC-QT-41 | Không có giáo viên nhận | UC-QT-07 | A |  | Thiếu |
| AC-QT-42 | Hủy giao | UC-QT-07 | A |  | Thiếu |
| AC-QT-43 | Giáo viên nhận không còn hợp lệ | UC-QT-07 | A | AdminContentTransferApiIntegrationTest.transferAll_recipientLocked_rejected_AC_QT_43 | Đã có |
| AC-QT-44 | Trùng tên với nội dung của giáo viên nhận | UC-QT-07 | A | AdminContentTransferApiIntegrationTest.transferAll_titleConflict_movesNothing_AC_QT_44 | Đã có |
| AC-QT-45 | Mất kết nối khi lưu | UC-QT-07 | A |  | Thiếu |
| AC-QT-53 | Nội dung của giáo viên đã thay đổi | UC-QT-07 | A | AdminContentTransferApiIntegrationTest.transferAll_contentChangedSinceSummary_rejectedWithNewSummary_AC_QT_53 | Đã có |
| AC-QT-55 | Nội dung cá nhân không bị giao | UC-QT-07 | D | AdminContentTransferApiIntegrationTest.transferAll_personalContentStays_AC_QT_55 | Đã có |
