# Truy vết AC → test: NK-nhat-ky-thong-ke-he-thong

> Nguồn AC: `docs/srs/NK-nhat-ky-thong-ke-he-thong/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng` (định nghĩa ở [mục lục](../TRACEABILITY-AC-TEST.md#định-nghĩa-trạng-thái)).

Tổng hợp: 27 AC, 0 đã có test, 19 một phần, 8 thiếu.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-NK-01 | Xem nhật ký mặc định | UC-NK-01 | D | AdminAuditLogApiIntegrationTest.list_defaultsToLastSevenDaysNewestFirst_AC_NK_01 (chưa test giao diện) | Một phần |
| AC-NK-02 | Lọc kết hợp | UC-NK-01 | D | AdminAuditLogApiIntegrationTest.list_combinesActionTypePeriodAndKeyword_AC_NK_02 (chưa test giao diện) | Một phần |
| AC-NK-03 | Xem chi tiết thay đổi | UC-NK-01 | D | AdminAuditLogApiIntegrationTest.detail_showsOldAndNewValuesOfEachChangedField_AC_NK_03, AuditChangesTest.build_keepsOnlyChangedFields_withOldAndNew_AC_NK_03 (chưa test giao diện) | Một phần |
| AC-NK-04 | Mở đối tượng | UC-NK-01 | D, A | AdminAuditLogApiIntegrationTest.detail_existingLesson_canBeOpened_deletedOneCannot_AC_NK_04 (chưa test giao diện) | Một phần |
| AC-NK-05 | Chưa có nhật ký trong khoảng thời gian | UC-NK-01 | B | frontend/src/features/audit/auditFormat.test.ts (gợi ý khoảng rộng hơn; chưa test giao diện) | Một phần |
| AC-NK-06 | Không có mục phù hợp | UC-NK-01 | A | AdminAuditLogApiIntegrationTest.list_noMatch_isEmpty_AC_NK_06 (chưa test giao diện) | Một phần |
| AC-NK-07 | Không tải được nhật ký | UC-NK-01 |  |  | Thiếu |
| AC-NK-08 | Lọc theo vai trò người thực hiện | UC-NK-01 | D | AdminAuditLogApiIntegrationTest.list_filtersByActorRoleIncludingSystem_AC_NK_08 (chưa test giao diện) | Một phần |
| AC-NK-09 | Xem tổng quan hệ thống | UC-NK-02 | D | StatsWindowTest.metric_changeIsRelativeToPreviousPeriod_AC_NK_09 (chưa test giao diện) | Một phần |
| AC-NK-10 | Đổi khoảng thời gian | UC-NK-02 |  |  | Thiếu |
| AC-NK-11 | Xử lý báo cáo đang chờ | UC-NK-02 |  |  | Thiếu |
| AC-NK-12 | Không tải được số liệu | UC-NK-02 |  |  | Thiếu |
| AC-NK-13 | Chưa có dữ liệu trong khoảng thời gian | UC-NK-02 | B | frontend/src/features/stats/statsFormat.test.ts (trục biểu đồ khi mọi giá trị bằng 0; chưa test giao diện) | Một phần |
| AC-NK-14 | Đếm người dùng hoạt động | UC-NK-02 | D | SystemStatsAdminServiceIntegrationTest.overview_activeUserHasPracticeReviewOrSuccessfulAi_AC_NK_14 (chưa test giao diện) | Một phần |
| AC-NK-15 | Ngày theo giờ Việt Nam và ngày không có dữ liệu | UC-NK-02 | B | StatsWindowTest.sevenDays_endsTodayInVietnam_andHasEveryDay_AC_NK_15, SystemStatsAdminServiceIntegrationTest.overview_daysFollowVietnamTimeAndEmptyDaysAreZero_AC_NK_15, frontend/src/features/stats/statsFormat.test.ts (chưa test giao diện) | Một phần |
| AC-NK-16 | Xem thống kê luyện tập | UC-NK-03 | D | SystemStatsAdminServiceIntegrationTest.practice_reviewsCorrectRateAndTopDeck_AC_NK_16 (chưa test giao diện) | Một phần |
| AC-NK-17 | Đổi khoảng thời gian và lọc theo gói | UC-NK-03 | D | SystemStatsAdminServiceIntegrationTest.practice_countsAttemptsAveragesAndCompletion_AC_NK_20_AC_NK_17 (chưa test giao diện) | Một phần |
| AC-NK-18 | Chưa có dữ liệu luyện tập | UC-NK-03 | B | SystemStatsAdminServiceIntegrationTest.practice_noData_isZeroWithEmptyRankings_AC_NK_18 (chưa test giao diện) | Một phần |
| AC-NK-19 | Không tải được số liệu | UC-NK-03 |  |  | Thiếu |
| AC-NK-20 | Lượt "Hiện cả câu", lượt "Làm lại" và mức tăng giảm | UC-NK-03 | B | SystemStatsAdminServiceIntegrationTest.practice_countsAttemptsAveragesAndCompletion_AC_NK_20_AC_NK_17 (chưa test giao diện) | Một phần |
| AC-NK-21 | Xem thống kê sử dụng AI và chi phí | UC-NK-04 | D | AiEconomicsCalculatorTest.pricePerUnit_usesEveryCreditSpent_notOnlyPaidOnes_AC_NK_21, RevenueCalculatorTest.revenue_monthlyOrdersInsideAndYearlyOrderSpanningWindow_AC_NK_21, SystemStatsAdminServiceIntegrationTest.aiUsage_profitAndTrialCostWithExtraCost_AC_NK_21_AC_NK_26 (chưa test giao diện) | Một phần |
| AC-NK-22 | Đổi khoảng thời gian | UC-NK-04 |  |  | Thiếu |
| AC-NK-23 | Điều chỉnh cấu hình credit | UC-NK-04 |  |  | Thiếu |
| AC-NK-24 | Chưa có lần dùng AI | UC-NK-04 | B | RevenueCalculatorTest.revenue_noAiUsageStillCountsOrders_AC_NK_24, SystemStatsAdminServiceIntegrationTest.aiUsage_noUsageStillShowsRevenue_AC_NK_24 (chưa test giao diện) | Một phần |
| AC-NK-25 | Không tải được số liệu | UC-NK-04 |  |  | Thiếu |
| AC-NK-26 | Lượt phát sinh thêm | UC-NK-04 | D | SystemStatsAdminServiceIntegrationTest.aiUsage_profitAndTrialCostWithExtraCost_AC_NK_21_AC_NK_26 (chưa test giao diện) | Một phần |
| AC-NK-27 | Tính năng lỗ và chi phí dùng thử | UC-NK-04 | D, B | AiEconomicsCalculatorTest.pricePerUnit_dividesByUnitsNotCalls_AC_NK_27, AiEconomicsCalculatorTest.isLoss_whenAverageCostIsHigher_AC_NK_27, SystemStatsAdminServiceIntegrationTest.aiUsage_flagsLossWhoeverUsedIt_AC_NK_27 (chưa test giao diện) | Một phần |
