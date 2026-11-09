# TK — Tài khoản và xác thực: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TK-10 | Tài khoản bị quản trị viên khóa không đăng nhập được bằng bất kỳ cách nào (email và mật khẩu, hoặc Google). Yêu cầu quên mật khẩu cho tài khoản này vẫn nhận thông báo chung như mọi email (BR-TK-04) nhưng hệ thống không gửi thư đặt lại, vì thư không giúp đăng nhập được. | UC-TK-02 (6a), UC-TK-03 (6a), UC-TK-06 (Bước 5), AC-TK-15, AC-TK-23, AC-TK-34, AC-TK-07 |
| BR-TK-12 | Học viên phải hoàn tất thiết lập hồ sơ học tập trước khi dùng các chức năng khác. Quy tắc này chỉ áp dụng cho Học viên, không áp dụng cho Giáo viên và Quản trị viên. | UC-TK-08 (Bước 1), UC-TK-02 (8a), AC-TK-10, AC-TK-46, AC-TK-52, AC-TK-53 |
| BR-TK-15 | Tài khoản tự đăng ký (bằng email hoặc Google) luôn có vai trò Học viên. Vai trò Giáo viên và Quản trị viên do quản trị viên cấp. | UC-TK-01 (Bước 6), UC-TK-03 (5a), AC-TK-01, AC-TK-17 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TK-01 | Email là duy nhất trong hệ thống, không phân biệt chữ hoa và chữ thường. Tên hiển thị được phép trùng giữa nhiều người dùng. | UC-TK-01 (5a), AC-TK-04, AC-TK-05 |
| BR-TK-02 | Mật khẩu có ít nhất 8 ký tự. Không bắt buộc chữ hoa, chữ số hay ký tự đặc biệt. | UC-TK-01 (4a), UC-TK-06 (9a), UC-TK-07 (4b), AC-TK-02, AC-TK-40, AC-TK-45, AC-TK-36, AC-TK-42, AC-TK-43 |
| BR-TK-11 | Tên hiển thị dài từ 1 đến 50 ký tự (không tính khoảng trắng đầu và cuối). | UC-TK-01 (4a), UC-TK-08 (4a), AC-TK-02, AC-TK-49, AC-TK-48 |
| BR-TK-13 | Thời lượng học mỗi ngày chọn một trong 10, 15, 20, 30 phút, mặc định 15 phút (khớp mockup trang Hôm nay và Cài đặt). Đây là tổng thời gian mặc định của kế hoạch học hằng ngày; học viên vẫn đổi được cho riêng từng ngày ở trang Hôm nay. Ngôn ngữ giao diện: tiếng Việt hoặc tiếng Anh. | UC-TK-08 (4a), AC-TK-47, AC-TK-49 |
| BR-TK-14 | Người dùng phải đồng ý Điều khoản sử dụng và Chính sách quyền riêng tư trước khi dùng hệ thống: ở biểu mẫu đăng ký nếu đăng ký bằng email, ở bước thiết lập hồ sơ nếu đăng nhập bằng Google. Việc đồng ý lưu giọng nói và xử lý bằng AI được hỏi riêng ở lần ghi âm đầu tiên, không thuộc module này. | UC-TK-01 (4b), UC-TK-08 (4b), AC-TK-03, AC-TK-50 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TK-04 | Thông báo khi đăng nhập sai luôn là thông báo chung, không cho biết email có tài khoản hay không, hay tài khoản chỉ dùng Google. Quên mật khẩu và gửi lại email xác thực luôn trả cùng một thông báo dù email có tài khoản hay không. Việc báo "email chưa xác thực" chỉ xảy ra sau khi đã nhập đúng mật khẩu. | UC-TK-02 (5a, 7a), UC-TK-05 (2a), UC-TK-06 (Bước 4), AC-TK-12, AC-TK-29, AC-TK-33, AC-TK-34 |
| BR-TK-05 | Tài khoản đăng ký bằng email phải xác thực email trước khi đăng nhập. Đăng nhập đúng mật khẩu khi email chưa xác thực thì không được cấp phiên, mà được chuyển đến màn hình "Kiểm tra hộp thư" có tùy chọn gửi lại. Email được coi là đã xác thực khi: chọn liên kết xác thực, đặt lại mật khẩu thành công qua liên kết trong thư, hoặc đăng nhập bằng Google cùng email. | UC-TK-01 (Bước 6, 8), UC-TK-02 (7a), UC-TK-05, UC-TK-06 (Bước 9), UC-TK-03 (5b), AC-TK-01, AC-TK-09, AC-TK-28, AC-TK-35, AC-TK-06, AC-TK-07, AC-TK-30 |
| BR-TK-08 | Đăng nhập bằng Google: email Google đã được Google xác thực thì được coi là đã xác thực. Nếu email trùng tài khoản có sẵn thì liên kết vào tài khoản đó, không tạo tài khoản thứ hai. Nếu tài khoản có sẵn chưa xác thực email, mật khẩu cũ bị hủy và các phiên đăng nhập đang có bị kết thúc. Google không xác nhận email thì không đăng nhập, không liên kết. | UC-TK-03 (4a, 5a, 5b), AC-TK-17, AC-TK-18, AC-TK-19, AC-TK-21, AC-TK-08, AC-TK-16, AC-TK-20, AC-TK-22, AC-TK-24 |
| BR-TK-09 | Khi tạo hoặc đổi mật khẩu, các phiên đăng nhập trên thiết bị khác bị kết thúc, phiên trên thiết bị đang dùng được giữ. Khi đặt lại mật khẩu qua thư thì mọi phiên đều bị kết thúc. | UC-TK-06 (Bước 9), UC-TK-07 (Bước 6), AC-TK-35, AC-TK-41 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TK-03 | Nhập sai mật khẩu 5 lần liên tiếp thì tạm khóa đăng nhập 15 phút. Đăng nhập thành công thì đếm lại từ đầu. Nhập sai mật khẩu hiện tại khi đổi mật khẩu cũng tính vào số lần sai. | UC-TK-02 (4a, 5b), UC-TK-07 (4a), AC-TK-11, AC-TK-13, AC-TK-14, AC-TK-44 |
| BR-TK-06 | Liên kết xác thực email có hiệu lực 24 giờ; liên kết đặt lại mật khẩu có hiệu lực 30 phút. Mỗi liên kết chỉ dùng một lần. Gửi lại thư sau ít nhất 60 giây kể từ lần gửi trước; gửi lại thì liên kết cũ hết hiệu lực. | UC-TK-05 (2a, 2b, 3b), UC-TK-06 (3b, 7a), AC-TK-29, AC-TK-31, AC-TK-32, AC-TK-38, AC-TK-39 |
| BR-TK-07 | Phiên đăng nhập hết hạn nếu không sử dụng quá 30 ngày; khi đó phải đăng nhập lại. | UC-TK-04 (1a), AC-TK-27, AC-TK-25, AC-TK-26 |
