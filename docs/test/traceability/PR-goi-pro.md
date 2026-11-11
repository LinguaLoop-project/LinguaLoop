# Truy vết AC → test: PR-goi-pro

> Nguồn AC: `docs/srs/PR-goi-pro/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng`. Quay lại [mục lục](../TRACEABILITY-AC-TEST.md).

Tổng hợp: 23 AC, 0 đã có test, 0 một phần, 23 thiếu.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-PR-01 | Hiển thị gói hiện tại đối với Học viên thường (gói Free) | UC-PR-01 |  |  | Thiếu |
| AC-PR-02 | Hiển thị gói hiện tại đối với Học viên pro đang hoạt động | UC-PR-01 |  |  | Thiếu |
| AC-PR-03 | Tự động chuyển về gói Free khi gói Pro quá ngày hết hạn | UC-PR-01 |  |  | Thiếu |
| AC-PR-04 | Bảo mật lịch sử giao dịch riêng tư | UC-PR-01 |  |  | Thiếu |
| AC-PR-05 | Thông báo lỗi khi mất kết nối mạng | UC-PR-01 |  |  | Thiếu |
| AC-PR-06 | Hiển thị các kỳ hạn gói Pro và khởi tạo nâng cấp | UC-PR-02 |  |  | Thiếu |
| AC-PR-07 | Mở hộp nâng cấp từ các tính năng khóa Pro và quay lại sau khi nâng cấp | UC-PR-02 |  |  | Thiếu |
| AC-PR-08 | Hủy chọn gói trước khi thanh toán giữ nguyên gói Free | UC-PR-02 |  |  | Thiếu |
| AC-PR-09 | Chặn nâng cấp trùng lặp khi tài khoản đã có gói Pro còn hạn | UC-PR-02 |  |  | Thiếu |
| AC-PR-10 | Từ chối khi chọn kỳ hạn gói không tồn tại | UC-PR-02 |  |  | Thiếu |
| AC-PR-11 | Thông báo lỗi khi mất kết nối lúc tạo đơn nâng cấp | UC-PR-02 |  |  | Thiếu |
| AC-PR-12 | Thanh toán VNPAY thành công kích hoạt gói Pro ngay lập tức | UC-PR-03 |  |  | Thiếu |
| AC-PR-13 | Chống cộng trùng thời hạn khi nhận cả Return URL và IPN nhiều lần | UC-PR-03 |  |  | Thiếu |
| AC-PR-14 | Hủy thanh toán trên cổng VNPAY giữ nguyên gói hiện tại | UC-PR-03 |  |  | Thiếu |
| AC-PR-15 | Đơn thanh toán tự động hết hạn sau 15 phút | UC-PR-03 |  |  | Thiếu |
| AC-PR-16 | Giao dịch VNPAY thất bại hoặc sai chữ ký không nâng cấp tài khoản | UC-PR-03 |  |  | Thiếu |
| AC-PR-17 | Không cho phép tự khai báo hoàn tất thanh toán từ phía trình duyệt | UC-PR-03 |  |  | Thiếu |
| AC-PR-18 | Tự động kích hoạt qua IPN khi mất mạng hoặc tắt trình duyệt sau khi thanh toán | UC-PR-03 |  |  | Thiếu |
| AC-PR-23 | Thoát giữa chừng rồi thanh toán lại sẽ hủy đơn chờ cũ và tạo mã đơn VNPAY mới | UC-PR-03 |  |  | Thiếu |
| AC-PR-19 | Gia hạn cộng dồn nối tiếp vào ngày hết hạn hiện tại | UC-PR-04 |  |  | Thiếu |
| AC-PR-20 | Hủy thao tác gia hạn giữa chừng giữ nguyên ngày hết hạn cũ | UC-PR-04 |  |  | Thiếu |
| AC-PR-21 | Chặn Học viên thường gọi trực tiếp chức năng Gia hạn gói Pro | UC-PR-04 |  |  | Thiếu |
| AC-PR-22 | Gia hạn nhiều lần liên tiếp được cộng dồn đầy đủ | UC-PR-04 |  |  | Thiếu |
