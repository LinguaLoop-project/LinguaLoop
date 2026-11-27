# Truy vết AC → test: TN-xem-thong-ke-noi-dung

> Nguồn AC: `docs/srs/TN-xem-thong-ke-noi-dung/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng` (định nghĩa ở [mục lục](../TRACEABILITY-AC-TEST.md#định-nghĩa-trạng-thái)).

Tổng hợp: 23 AC, 0 đã có test, 19 một phần, 4 thiếu.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-TN-01 | Xem tổng quan nội dung của mình | UC-TN-01 | D | TeacherContentStatsServiceIntegrationTest.overview_countsOwnContentAndComparesWithPreviousPeriod_AC_TN_01 (chưa test giao diện) | Một phần |
| AC-TN-02 | Đổi khoảng thời gian | UC-TN-01 | D | TeacherContentStatsServiceIntegrationTest.overview_periodLimitsAttempts_AC_TN_02 (chưa test giao diện) | Một phần |
| AC-TN-03 | Danh sách xếp hạng | UC-TN-01 | D | TeacherContentStatsServiceIntegrationTest.overview_topLessonsAreFiveWithMostLearners_AC_TN_03, TeacherContentStatsServiceIntegrationTest.overview_learnersCountLessonOrDeckOnceAndTopDecks_BR_TN_02 (chưa test giao diện) | Một phần |
| AC-TN-04 | Mở chi tiết từ danh sách | UC-TN-01 | D | Chỉ có ở giao diện, chưa có test | Thiếu |
| AC-TN-05 | Chuyển sang báo cáo đang mở | UC-TN-01 | D | TeacherContentStatsServiceIntegrationTest.overview_cachedForAnHourButOpenReportsAreLive_BR_TN_06 (chưa test giao diện) | Một phần |
| AC-TN-06 | Chưa có nội dung | UC-TN-01 | B | TeacherContentStatsServiceIntegrationTest.overview_noContent_AC_TN_06 (chưa test giao diện) | Một phần |
| AC-TN-07 | Chưa có lượt học trong khoảng thời gian | UC-TN-01 | B | TeacherContentStatsServiceIntegrationTest.overview_noAttemptsInPeriod_isZeroWithEmptyRankings_AC_TN_07 (chưa test giao diện) | Một phần |
| AC-TN-08 | Không tải được số liệu | UC-TN-01 | A | Chỉ có ở giao diện, chưa có test | Thiếu |
| AC-TN-09 | Xem thống kê một bài học | UC-TN-02 | D | TeacherContentStatsServiceIntegrationTest.lesson_countsStartedCompletedOncePerLearnerAndAverages_AC_TN_09 (chưa test giao diện) | Một phần |
| AC-TN-10 | Đổi khoảng thời gian | UC-TN-02 | D | TeacherContentStatsServiceIntegrationTest.lesson_periodLimitsAttempts_AC_TN_10 (chưa test giao diện) | Một phần |
| AC-TN-11 | Câu khó nhất tính riêng từng chế độ | UC-TN-02 | B | TeacherContentStatsServiceIntegrationTest.lesson_hardestSentencesPerModeSkipTooFewAttempts_AC_TN_11, TeacherContentStatsServiceIntegrationTest.lesson_hardestSentencesAreFiveTiesKeepLessonOrder_BR_TN_04 (chưa test giao diện) | Một phần |
| AC-TN-12 | Xem thống kê bài của người khác | UC-TN-02 | A | TeacherContentStatsServiceIntegrationTest.lesson_ofAnotherTeacher_isForbidden_AC_TN_12, TeacherStatsApiIntegrationTest.otherTeachersContent_isForbidden_AC_TN_12_AC_TN_20 (chưa test giao diện) | Một phần |
| AC-TN-13 | Bài học không còn tồn tại | UC-TN-02 | A | TeacherContentStatsServiceIntegrationTest.lesson_deleted_isNotFound_AC_TN_13, TeacherStatsApiIntegrationTest.missingContent_isNotFound_AC_TN_13_AC_TN_21 (chưa test giao diện) | Một phần |
| AC-TN-14 | Bài học chưa có dữ liệu | UC-TN-02 | B | TeacherContentStatsServiceIntegrationTest.lesson_draftWithoutLearners_isZeroWithEmptyHardestLists_AC_TN_14 (chưa test giao diện) | Một phần |
| AC-TN-15 | Không tải được số liệu | UC-TN-02 | A | Chỉ có ở giao diện, chưa có test | Thiếu |
| AC-TN-16 | Xem thống kê một bộ thẻ | UC-TN-03 | D | TeacherContentStatsServiceIntegrationTest.deck_countsLearnersCorrectRateStatesAndHardestCardsPerGroup_AC_TN_16_AC_TN_19 (chưa test giao diện) | Một phần |
| AC-TN-17 | Đổi khoảng thời gian | UC-TN-03 | D | TeacherContentStatsServiceIntegrationTest.deck_periodLimitsReviews_AC_TN_17 (chưa test giao diện) | Một phần |
| AC-TN-18 | Thẻ khó nhất của một nhóm thẻ | UC-TN-03 | B | TeacherContentStatsServiceIntegrationTest.deck_hardestCardsAreFiveLowestRatePerGroupTiesKeepOrder_AC_TN_18 (chưa test giao diện) | Một phần |
| AC-TN-19 | Nhóm thẻ chưa đủ dữ liệu | UC-TN-03 | B | TeacherContentStatsServiceIntegrationTest.deck_countsLearnersCorrectRateStatesAndHardestCardsPerGroup_AC_TN_16_AC_TN_19 (chưa test giao diện) | Một phần |
| AC-TN-20 | Xem thống kê bộ của người khác | UC-TN-03 | A | TeacherContentStatsServiceIntegrationTest.deck_ofAnotherTeacher_isForbiddenAndDeletedIsNotFound_AC_TN_20_AC_TN_21, TeacherStatsApiIntegrationTest.otherTeachersContent_isForbidden_AC_TN_12_AC_TN_20 (chưa test giao diện) | Một phần |
| AC-TN-21 | Bộ thẻ không còn tồn tại | UC-TN-03 | A | TeacherContentStatsServiceIntegrationTest.deck_ofAnotherTeacher_isForbiddenAndDeletedIsNotFound_AC_TN_20_AC_TN_21, TeacherStatsApiIntegrationTest.missingContent_isNotFound_AC_TN_13_AC_TN_21 (chưa test giao diện) | Một phần |
| AC-TN-22 | Bộ thẻ chưa có dữ liệu | UC-TN-03 | B | TeacherContentStatsServiceIntegrationTest.deck_draftWithoutLearners_isZeroAndGroupsHaveNoHardestCards_AC_TN_22 (chưa test giao diện) | Một phần |
| AC-TN-23 | Không tải được số liệu | UC-TN-03 | A | Chỉ có ở giao diện, chưa có test | Thiếu |
