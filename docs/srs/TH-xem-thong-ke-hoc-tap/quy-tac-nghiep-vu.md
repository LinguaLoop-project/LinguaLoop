# TH — Xem thống kê học tập: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TH-01 | Mọi chức năng Xem thống kê học tập, Xem lịch sử luyện tập và Xem thống kê điểm phát âm đều mở cho Học viên đã đăng nhập. Học viên chỉ được xem dữ liệu thống kê, chuỗi ngày học và lịch sử luyện tập của chính mình; mọi yêu cầu truy cập dữ liệu của học viên khác đều bị hệ thống từ chối. | UC-TH-01, UC-TH-02, AC-TH-01, AC-TH-06, AC-TH-08 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TH-02 | Chuỗi ngày học liên tiếp (streak) được tính theo ngày lịch trên múi giờ cá nhân của học viên (mặc định là múi giờ Việt Nam `Asia/Ho_Chi_Minh`). Một ngày được tính là "đã học" ngay khi học viên hoàn thành ít nhất một hoạt động học tập trong ngày đó (nộp một lượt Nghe chép, đọc một lượt Shadowing, hoàn thành một lượt học/ôn thẻ từ vựng hoặc hoàn thành một phiên Thực hành với AI). Nếu qua trọn một ngày lịch mà không có hoạt động học tập nào, chuỗi ngày học hiện tại quay về `0`, còn kỷ lục chuỗi ngày học dài nhất từ trước đến nay luôn được giữ nguyên. | UC-TH-01 (3a), AC-TH-02, AC-TH-05 |
| BR-TH-09 | Trên Bản đồ 44 âm vị, mỗi âm vị có 4 mức hiển thị dựa trên tổng số lần gặp và tỷ lệ phần trăm lỗi trong khoảng thời gian đang lọc: **Chưa đủ dữ liệu** (tổng số lần gặp dưới 5 lần), **Tốt** (đã gặp từ 5 lần trở lên và tỷ lệ lỗi `< 15%`), **Cần chú ý** (tỷ lệ lỗi từ `15%` đến `30%`) và **Hay sai** (tỷ lệ lỗi `> 30%`). | UC-TH-03 (4a), AC-TH-14, AC-TH-17 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TH-03 | Bộ lọc khoảng thời gian của thống kê học tập, lịch sử luyện tập và thống kê điểm phát âm chỉ nhận một trong ba giá trị: `7 ngày` (7 ngày gần nhất tính đến hiện tại), `30 ngày` (30 ngày gần nhất — giá trị mặc định khi mở trang) và `Toàn bộ` (toàn bộ lịch sử từ khi tạo tài khoản). Mọi giá trị ngoài ba mức này đều bị hệ thống từ chối. | UC-TH-01 (2a, 2b), UC-TH-02, UC-TH-03, AC-TH-01, AC-TH-03, AC-TH-07, AC-TH-09, AC-TH-18 |
| BR-TH-07 | Khi lọc danh sách Lịch sử luyện tập theo chế độ học, hệ thống cho phép chọn `Tất cả` hoặc lọc riêng theo từng chế độ: `Nghe chép`, `Shadowing`, `Từ vựng`, `Thực hành AI`, kết hợp đồng thời với bộ lọc khoảng thời gian (BR-TH-03). | UC-TH-02 (5a), AC-TH-09, AC-TH-12 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TH-04 | Các chỉ số thống kê học tập tổng quát được tổng hợp trực tiếp từ dữ liệu gốc của học viên (không lưu trùng số cộng dồn thủ công): số thẻ từ vựng phân theo 4 trạng thái (`Mới`, `Đang học`, `Cần ôn`, `Đã thuộc`), tỷ lệ trả lời đúng từ vựng tính bằng phần trăm số lần trả lời đúng trên tổng số lần trả lời, cùng tổng số câu và bài học đã luyện. | UC-TH-01 (3a), AC-TH-01, AC-TH-05 |
| BR-TH-05 | Thống kê lỗi Nghe chép theo loại từ chỉ tính trên lượt nộp đầu tiên của mỗi câu (không tính các lượt làm lại câu hoặc lượt ôn trong phiên ôn câu đã lưu theo BR-HT-23) để phản ánh đúng điểm yếu thực tế. Tỷ lệ lỗi của mỗi loại từ được tính bằng tổng số từ sai (gồm `Bỏ sót`, `Nhầm từ`, `Sai chính tả`) chia cho tổng số từ thuộc loại từ đó mà học viên đã gặp trong khoảng thời gian lọc. | UC-TH-01, AC-TH-04 |
| BR-TH-06 | Danh sách Lịch sử luyện tập ghi nhận mọi lượt làm bài của học viên (bao gồm cả lượt làm thường, lượt làm lại và lượt bỏ cuộc) sắp xếp theo thời điểm thực hiện từ mới nhất đến cũ nhất. Nếu bài học hoặc bộ từ vựng gốc sau đó bị gỡ xuất bản hoặc bị xóa, bản ghi kết quả trong lịch sử của học viên vẫn được giữ nguyên nhưng không còn mở lại được nội dung gốc. | UC-TH-02 (3a, 3b), AC-TH-08, AC-TH-11 |
| BR-TH-08 | Thống kê điểm phát âm và Bản đồ 44 âm vị được tổng hợp từ các lượt chấm phát âm ở chế độ Shadowing theo bảng 44 âm vị chuẩn giọng Mỹ của hệ thống, tính theo âm đích của từ trong câu. Một lần đọc âm vị được tính là một lần lỗi khi điểm chính xác của âm đó dưới **60 điểm** (hoặc đọc thành phụ âm khác âm đích); tỷ lệ lỗi của một âm bằng số lần lỗi chia cho tổng số lần âm đó xuất hiện trong các câu đã đọc. | UC-TH-03, AC-TH-14, AC-TH-15, AC-TH-18, AC-TH-20 |
| BR-TH-10 | Khi học viên chọn một âm vị đã có từ 5 lần gặp trở lên trên Bản đồ 44 âm vị, hệ thống hiển thị âm mà học viên hay đọc nhầm thành nhiều nhất (hoặc báo bỏ sót âm), mẹo sửa khẩu hình bằng tiếng Việt, biểu đồ xu hướng tỷ lệ lỗi theo tuần và nút chuyển sang Thực hành shadowing (UC-SH-01). | UC-TH-03 (6a), AC-TH-16, AC-TH-19 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TH-11 | Ngưỡng tối thiểu để một âm vị trên Bản đồ 44 âm vị được tính và hiển thị tỷ lệ lỗi là **5 lần gặp**; ngưỡng điểm dưới **60 điểm** được tính là một lần đọc lỗi âm vị. Danh sách Lịch sử luyện tập hiển thị tối đa **20 lượt mỗi trang**, sắp xếp từ mới nhất đến cũ nhất. | UC-TH-02 (5b), AC-TH-08, AC-TH-10, AC-TH-13 |

