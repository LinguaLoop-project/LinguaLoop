# TN — Xem thống kê nội dung: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TN-01 | Giáo viên chỉ xem thống kê của nội dung do chính mình tạo (bài học, bộ thẻ). Nội dung chưa xuất bản chưa có số liệu học tập. | UC-TN-01 đến 03, AC-TN-01, 12, 20 |
| BR-TN-05 | Thống kê chỉ gồm số liệu tổng hợp. Giáo viên không xem được tên, tài khoản hay kết quả riêng của từng học viên. | UC-TN-01 đến 03 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TN-02 | Cách tính các chỉ số: **lượt luyện** là mỗi lần học viên nộp bài làm một câu ở chế độ nghe chép hoặc shadowing; **điểm trung bình** là trung bình điểm của các lượt luyện trong khoảng thời gian; **hoàn thành bài** là học viên đã học hết bài; **tỷ lệ hoàn thành** = số học viên hoàn thành / số học viên đã bắt đầu; **lượt ôn thẻ** là mỗi lần học viên trả lời một thẻ; **tỷ lệ trả lời đúng** = số lượt ôn đúng / số lượt ôn; **học viên đã ôn bộ** là học viên có ít nhất một lượt ôn thẻ của bộ trong khoảng thời gian. | UC-TN-01 (Bước 2), UC-TN-02 (Bước 2), UC-TN-03 (Bước 2), AC-TN-09, 16 |
| BR-TN-06 | Số liệu được cập nhật mỗi giờ và luôn hiển thị thời điểm cập nhật gần nhất. | UC-TN-01 (2), UC-TN-02 (2), UC-TN-03 (2), AC-TN-01 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TN-03 | Khoảng thời gian xem thống kê là 7, 30 hoặc 90 ngày gần nhất, mặc định 30 ngày. Khoảng thời gian chỉ ảnh hưởng các chỉ số lượt, điểm và tỷ lệ; số lượng nội dung và trạng thái học của thẻ là số hiện tại. Mức tăng giảm ở tổng quan so với khoảng liền trước có cùng độ dài. | UC-TN-01 (4), UC-TN-02 (4a), UC-TN-03 (5a), AC-TN-02, 10, 17 |
| BR-TN-04 | Mỗi danh sách xếp hạng ở tổng quan có tối đa 5 mục: bài học theo lượt luyện giảm dần, bộ thẻ theo số học viên giảm dần, câu theo điểm trung bình tăng dần. Câu hoặc thẻ có dưới 10 lượt làm được coi là chưa đủ dữ liệu: không vào danh sách câu hay sai ở tổng quan và xếp cuối trong danh sách câu, thẻ của một bài hoặc một bộ. Danh sách câu của bài mặc định xếp điểm thấp nhất lên đầu; danh sách thẻ của bộ xếp tỷ lệ đúng thấp nhất lên đầu. | UC-TN-01 (3), UC-TN-02 (3), UC-TN-03 (4), AC-TN-03, 09, 16 |
