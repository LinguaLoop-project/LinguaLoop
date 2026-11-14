# Truy vết AC → test: BT-quan-ly-bo-the

> Nguồn AC: `docs/srs/BT-quan-ly-bo-the/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng`. Quay lại [mục lục](../TRACEABILITY-AC-TEST.md).

Tổng hợp: 73 AC, 24 đã có test, 3 một phần, 46 thiếu.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-BT-01 | Giáo viên chỉ thấy bộ của mình | UC-BT-01 | D, A | TeacherVocabDeckApiIntegrationTest.listDecks_teacherA_returnsOnlyOwnNonDeletedDecks_AC_BT_01; VocabDeckManageRepositoryIntegrationTest.list_countsOnlyNonDeletedGroupsAndCards_AC_BT_01; TeacherVocabDeckApiIntegrationTest.listDecks_noToken_returns401_AC_BT_01; `frontend/src/features/vocab/deckListState.test.ts`; `frontend/src/features/vocab/deckActions.test.ts` (E2E `e2e/bt-xem-danh-sach-bo-the.spec.ts` chưa viết: chưa có Playwright) | Một phần |
| AC-BT-02 | Quản trị viên chỉ thấy bộ đã xuất bản | UC-BT-01 | D, B | AdminVocabDeckApiIntegrationTest.listDecks_admin_returnsOnlyPublishedWithOwnerName_AC_BT_02; VocabDeckManageRepositoryIntegrationTest.list_sameUpdatedAt_ordersByIdDesc_AC_BT_02 | Đã có |
| AC-BT-03 | Tìm kiếm và lọc của Giáo viên | UC-BT-01 | D, A | VocabDeckManageRepositoryIntegrationTest.list_qToeicStatusDraftPro_returnsIntersection_AC_BT_03; VocabDeckManageRepositoryIntegrationTest.list_statusAll_includesDraftAndPublishedExcludesDeleted_AC_BT_03; TeacherVocabDeckApiIntegrationTest.listDecks_invalidStatusValue_returns400_AC_BT_03; `frontend/src/features/vocab/deckManageApi.test.ts` | Đã có |
| AC-BT-04 | Giáo viên xem bộ đã xóa | UC-BT-01 | D, A, B | VocabDeckManageRepositoryIntegrationTest.list_statusDeleted_returnsOnlyWithin30Days_AC_BT_04; VocabDeckManageRepositoryIntegrationTest.list_statusDeleted_exactly30DaysAgo_included_AC_BT_04; VocabDeckManageRepositoryIntegrationTest.list_statusDeleted_30DaysAnd1SecondAgo_excluded_AC_BT_04; TeacherVocabDeckApiIntegrationTest.listDecks_statusDeleted_otherTeachersDeletedDeck_notReturned_AC_BT_04; `frontend/src/features/vocab/deckActions.test.ts` | Đã có |
| AC-BT-05 | Danh sách trống | UC-BT-01 | D | TeacherVocabDeckApiIntegrationTest.listDecks_teacherWithNoDecks_returnsEmptyPage_AC_BT_05; `frontend/src/features/vocab/deckListState.test.ts` | Đã có |
| AC-BT-06 | Không có kết quả phù hợp | UC-BT-01 | D | VocabDeckManageRepositoryIntegrationTest.list_qNoMatch_returnsEmpty_AC_BT_06; `frontend/src/features/vocab/deckListState.test.ts` | Đã có |
| AC-BT-50 | Quản trị viên lọc theo giáo viên chủ bộ | UC-BT-01 | D, A | VocabDeckManageRepositoryIntegrationTest.list_adminOwnerFilter_returnsOnlyThatOwner_AC_BT_50; AdminVocabDeckApiIntegrationTest.listDecks_ownerWithNoPublishedDecks_returnsEmpty_AC_BT_50 | Đã có |
| AC-BT-57 | Quản trị viên thấy bộ hệ thống | UC-BT-01 | D, A | VocabDeckManageRepositoryIntegrationTest.list_admin_includesSystemDeckExcludesPersonal_AC_BT_57; AdminVocabDeckApiIntegrationTest.listDecks_systemTrue_returnsOnlySystemDecks_AC_BT_57; TeacherVocabDeckApiIntegrationTest.listDecks_teacher_doesNotSeeSystemDeck_AC_BT_57 | Đã có |
| AC-BT-58 | Phân trang danh sách | UC-BT-01 | D, A, B | VocabDeckManageRepositoryIntegrationTest.list_25Decks_page0Has10_page2Has5_descOrder_AC_BT_58; VocabDeckManageRepositoryIntegrationTest.list_exactly10Decks_singlePage_AC_BT_58; TeacherVocabDeckApiIntegrationTest.listDecks_pageBeyondLast_returnsEmptyContent_AC_BT_58; TeacherVocabDeckApiIntegrationTest.listDecks_negativePage_returns400_AC_BT_58 | Đã có |
| AC-BT-59 | Lọc theo danh mục và mục "Khác" | UC-BT-01 | D, A, B | VocabDeckManageRepositoryIntegrationTest.list_categoryAcademic_returnsOnlyThatCategory_AC_BT_59; VocabDeckManageRepositoryIntegrationTest.list_otherTrue_returnsOnlyNullCategory_AC_BT_59; TeacherVocabDeckApiIntegrationTest.listDecks_unknownCategoryId_returnsEmpty_AC_BT_59 | Đã có |
| AC-BT-60 | Tìm kiếm không phân biệt hoa thường, ký tự đặc biệt | UC-BT-01 | D, B | VocabDeckManageRepositoryIntegrationTest.list_qLowercase_matchesCaseInsensitive_AC_BT_60; VocabDeckManageRepositoryIntegrationTest.list_qPercent_isLiteralNotWildcard_AC_BT_60; VocabDeckManageRepositoryIntegrationTest.list_qUnderscoreAndBackslash_areLiteral_AC_BT_60; TeacherVocabDeckApiIntegrationTest.listDecks_qBlank_treatedAsNoFilter_AC_BT_60 | Đã có |
| AC-BT-61 | Quản trị viên không lấy được bộ ngoài phạm vi qua API | UC-BT-01 | A | AdminVocabDeckApiIntegrationTest.listDecks_adminStatusDraft_returns403_AC_BT_61; AdminVocabDeckApiIntegrationTest.listDecks_adminStatusDeleted_returns403_AC_BT_61 | Đã có |
| AC-BT-62 | Giáo viên không lấy được bộ của người khác qua mã bộ | UC-BT-01 |  | Chưa có endpoint chi tiết (UC-BT-04, ngoài đầu việc này) | Thiếu |
| AC-BT-63 | Quản trị viên không có nút sửa, xóa, khôi phục | UC-BT-01 | A | TeacherVocabDeckApiIntegrationTest.listDecks_adminCallsTeacherEndpoint_returns403_AC_BT_63; TeacherVocabDeckApiIntegrationTest.createDeck_admin_returns403_AC_BT_63; `frontend/src/features/vocab/deckActions.test.ts` (403 cho sửa, xóa, khôi phục bổ sung khi có UC-BT-03, 07, 08) | Một phần |
| AC-BT-64 | Lỗi khi tải danh sách | UC-BT-01 | D, A | `frontend/src/features/vocab/deckListState.test.ts`; `frontend/src/features/vocab/deckManageApi.test.ts` | Đã có |
| AC-BT-07 | Thêm bộ thành công | UC-BT-02 | D, A | TeacherVocabDeckApiIntegrationTest.createDeck_validNameJpgCategoryPro_returns201Draft_AC_BT_07; VocabDeckManageServiceIntegrationTest.createDeck_persistsLibraryDraftOwnedByTeacher_notVisibleToStudents_AC_BT_07; TeacherVocabDeckApiIntegrationTest.createDeck_unknownCategoryId_returns400or404_AC_BT_07; `frontend/src/features/vocab/deckManageApi.test.ts` (E2E `e2e/bt-tao-bo-the.spec.ts` chưa viết: chưa có Playwright) | Một phần |
| AC-BT-08 | Thêm bộ không chọn ảnh | UC-BT-02 | D | TeacherVocabDeckApiIntegrationTest.createDeck_nameOnly_usesDefaultImageNoCategoryNotPro_AC_BT_08 | Đã có |
| AC-BT-09 | Hủy tạo bộ | UC-BT-02 | D | `frontend/src/features/vocab/createDeckForm.test.ts` | Đã có |
| AC-BT-10 | Thiếu hoặc sai tên bộ | UC-BT-02 | A | TeacherVocabDeckApiIntegrationTest.createDeck_blankName_returns400_AC_BT_10; `frontend/src/features/vocab/createDeckForm.test.ts` | Đã có |
| AC-BT-11 | Tên bộ bị trùng | UC-BT-02 | A | VocabDeckManageServiceIntegrationTest.createDeck_sameNameDifferentCase_throwsConflict_AC_BT_11; TeacherVocabDeckApiIntegrationTest.createDeck_duplicateName_returns409_AC_BT_11; `frontend/src/features/vocab/createDeckForm.test.ts` | Đã có |
| AC-BT-12 | Ảnh không hợp lệ | UC-BT-02 | A | DeckImageValidatorTest.validate_pdfFile_throwsFieldValidation_AC_BT_12; DeckImageValidatorTest.validate_png5MB_throwsFieldValidation_AC_BT_12; TeacherVocabDeckApiIntegrationTest.createDeck_pdfImage_returns400AndNothingSaved_AC_BT_12; `frontend/src/features/vocab/createDeckForm.test.ts` | Đã có |
| AC-BT-13 | Mất kết nối khi lưu | UC-BT-02 | A | VocabDeckManageServiceIntegrationTest.createDeck_dbFailureAfterImageStored_deletesImage_AC_BT_13; `frontend/src/features/vocab/createDeckForm.test.ts` | Đã có |
| AC-BT-65 | Biên độ dài tên bộ | UC-BT-02 | B | VocabDeckManageServiceImplTest.createDeck_name100Chars_accepted_AC_BT_65; VocabDeckManageServiceImplTest.createDeck_name101Chars_throwsFieldValidation_AC_BT_65; TeacherVocabDeckApiIntegrationTest.createDeck_name101Chars_returns400_name100Chars_returns201_AC_BT_65; `frontend/src/features/vocab/createDeckForm.test.ts` | Đã có |
| AC-BT-66 | Tên chỉ có khoảng trắng | UC-BT-02 | A, B | VocabDeckManageServiceImplTest.createDeck_whitespaceOnlyName_throwsRequired_AC_BT_66; TeacherVocabDeckApiIntegrationTest.createDeck_nameWithPaddingSpaces_savedTrimmed_AC_BT_66; VocabDeckManageServiceImplTest.createDeck_name100CharsPlusPaddingSpaces_accepted_AC_BT_66 | Đã có |
| AC-BT-67 | Trùng tên khác giáo viên và bộ đã xóa | UC-BT-02 | B | VocabDeckManageServiceIntegrationTest.createDeck_sameNameAsOtherTeachersDeck_succeeds_AC_BT_67; VocabDeckManageServiceIntegrationTest.createDeck_sameNameAsOwnDeletedDeck_succeeds_AC_BT_67 | Đã có |
| AC-BT-68 | Tạo đồng thời cùng tên | UC-BT-02 | B | VocabDeckManageServiceIntegrationTest.createDeck_twoConcurrentSameName_oneSavedOtherConflict_AC_BT_68 | Đã có |
| AC-BT-69 | Biên dung lượng và định dạng ảnh | UC-BT-02 | D, A, B | DeckImageValidatorTest.validate_jpgExactly2097152Bytes_accepted_AC_BT_69; DeckImageValidatorTest.validate_jpg2097153Bytes_rejected_AC_BT_69; DeckImageValidatorTest.validate_pdfRenamedPng_rejectedByMagicBytes_AC_BT_69; DeckImageValidatorTest.validate_realPngAndJpgSignatures_accepted_AC_BT_69; DeckImageValidatorTest.validate_emptyFile_rejected_AC_BT_69; TeacherVocabDeckApiIntegrationTest.createDeck_pdfRenamedPng_returns400_AC_BT_69 | Đã có |
| AC-BT-14 | Sửa bộ Nháp thành công | UC-BT-03 |  |  | Thiếu |
| AC-BT-15 | Sửa bộ đã xuất bản | UC-BT-03 |  |  | Thiếu |
| AC-BT-16 | Xóa ảnh của bộ | UC-BT-03 |  |  | Thiếu |
| AC-BT-17 | Sửa bộ của người khác | UC-BT-03 |  |  | Thiếu |
| AC-BT-18 | Bộ không còn tồn tại | UC-BT-03 |  |  | Thiếu |
| AC-BT-19 | Thiếu hoặc sai thông tin | UC-BT-03 |  |  | Thiếu |
| AC-BT-20 | Tên bộ bị trùng | UC-BT-03 |  |  | Thiếu |
| AC-BT-21 | Mất kết nối khi lưu | UC-BT-03 |  |  | Thiếu |
| AC-BT-70 | Hủy thay đổi chưa lưu | UC-BT-03 |  |  | Thiếu |
| AC-BT-22 | Giáo viên xem chi tiết bộ Nháp | UC-BT-04 |  |  | Thiếu |
| AC-BT-23 | Giáo viên chuyển từ xem chi tiết sang sửa | UC-BT-04 |  |  | Thiếu |
| AC-BT-24 | Giáo viên xem chi tiết bộ của người khác | UC-BT-04 |  |  | Thiếu |
| AC-BT-25 | Bộ chưa có thẻ | UC-BT-04 |  |  | Thiếu |
| AC-BT-51 | Quản trị viên xem chi tiết bộ đã xuất bản | UC-BT-04 |  |  | Thiếu |
| AC-BT-52 | Quản trị viên mở bộ không có quyền xem | UC-BT-04 |  |  | Thiếu |
| AC-BT-53 | Tìm thẻ và phân trang | UC-BT-04 |  |  | Thiếu |
| AC-BT-54 | Không có thẻ khớp từ khóa | UC-BT-04 |  |  | Thiếu |
| AC-BT-55 | Bộ không còn xem được | UC-BT-04 |  |  | Thiếu |
| AC-BT-26 | Xuất bản thành công | UC-BT-05 |  |  | Thiếu |
| AC-BT-27 | Xuất bản lại bộ đã bị quản trị viên gỡ | UC-BT-05 |  |  | Thiếu |
| AC-BT-28 | Bộ đã xuất bản | UC-BT-05 |  |  | Thiếu |
| AC-BT-29 | Bộ chưa đủ điều kiện | UC-BT-05 |  |  | Thiếu |
| AC-BT-30 | Hủy xuất bản | UC-BT-05 |  |  | Thiếu |
| AC-BT-31 | Mất kết nối khi xuất bản | UC-BT-05 |  |  | Thiếu |
| AC-BT-71 | Xuất bản bộ của người khác | UC-BT-05 |  |  | Thiếu |
| AC-BT-72 | Xuất bản bộ không còn tồn tại | UC-BT-05 |  |  | Thiếu |
| AC-BT-32 | Giáo viên gỡ bộ của mình | UC-BT-06 |  |  | Thiếu |
| AC-BT-33 | Quản trị viên gỡ bộ kèm lý do | UC-BT-06 |  |  | Thiếu |
| AC-BT-34 | Gỡ bộ của người khác | UC-BT-06 |  |  | Thiếu |
| AC-BT-35 | Bộ không ở trạng thái Đã xuất bản | UC-BT-06 |  |  | Thiếu |
| AC-BT-36 | Quản trị viên chưa nhập lý do | UC-BT-06 |  |  | Thiếu |
| AC-BT-37 | Hủy gỡ xuất bản | UC-BT-06 |  |  | Thiếu |
| AC-BT-38 | Mất kết nối khi gỡ | UC-BT-06 |  |  | Thiếu |
| AC-BT-39 | Giáo viên xóa bộ Nháp | UC-BT-07 |  |  | Thiếu |
| AC-BT-40 | Giáo viên xóa bộ đang xuất bản | UC-BT-07 |  |  | Thiếu |
| AC-BT-41 | Xóa bộ của người khác | UC-BT-07 |  |  | Thiếu |
| AC-BT-42 | Bộ không còn tồn tại | UC-BT-07 |  |  | Thiếu |
| AC-BT-43 | Hủy xóa | UC-BT-07 |  |  | Thiếu |
| AC-BT-44 | Mất kết nối khi xóa | UC-BT-07 |  |  | Thiếu |
| AC-BT-45 | Khôi phục thành công | UC-BT-08 |  |  | Thiếu |
| AC-BT-46 | Tên bộ bị trùng khi khôi phục | UC-BT-08 |  |  | Thiếu |
| AC-BT-47 | Bộ quá hạn khôi phục | UC-BT-08 |  |  | Thiếu |
| AC-BT-48 | Hủy khôi phục | UC-BT-08 |  |  | Thiếu |
| AC-BT-49 | Mất kết nối khi khôi phục | UC-BT-08 |  |  | Thiếu |
| AC-BT-56 | Bộ đã được khôi phục trước đó | UC-BT-08 |  |  | Thiếu |
| AC-BT-73 | Khôi phục bộ của người khác | UC-BT-08 | A | VocabDeckLifecycleApiIntegrationTest.restore_otherTeachersDeck_returns403 | Đã có |
