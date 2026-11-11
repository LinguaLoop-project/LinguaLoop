# PR — Gói Pro: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-PR-01 | Chức năng Xem gói hiện tại và Thanh toán mở cho cả Học viên thường và Học viên pro đã đăng nhập. Chức năng Nâng cấp lên pro chỉ dành cho Học viên thường (chưa có gói Pro còn hạn); chức năng Gia hạn gói pro chỉ dành cho Học viên pro (đang có gói Pro còn hạn). | UC-PR-01, UC-PR-02 (2a), UC-PR-04 (2a), AC-PR-01, AC-PR-09, AC-PR-21 |
| BR-PR-02 | Học viên pro còn hạn được mở khóa toàn bộ quyền lợi Pro trên hệ thống gồm: bài học Pro (BR-PR-13), bộ từ vựng Pro (BR-PR-14), video khẩu hình phát âm (BR-PR-15), credit hằng tháng của gói để dùng tính năng AI (BR-PR-10) và quản lý bài học cá nhân. | UC-PR-01, UC-PR-02, AC-PR-01, AC-PR-02, AC-PR-06, AC-PR-07 |
| BR-PR-03 | Học viên chỉ được xem thông tin gói, đơn thanh toán và lịch sử giao dịch của chính mình; mọi yêu cầu truy cập hoặc thao tác trên đơn đăng ký của học viên khác đều bị hệ thống từ chối và báo không tìm thấy. | UC-PR-01, AC-PR-04 |
| BR-PR-13 | Với bài học gắn nhãn Pro, học viên gói Free (hoặc gói Pro đã hết hạn theo BR-PR-04) chỉ xem được thông tin giới thiệu bài, bị khóa danh sách lời thoại và bị từ chối mở các chế độ luyện tập; học viên có gói Pro còn hạn được đọc lời thoại và luyện đầy đủ. | UC-DI-01 (1a), AC-DI-08, UC-TC-01, UC-TC-02 (4a, 4b), UC-TC-04, AC-TC-08, AC-TC-10, AC-TC-14, AC-TC-15, AC-TC-18, AC-TC-32 |
| BR-PR-14 | Với bộ từ vựng gắn nhãn Pro (BR-BT-06), học viên gói Free (hoặc gói Pro đã hết hạn theo BR-PR-04) thấy bộ kèm nhãn Pro nhưng không mở và học được phần nào của bộ; học viên có gói Pro còn hạn được học toàn bộ các phần. | UC-HT-01, UC-HT-02 (1a), AC-HT-03, AC-HT-04, AC-HT-15 |
| BR-PR-15 | Với video khẩu hình của âm đọc dưới 60 điểm, học viên gói Free (hoặc gói Pro đã hết hạn theo BR-PR-04) thấy hộp khóa và không nhận được đường dẫn video; học viên có gói Pro còn hạn xem được video khẩu hình. | UC-SH-02 (5b), AC-SH-18, AC-SH-19 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-PR-04 | Một tài khoản được xác định là Học viên pro khi có gói Pro ở trạng thái "Đang hoạt động" mà thời điểm kết thúc của gói vẫn lớn hơn thời điểm hiện tại. Ngay khi vượt quá thời điểm kết thúc mà không được gia hạn, gói tự động chuyển sang trạng thái "Đã hết hạn" và tài khoản trở về vai trò Học viên thường (gói Free). | UC-PR-01 (4a), UC-PR-04 (2a), AC-PR-02, AC-PR-03 |
| BR-PR-09 | Khi gói Pro hết hạn và tài khoản chuyển về gói Free, toàn bộ dữ liệu lịch sử học tập, từ đã lưu, câu cần ôn và tiến độ mà học viên đã tích lũy trong thời gian dùng Pro đều được bảo toàn nguyên vẹn; chỉ các quyền truy cập mới vào nội dung khóa Pro bị giới hạn lại theo quy tắc của gói Free. | UC-PR-01 (4a), AC-PR-03 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-PR-05 | Khi tạo đơn nâng cấp hoặc gia hạn, gói được chọn phải thuộc các gói Pro đang bán do quản trị viên cấu hình (UC-GA-03 đến 06) và số tiền thanh toán phải khớp chính xác với giá của gói đó tại thời điểm tạo đơn. Đơn đăng ký lưu cố định thông tin gói tại thời điểm khởi tạo (tên gói, số tháng, giá tiền, số credit mỗi tháng, loại đơn nâng cấp hay gia hạn) và sinh một mã tham chiếu đơn hàng duy nhất (`vnp_TxnRef`) để gửi sang cổng thanh toán VNPAY. | UC-PR-02 (5a), UC-PR-03 (3b), AC-PR-10, AC-PR-16 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-PR-06 | Khi Học viên thường hoàn tất thanh toán Nâng cấp lên pro, gói Pro có hiệu lực ngay lập tức tại thời điểm xác nhận; thời điểm kết thúc được tính bằng thời điểm kích hoạt cộng với số tháng của gói đã mua, số credit của tháng đầu được cấp ngay (BR-GA-10), và quyền lợi Pro có hiệu lực ngay trên phiên đăng nhập hiện tại mà không yêu cầu đăng nhập lại. | UC-PR-02 (3a), UC-PR-03, AC-PR-06, AC-PR-07, AC-PR-12 |
| BR-PR-07 | Khi Học viên pro hoàn tất thanh toán Gia hạn gói pro trong lúc gói hiện tại vẫn còn hạn, thời hạn của kỳ hạn mới được cộng dồn nối tiếp vào thời điểm kết thúc hiện tại của gói (không làm mất thời hạn còn lại). Gói gia hạn bắt đầu cấp credit từ ngày hết hạn hiện tại của gói cũ; số dư credit hiện có giữ nguyên đến hết tháng hiện tại (BR-GA-10). | UC-PR-03, AC-PR-19, AC-PR-22, AC-PR-20 |
| BR-PR-08 | Trạng thái Đã thanh toán của một đơn đăng ký chỉ được xác lập khi hệ thống kiểm tra hợp lệ chữ ký bảo mật (`vnp_SecureHash`), mã tham chiếu đơn hàng (`vnp_TxnRef`), số tiền thanh toán (`vnp_Amount`) và mã kết quả thành công (`vnp_ResponseCode = '00'`) từ cổng thanh toán VNPAY (qua đường dẫn trả về Return URL hoặc thông báo ngầm IPN); trình duyệt không thể tự khai báo hoàn tất. Mỗi mã đơn thanh toán chỉ được kích hoạt hoặc cộng dồn thời hạn gói Pro đúng một lần duy nhất dù hệ thống nhận đồng thời cả Return URL và IPN hoặc nhận thông báo IPN lặp lại nhiều lần. | UC-PR-03 (2a, 3a, 3b, 3c), AC-PR-12, AC-PR-13, AC-PR-14, AC-PR-16, AC-PR-17, AC-PR-18, AC-PR-08 |
| BR-PR-16 | Tại một thời điểm, mỗi học viên chỉ giữ tối đa một đơn ở trạng thái chờ thanh toán. Nếu học viên thoát khỏi cổng VNPAY giữa chừng (đóng trình duyệt, nhấn quay lại mà chưa hoàn tất giao dịch) rồi khởi tạo lại yêu cầu thanh toán hoặc chọn gói khác, hệ thống tự động chuyển đơn chờ thanh toán cũ sang trạng thái Đã hủy và tạo một đơn mới với mã tham chiếu (`vnp_TxnRef`) mới để học viên thanh toán lại ngay mà không phải đợi hết 15 phút. Nếu giao dịch trước đó bị hủy hoặc thất bại trên VNPAY, khi học viên chọn "Thanh toán lại" hệ thống cũng luôn tạo đơn mới với mã tham chiếu mới. | UC-PR-02 (5b), UC-PR-03 (2a, 2c, 3b), AC-PR-14, AC-PR-16, AC-PR-23 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-PR-10 | Học viên thường (gói Free) được cấp credit miễn phí mỗi ngày (BR-GA-03), tự đặt lại vào 00:00 mỗi ngày theo giờ Việt Nam và không cộng dồn. Học viên pro dùng credit hằng tháng của gói, cấp theo từng tháng của thời hạn gói (BR-GA-10) và không có credit miễn phí hằng ngày. Quy tắc gốc về credit nằm ở module GA (BR-GA-03, BR-GA-06, BR-GA-10); cách tiêu credit theo từng hoạt động xem BR-AI-10. Quyền học bộ từ vựng Pro theo BR-PR-14. | UC-PR-01 (4a), AC-PR-01 |
| BR-PR-11 | Các gói Pro mở bán do quản trị viên cấu hình ở module GA (UC-GA-03 đến 06); mỗi gói có tên, thời hạn tính theo tháng, giá và số credit mỗi tháng (BR-GA-07). Học viên chọn một trong các gói đang bán. | UC-PR-02 (3a), UC-PR-04, AC-PR-06, AC-PR-12, AC-PR-19 |
| BR-PR-12 | Mỗi đơn đăng ký ở trạng thái chờ thanh toán có thời hạn hiệu lực tối đa là 15 phút kể từ lúc khởi tạo; quá 15 phút mà chưa thanh toán thành công thì đơn tự động chuyển sang trạng thái Hết hạn. | UC-PR-03 (2b), AC-PR-15 |