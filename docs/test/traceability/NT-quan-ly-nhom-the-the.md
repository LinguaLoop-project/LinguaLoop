# Truy vết AC → test: NT-quan-ly-nhom-the-the

> Nguồn AC: `docs/srs/NT-quan-ly-nhom-the-the/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng`. Quay lại [mục lục](../TRACEABILITY-AC-TEST.md).

Tổng hợp: 76 AC, 54 đã có test, 5 một phần, 17 thiếu.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-NT-01 | Thêm nhóm thẻ thành công | UC-NT-01 | D | TeacherVocabContentApiIntegrationTest.addGroup_validName_appendsEmptyGroupAtEnd_AC_NT_01 | Đã có |
| AC-NT-02 | Thêm nhóm thẻ vào bộ của người khác | UC-NT-01 | A | TeacherVocabContentApiIntegrationTest.addGroup_deckOfOtherTeacher_forbidden_AC_NT_02 | Đã có |
| AC-NT-03 | Bộ không còn tồn tại | UC-NT-01 | A | TeacherVocabContentApiIntegrationTest.addGroup_deletedDeck_notFound_AC_NT_03 | Đã có |
| AC-NT-58 | Thêm nhóm thẻ vào bộ đã xuất bản | UC-NT-01 | A | TeacherVocabContentApiIntegrationTest.addGroup_publishedDeck_rejected_AC_NT_58 | Đã có |
| AC-NT-04 | Hủy thêm nhóm thẻ | UC-NT-01 |  |  | Thiếu |
| AC-NT-05 | Thiếu hoặc sai thông tin | UC-NT-01 | A, B | TeacherVocabContentApiIntegrationTest.addGroup_blankOrWhitespaceName_rejected_AC_NT_05; TeacherVocabContentApiIntegrationTest.addGroup_nameOver100Chars_rejected_AC_NT_05; `frontend/src/features/vocab/deckContentForm.test.ts` | Đã có |
| AC-NT-06 | Tên nhóm thẻ bị trùng | UC-NT-01 | A | TeacherVocabContentApiIntegrationTest.addGroup_nameTakenIgnoringCase_conflict_AC_NT_06; `frontend/src/features/vocab/deckContentForm.test.ts` | Đã có |
| AC-NT-07 | Mất kết nối khi lưu | UC-NT-01 |  | `frontend/src/features/vocab/deckContentForm.test.ts` | Đã có |
| AC-NT-08 | Sửa nhóm thẻ thành công | UC-NT-02 | D | TeacherVocabContentApiIntegrationTest.renameGroup_valid_keepsCards_AC_NT_08 | Đã có |
| AC-NT-09 | Sửa nhóm thẻ của bộ đã xuất bản | UC-NT-02 | D | TeacherVocabContentApiIntegrationTest.renameGroup_publishedDeck_staysPublished_AC_NT_09 | Đã có |
| AC-NT-10 | Sửa nhóm thẻ của bộ người khác | UC-NT-02 | A | TeacherVocabContentApiIntegrationTest.renameGroup_deckOfOtherTeacher_forbidden_AC_NT_10 | Đã có |
| AC-NT-11 | Bộ không còn tồn tại | UC-NT-02 |  | TeacherVocabContentApiIntegrationTest.renameGroup_deletedDeck_notFound_AC_NT_11 | Đã có |
| AC-NT-12 | Nhóm thẻ không còn tồn tại | UC-NT-02 | A | TeacherVocabContentApiIntegrationTest.renameGroup_deletedGroup_notFound_AC_NT_12 | Đã có |
| AC-NT-13 | Hủy sửa nhóm thẻ | UC-NT-02 |  |  | Thiếu |
| AC-NT-59 | Thiếu tên nhóm thẻ | UC-NT-02 | A | TeacherVocabContentApiIntegrationTest.renameGroup_blankName_keepsOldName_AC_NT_59 | Đã có |
| AC-NT-14 | Tên nhóm thẻ bị trùng | UC-NT-02 | A | TeacherVocabContentApiIntegrationTest.renameGroup_nameOfOtherGroup_conflict_AC_NT_14 | Đã có |
| AC-NT-15 | Mất kết nối khi lưu | UC-NT-02 |  |  | Thiếu |
| AC-NT-16 | Xóa nhóm thẻ thành công | UC-NT-03 | D | TeacherVocabContentApiIntegrationTest.deleteGroup_softDeletesGroupAndCards_AC_NT_16 (chưa kiểm tiến độ học (BR-BT-07)) | Một phần |
| AC-NT-17 | Xóa nhóm thẻ của bộ người khác | UC-NT-03 | A | TeacherVocabContentApiIntegrationTest.deleteGroup_deckOfOtherTeacher_forbidden_AC_NT_17 | Đã có |
| AC-NT-18 | Bộ không còn tồn tại | UC-NT-03 |  | TeacherVocabContentApiIntegrationTest.deleteGroup_deletedDeck_notFound_AC_NT_18 | Đã có |
| AC-NT-19 | Nhóm thẻ không còn tồn tại | UC-NT-03 | A | TeacherVocabContentApiIntegrationTest.deleteGroup_alreadyDeleted_notFound_AC_NT_19 | Đã có |
| AC-NT-20 | Xóa nhóm thẻ duy nhất của bộ đã xuất bản | UC-NT-03 | A, B | TeacherVocabContentApiIntegrationTest.deleteGroup_onlyGroupOfPublishedDeck_rejected_AC_NT_20 | Đã có |
| AC-NT-21 | Hủy xóa nhóm thẻ | UC-NT-03 |  |  | Thiếu |
| AC-NT-22 | Mất kết nối khi xóa | UC-NT-03 |  |  | Thiếu |
| AC-NT-23 | Thêm thẻ thành công | UC-NT-04 | D | TeacherVocabContentApiIntegrationTest.addCard_valid_appendsAtEndOfGroup_AC_NT_23 | Đã có |
| AC-NT-24 | Thêm thẻ từ từ điển | UC-NT-04 | D | `frontend/src/features/vocab/deckContentForm.test.ts` (chưa test luồng giao diện chọn gợi ý) | Một phần |
| AC-NT-60 | Loại từ trong từ điển không thuộc danh sách | UC-NT-04 | B | `frontend/src/features/vocab/deckContentForm.test.ts` | Đã có |
| AC-NT-25 | Thêm thẻ vào bộ của người khác | UC-NT-04 | A | TeacherVocabContentApiIntegrationTest.addCard_deckOfOtherTeacher_forbidden_AC_NT_25 | Đã có |
| AC-NT-26 | Bộ không còn tồn tại | UC-NT-04 |  | TeacherVocabContentApiIntegrationTest.addCard_deletedDeck_notFound_AC_NT_26 | Đã có |
| AC-NT-27 | Nhóm thẻ không còn tồn tại | UC-NT-04 | A | TeacherVocabContentApiIntegrationTest.addCard_deletedGroup_notFound_AC_NT_27 | Đã có |
| AC-NT-61 | Không tìm thấy từ trong từ điển khi thêm thẻ | UC-NT-04 |  |  | Thiếu |
| AC-NT-28 | Hủy thêm thẻ | UC-NT-04 |  |  | Thiếu |
| AC-NT-29 | Thiếu từ vựng | UC-NT-04 | A | TeacherVocabContentApiIntegrationTest.addCard_blankWordOrMeaning_rejected_AC_NT_29; `frontend/src/features/vocab/deckContentForm.test.ts` | Đã có |
| AC-NT-30 | Từ vựng bị trùng trong bộ | UC-NT-04 | A | TeacherVocabContentApiIntegrationTest.addCard_wordInOtherGroupIgnoringCase_conflict_AC_NT_30; `frontend/src/features/vocab/deckContentForm.test.ts` | Đã có |
| AC-NT-73 | Thêm thẻ kèm ảnh | UC-NT-04 | D | TeacherVocabContentApiIntegrationTest.addCard_withImage_storesKeyAndReturnsPublicUrl_AC_NT_73 | Đã có |
| AC-NT-74 | Ảnh của thẻ không hợp lệ | UC-NT-04 | A | TeacherVocabContentApiIntegrationTest.addCard_imageNotJpgOrPng_rejectedOnImageFieldAndDiscarded_AC_NT_74 | Đã có |
| AC-NT-31 | Mất kết nối khi lưu | UC-NT-04 |  |  | Thiếu |
| AC-NT-32 | Sửa thẻ thành công | UC-NT-05 | D | TeacherVocabContentApiIntegrationTest.updateCard_valid_keepsPosition_AC_NT_32 | Đã có |
| AC-NT-33 | Sửa thẻ bằng từ trong từ điển | UC-NT-05 | D | `frontend/src/features/vocab/deckContentForm.test.ts` (chưa test luồng giao diện xác nhận thay thông tin) | Một phần |
| AC-NT-34 | Sửa thẻ của bộ người khác | UC-NT-05 | A | TeacherVocabContentApiIntegrationTest.updateCard_deckOfOtherTeacher_forbidden_AC_NT_34 | Đã có |
| AC-NT-35 | Bộ không còn tồn tại | UC-NT-05 |  | TeacherVocabContentApiIntegrationTest.updateCard_deletedDeck_notFound_AC_NT_35 | Đã có |
| AC-NT-36 | Thẻ không còn tồn tại | UC-NT-05 | A | TeacherVocabContentApiIntegrationTest.updateCard_deletedCard_notFound_AC_NT_36 | Đã có |
| AC-NT-62 | Không tìm thấy từ trong từ điển khi sửa thẻ | UC-NT-05 |  |  | Thiếu |
| AC-NT-63 | Không xác nhận thay thông tin bằng từ điển | UC-NT-05 |  |  | Thiếu |
| AC-NT-37 | Hủy sửa thẻ | UC-NT-05 |  |  | Thiếu |
| AC-NT-38 | Thiếu từ vựng | UC-NT-05 |  | TeacherVocabContentApiIntegrationTest.updateCard_blankWordOrMeaning_rejectedAndCardKept_AC_NT_38 | Đã có |
| AC-NT-39 | Từ vựng bị trùng trong bộ | UC-NT-05 | A | TeacherVocabContentApiIntegrationTest.updateCard_wordOfOtherCard_conflict_AC_NT_39 | Đã có |
| AC-NT-75 | Đổi hoặc bỏ ảnh của thẻ | UC-NT-05 | D | TeacherVocabContentApiIntegrationTest.updateCard_newImage_replacesAndDiscardsOldImage_AC_NT_75; TeacherVocabContentApiIntegrationTest.updateCard_removeImage_clearsAndDiscards_AC_NT_75 | Đã có |
| AC-NT-76 | Ảnh mới không hợp lệ | UC-NT-05 | A | TeacherVocabContentApiIntegrationTest.updateCard_newImageNotJpgOrPng_keepsOldImage_AC_NT_76 | Đã có |
| AC-NT-40 | Mất kết nối khi lưu | UC-NT-05 |  |  | Thiếu |
| AC-NT-41 | Xóa thẻ thành công | UC-NT-06 | D | TeacherVocabContentApiIntegrationTest.deleteCard_valid_softDeletes_AC_NT_41 (chưa kiểm tiến độ học (BR-BT-07)) | Một phần |
| AC-NT-42 | Xóa thẻ của bộ người khác | UC-NT-06 | A | TeacherVocabContentApiIntegrationTest.deleteCard_deckOfOtherTeacher_forbidden_AC_NT_42 | Đã có |
| AC-NT-43 | Bộ không còn tồn tại | UC-NT-06 |  | TeacherVocabContentApiIntegrationTest.deleteCard_deletedDeck_notFound_AC_NT_43 | Đã có |
| AC-NT-44 | Thẻ không còn tồn tại | UC-NT-06 | A | TeacherVocabContentApiIntegrationTest.deleteCard_deletedCard_notFound_AC_NT_44 | Đã có |
| AC-NT-45 | Xóa thẻ cuối cùng của một nhóm thẻ thuộc bộ đã xuất bản | UC-NT-06 | A, B | TeacherVocabContentApiIntegrationTest.deleteCard_lastCardOfGroupInPublishedDeck_rejected_AC_NT_45 | Đã có |
| AC-NT-46 | Hủy xóa thẻ | UC-NT-06 |  |  | Thiếu |
| AC-NT-47 | Mất kết nối khi xóa | UC-NT-06 |  |  | Thiếu |
| AC-NT-48 | Nhập thẻ từ Excel/CSV thành công | UC-NT-07 | D | TeacherVocabContentApiIntegrationTest.import_validCsv_previewThenAppendInFileOrder_AC_NT_48; TeacherVocabContentApiIntegrationTest.import_validXlsx_appendsCards_AC_NT_48 | Đã có |
| AC-NT-49 | Tải tệp mẫu | UC-NT-07 | D | TeacherVocabContentApiIntegrationTest.template_xlsxAndCsv_haveAllColumnsAndExampleRow_AC_NT_49 | Đã có |
| AC-NT-50 | Nhập vào bộ của người khác | UC-NT-07 | A | TeacherVocabContentApiIntegrationTest.import_deckOfOtherTeacher_forbidden_AC_NT_50 | Đã có |
| AC-NT-51 | Bộ không còn tồn tại | UC-NT-07 |  | TeacherVocabContentApiIntegrationTest.importCards_deletedDeck_notFound_AC_NT_51 | Đã có |
| AC-NT-52 | Nhóm thẻ không còn tồn tại | UC-NT-07 | A | TeacherVocabContentApiIntegrationTest.import_deletedGroup_notFound_AC_NT_52 | Đã có |
| AC-NT-53 | Tệp không hợp lệ | UC-NT-07 | A, B | TeacherVocabContentApiIntegrationTest.import_pdfFile_rejectedAsFormat_AC_NT_53; TeacherVocabContentApiIntegrationTest.import_fileOver2MB_rejectedAsTooLarge_AC_NT_53; TeacherVocabContentApiIntegrationTest.import_csvMissingWordColumn_rejected_AC_NT_53; `frontend/src/features/vocab/deckContentForm.test.ts` | Đã có |
| AC-NT-54 | Có dòng dữ liệu sai | UC-NT-07 | A | TeacherVocabContentApiIntegrationTest.import_rowsWithErrors_reportsEachRowAndAddsNothing_AC_NT_54; `frontend/src/features/vocab/deckContentForm.test.ts` | Đã có |
| AC-NT-55 | Tệp có quá nhiều dòng | UC-NT-07 | A, B | TeacherVocabContentApiIntegrationTest.import_501Rows_rejected_AC_NT_55; `frontend/src/features/vocab/deckContentForm.test.ts` | Đã có |
| AC-NT-56 | Hủy nhập | UC-NT-07 |  |  | Thiếu |
| AC-NT-57 | Mất kết nối khi nhập | UC-NT-07 |  |  | Thiếu |
| AC-NT-64 | Gắn ảnh hàng loạt thành công | UC-NT-08 | D | TeacherVocabContentApiIntegrationTest.attachImages_matchesFileNamesToWords_AC_NT_64; `frontend/src/features/vocab/deckContentForm.test.ts` | Đã có |
| AC-NT-65 | Ảnh không hợp lệ | UC-NT-08 | A | TeacherVocabContentApiIntegrationTest.attachImages_notJpgOrPng_reportedInvalid_AC_NT_65; `frontend/src/features/vocab/deckContentForm.test.ts` | Đã có |
| AC-NT-66 | Gắn ảnh vào bộ của người khác | UC-NT-08 | A | TeacherVocabContentApiIntegrationTest.attachImages_deckOfOtherTeacher_forbidden_AC_NT_66 | Đã có |
| AC-NT-67 | Ảnh không khớp hoặc trùng thẻ | UC-NT-08 | A | TeacherVocabContentApiIntegrationTest.attachImages_matchesFileNamesToWords_AC_NT_64 | Đã có |
| AC-NT-68 | Hủy gắn ảnh | UC-NT-08 |  |  | Thiếu |
| AC-NT-69 | Mất kết nối khi gắn ảnh | UC-NT-08 | A | `frontend/src/features/vocab/deckContentForm.test.ts` (chưa test hộp thoại) | Một phần |
| AC-NT-70 | Bộ không còn tồn tại | UC-NT-08 |  | TeacherVocabContentApiIntegrationTest.attachImages_deletedDeck_notFound_AC_NT_70 | Đã có |
| AC-NT-71 | Nhóm thẻ không còn tồn tại | UC-NT-08 |  | TeacherVocabContentApiIntegrationTest.attachImages_deletedGroup_notFound_AC_NT_71 | Đã có |
| AC-NT-72 | Nhóm chưa có thẻ | UC-NT-08 |  | TeacherVocabContentApiIntegrationTest.attachImages_groupWithoutCards_attachesNothing_AC_NT_72 | Đã có |
