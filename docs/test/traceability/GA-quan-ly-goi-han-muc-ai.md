# Truy vết AC → test: GA-quan-ly-goi-han-muc-ai

> Nguồn AC: `docs/srs/GA-quan-ly-goi-han-muc-ai/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng` (định nghĩa ở [mục lục](../TRACEABILITY-AC-TEST.md#định-nghĩa-trạng-thái)).

Tổng hợp: 44 AC, 25 đã có test, 4 một phần, 0 thiếu, 15 thủ công.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-GA-01 | Xem cấu hình credit | UC-GA-01 | D | AdminCreditConfigApiIntegrationTest.get_showsSettingsFeatureTableAndLastEditor_AC_GA_01 | Đã có |
| AC-GA-02 | Chưa từng sửa cấu hình | UC-GA-01 | D | AdminCreditConfigApiIntegrationTest.get_neverEdited_hasNoEditor_AC_GA_02 | Đã có |
| AC-GA-03 | Không tải được cấu hình | UC-GA-01 | A | Chưa có test tự động; kiểm tra thủ công trên AdminCreditConfigPage | Thủ công |
| AC-GA-04 | Sửa cấu hình thành công | UC-GA-02 | D | AdminCreditConfigApiIntegrationTest.update_savesNewValues_recordsEditorAndKeepsGrantedTrialBalances_AC_GA_04 | Đã có |
| AC-GA-05 | Sửa số credit mỗi đơn vị của một tính năng | UC-GA-02 | D | AdminCreditConfigApiIntegrationTest.update_creditsPerUse_changesShownPriceAndNextCharge_AC_GA_05 (giao diện chưa có test tự động) | Một phần |
| AC-GA-06 | Không có thay đổi nào | UC-GA-02 | A | AdminCreditConfigApiIntegrationTest.update_withoutChanges_isRefused_AC_GA_06 | Đã có |
| AC-GA-07 | Hủy sửa | UC-GA-02 | D | Chưa có test tự động; chỉ ở giao diện | Thủ công |
| AC-GA-08 | Giá trị không hợp lệ | UC-GA-02 | A, B | AdminCreditConfigApiIntegrationTest.update_invalidValues_savesNothing_AC_GA_08; `frontend/src/features/credit/margin.test.ts` | Đã có |
| AC-GA-09 | Phí cổng thanh toán và biên lợi nhuận tối thiểu quá cao | UC-GA-02 | A | AdminCreditConfigApiIntegrationTest.update_feeAndMarginReach100Percent_isRefused_AC_GA_09 | Đã có |
| AC-GA-10 | Không xác nhận | UC-GA-02 | D | Chưa có test tự động; chỉ ở giao diện | Thủ công |
| AC-GA-11 | Mất kết nối khi lưu | UC-GA-02 | A | Chưa có test tự động; kiểm tra thủ công trên AdminCreditConfigPage | Thủ công |
| AC-GA-12 | Cấu hình đã bị người khác sửa | UC-GA-02 | A | AdminCreditConfigApiIntegrationTest.update_afterAnotherAdminSaved_isRefusedAndKeepsTheirValue_AC_GA_12 | Đã có |
| AC-GA-13 | Đổi cấu hình không làm đổi gói Pro đã tạo | UC-GA-02 | D | `frontend/src/features/credit/margin.test.ts` (biên 46,4% khi 1 credit = 26 đồng) | Đã có |
| AC-GA-44 | Sửa đơn giá không tính lại chi phí đã ghi | UC-GA-02 | D | AdminCreditConfigApiIntegrationTest.update_unitPrices_doesNotRecomputeLoggedCost_AC_GA_44 | Đã có |
| AC-GA-14 | Xem danh sách gói Pro | UC-GA-03 | D | AdminProPlanApiIntegrationTest.list_sortedByMonthsWithPurchaseCounts_AC_GA_14 | Đã có |
| AC-GA-15 | Chưa có gói nào | UC-GA-03 | D | Chưa có test tự động; chỉ ở giao diện | Thủ công |
| AC-GA-16 | Không tải được danh sách | UC-GA-03 | A | Chưa có test tự động; kiểm tra thủ công trên AdminProPlanPage | Thủ công |
| AC-GA-17 | Thêm gói thành công | UC-GA-04 | D | AdminProPlanApiIntegrationTest.create_savesPlanNotOnSale_AC_GA_17; `frontend/src/features/credit/margin.test.ts` | Đã có |
| AC-GA-18 | Cảnh báo biên thấp nhưng vẫn lưu được | UC-GA-04 | D | `frontend/src/features/credit/margin.test.ts` (giao diện chưa có test tự động) | Một phần |
| AC-GA-19 | Hủy thêm gói | UC-GA-04 | D | Chưa có test tự động; chỉ ở giao diện | Thủ công |
| AC-GA-20 | Thiếu hoặc sai thông tin | UC-GA-04 | A, B | AdminProPlanApiIntegrationTest.create_invalidValues_savesNothing_AC_GA_20 | Đã có |
| AC-GA-21 | Trùng tên gói | UC-GA-04 | A | AdminProPlanApiIntegrationTest.create_duplicateNameIgnoringCase_isRefused_AC_GA_21 | Đã có |
| AC-GA-22 | Mất kết nối khi lưu | UC-GA-04 | A | Chưa có test tự động; kiểm tra thủ công trên PlanFormDialog | Thủ công |
| AC-GA-42 | Thêm gói giá 0 đồng | UC-GA-04 | B | AdminProPlanApiIntegrationTest.create_freePlan_isAllowed_AC_GA_42; `frontend/src/features/credit/margin.test.ts` | Đã có |
| AC-GA-23 | Sửa giá của gói | UC-GA-05 | D | AdminProPlanApiIntegrationTest.update_price_keepsPaidOrdersAsBought_AC_GA_23; `frontend/src/features/credit/margin.test.ts` | Đã có |
| AC-GA-24 | Sửa tên và thời hạn, có cảnh báo biên thấp | UC-GA-05 | D | AdminProPlanApiIntegrationTest.update_nameAndMonths_AC_GA_24; `frontend/src/features/credit/margin.test.ts` | Đã có |
| AC-GA-25 | Hủy sửa | UC-GA-05 | D | Chưa có test tự động; chỉ ở giao diện | Thủ công |
| AC-GA-26 | Không có thay đổi nào | UC-GA-05 | A | AdminProPlanApiIntegrationTest.update_withoutChanges_isRefused_AC_GA_26 | Đã có |
| AC-GA-27 | Thiếu hoặc sai thông tin | UC-GA-05 | A, B | AdminProPlanApiIntegrationTest.update_invalidValues_isRefused_AC_GA_27 | Đã có |
| AC-GA-28 | Trùng tên gói | UC-GA-05 | A | AdminProPlanApiIntegrationTest.update_toAnotherPlansName_isRefused_AC_GA_28 | Đã có |
| AC-GA-29 | Gói đã bị người khác sửa | UC-GA-05 | A | AdminProPlanApiIntegrationTest.update_afterAnotherAdminSaved_isRefused_AC_GA_29 | Đã có |
| AC-GA-30 | Mất kết nối khi lưu | UC-GA-05 | A | Chưa có test tự động; kiểm tra thủ công trên PlanFormDialog | Thủ công |
| AC-GA-31 | Bật bán gói | UC-GA-06 | D | AdminProPlanApiIntegrationTest.onSale_thenStopSelling_keepsPaidOrders_AC_GA_31_32 (học viên thấy gói khi mua thuộc module PR, chưa làm) | Một phần |
| AC-GA-32 | Ngừng bán gói đã có người mua | UC-GA-06 | D | AdminProPlanApiIntegrationTest.onSale_thenStopSelling_keepsPaidOrders_AC_GA_31_32 | Đã có |
| AC-GA-33 | Ngừng bán gói bán cuối cùng | UC-GA-06 | D | Chưa có test tự động; cảnh báo ở PlanOnSaleDialog | Thủ công |
| AC-GA-34 | Không xác nhận | UC-GA-06 | D | Chưa có test tự động; chỉ ở giao diện | Thủ công |
| AC-GA-35 | Trạng thái đã bị đổi | UC-GA-06 | A | AdminProPlanApiIntegrationTest.onSale_alreadyInThatState_isRefusedWithCurrentState_AC_GA_35 | Đã có |
| AC-GA-36 | Mất kết nối khi đổi trạng thái | UC-GA-06 | A | Chưa có test tự động; kiểm tra thủ công trên PlanOnSaleDialog | Thủ công |
| AC-GA-37 | Cấp credit cho giáo viên thành công | UC-GA-07 | D | AdminTeacherCreditApiIntegrationTest.grant_addsToBalance_recordsAuditAndNotifiesTeacher_AC_GA_37 | Đã có |
| AC-GA-38 | Hủy cấp credit | UC-GA-07 | D | Chưa có test tự động; chỉ ở giao diện | Thủ công |
| AC-GA-39 | Thiếu hoặc sai thông tin | UC-GA-07 | A, B | AdminTeacherCreditApiIntegrationTest.grant_invalidAmountOrNote_grantsNothing_AC_GA_39 | Đã có |
| AC-GA-40 | Tài khoản không còn đủ điều kiện nhận credit | UC-GA-07 | A | AdminTeacherCreditApiIntegrationTest.grant_toLockedTeacherOrStudent_isRefused_AC_GA_40 | Đã có |
| AC-GA-41 | Mất kết nối khi lưu | UC-GA-07 | A | Chưa có test tự động; kiểm tra thủ công trên GrantCreditDialog | Thủ công |
| AC-GA-43 | Giáo viên đang bị khóa | UC-GA-07 | D | AdminTeacherCreditApiIntegrationTest.detail_ofLockedTeacher_stillShowsBalance_AC_GA_43 (ẩn nút "Cấp credit" ở giao diện chưa có test tự động) | Một phần |
