# BT — Quản lý bộ thẻ từ vựng: Business rules

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BT-01 | Giảng viên chỉ xem, sửa, xem trước, xuất bản, gỡ xuất bản và xóa các bộ do chính mình tạo. Giảng viên xem được cả bộ Nháp và Đã xuất bản của mình. Quản trị viên xem được các bộ Đã xuất bản và các bộ Đã xóa của mọi giảng viên (không thấy bộ Nháp), được gỡ xuất bản và xóa các bộ Đã xuất bản, khôi phục bộ Đã xóa, nhưng không thêm hay sửa nội dung bộ. | UC-BT-01 đến 08, AC-BT-01, 02, 17, 24, 34, 41 |
| BR-BT-02 | Bộ thẻ có ba trạng thái: Nháp, Đã xuất bản, Đã xóa. Bộ mới tạo luôn là Nháp. Chỉ bộ Đã xuất bản hiển thị cho học viên. Giảng viên xuất bản trực tiếp, không cần quản trị viên duyệt. | UC-BT-02, 05, 06, 07, AC-BT-07, 26 |
| BR-BT-03 | Tên bộ bắt buộc, dài 1 đến 100 ký tự *(đề xuất)*, không trùng tên với bộ khác của cùng giảng viên (không phân biệt chữ hoa, chữ thường; bộ đã xóa không tính). | UC-BT-02 (6a, 6b), UC-BT-03 (6a, 6b), UC-BT-08 (6a), AC-BT-10, 11, 19, 20, 46 |
| BR-BT-04 | Mỗi thẻ bắt buộc có từ vựng; định nghĩa, nghĩa tiếng Việt, câu ví dụ là tùy chọn. Một từ không xuất hiện ở hai thẻ trong cùng một bộ (không phân biệt chữ hoa, chữ thường). | UC-BT-02 (6a, 6c), UC-BT-03 (6a), AC-BT-10, 12, 19 |
| BR-BT-05 | Điều kiện xuất bản: bộ có ít nhất 1 bài và mỗi bài có ít nhất 1 thẻ *(đề xuất)*. | UC-BT-05 (2a), AC-BT-29 |
| BR-BT-06 | Bộ yêu cầu gói Pro thì học viên gói Free không học được (khớp thiết kế giao diện giảng viên). | UC-BT-02, 03 |
| BR-BT-07 | Sửa bộ đã xuất bản có hiệu lực ngay sau khi lưu. Thẻ bị xóa thì tiến độ học của thẻ đó không còn được tính; tiến độ các thẻ còn lại được giữ. | UC-BT-03, AC-BT-15, 16 |
| BR-BT-08 | Khi quản trị viên gỡ xuất bản phải nhập lý do, lý do hiển thị cho giảng viên chủ bộ; giảng viên tự gỡ bộ của mình không cần lý do. Gỡ xuất bản không xóa tiến độ học của học viên. Bộ đã gỡ được xuất bản lại khi đủ điều kiện BR-BT-05. | UC-BT-05, 06, AC-BT-27, 32, 33, 36 |
| BR-BT-09 | Giảng viên chỉ xóa được bộ ở trạng thái Nháp, bộ Đã xuất bản phải gỡ xuất bản trước. Quản trị viên chỉ thấy bộ Đã xuất bản nên xóa trực tiếp bộ Đã xuất bản, không cần gỡ trước; bộ bị xóa đồng thời biến mất khỏi thư viện học viên *(đề xuất)*. | UC-BT-07 (1b), AC-BT-42 |
| BR-BT-10 | Xóa là xóa tạm: bộ được giữ 30 ngày *(đề xuất)*, chỉ quản trị viên khôi phục được, bộ khôi phục luôn về trạng thái Nháp; quá 30 ngày thì không khôi phục được và không hiển thị ở bộ lọc "Đã xóa". | UC-BT-01 (4a), UC-BT-07, UC-BT-08, AC-BT-04, 39, 40, 45, 47 |
| BR-BT-11 | Xem trước không ghi nhận tiến độ học và không tính vào thống kê học của học viên. | UC-BT-04, AC-BT-22 |
| BR-BT-12 | Danh sách hiển thị 10 bộ mỗi trang *(đề xuất)*, bộ cập nhật gần nhất ở đầu. | UC-BT-01, AC-BT-02 |
