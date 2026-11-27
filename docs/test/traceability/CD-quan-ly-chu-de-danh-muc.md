# Truy vết AC → test: CD-quan-ly-chu-de-danh-muc

> Nguồn AC: `docs/srs/CD-quan-ly-chu-de-danh-muc/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng` (định nghĩa ở [mục lục](../TRACEABILITY-AC-TEST.md#định-nghĩa-trạng-thái)).

Tổng hợp: 28 AC, 16 đã có test, 8 một phần, 0 thiếu, 4 thủ công.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-CD-01 | Xem danh sách chủ đề | UC-CD-01 | D | AdminTopicApiIntegrationTest.list_inDisplayOrderWithPublishedCountsAndVisibility_AC_CD_01 | Đã có |
| AC-CD-02 | Tìm kiếm và lọc | UC-CD-01 | D | AdminTopicApiIntegrationTest.list_searchIgnoresCaseAndFiltersByVisibility_AC_CD_02; `frontend/src/features/lesson/adminTopics.test.ts` | Đã có |
| AC-CD-03 | Chưa có chủ đề | UC-CD-01 | B | `frontend/src/features/lesson/adminTopics.test.ts` (backend không dựng được hệ thống rỗng trên DB test dùng chung; chưa test giao diện thông báo và nút Thêm chủ đề) | Một phần |
| AC-CD-04 | Không có chủ đề phù hợp | UC-CD-01 | A | AdminTopicApiIntegrationTest.list_noMatch_returnsEmpty_AC_CD_04; `frontend/src/features/lesson/adminTopics.test.ts` (chưa test giao diện nút Xóa bộ lọc) | Một phần |
| AC-CD-05 | Thêm chủ đề thành công | UC-CD-02 | D | AdminTopicApiIntegrationTest.create_addsHiddenTopicAtEndAndLogs_AC_CD_05 | Đã có |
| AC-CD-06 | Hủy thêm chủ đề | UC-CD-02 | A | Chưa có test tự động; kiểm tra thủ công trên AdminTopicPage | Thủ công |
| AC-CD-07 | Thiếu hoặc sai thông tin | UC-CD-02 | B | AdminTopicApiIntegrationTest.create_blankOrTooLong_rejected_AC_CD_07; `frontend/src/components/common/nameField.test.ts` | Đã có |
| AC-CD-08 | Tên chủ đề bị trùng | UC-CD-02 | A | AdminTopicApiIntegrationTest.create_duplicateNameIgnoringCase_rejected_AC_CD_08; `frontend/src/features/lesson/adminTopics.test.ts` | Đã có |
| AC-CD-09 | Mất kết nối khi lưu | UC-CD-02 | A | `frontend/src/features/lesson/adminTopics.test.ts` (chưa test giao diện giữ tên đã nhập khi lưu lỗi) | Một phần |
| AC-CD-10 | Sửa tên chủ đề thành công | UC-CD-03 | D | AdminTopicApiIntegrationTest.rename_keepsLessonsAndOrder_refreshesUpdatedAt_logsOldAndNew_AC_CD_10 | Đã có |
| AC-CD-11 | Hủy sửa tên | UC-CD-03 | A | Chưa có test tự động; kiểm tra thủ công trên AdminTopicPage | Thủ công |
| AC-CD-12 | Thiếu hoặc sai thông tin | UC-CD-03 | B | AdminTopicApiIntegrationTest.rename_blankOrTooLong_keepsOldName_AC_CD_12; `frontend/src/components/common/nameField.test.ts` | Đã có |
| AC-CD-13 | Tên chủ đề bị trùng | UC-CD-03 | A | AdminTopicApiIntegrationTest.rename_toOtherTopicNameIgnoringCase_rejected_AC_CD_13; `frontend/src/features/lesson/adminTopics.test.ts` | Đã có |
| AC-CD-14 | Mất kết nối khi lưu | UC-CD-03 | A | `frontend/src/features/lesson/adminTopics.test.ts` (chưa test giao diện giữ tên đã nhập khi lưu lỗi) | Một phần |
| AC-CD-15 | Xem danh sách danh mục | UC-CD-04 | D | AdminDeckCategoryApiIntegrationTest.list_inDisplayOrderWithPublishedDeckCounts_AC_CD_15 | Đã có |
| AC-CD-16 | Tìm kiếm danh mục | UC-CD-04 | D | AdminDeckCategoryApiIntegrationTest.list_searchIgnoresCase_AC_CD_16 | Đã có |
| AC-CD-17 | Chưa có danh mục | UC-CD-04 | B | `frontend/src/features/vocab/categoryAdmin.test.ts` (backend không dựng được hệ thống rỗng trên DB test dùng chung; chưa test giao diện thông báo và nút Thêm danh mục) | Một phần |
| AC-CD-18 | Không có danh mục phù hợp | UC-CD-04 | A | AdminDeckCategoryApiIntegrationTest.list_noMatch_returnsEmpty_AC_CD_18; `frontend/src/features/vocab/categoryAdmin.test.ts` (chưa test giao diện nút Xóa bộ lọc) | Một phần |
| AC-CD-19 | Thêm danh mục thành công | UC-CD-05 | D | AdminDeckCategoryApiIntegrationTest.create_addsCategoryAtEnd_teacherCanPick_logs_AC_CD_19 | Đã có |
| AC-CD-20 | Hủy thêm danh mục | UC-CD-05 | A | Chưa có test tự động; kiểm tra thủ công trên AdminCategoryPage | Thủ công |
| AC-CD-21 | Thiếu hoặc sai thông tin | UC-CD-05 | B | AdminDeckCategoryApiIntegrationTest.create_blankOrTooLong_rejected_AC_CD_21; `frontend/src/components/common/nameField.test.ts` | Đã có |
| AC-CD-22 | Tên danh mục bị trùng | UC-CD-05 | A | AdminDeckCategoryApiIntegrationTest.create_duplicateNameIgnoringCase_rejected_AC_CD_22; `frontend/src/features/vocab/categoryAdmin.test.ts` | Đã có |
| AC-CD-23 | Mất kết nối khi lưu | UC-CD-05 | A | `frontend/src/features/vocab/categoryAdmin.test.ts` (chưa test giao diện giữ tên đã nhập khi lưu lỗi) | Một phần |
| AC-CD-24 | Sửa tên danh mục thành công | UC-CD-06 | D | AdminDeckCategoryApiIntegrationTest.rename_keepsDecksAndOrder_refreshesUpdatedAt_logsOldAndNew_AC_CD_24 | Đã có |
| AC-CD-25 | Hủy sửa tên | UC-CD-06 | A | Chưa có test tự động; kiểm tra thủ công trên AdminCategoryPage | Thủ công |
| AC-CD-26 | Thiếu hoặc sai thông tin | UC-CD-06 | B | AdminDeckCategoryApiIntegrationTest.rename_blank_keepsOldName_AC_CD_26; `frontend/src/components/common/nameField.test.ts` | Đã có |
| AC-CD-27 | Tên danh mục bị trùng | UC-CD-06 | A | AdminDeckCategoryApiIntegrationTest.rename_toOtherCategoryNameIgnoringCase_rejected_AC_CD_27; `frontend/src/features/vocab/categoryAdmin.test.ts` | Đã có |
| AC-CD-28 | Mất kết nối khi lưu | UC-CD-06 | A | `frontend/src/features/vocab/categoryAdmin.test.ts` (chưa test giao diện giữ tên đã nhập khi lưu lỗi) | Một phần |
