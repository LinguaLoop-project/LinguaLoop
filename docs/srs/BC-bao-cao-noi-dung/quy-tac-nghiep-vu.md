# BC — Báo cáo nội dung: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-01 | Chức năng Báo cáo nội dung chỉ dành cho Học viên đã đăng nhập. Đối tượng được báo cáo phải là bài học, bộ từ vựng hoặc video học thụ động đang ở trạng thái hiển thị hợp lệ cho học viên (Đã duyệt / Đã xuất bản và chưa bị xóa); hệ thống từ chối nhận báo cáo cho nội dung không tồn tại, đang ở bản Nháp hoặc đã bị xóa. | UC-BC-01 (2a), UC-TC-04 (3f), AC-BC-01, AC-BC-07, AC-TC-31 |
| BR-BC-02 | Học viên chỉ được xem danh sách và chi tiết các báo cáo nội dung do chính mình đã gửi; mọi yêu cầu truy cập báo cáo của người dùng khác đều bị hệ thống từ chối và báo không tìm thấy. | UC-BC-01 (1a), AC-BC-05, AC-BC-06 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-03 | Mỗi báo cáo nội dung có 4 trạng thái: **Chờ xử lý** (mới gửi), **Đang xem** (người phụ trách đang kiểm tra), **Đã xử lý** (đã sửa hoặc xử lý nội dung theo báo cáo) và **Từ chối** (báo cáo không chính xác). Báo cáo mới gửi luôn được khởi tạo ở trạng thái **Chờ xử lý**. | UC-BC-01 (1a), AC-BC-01, AC-BC-05, AC-BC-08 |
| BR-BC-04 | Khi báo cáo được Giảng viên hoặc Quản trị viên giải quyết (chuyển sang **Đã xử lý** hoặc **Từ chối** tại module XL), hệ thống lưu người xử lý, thời điểm xử lý và ghi chú phản hồi để hiển thị cho học viên đã gửi. Bản ghi báo cáo luôn được giữ lại trong lịch sử kể cả khi nội dung gốc bị gỡ xuất bản hoặc bị xóa sau đó. | UC-BC-01 (1a), AC-BC-05 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-05 | Khi gửi báo cáo, học viên bắt buộc phải chọn một lý do trong danh mục quy định gồm: `Sai nội dung`, `Sai bản dịch`, `Sai mức trình độ`, `Lỗi âm thanh / video`, `Nội dung phản cảm`, `Spam`, `Khác`. Nếu chọn lý do `Khác`, học viên bắt buộc phải nhập mô tả chi tiết; với các lý do còn lại, mô tả chi tiết là tùy chọn. | UC-BC-01 (5a), AC-BC-01, AC-BC-02, AC-BC-03, AC-BC-09 |
| BR-BC-06 | Mô tả chi tiết của báo cáo (khi có nhập) được tự động cắt khoảng trắng ở hai đầu, không được chỉ chứa khoảng trắng và có độ dài từ 1 đến 500 ký tự. | UC-BC-01 (5a), AC-BC-02, AC-BC-03 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-07 | Báo cáo sau khi tạo thành công được tự động chuyển vào hàng đợi xử lý báo cáo (module XL) của Giảng viên phụ trách nội dung đó để sửa nội dung, từ chối hoặc chuyển tiếp cho Quản trị viên; đối với nội dung do hệ thống tạo hoặc báo cáo vi phạm nghiêm trọng, Quản trị viên có quyền xử lý trực tiếp. | UC-BC-01, AC-BC-01 |
| BR-BC-08 | Một học viên không được gửi báo cáo mới có cùng lý do trên cùng một nội dung nếu học viên đó đang có một báo cáo ở trạng thái **Chờ xử lý** hoặc **Đang xem** cho đúng nội dung và lý do đó. Nếu báo cáo trước đó đã chuyển sang **Đã xử lý** hoặc **Từ chối**, hoặc báo cáo đến từ các học viên khác nhau, hệ thống vẫn cho phép gửi và gộp số lượt báo trùng để người xử lý theo dõi mức độ ưu tiên. | UC-BC-01 (5b), AC-BC-04 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-09 | Mô tả chi tiết trong mỗi báo cáo dài tối đa 500 ký tự; danh sách báo cáo đã gửi của học viên hiển thị tối đa 10 báo cáo mỗi trang, sắp xếp theo thời điểm gửi từ mới nhất đến cũ nhất. | UC-BC-01 (1a), AC-BC-03, AC-BC-05 |
