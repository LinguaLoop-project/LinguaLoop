# TN — Xem thống kê nội dung: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TN-01 | Giáo viên chỉ xem thống kê của nội dung do chính mình tạo (bài học, bộ thẻ). Nội dung chưa xuất bản chưa có số liệu học tập. | UC-TN-01 đến 03, AC-TN-01, 12, 20 |
| BR-TN-05 | Thống kê chỉ gồm số liệu tổng hợp. Giáo viên không xem được tên, tài khoản hay kết quả riêng của từng học viên. | UC-TN-01 đến 03 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TN-02 | Phạm vi số liệu: chỉ tính lượt của tài khoản học viên (lượt giáo viên, quản trị viên xem thử không tính); câu, thẻ và nhóm thẻ đã xóa không có trong bất kỳ chỉ số nào, kể cả tổng lượt. Cách tính các chỉ số: **lượt luyện** là mỗi lần học viên nộp bài làm một câu ở chế độ nghe chép hoặc shadowing; **điểm trung bình** là trung bình điểm của mọi lượt luyện trong khoảng thời gian, kể cả lượt "Hiện cả câu" (0 điểm); **điểm trung bình của một câu** tính riêng từng chế độ trên các lượt của câu ở chế độ đó; **học viên đã học nội dung** (tổng quan) là học viên có ít nhất một lượt luyện trên bài học hoặc một lượt ôn trên bộ thẻ của giáo viên trong khoảng thời gian; **học viên đã bắt đầu bài** là học viên có ít nhất một lượt luyện trên bài trong khoảng thời gian; **hoàn thành bài** là học viên đã có ít nhất một lượt luyện ở cùng một chế độ (nghe chép hoặc shadowing) trên mọi câu chưa bị xóa của bài; thời điểm hoàn thành là thời điểm sớm nhất học viên làm đủ các câu đó ở một chế độ; mỗi học viên được tính hoàn thành một bài tối đa một lần, dù hoàn thành ở một hay cả hai chế độ, và được tính vào khoảng thời gian chứa thời điểm hoàn thành; **tỷ lệ hoàn thành** = số học viên hoàn thành / số học viên đã bắt đầu; **lượt ôn thẻ** là mỗi lần học viên trả lời một thẻ; một lượt ôn được tính **đúng** khi mức đánh giá khác Quên ($q \ge 3$, BR-HT-10); **tỷ lệ trả lời đúng** = số lượt ôn đúng / số lượt ôn; **học viên đã ôn bộ** là học viên có ít nhất một lượt ôn thẻ của bộ trong khoảng thời gian; **tỷ lệ thẻ ở một trạng thái học** (BR-HT-08) = số cặp (học viên, thẻ) đang ở trạng thái đó / tổng số cặp (học viên, thẻ) của các học viên đã ôn bộ; **tỷ lệ trả lời đúng của một thẻ** = số lượt ôn đúng thẻ đó / số lượt ôn thẻ đó; **số báo cáo đang mở** là số dòng báo cáo Chờ giáo viên trên nội dung của giáo viên, đếm như danh sách "Báo cáo nội dung" (cùng câu hoặc thẻ và cùng lý do là một dòng, BR-XL-03). | UC-TN-01 (Bước 2), UC-TN-02 (Bước 2), UC-TN-03 (Bước 2, 3), AC-TN-01, 05, 09, 11, 16 |
| BR-TN-06 | Số liệu được cập nhật mỗi giờ và luôn hiển thị thời điểm cập nhật gần nhất. Riêng số báo cáo đang mở luôn là số hiện tại để khớp với danh sách "Báo cáo nội dung". | UC-TN-01 (2), UC-TN-02 (2), UC-TN-03 (2), AC-TN-01 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TN-03 | Khoảng thời gian xem thống kê là 7, 30 hoặc 90 ngày gần nhất, mặc định 30 ngày. Khoảng thời gian chỉ ảnh hưởng các chỉ số lượt, điểm, tỷ lệ, biểu đồ theo ngày (mỗi ngày một điểm, ngày không có lượt là 0) và các danh sách xếp hạng; số lượng nội dung và trạng thái học của thẻ là số hiện tại. Mức tăng giảm ở tổng quan so với khoảng liền trước có cùng độ dài, tính theo phần trăm làm tròn 1 chữ số thập phân; khoảng liền trước bằng 0 thì không hiển thị mức tăng giảm. | UC-TN-01 (4a), UC-TN-02 (4a), UC-TN-03 (4a), AC-TN-02, 10, 17 |
| BR-TN-04 | Tổng quan có hai danh sách xếp hạng, mỗi danh sách tối đa 5 mục: bài học theo số học viên đã bắt đầu bài, bộ thẻ theo số học viên đã ôn bộ, cùng xếp giảm dần; bằng nhau thì theo tên tăng dần. Câu khó nhất của một bài: hai danh sách, mỗi chế độ (nghe chép, shadowing) một danh sách tối đa 5 câu, xếp điểm trung bình của câu ở chế độ đó (BR-TN-02) tăng dần; chỉ gồm câu có từ 10 lượt làm ở chế độ đó. Thẻ khó nhất của một bộ: mỗi nhóm thẻ tối đa 5 thẻ, xếp tỷ lệ trả lời đúng của thẻ tăng dần; chỉ gồm thẻ có từ 10 lượt ôn. Câu hoặc thẻ dưới 10 lượt là chưa đủ dữ liệu và không vào danh sách; không có câu hoặc thẻ nào đủ dữ liệu thì hiển thị "Chưa đủ dữ liệu để xếp hạng". Bằng nhau thì giữ thứ tự câu trong bài, thứ tự thẻ trong nhóm. | UC-TN-01 (3), UC-TN-02 (3), UC-TN-03 (3, 4b), AC-TN-03, 09, 11, 14, 16, 18, 19, 22 |
