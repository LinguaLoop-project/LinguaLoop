# BH — Quản lý bài học: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BH-01 | Giáo viên chỉ xem, xem chi tiết, sửa thông tin, sửa câu, tạo lại gợi ý, xuất bản, gỡ xuất bản, xóa và khôi phục các bài do chính mình tạo; xem được cả bài Nháp và Đã xuất bản của mình, và các bài mình đã xóa trong 30 ngày gần nhất ở bộ lọc "Đã xóa". Chỉ giáo viên đã đăng nhập và đang hoạt động mới thao tác trên bài. | UC-BH-01 đến UC-BH-10, AC-BH-01, 09, 30, 52, 60 |
| BR-BH-02 | Quản trị viên xem danh sách và xem chi tiết các bài Đã xuất bản của mọi giáo viên (không thấy bài Nháp, không thấy bài đã xóa), lọc được theo giáo viên chủ bài. Quản trị viên chỉ có thể gỡ xuất bản bài kèm lý do; không thêm, không sửa, không xuất bản, không xóa và không khôi phục bài, vì nội dung bài thuộc về giáo viên chủ. Bài cá nhân của Học viên Pro thuộc module PR, không nằm trong module này. | UC-BH-01, UC-BH-02, UC-BH-07, AC-BH-02, 08, 10, 51, 60 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BH-03 | Bài học có ba trạng thái: Nháp, Đã xuất bản, Đã xóa. Bài mới tạo luôn là Nháp. Chỉ bài Đã xuất bản hiển thị cho học viên. Giáo viên xuất bản trực tiếp, không cần quản trị viên duyệt. | UC-BH-03, UC-BH-06, UC-BH-07, AC-BH-14, 43 |
| BR-BH-04 | Khi quản trị viên gỡ xuất bản phải nhập lý do dài 1 đến 500 ký tự; lý do hiển thị cho giáo viên chủ bài trong danh sách và chi tiết bài. Giáo viên tự gỡ bài của mình không cần lý do. Gỡ xuất bản đưa bài về Nháp và không xóa tiến độ học của học viên. Bài đã gỡ được xuất bản lại khi đủ điều kiện BR-BH-11. Khi quản trị viên gỡ nội dung từ báo cáo (UC-XL-06), lý do gỡ do quản trị viên nhập ở đó được dùng làm lý do này. | UC-BH-01, UC-BH-02, UC-BH-07, AC-BH-50, 51, 54 |
| BR-BH-05 | Chỉ giáo viên chủ bài xóa được bài, ở trạng thái Nháp hoặc Đã xuất bản, không cần gỡ xuất bản trước. Xóa là xóa tạm: bài được giữ 30 ngày, quá 30 ngày thì không khôi phục được và không hiển thị ở bộ lọc "Đã xóa". Xóa bài Đã xuất bản làm bài biến mất khỏi thư viện học viên; tiến độ học của học viên được giữ lại và hiển thị lại khi bài được khôi phục và xuất bản lại. Báo cáo đang mở về câu của bài xử lý theo BR-XL-08. Quản trị viên không xóa bài; muốn đưa bài khỏi học viên thì gỡ xuất bản. | UC-BH-01 (5a), UC-BH-08, UC-BH-09, AC-BH-04, 57, 58, 59, 60, 65 |
| BR-BH-06 | Chỉ giáo viên chủ bài khôi phục được bài, trong 30 ngày kể từ ngày xóa. Bài khôi phục luôn về trạng thái Nháp, dù trước khi xóa là Nháp hay Đã xuất bản, với đủ các câu như trước khi xóa. Nếu giáo viên đã có bài khác cùng tiêu đề thì phải nhập tiêu đề mới cho bài khôi phục. | UC-BH-09, AC-BH-63, 64, 65, 66 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BH-07 | Link YouTube là link video hợp lệ (dạng youtube.com/watch hoặc youtu.be). Video phải truy cập được (công khai hoặc không công khai nhưng xem được bằng link), không phải video phát trực tiếp, không bị giới hạn độ tuổi và có phụ đề tiếng Anh. Link YouTube của bài không sửa được sau khi tạo; muốn dùng video khác thì tạo bài mới. | UC-BH-03 (5a, 6a, 6b), UC-BH-04 (Bước 2), AC-BH-16, 17, 18 |
| BR-BH-08 | Tiêu đề bài dài 1 đến 100 ký tự, không trùng với bài khác (chưa xóa) của cùng giáo viên, không phân biệt chữ hoa, chữ thường; khi tạo bài mà để trống thì lấy tên video, cắt còn tối đa 100 ký tự. Chủ đề bắt buộc, chọn trong danh sách chủ đề do quản trị viên quản lý (UC-CD-01), kể cả chủ đề đang Chưa hiển thị (BR-CD-04). Trình độ bắt buộc, chọn một trong A1, A2, B1, B2, C1, C2. Nhãn "Yêu cầu gói Pro" không bắt buộc, mặc định không. | UC-BH-03 (5b, 5c), UC-BH-04 (5a, 5b), UC-BH-09 (6a), AC-BH-15, 20, 21, 28, 29, 64 |
| BR-BH-09 | Dữ liệu của một câu: câu tiếng Anh bắt buộc, dài 1 đến 500 ký tự; IPA và bản dịch tiếng Việt không bắt buộc khi lưu nhưng bản dịch bắt buộc khi xuất bản (BR-BH-11), mỗi ô tối đa 500 ký tự. Mốc bắt đầu nhỏ hơn mốc kết thúc, đoạn dài ít nhất 0,5 giây, không chồng lấn với câu kề bên và không vượt độ dài video. Thứ tự câu theo mốc thời gian. | UC-BH-05 (5a, 5b), AC-BH-36, 37, 38 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BH-10 | Nguồn lời thoại của bài chỉ là phụ đề tiếng Anh có sẵn của video YouTube. Hệ thống tách phụ đề thành các câu kèm mốc thời gian. Giáo viên không tải âm thanh hay video lên, không nhập file phụ đề, và hệ thống không tự nhận dạng giọng nói; video không có phụ đề tiếng Anh thì không tạo được bài. Hệ thống chỉ lưu link, thông tin cơ bản của video và các câu của bài; video vẫn được phát từ YouTube. | UC-BH-03, UC-BH-04, UC-BH-02 (3a), AC-BH-12, 14, 17, 18, 23 |
| BR-BH-11 | Điều kiện xuất bản: bài có ít nhất 1 câu và mọi câu đều có bản dịch tiếng Việt; tiêu đề, chủ đề và trình độ đã đầy đủ. IPA không bắt buộc. Bài đã gỡ xuất bản cũng phải đạt điều kiện này mới xuất bản lại được. | UC-BH-06 (2a), AC-BH-45, 46 |
| BR-BH-12 | Bài có thể được đánh dấu yêu cầu gói Pro khi tạo hoặc sửa. Học viên gói Free thấy bài kèm nhãn Pro nhưng không học được; học viên gói Pro học bình thường (BR-PR-13). Bật yêu cầu Pro cho bài đã xuất bản thì học viên gói Free không học tiếp được, tiến độ đã có được giữ; tắt thì học lại được. | UC-BH-03, UC-BH-04 (3a), AC-BH-26 |
| BR-BH-13 | Sửa bài đã xuất bản (thông tin hoặc câu) có hiệu lực ngay sau khi lưu. Sửa nội dung một câu giữ nguyên điểm và tiến độ học của câu đó. Giáo viên sửa được câu tiếng Anh, IPA, bản dịch và mốc thời gian, và xóa được câu không dùng được; không thêm, tách hay gộp câu. Câu bị xóa thì tiến độ học của câu đó không còn được tính, tiến độ các câu còn lại được giữ; báo cáo đang mở về câu bị xóa chỉ còn được từ chối (BR-XL-08). Bài Đã xuất bản phải còn ít nhất 1 câu. Mỗi lần lưu thay đổi câu được tính là một lần sửa nội dung của giáo viên (BR-XL-05). | UC-BH-04, UC-BH-05, AC-BH-25, 39, 40, 41 |
| BR-BH-14 | Khi tạo bài (UC-BH-03) và khi tạo lại gợi ý (UC-BH-10), hệ thống dùng AI để gợi ý bản dịch tiếng Việt và IPA cho từng câu. Credit trừ vào số dư riêng do quản trị viên cấp cho giáo viên theo BR-GA-06 và BR-GA-11; giáo viên không có credit miễn phí hằng ngày. Không đủ credit để bắt đầu thì không dùng được AI, nhưng bài vẫn được tạo và giáo viên vẫn nhập, sửa tay bình thường. Hết credit giữa chừng thì dừng sau câu đang xử lý, giữ phần đã tạo và chỉ trừ credit phần đã tạo; số dư không âm. Lỗi do hệ thống thì không trừ credit. Gợi ý chỉ điền vào ô, không tự lưu; credit đã trừ không được hoàn khi giáo viên bỏ gợi ý. Hệ thống không hiển thị ước tính credit trước khi dùng. | UC-BH-03 (8, 8a, 8b), UC-BH-10, AC-BH-14, 22, 69 đến 75 |
| BR-BH-15 | Xem danh sách và xem chi tiết bài không ghi nhận tiến độ học và không tính vào thống kê học của học viên; nghe thử đoạn của câu cũng không tính. | UC-BH-02, AC-BH-13 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BH-16 | Danh sách hiển thị 10 bài mỗi trang, bài cập nhật gần nhất ở đầu. | UC-BH-01, AC-BH-02 |
| BR-BH-17 | Video để tạo bài dài tối đa 30 phút. | UC-BH-03 (6c), AC-BH-19 |
