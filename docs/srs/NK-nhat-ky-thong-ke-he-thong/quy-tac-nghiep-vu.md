# NK — Nhật ký và thống kê hệ thống: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-NK-01 | Chỉ quản trị viên được xem nhật ký và thống kê hệ thống. Giáo viên chỉ xem thống kê nội dung của mình (module TN). | UC-NK-01 đến 05 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-NK-02 | Nhật ký chỉ đọc: không ai sửa hoặc xóa mục nhật ký. Nhật ký được giữ lâu dài, không tự xóa. | UC-NK-01, UC-NK-02 |
| BR-NK-03 | Nhật ký ghi các thao tác tạo, sửa, xóa, xuất bản, gỡ xuất bản trên nội dung (bài học, câu, bộ thẻ, nhóm thẻ, thẻ, chủ đề, danh mục), cùng các thao tác quản trị: khóa, mở khóa, đổi vai trò, giao lại nội dung, sửa cấu hình credit, thêm, sửa, bật hoặc ngừng bán gói Pro, cấp credit cho giáo viên (BR-QT-09, BR-GA-09) và xử lý báo cáo (BR-XL-07). Mỗi mục gồm hành động, loại và tên đối tượng, người thực hiện (tên, vai trò), thời điểm; thao tác sửa kèm giá trị cũ và mới của từng mục bị đổi; thao tác có nhập lý do hoặc ghi chú thì kèm lý do hoặc ghi chú. Tên đối tượng và tên người thực hiện được lưu tại thời điểm ghi, vẫn hiển thị khi đối tượng hoặc tài khoản đã bị xóa. | UC-NK-01 (Bước 2, 6), UC-NK-02 (Bước 3, 5), AC-NK-01, 03, 10 |
| BR-NK-05 | Lịch sử của một đối tượng gồm mọi thao tác ghi nhận trên đối tượng đó, từ mới đến cũ, kể cả khi đối tượng đã bị xóa. | UC-NK-02, AC-NK-07, 10 |
| BR-NK-06 | Cách tính chỉ số tổng quan: **người dùng hoạt động trong ngày** là tài khoản có ít nhất một lượt luyện hoặc ôn thẻ trong ngày; **tài khoản mới** là tài khoản tạo trong khoảng thời gian; **tỷ lệ Pro** = số học viên đang Pro / tổng số học viên; **doanh thu ước tính** = tổng giá trị các gói Pro do người dùng thanh toán có hiệu lực trong khoảng, không trừ hoàn tiền. Số tổng tài khoản và số tài khoản Pro đang hoạt động là số tại thời điểm xem, không đổi theo khoảng thời gian. | UC-NK-03 (Bước 2, 3), AC-NK-12, 13 |
| BR-NK-08 | Thống kê luyện tập tính toàn hệ thống theo cách tính ở BR-TN-02 (lượt luyện, điểm trung bình, tỷ lệ trả lời đúng); lọc được theo gói của học viên (Tất cả, Free, Pro). Mỗi danh sách xếp hạng có tối đa 5 mục. | UC-NK-04, AC-NK-17, 18 |
| BR-NK-09 | Thống kê sử dụng AI gồm 4 tính năng AI tốn credit (nhận xét AI cho lượt đọc, thực hành với AI theo bài, phiên gia sư theo câu, gợi ý dịch và IPA khi soạn bài; BR-GA-04). **Lần dùng** là lần được xử lý thành công. **Credit đã tiêu** là tổng credit đã trừ cho các lần dùng đó (BR-GA-06). **Chi phí AI ước tính** = credit đã tiêu × giá trị 1 credit (đồng), là số ước tính vì chi phí thực tế phụ thuộc hóa đơn của nhà cung cấp. Lần bị từ chối vì hết credit và lần lỗi dịch vụ được đếm riêng, không tính vào lần dùng và không trừ credit. **Tỷ lệ lỗi** = số lần lỗi / (số lần dùng + số lần lỗi). **Chênh lệch** = doanh thu ước tính (BR-NK-06) − chi phí AI ước tính trong cùng khoảng thời gian. Danh sách tài khoản có 10 tài khoản, xếp theo credit đã tiêu giảm dần. | UC-NK-05, AC-NK-21, 22 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-NK-04 | Danh sách nhật ký mặc định lọc 7 ngày gần nhất; khoảng thời gian chọn được là 7, 30, 90 ngày hoặc Tất cả; thao tác mới nhất ở đầu, 50 mục mỗi trang. Các điều kiện lọc kết hợp được với nhau (tất cả cùng đúng). | UC-NK-01, AC-NK-01, 02, 05 |
| BR-NK-07 | Khoảng thời gian xem thống kê là 7, 30 hoặc 90 ngày gần nhất, mặc định 30 ngày; mức tăng giảm so với khoảng liền trước có cùng độ dài. | UC-NK-03, UC-NK-04, UC-NK-05, AC-NK-12, 13, 18, 22 |
| BR-NK-10 | Số liệu thống kê được cập nhật mỗi giờ và luôn hiển thị thời điểm cập nhật gần nhất. Nhật ký cập nhật ngay khi thao tác xảy ra. | UC-NK-03 (Bước 2), UC-NK-04 (Bước 2), UC-NK-05 (Bước 2), AC-NK-12 |
