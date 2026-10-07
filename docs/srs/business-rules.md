# Quy tắc nghiệp vụ

Các giá trị đánh dấu *(đề xuất)* chờ nhóm chốt.

## Module AUTH

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-AUTH-01 | Email là duy nhất trong hệ thống, không phân biệt chữ hoa và chữ thường. Tên hiển thị được phép trùng giữa nhiều người dùng. | UC-AUTH-01 (5a), AC-AUTH-04, AC-AUTH-05 |
| BR-AUTH-02 | Mật khẩu có ít nhất 8 ký tự. Không bắt buộc chữ hoa, chữ số hay ký tự đặc biệt. | UC-AUTH-01 (4a), UC-AUTH-06 (9a), UC-AUTH-07 (4b), AC-AUTH-02, AC-AUTH-40, AC-AUTH-45 |
| BR-AUTH-03 | Nhập sai mật khẩu 5 lần liên tiếp thì tạm khóa đăng nhập 15 phút. Đăng nhập thành công thì đếm lại từ đầu. Nhập sai mật khẩu hiện tại khi đổi mật khẩu cũng tính vào số lần sai. | UC-AUTH-02 (4a, 5b), UC-AUTH-07 (4a), AC-AUTH-12, AC-AUTH-14, AC-AUTH-15, AC-AUTH-44 |
| BR-AUTH-04 | Thông báo khi đăng nhập sai luôn là thông báo chung, không cho biết email có tài khoản hay không, hay tài khoản chỉ dùng Google. Quên mật khẩu và gửi lại email xác thực luôn trả cùng một thông báo dù email có tài khoản hay không. Việc báo "email chưa xác thực" chỉ xảy ra sau khi đã nhập đúng mật khẩu. | UC-AUTH-02 (5a, 7a), UC-AUTH-05 (2a), UC-AUTH-06 (Bước 4), AC-AUTH-13, AC-AUTH-29, AC-AUTH-33, AC-AUTH-34 |
| BR-AUTH-05 | Tài khoản đăng ký bằng email phải xác thực email trước khi đăng nhập. Đăng nhập đúng mật khẩu khi email chưa xác thực thì không được cấp phiên, mà được chuyển đến màn hình "Kiểm tra hộp thư" có tùy chọn gửi lại. Email được coi là đã xác thực khi: chọn liên kết xác thực, đặt lại mật khẩu thành công qua liên kết trong thư, hoặc đăng nhập bằng Google cùng email. | UC-AUTH-01 (Bước 6, 8), UC-AUTH-02 (7a), UC-AUTH-05, UC-AUTH-06 (Bước 9), UC-AUTH-03 (5b), AC-AUTH-01, AC-AUTH-10, AC-AUTH-28, AC-AUTH-35 |
| BR-AUTH-06 | Liên kết xác thực email có hiệu lực 24 giờ; liên kết đặt lại mật khẩu có hiệu lực 30 phút *(đề xuất)*. Mỗi liên kết chỉ dùng một lần. Gửi lại thư sau ít nhất 60 giây kể từ lần gửi trước; gửi lại thì liên kết cũ hết hiệu lực. | UC-AUTH-05 (2a, 2b, 3b), UC-AUTH-06 (3b, 7a), AC-AUTH-29, AC-AUTH-31, AC-AUTH-32, AC-AUTH-38, AC-AUTH-39 |
| BR-AUTH-07 | Phiên đăng nhập hết hạn nếu không sử dụng quá 30 ngày *(đề xuất)*; khi đó phải đăng nhập lại. | UC-AUTH-04 (1a), AC-AUTH-27 |
| BR-AUTH-08 | Đăng nhập bằng Google: email Google đã được Google xác thực thì được coi là đã xác thực. Nếu email trùng tài khoản có sẵn thì liên kết vào tài khoản đó, không tạo tài khoản thứ hai. Nếu tài khoản có sẵn chưa xác thực email, mật khẩu cũ bị hủy và các phiên đăng nhập đang có bị kết thúc. Google không xác nhận email thì không đăng nhập, không liên kết. | UC-AUTH-03 (4a, 5a, 5b), AC-AUTH-18, AC-AUTH-19, AC-AUTH-20, AC-AUTH-22 |
| BR-AUTH-09 | Khi tạo hoặc đổi mật khẩu, các phiên đăng nhập trên thiết bị khác bị kết thúc, phiên trên thiết bị đang dùng được giữ. Khi đặt lại mật khẩu qua thư thì mọi phiên đều bị kết thúc. | UC-AUTH-06 (Bước 9), UC-AUTH-07 (Bước 6), AC-AUTH-35, AC-AUTH-41 |
| BR-AUTH-10 | Tài khoản bị quản trị viên khóa không đăng nhập được bằng bất kỳ cách nào (email và mật khẩu, hoặc Google). | UC-AUTH-02 (6a), UC-AUTH-03 (6a), AC-AUTH-16, AC-AUTH-24 |
| BR-AUTH-11 | Tên hiển thị dài từ 1 đến 50 ký tự (không tính khoảng trắng đầu và cuối). | UC-AUTH-01 (4a), UC-AUTH-08 (4a), AC-AUTH-02, AC-AUTH-49 |
| BR-AUTH-12 | Học viên phải hoàn tất thiết lập hồ sơ học tập trước khi dùng các chức năng khác. Quy tắc này chỉ áp dụng cho Học viên, không áp dụng cho Giảng viên và Quản trị viên. | UC-AUTH-08 (Bước 1), UC-AUTH-02 (8a), AC-AUTH-11, AC-AUTH-46 |
| BR-AUTH-13 | Thời lượng học mỗi ngày chọn một trong 10, 15, 20, 30 phút, mặc định 15 phút (khớp mockup trang Hôm nay và Cài đặt). Đây là tổng thời gian mặc định của kế hoạch học hằng ngày; học viên vẫn đổi được cho riêng từng ngày ở trang Hôm nay. Ngôn ngữ giao diện: tiếng Việt hoặc tiếng Anh. | UC-AUTH-08 (4a), AC-AUTH-47, AC-AUTH-49 |
| BR-AUTH-14 | Người dùng phải đồng ý Điều khoản sử dụng và Chính sách quyền riêng tư trước khi dùng hệ thống: ở biểu mẫu đăng ký nếu đăng ký bằng email, ở bước thiết lập hồ sơ nếu đăng nhập bằng Google. Việc đồng ý lưu giọng nói và xử lý bằng AI được hỏi riêng ở lần ghi âm đầu tiên, không thuộc module này. | UC-AUTH-01 (4b), UC-AUTH-08 (4b), AC-AUTH-03, AC-AUTH-50 |
| BR-AUTH-15 | Tài khoản tự đăng ký (bằng email hoặc Google) luôn có vai trò Học viên. Vai trò Giảng viên và Quản trị viên do quản trị viên cấp. | UC-AUTH-01 (Bước 6), UC-AUTH-03 (5a), AC-AUTH-01, AC-AUTH-18 |
