# PR — Gói Pro: Quy trình nghiệp vụ

## 1. Vòng đời đơn đăng ký

Mỗi lần học viên bấm "Tiếp tục thanh toán" (UC-PR-02) hoặc xác nhận gia hạn (UC-PR-04) tạo ra một **đơn đăng ký**. Đơn lưu cố định gói lúc tạo (tên, số tháng, giá, credit mỗi tháng) và **loại đơn**: Nâng cấp hoặc Gia hạn (BR-PR-05). Đơn có năm trạng thái: **Chờ thanh toán**, **Đã thanh toán**, **Đã hủy**, **Thất bại**, **Hết hạn**.

| Từ | Đến | Ai / cái gì gây ra | UC | Ghi chú |
|---|---|---|---|---|
| (chưa có) | Chờ thanh toán | Học viên | UC-PR-02, UC-PR-04 | Gói phải đang bán, đúng loại người dùng (BR-PR-01, BR-PR-05); đơn chờ cũ của học viên (nếu có) chuyển Đã hủy trước (BR-PR-16); giữ chỗ 15 phút (BR-PR-12) |
| Chờ thanh toán | Đã thanh toán | Kết quả VNPAY hợp lệ, mã `00` | UC-PR-03 | Qua Return URL hoặc IPN, lần nào đến trước (BR-PR-08); kích hoạt hoặc cộng dồn thời hạn (BR-PR-06, BR-PR-07) |
| Chờ thanh toán | Đã hủy | Học viên hủy trên VNPAY (mã `24`), hoặc tạo đơn mới | UC-PR-03 (2a, 2c) | Gói hiện tại không đổi (BR-PR-08, BR-PR-16) |
| Chờ thanh toán | Thất bại | Kết quả VNPAY hợp lệ với mã khác `00` và `24` | UC-PR-03 (3b) | Lưu mã phản hồi; gói hiện tại không đổi |
| Chờ thanh toán | Hết hạn | Hệ thống, quá 15 phút | UC-PR-03 (2b) | BR-PR-12 |
| Đã hủy hoặc Hết hạn | Đã thanh toán | Kết quả VNPAY hợp lệ, mã `00`, đến muộn | UC-PR-03 (3d) | Học viên đã bị trừ tiền nên vẫn ghi nhận (BR-PR-17) |

"Đã thanh toán" và "Thất bại" là trạng thái cuối: kết quả VNPAY đến sau cho đơn đã ở hai trạng thái này không đổi gì (BR-PR-08). "Thanh toán lại" luôn tạo đơn mới với mã tham chiếu mới (BR-PR-16).

## 2. Luồng thanh toán qua VNPAY

1. Học viên chọn gói. Hệ thống tạo đơn Chờ thanh toán và trả đường dẫn sang cổng VNPAY đã ký bằng khóa bí mật của cửa hàng. Đường dẫn mang mã tham chiếu `vnp_TxnRef` của đơn, số tiền và hạn thanh toán bằng hạn giữ chỗ của đơn.
2. Học viên thanh toán trên VNPAY. Sau đó có hai kênh báo kết quả, độc lập nhau:
   - **Return URL**: VNPAY chuyển trình duyệt về trang kết quả của ứng dụng; trang này gửi nguyên các tham số về máy chủ để kiểm tra.
   - **IPN**: máy chủ VNPAY gọi thẳng máy chủ ứng dụng. Kênh này vẫn chạy khi học viên đã đóng trình duyệt (AC-PR-18).
3. Với mỗi kết quả, hệ thống kiểm tra theo thứ tự: chữ ký `vnp_SecureHash` → đơn có mã `vnp_TxnRef` tồn tại → số tiền `vnp_Amount` khớp đơn → mã kết quả `vnp_ResponseCode`. Sai ở bước nào thì dừng ở bước đó và không đổi quyền hạn (BR-PR-08).
4. Hai kênh dùng chung một bước ghi nhận; bước này chỉ chạy một lần cho mỗi đơn dù hai kênh đến cùng lúc hay IPN đến nhiều lần (BR-PR-08).

## 3. Tính thời hạn khi ghi nhận thanh toán

- Học viên chưa có gói Pro còn hạn: gói bắt đầu từ lúc ghi nhận, kết thúc sau số tháng của gói (BR-PR-06).
- Học viên đang có gói Pro còn hạn: gói mới nối tiếp vào thời điểm kết thúc xa nhất hiện có (BR-PR-07). Quy tắc này áp dụng theo trạng thái gói lúc ghi nhận, không theo loại đơn, nên một đơn Nâng cấp được thanh toán muộn khi học viên đã là Pro cũng được nối tiếp (BR-PR-17).
- Credit của gói được cấp theo tháng của thời hạn gói (BR-GA-10); khi kích hoạt từ gói Free, credit dùng thử còn lại bị bỏ (BR-PR-10).

## 4. Phạm vi chưa làm

Hoàn tiền và tra cứu giao dịch chủ động với VNPAY (API `querydr`) chưa nằm trong phạm vi. Đơn thanh toán muộn được ghi nhận theo BR-PR-17 thay vì hoàn tiền.
