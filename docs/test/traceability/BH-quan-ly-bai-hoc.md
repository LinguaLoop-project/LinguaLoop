# Truy vết AC → test: BH-quan-ly-bai-hoc

> Nguồn AC: `docs/srs/BH-quan-ly-bai-hoc/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng` (định nghĩa ở [mục lục](../TRACEABILITY-AC-TEST.md#định-nghĩa-trạng-thái)).

Tổng hợp: 101 AC, 67 đã có test, 2 một phần, 29 thiếu, 3 không áp dụng.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-BH-01 | Giáo viên chỉ thấy bài của mình | UC-BH-01 | A | LessonManageApiIntegrationTest.teacherList_showsOnlyOwnNotDeletedLessons_AC_BH_01 | Đã có |
| AC-BH-02 | Quản trị viên chỉ thấy bài đã xuất bản | UC-BH-01 | A | LessonManageApiIntegrationTest.adminList_showsOnlyPublishedWithOwnerName_AC_BH_02_AC_BH_82 | Đã có |
| AC-BH-03 | Tìm kiếm và lọc của Giáo viên | UC-BH-01 | A | LessonManageApiIntegrationTest.teacherList_searchAndFilters_AC_BH_03 | Đã có |
| AC-BH-04 | Giáo viên xem bài đã xóa | UC-BH-01 | A | LessonManageApiIntegrationTest.teacherList_deletedFilterShowsOnlyLast30Days_AC_BH_04 | Đã có |
| AC-BH-05 | Danh sách trống | UC-BH-01 | A | LessonManageApiIntegrationTest.teacherList_empty_AC_BH_05 | Đã có |
| AC-BH-06 | Không có kết quả phù hợp | UC-BH-01 |  |  | Thiếu |
| AC-BH-82 | Quản trị viên lọc theo giáo viên chủ bài | UC-BH-01 | A | LessonManageApiIntegrationTest.adminList_showsOnlyPublishedWithOwnerName_AC_BH_02_AC_BH_82 | Đã có |
| AC-BH-07 | Giáo viên xem chi tiết bài Nháp của mình | UC-BH-02 | A | LessonManageApiIntegrationTest.teacherDetail_ownDraftWithOrderedSentences_AC_BH_07 | Đã có |
| AC-BH-08 | Quản trị viên xem chi tiết bài đã xuất bản | UC-BH-02 | A | LessonManageApiIntegrationTest.detail_permissions_AC_BH_08_09_10_11 | Đã có |
| AC-BH-09 | Bài của giáo viên khác | UC-BH-02 | A | LessonManageApiIntegrationTest.detail_permissions_AC_BH_08_09_10_11 | Đã có |
| AC-BH-10 | Quản trị viên không xem được bản Nháp | UC-BH-02 | A | LessonManageApiIntegrationTest.detail_permissions_AC_BH_08_09_10_11; ReportModerationApiIntegrationTest.adminLessonDetail_takenDownDraftIsViewable_plainDraftIsNot_AC_BH_10 | Đã có |
| AC-BH-11 | Bài đã bị xóa | UC-BH-02 | A | LessonManageApiIntegrationTest.detail_permissions_AC_BH_08_09_10_11 | Đã có |
| AC-BH-12 | Video không phát được | UC-BH-02 |  |  | Thiếu |
| AC-BH-13 | Xem chi tiết không ghi nhận tiến độ | UC-BH-02 |  |  | Thiếu |
| AC-BH-14 | Tạo bài thành công | UC-BH-03 | D | TeacherLessonImportApiIntegrationTest.create_validVideo_savesDraftWithTimedSentencesAndIpaWithoutTranslation_AC_BH_14; TranscriptApiLessonImportIntegrationTest.create_fromEnglishCaptions_mergesLinesIntoTimedSentencesWithoutAi_AC_BH_14 | Đã có |
| AC-BH-15 | Để trống tiêu đề | UC-BH-03 | D, B | TeacherLessonImportApiIntegrationTest.create_blankTitle_usesVideoTitleCutTo100Characters_AC_BH_15 | Đã có |
| AC-BH-16 | Link không hợp lệ | UC-BH-03 | A | TeacherLessonImportApiIntegrationTest.create_invalidOrBlankLink_rejectsWithoutCallingYouTube_AC_BH_16; YouTubeVideoIdTest; TeacherLessonImportApiIntegrationTest.preview_invalidLinkTooLongOrTakenVideo_reportsSameErrorsAsCreate_AC_BH_16_19_93 | Đã có |
| AC-BH-17 | Video không có phụ đề tiếng Anh | UC-BH-03 | A | TeacherLessonImportApiIntegrationTest.create_videoWithoutEnglishSpeech_createsNothingAndChargesNothing_AC_BH_17; TranscriptApiLessonImportIntegrationTest.create_videoWithoutEnglishCaptions_createsNothingAndChargesNothing_AC_BH_17 | Đã có |
| AC-BH-18 | Video không truy cập được | UC-BH-03 | A | TeacherLessonImportApiIntegrationTest.create_privateRemovedLiveOrAgeRestrictedVideo_isUnavailable_AC_BH_18; TeacherLessonImportApiIntegrationTest.create_unlistedVideo_isAccepted_BR_BH_07 | Đã có |
| AC-BH-19 | Video quá dài | UC-BH-03 | A, B | TeacherLessonImportApiIntegrationTest.create_videoLongerThan15Minutes_isRejected_AC_BH_19; TeacherLessonImportApiIntegrationTest.preview_invalidLinkTooLongOrTakenVideo_reportsSameErrorsAsCreate_AC_BH_16_19_93 | Đã có |
| AC-BH-20 | Tiêu đề bị trùng | UC-BH-03 | A | TeacherLessonImportApiIntegrationTest.create_titleTakenIgnoringCase_isRejected_AC_BH_20 | Đã có |
| AC-BH-21 | Thông tin bài chưa hợp lệ | UC-BH-03 | A | TeacherLessonImportApiIntegrationTest.create_missingTopicOrLevel_showsFieldError_AC_BH_21 | Đã có |
| AC-BH-22 | Tạo bài không cần credit | UC-BH-03 | A | TeacherLessonImportApiIntegrationTest.create_withoutCredit_stillCreatesLesson_AC_BH_22 | Đã có |
| AC-BH-23 | Mất kết nối hoặc YouTube không phản hồi | UC-BH-03 | A | TeacherLessonImportApiIntegrationTest.create_youTubeDown_createsNothing_AC_BH_23 | Đã có |
| AC-BH-83 | Không lấy được lời thoại | UC-BH-03 | A | TeacherLessonImportApiIntegrationTest.create_transcriptServiceFails_createsNothingAndChargesNothing_AC_BH_83; TranscriptApiLessonImportIntegrationTest.create_transcriptApiOutOfCredits_failsWithRetryAndCreatesNothing_AC_BH_83 | Đã có |
| AC-BH-84 | (Bỏ) Lỗi AI khi gợi ý bản dịch lúc tạo bài | UC-BH-03 | A | Tạo bài không còn gọi AI dịch; TranscriptApiLessonImportIntegrationTest kiểm Gemini không được gọi | Không áp dụng |
| AC-BH-85 | (Bỏ) Hết credit giữa chừng khi tạo bài | UC-BH-03 | A, B | Tạo bài không gọi AI dịch nên không trừ credit | Không áp dụng |
| AC-BH-92 | Tiêu đề lấy từ tên video bị trùng | UC-BH-03 |  |  | Thiếu |
| AC-BH-93 | Video đã có bài của chính giáo viên | UC-BH-03 | A | TeacherLessonImportApiIntegrationTest.create_videoAlreadyUsedByOwnLesson_pointsToThatLesson_AC_BH_93; TeacherLessonImportApiIntegrationTest.preview_invalidLinkTooLongOrTakenVideo_reportsSameErrorsAsCreate_AC_BH_16_19_93 | Đã có |
| AC-BH-94 | Video đã có bài của giáo viên khác | UC-BH-03 | A | TeacherLessonImportApiIntegrationTest.create_videoAlreadyUsedByAnotherTeacher_hidesThatLesson_AC_BH_94 | Đã có |
| AC-BH-95 | Hai yêu cầu tạo bài cùng video cùng lúc | UC-BH-03 |  |  | Thiếu |
| AC-BH-24 | Sửa thông tin bài Nháp | UC-BH-04 | A | LessonManageApiIntegrationTest.updateInfo_savesAndAudits_AC_BH_24 | Đã có |
| AC-BH-25 | Sửa bài đã xuất bản có hiệu lực ngay | UC-BH-04 |  |  | Thiếu |
| AC-BH-26 | Bật nhãn Pro cho bài đã xuất bản | UC-BH-04 |  |  | Thiếu |
| AC-BH-27 | Đổi chủ đề | UC-BH-04 |  |  | Thiếu |
| AC-BH-28 | Tiêu đề bị trùng | UC-BH-04 | A | LessonManageApiIntegrationTest.updateInfo_titleTakenOrInvalid_AC_BH_28_29 | Đã có |
| AC-BH-29 | Tiêu đề rỗng hoặc quá dài | UC-BH-04 | A | LessonManageApiIntegrationTest.updateInfo_titleTakenOrInvalid_AC_BH_28_29 | Đã có |
| AC-BH-30 | Bài của giáo viên khác | UC-BH-04 | A | LessonManageApiIntegrationTest.updateInfo_otherTeacherOrDeleted_AC_BH_30_31 | Đã có |
| AC-BH-31 | Bài đã bị xóa trong lúc sửa | UC-BH-04 | A | LessonManageApiIntegrationTest.updateInfo_otherTeacherOrDeleted_AC_BH_30_31 | Đã có |
| AC-BH-32 | Hủy chỉnh sửa | UC-BH-04 |  |  | Thiếu |
| AC-BH-33 | Mất kết nối khi lưu | UC-BH-04 |  |  | Thiếu |
| AC-BH-34 | Sửa câu tiếng Anh và bản dịch | UC-BH-05 | A | LessonManageApiIntegrationTest.updateSentences_savesTranslationAndIpaWithAudit_AC_BH_34_35_36; sentenceDraft.test.ts "chỉ gửi câu đã đổi và câu đã chọn xóa" | Đã có |
| AC-BH-35 | IPA được tạo lại khi sửa câu tiếng Anh | UC-BH-05 | D | Chưa có: test hiện tại chỉ kiểm lưu IPA gửi lên, chưa kiểm tạo lại IPA khi câu tiếng Anh đổi | Thiếu |
| AC-BH-36 | Sửa mốc thời gian | UC-BH-05 | A | LessonManageApiIntegrationTest.updateSentences_savesTranslationAndIpaWithAudit_AC_BH_34_35_36; sentenceDraft.test.ts "định dạng và đọc lại mốc thời gian" | Đã có |
| AC-BH-37 | Mốc thời gian không hợp lệ | UC-BH-05 | A | LessonManageApiIntegrationTest.updateSentences_invalidTimesOrText_rejectsAll_AC_BH_37_38; sentenceDraft.test.ts "báo mốc chồng lấn câu kề bên", "báo đoạn ngắn hơn 0,5 giây…" | Đã có |
| AC-BH-38 | Câu tiếng Anh để trống hoặc quá dài | UC-BH-05 | A | LessonManageApiIntegrationTest.updateSentences_invalidTimesOrText_rejectsAll_AC_BH_37_38; sentenceDraft.test.ts "câu tiếng Anh trống hoặc bản dịch 501 ký tự" | Đã có |
| AC-BH-39 | Xóa câu | UC-BH-05 | A | LessonManageApiIntegrationTest.updateSentences_deleteRenumbers_AC_BH_39; sentenceDraft.test.ts "chỉ gửi câu đã đổi và câu đã chọn xóa" | Đã có |
| AC-BH-40 | Không xóa hết câu của bài đã xuất bản | UC-BH-05 | A | LessonManageApiIntegrationTest.updateSentences_publishedMustKeepOneSentence_AC_BH_40 | Đã có |
| AC-BH-41 | Sửa câu của bài đã xuất bản giữ tiến độ | UC-BH-05 | A | LessonManageApiIntegrationTest.updateSentences_publishedKeepsAttempts_AC_BH_41 | Đã có |
| AC-BH-42 | Sửa câu bài của giáo viên khác | UC-BH-05 | A | LessonManageApiIntegrationTest.updateSentences_otherTeacherOrDeletedLesson_AC_BH_42_86 | Đã có |
| AC-BH-86 | Sửa câu của bài đã bị xóa | UC-BH-05 | A | LessonManageApiIntegrationTest.updateSentences_otherTeacherOrDeletedLesson_AC_BH_42_86 | Đã có |
| AC-BH-87 | Rời màn hình khi chưa lưu | UC-BH-05 |  |  | Thiếu |
| AC-BH-88 | Mất kết nối khi lưu câu | UC-BH-05 |  |  | Thiếu |
| AC-BH-98 | Tách câu của bài chưa từng xuất bản | UC-BH-05 | D | LessonManageApiIntegrationTest.split_neverPublishedDraft_addsSentenceAndFillsIpa_AC_BH_98; sentenceDraft.test.ts "splitRow and mergeWithNext" | Đã có |
| AC-BH-99 | Gộp hai câu | UC-BH-05 | D | LessonManageApiIntegrationTest.merge_twoSentences_keepsFirstIdAndDeletesSecond_AC_BH_99; sentenceDraft.test.ts "merges with the next sentence" | Đã có |
| AC-BH-100 | Bài đã từng xuất bản không tách, gộp được | UC-BH-05 | A | LessonManageApiIntegrationTest.split_lessonPublishedBefore_isLockedEvenAfterUnpublish_AC_BH_100 | Đã có |
| AC-BH-101 | Chưa nhập mốc tách | UC-BH-05 | B | LessonManageApiIntegrationTest.split_newSentenceWithoutSplitTime_reportsErrorOnItsKey_AC_BH_101; sentenceDraft.test.ts "splits at the cursor" | Đã có |
| AC-BH-43 | Xuất bản thành công | UC-BH-06 | A | LessonManageApiIntegrationTest.publish_completeDraft_publishesAndAudits_AC_BH_43 | Đã có |
| AC-BH-44 | Chủ đề trở thành hiển thị | UC-BH-06 |  |  | Thiếu |
| AC-BH-45 | Thiếu bản dịch | UC-BH-06 | A | LessonManageApiIntegrationTest.publish_missingTranslationsOrNoSentences_AC_BH_45_46 | Đã có |
| AC-BH-46 | Bài không có câu | UC-BH-06 | A | LessonManageApiIntegrationTest.publish_missingTranslationsOrNoSentences_AC_BH_45_46 | Đã có |
| AC-BH-47 | Xuất bản bài của giáo viên khác | UC-BH-06 | A | LessonManageApiIntegrationTest.publish_otherTeacherOrAlreadyPublished_AC_BH_47_89 | Đã có |
| AC-BH-48 | Hủy xuất bản | UC-BH-06 |  |  | Thiếu |
| AC-BH-49 | Mất kết nối khi xuất bản | UC-BH-06 |  |  | Thiếu |
| AC-BH-89 | Bài đã được xuất bản ở cửa sổ khác | UC-BH-06 | A | LessonManageApiIntegrationTest.publish_otherTeacherOrAlreadyPublished_AC_BH_47_89 | Đã có |
| AC-BH-76 | Gửi duyệt xuất bản lại bài bị quản trị viên gỡ | UC-BH-06 | A | ReportModerationApiIntegrationTest.publish_lessonTakenDownByReport_requiresReview_AC_BH_76 | Một phần |
| AC-BH-77 | Đã có yêu cầu đang chờ duyệt | UC-BH-06 |  |  | Thiếu |
| AC-BH-81 | Gửi duyệt bài bị gỡ tay kèm ghi chú | UC-BH-06 | D, A |  | Thiếu |
| AC-BH-50 | Giáo viên gỡ bài của mình | UC-BH-07 | A | LessonManageApiIntegrationTest.teacherUnpublish_backToDraftWithoutReason_AC_BH_50 | Đã có |
| AC-BH-51 | Quản trị viên gỡ bài kèm lý do | UC-BH-07 | A | LessonManageApiIntegrationTest.adminUnpublish_reasonShownToTeacher_AC_BH_51; ReportModerationApiIntegrationTest.adminUnpublishLesson_marksNotifiesAndClosesOffensive_AC_BH_51_AC_BH_80 | Đã có |
| AC-BH-52 | Gỡ bài của người khác | UC-BH-07 | A | LessonManageApiIntegrationTest.unpublish_otherTeacherDraftOrBadReason_AC_BH_52_53_54 | Đã có |
| AC-BH-53 | Bài không ở trạng thái Đã xuất bản | UC-BH-07 | A | LessonManageApiIntegrationTest.unpublish_otherTeacherDraftOrBadReason_AC_BH_52_53_54 | Đã có |
| AC-BH-54 | Lý do gỡ không hợp lệ | UC-BH-07 | A | LessonManageApiIntegrationTest.unpublish_otherTeacherDraftOrBadReason_AC_BH_52_53_54 | Đã có |
| AC-BH-55 | Hủy gỡ xuất bản | UC-BH-07 |  |  | Thiếu |
| AC-BH-56 | Mất kết nối khi gỡ | UC-BH-07 |  |  | Thiếu |
| AC-BH-80 | Quản trị viên gỡ tay đóng báo cáo Phản cảm của bài | UC-BH-07 | D | ReportModerationApiIntegrationTest.adminUnpublishLesson_marksNotifiesAndClosesOffensive_AC_BH_51_AC_BH_80 | Đã có |
| AC-BH-57 | Xóa bài Nháp | UC-BH-08 | A | LessonManageApiIntegrationTest.delete_movesToDeletedFilterAndAudits_AC_BH_57_58 | Đã có |
| AC-BH-58 | Xóa bài đã xuất bản | UC-BH-08 | A | LessonManageApiIntegrationTest.delete_movesToDeletedFilterAndAudits_AC_BH_57_58 | Đã có |
| AC-BH-59 | Xóa bài có báo cáo đang mở | UC-BH-08 |  |  | Thiếu |
| AC-BH-60 | Xóa bài của giáo viên khác | UC-BH-08 | A | LessonManageApiIntegrationTest.delete_otherTeacherOrAdmin_AC_BH_60 | Đã có |
| AC-BH-61 | Hủy xóa | UC-BH-08 |  |  | Thiếu |
| AC-BH-62 | Mất kết nối khi xóa | UC-BH-08 |  |  | Thiếu |
| AC-BH-90 | Bài đã bị xóa ở cửa sổ khác | UC-BH-08 | A | LessonManageApiIntegrationTest.delete_alreadyDeleted_keepsDeletedAt_AC_BH_90 | Đã có |
| AC-BH-78 | Xóa bài đang chờ duyệt xuất bản lại | UC-BH-08 | D | ReportModerationApiIntegrationTest.deleteLesson_cancelsPendingRequest_AC_BH_78 | Đã có |
| AC-BH-63 | Khôi phục thành công | UC-BH-09 | A | LessonManageApiIntegrationTest.restore_publishedLessonComesBackAsDraftWithSentences_AC_BH_63 | Đã có |
| AC-BH-64 | Tiêu đề bị trùng khi khôi phục | UC-BH-09 | A | LessonManageApiIntegrationTest.restore_titleTaken_needsNewTitle_AC_BH_64 | Đã có |
| AC-BH-65 | Bài quá hạn khôi phục | UC-BH-09 | A | LessonManageApiIntegrationTest.restore_expiredOrNotDeleted_AC_BH_65_66 | Đã có |
| AC-BH-66 | Bài đã được khôi phục ở cửa sổ khác | UC-BH-09 | A | LessonManageApiIntegrationTest.restore_expiredOrNotDeleted_AC_BH_65_66 | Đã có |
| AC-BH-67 | Hủy khôi phục | UC-BH-09 |  |  | Thiếu |
| AC-BH-68 | Mất kết nối khi khôi phục | UC-BH-09 |  |  | Thiếu |
| AC-BH-96 | Khôi phục bài có video đã được dùng | UC-BH-09 | A | LessonManageApiIntegrationTest.restore_videoUsedByAnotherLesson_AC_BH_96 | Đã có |
| AC-BH-79 | Khôi phục bài bị quản trị viên gỡ vẫn giữ dấu | UC-BH-09 | D | ReportModerationApiIntegrationTest.restoreLesson_keepsTakedownMark_AC_BH_79 | Đã có |
| AC-BH-69 | Tạo lại gợi ý cho một câu | UC-BH-10 | A | LessonManageApiIntegrationTest.suggest_translationAndIpa_savesNothing_AC_BH_69_75; sentenceDraft.test.ts "ghi đè lấy mọi câu trong phạm vi; phạm vi câu đang chọn" | Đã có |
| AC-BH-70 | Điền cho toàn bài, chỉ ô còn trống | UC-BH-10 | D | sentenceDraft.test.ts "chỉ điền ô còn trống: chỉ lấy câu chưa có bản dịch, thiếu IPA không tính"; chưa test phần điền gợi ý vào ô | Một phần |
| AC-BH-71 | Ghi đè cần xác nhận | UC-BH-10 |  |  | Thiếu |
| AC-BH-72 | Không đủ credit để bắt đầu | UC-BH-10 | A | Chưa có: phần credit của gợi ý dịch làm sau (module credit) | Thiếu |
| AC-BH-73 | Hết credit giữa chừng | UC-BH-10 |  |  | Thiếu |
| AC-BH-74 | Lỗi hệ thống không trừ credit | UC-BH-10 | A | LessonManageApiIntegrationTest.suggest_aiFailure_keepsCellsEmpty_AC_BH_74 | Đã có |
| AC-BH-75 | Gợi ý chưa lưu thì không đổi nội dung bài | UC-BH-10 | A | LessonManageApiIntegrationTest.suggest_translationAndIpa_savesNothing_AC_BH_69_75 | Đã có |
| AC-BH-91 | Mất kết nối khi tạo gợi ý | UC-BH-10 |  |  | Thiếu |
| AC-BH-97 | (Bỏ) Tạo lại IPA khi hết credit | UC-BH-10 | A | UC-BH-10 chỉ gợi ý bản dịch; IPA tạo tự động không tốn credit | Không áp dụng |
