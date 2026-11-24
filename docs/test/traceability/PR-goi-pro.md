# Truy vết AC → test: PR-goi-pro

> Nguồn AC: `docs/srs/PR-goi-pro/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng` (định nghĩa ở [mục lục](../TRACEABILITY-AC-TEST.md#định-nghĩa-trạng-thái)).

Tổng hợp: 24 AC, 15 đã có test, 4 một phần, 5 thiếu.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-PR-01 | Hiển thị gói hiện tại đối với Học viên thường (gói Free) | UC-PR-01 | D | ProPaymentApiIntegrationTest.myPlan_freeStudentHasNoPeriod_AC_PR_01 | Một phần (API; giao diện chưa có test tự động) |
| AC-PR-02 | Hiển thị gói hiện tại đối với Học viên pro đang hoạt động | UC-PR-01 | D | ProPaymentApiIntegrationTest.myPlan_proShowsWholeChainedPeriod_AC_PR_02 | Một phần (API; giao diện chưa có test tự động) |
| AC-PR-03 | Tự động chuyển về gói Free khi gói Pro quá ngày hết hạn | UC-PR-01 | B | ProPaymentApiIntegrationTest.myPlan_expiredProIsFree_AC_PR_03 | Một phần (API; giao diện chưa có test tự động) |
| AC-PR-04 | Bảo mật lịch sử giao dịch riêng tư | UC-PR-01 | A | ProPaymentApiIntegrationTest.orders_onlyOwnHistoryAndOtherUsersOrderIsNotFound_AC_PR_04; ProPaymentApiIntegrationTest.returnForAnotherStudentsOrderIsNotFound_AC_PR_04 | Đã có |
| AC-PR-05 | Thông báo lỗi khi mất kết nối mạng | UC-PR-01 |  |  | Thiếu |
| AC-PR-06 | Hiển thị các kỳ hạn gói Pro và khởi tạo nâng cấp | UC-PR-02 | D | ProPaymentApiIntegrationTest.plans_listOnlyPlansOnSale_AC_PR_06; ProPaymentApiIntegrationTest.checkout_createsPendingOrderAndSignedVnpayUrl_AC_PR_06 | Một phần (API; ngày hết hạn dự kiến ở giao diện chỉ có unit test frontend) |
| AC-PR-07 | Mở hộp nâng cấp từ các tính năng khóa Pro và quay lại sau khi nâng cấp | UC-PR-02 |  |  | Thiếu |
| AC-PR-08 | Hủy chọn gói trước khi thanh toán giữ nguyên gói Free | UC-PR-02 |  |  | Thiếu |
| AC-PR-09 | Chặn nâng cấp trùng lặp khi tài khoản đã có gói Pro còn hạn | UC-PR-02 | A | ProPaymentApiIntegrationTest.checkout_proStudentCannotUpgradeAgain_AC_PR_09 | Đã có |
| AC-PR-10 | Từ chối khi chọn kỳ hạn gói không tồn tại | UC-PR-02 | A | ProPaymentApiIntegrationTest.checkout_planNotOnSaleOrUnknownIsRejected_AC_PR_10 | Đã có |
| AC-PR-11 | Thông báo lỗi khi mất kết nối lúc tạo đơn nâng cấp | UC-PR-02 |  |  | Thiếu |
| AC-PR-12 | Thanh toán VNPAY thành công kích hoạt gói Pro ngay lập tức | UC-PR-03 | D | ProPaymentApiIntegrationTest.ipnSuccess_activatesProWithPlanCredits_AC_PR_12 | Đã có |
| AC-PR-13 | Chống cộng trùng thời hạn khi nhận cả Return URL và IPN nhiều lần | UC-PR-03 | B | ProPaymentApiIntegrationTest.repeatedIpnAndReturn_activateOnlyOnce_AC_PR_13; ProPaymentApiIntegrationTest.concurrentIpnAndReturn_activateOnlyOnce_AC_PR_13 | Đã có |
| AC-PR-14 | Hủy thanh toán trên cổng VNPAY giữ nguyên gói hiện tại | UC-PR-03 | A | ProPaymentApiIntegrationTest.canceledOnVnpay_keepsCurrentPlan_AC_PR_14 | Đã có |
| AC-PR-15 | Đơn thanh toán tự động hết hạn sau 15 phút | UC-PR-03 | B | ProPaymentApiIntegrationTest.pendingOrderExpiresAfterFifteenMinutes_AC_PR_15 | Đã có |
| AC-PR-16 | Giao dịch VNPAY thất bại hoặc sai chữ ký không nâng cấp tài khoản | UC-PR-03 | A | ProPaymentApiIntegrationTest.failedPaymentOrWrongAmount_doesNotActivate_AC_PR_16 | Đã có |
| AC-PR-17 | Không cho phép tự khai báo hoàn tất thanh toán từ phía trình duyệt | UC-PR-03 | A | ProPaymentApiIntegrationTest.forgedResultFromBrowserIsRejected_AC_PR_17; VnpayGatewayTest.verify_rejectsTamperedAmountMissingHashAndForeignSecret_AC_PR_17 | Đã có |
| AC-PR-18 | Tự động kích hoạt qua IPN khi mất mạng hoặc tắt trình duyệt sau khi thanh toán | UC-PR-03 | D | ProPaymentApiIntegrationTest.ipnAloneActivatesWhenBrowserNeverReturns_AC_PR_18 | Đã có |
| AC-PR-23 | Thoát giữa chừng rồi thanh toán lại sẽ hủy đơn chờ cũ và tạo mã đơn VNPAY mới | UC-PR-03 | D | ProPaymentApiIntegrationTest.retryingCancelsPreviousPendingOrderAndIssuesNewTxnRef_AC_PR_23 | Đã có |
| AC-PR-24 | Ghi nhận thanh toán thành công đến muộn cho đơn đã hủy hoặc hết hạn | UC-PR-03 | B | ProPaymentApiIntegrationTest.lateSuccessForCanceledOrderIsHonoredAndChained_AC_PR_24; ProPaymentApiIntegrationTest.lateSuccessForExpiredOrderIsHonored_AC_PR_24 | Đã có |
| AC-PR-19 | Gia hạn cộng dồn nối tiếp vào ngày hết hạn hiện tại | UC-PR-04 | D | ProPaymentApiIntegrationTest.renewChainsOntoCurrentEnd_AC_PR_19 | Đã có |
| AC-PR-20 | Hủy thao tác gia hạn giữa chừng giữ nguyên ngày hết hạn cũ | UC-PR-04 |  |  | Thiếu |
| AC-PR-21 | Chặn Học viên thường gọi trực tiếp chức năng Gia hạn gói Pro | UC-PR-04 | A | ProPaymentApiIntegrationTest.freeStudentCannotRenew_AC_PR_21 | Đã có |
| AC-PR-22 | Gia hạn nhiều lần liên tiếp được cộng dồn đầy đủ | UC-PR-04 | B | ProPaymentApiIntegrationTest.renewingTwiceAddsBothPeriods_AC_PR_22 | Đã có |
