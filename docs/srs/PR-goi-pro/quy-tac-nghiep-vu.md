# PR — Gói Pro: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-PR-01 | Chức năng Xem gói hiện tại và Thanh toán mở cho cả Học viên thường và Học viên pro đã đăng nhập. Chức năng Nâng cấp lên pro chỉ dành cho Học viên thường (chưa có gói Pro còn hạn); chức năng Gia hạn gói pro và Hủy gói pro chỉ dành cho Học viên pro (đang có gói Pro còn hạn). | UC-PR-01, UC-PR-02 (2a), UC-PR-04 (2a), UC-PR-05 (1a), AC-PR-01, AC-PR-10, AC-PR-23, AC-PR-28 |
| BR-PR-02 | Học viên pro còn hạn được mở khóa toàn bộ quyền lợi Pro trên hệ thống gồm: bài học Pro (BR-PR-14), bộ từ vựng Pro (BR-PR-15), video khẩu hình phát âm (BR-PR-16), năng lượng AI không giới hạn trong ngày (BR-PR-11) và quản lý bài học cá nhân. | UC-PR-01, UC-PR-02, AC-PR-01, AC-PR-02, AC-PR-07, AC-PR-08 |
| BR-PR-03 | Học viên chỉ được xem thông tin gói, đơn thanh toán và lịch sử giao dịch của chính mình; mọi yêu cầu truy cập hoặc thao tác trên đơn đăng ký của học viên khác đều bị hệ thống từ chối và báo không tìm thấy. | UC-PR-01, AC-PR-05 |
| BR-PR-14 | Với bài học gắn nhãn Pro, học viên gói Free (hoặc gói Pro đã hết hạn theo BR-PR-04) chỉ xem được thông tin giới thiệu bài, bị khóa danh sách lời thoại và bị từ chối mở các chế độ luyện tập; học viên có gói Pro còn hạn được đọc lời thoại và luyện đầy đủ. | UC-DI-01 (1a), AC-DI-08, UC-TC-01, UC-TC-02 (4a, 4b), UC-TC-04, AC-TC-08, AC-TC-10, AC-TC-14, AC-TC-15, AC-TC-18, AC-TC-32 |
| BR-PR-15 | Với bộ từ vựng gắn nhãn Pro, học viên gói Free (hoặc gói Pro đã hết hạn theo BR-PR-04) chỉ mở và học được 2 phần đầu tiên (BR-PR-11), từ phần thứ 3 trở đi bị khóa; học viên có gói Pro còn hạn được học toàn bộ các phần. | UC-HT-01, UC-HT-02 (1a), AC-HT-03, AC-HT-04, AC-HT-15 |
| BR-PR-16 | Với video khẩu hình của âm đọc dưới 60 điểm, học viên gói Free (hoặc gói Pro đã hết hạn theo BR-PR-04) thấy hộp khóa và không nhận được đường dẫn video; học viên có gói Pro còn hạn xem được video khẩu hình. | UC-SH-02 (5b), AC-SH-18, AC-SH-19 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-PR-04 | Một tài khoản được xác định là Học viên pro khi có gói Pro ở trạng thái "Đang hoạt động" hoặc "Đã hủy gia hạn" mà thời điểm kết thúc của gói vẫn lớn hơn thời điểm hiện tại. Ngay khi vượt quá thời điểm kết thúc mà không được gia hạn, gói tự động chuyển sang trạng thái "Đã hết hạn" và tài khoản trở về vai trò Học viên thường (gói Free). | UC-PR-01 (4a), UC-PR-04 (2a), AC-PR-02, AC-PR-04 |
| BR-PR-05 | Khi Học viên pro thực hiện Hủy gói pro, hệ thống chỉ tắt việc gia hạn cho kỳ tiếp theo (chuyển trạng thái gói sang "Đã hủy gia hạn") chứ không thu hồi quyền Pro ngay lập tức; học viên vẫn giữ đầy đủ quyền lợi Học viên pro cho đến hết thời điểm kết thúc đã thanh toán. Gửi yêu cầu hủy lặp lại cho gói đã ở trạng thái "Đã hủy gia hạn" thì giữ nguyên và không báo lỗi. | UC-PR-01 (4b), UC-PR-05 (4a), AC-PR-03, AC-PR-25, AC-PR-27, AC-PR-26 |
| BR-PR-10 | Khi gói Pro hết hạn và tài khoản chuyển về gói Free, toàn bộ dữ liệu lịch sử học tập, từ đã lưu, câu cần ôn và tiến độ mà học viên đã tích lũy trong thời gian dùng Pro đều được bảo toàn nguyên vẹn; chỉ các quyền truy cập mới vào nội dung khóa Pro bị giới hạn lại theo quy tắc của gói Free. | UC-PR-05, AC-PR-29 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-PR-06 | Khi tạo đơn nâng cấp hoặc gia hạn, kỳ hạn gói được chọn phải thuộc danh mục gói Pro đang mở bán của hệ thống và số tiền thanh toán phải khớp chính xác với bảng giá niêm yết của kỳ hạn đó tại thời điểm tạo đơn. | UC-PR-02 (5a), UC-PR-03 (3b), AC-PR-11, AC-PR-17 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-PR-07 | Khi Học viên thường hoàn tất thanh toán Nâng cấp lên pro (hoặc được quản trị viên cấp Pro), gói Pro có hiệu lực ngay lập tức tại thời điểm xác nhận; thời điểm kết thúc được tính bằng thời điểm kích hoạt cộng với số ngày của kỳ hạn gói đã mua, và quyền lợi Pro có hiệu lực ngay trên phiên đăng nhập hiện tại mà không yêu cầu đăng nhập lại. | UC-PR-02 (3a), UC-PR-03, AC-PR-07, AC-PR-08, AC-PR-13 |
| BR-PR-08 | Khi Học viên pro hoàn tất thanh toán Gia hạn gói pro trong lúc gói hiện tại vẫn còn hạn, thời hạn của kỳ hạn mới được cộng dồn nối tiếp vào thời điểm kết thúc hiện tại của gói (không làm mất số ngày còn lại), đồng thời nếu gói đang ở trạng thái "Đã hủy gia hạn" thì được khôi phục về trạng thái "Đang hoạt động". | UC-PR-03, UC-PR-04 (1a), AC-PR-20, AC-PR-21, AC-PR-24, AC-PR-22 |
| BR-PR-09 | Trạng thái Đã thanh toán của một đơn đăng ký chỉ được xác lập khi có xác nhận hợp lệ từ cổng thanh toán (hoặc do quản trị viên cấp Pro theo module GA), trình duyệt không thể tự khai báo hoàn tất. Mỗi mã đơn thanh toán chỉ được kích hoạt hoặc cộng dồn thời hạn gói Pro đúng một lần duy nhất dù hệ thống nhận được thông báo xác nhận lặp lại nhiều lần. | UC-PR-03 (2a, 3a, 3b, 3c), AC-PR-13, AC-PR-14, AC-PR-15, AC-PR-17, AC-PR-18, AC-PR-19, AC-PR-09 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-PR-11 | Học viên thường (gói Free) được cấp 8 năng lượng AI mỗi ngày (tự động đặt lại về 0 vào lúc 00:00 mỗi ngày theo giờ Việt Nam); Học viên pro không bị giới hạn số năng lượng AI trong ngày. Đây là quy tắc gốc về hạn mức năng lượng AI; các module khác tham chiếu mã này, cách tiêu tốn năng lượng theo từng hoạt động xem BR-AI-10. Hạn mức phần từ vựng Pro theo BR-PR-15. | UC-PR-01 (4a), AC-PR-01 |
| BR-PR-12 | Các kỳ hạn gói Pro mở bán gồm gói Tháng (30 ngày) và gói Năm (365 ngày). | UC-PR-02 (3a), UC-PR-04, AC-PR-07, AC-PR-13, AC-PR-20 |
| BR-PR-13 | Mỗi đơn đăng ký ở trạng thái chờ thanh toán có thời hạn hiệu lực tối đa là 15 phút kể từ lúc khởi tạo; quá 15 phút mà chưa thanh toán thành công thì đơn tự động chuyển sang trạng thái Hết hạn. | UC-PR-03 (2b), AC-PR-16 |