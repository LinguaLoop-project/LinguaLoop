# SH — Thực hành Shadowing: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-SH-01 | Mọi chức năng của chế độ Shadowing đều yêu cầu học viên đã đăng nhập; câu được luyện phải thuộc bài học đã được duyệt và chưa bị xóa. Nếu bài học được gắn nhãn Pro thì chỉ học viên có gói Pro còn hạn mới được mở bài và gửi chấm phát âm; học viên gói Free bị hệ thống từ chối và mời nâng cấp. | UC-SH-01 (2b), AC-SH-10 |
| BR-SH-02 | Học viên chỉ được xem kết quả lượt đọc, lịch sử các lượt đọc, ghi chú, danh sách câu cần ôn, yêu cầu nhận xét AI và mở Phiên gia sư cho các lượt đọc của chính mình; mọi thao tác truy cập vào dữ liệu lượt đọc của học viên khác đều bị hệ thống từ chối và báo không tìm thấy. | UC-SH-01, UC-SH-02 (5c), UC-SH-03, AC-SH-02, AC-SH-07, AC-SH-25, AC-SH-38 |
| BR-SH-03 | Mẹo sửa phát âm bằng tiếng Việt của các âm được hiển thị cho cả học viên gói Free và gói Pro. Quyền xem video khẩu hình theo BR-PR-16. | UC-SH-02 (5b), AC-SH-18, AC-SH-19 |
| BR-SH-04 | Học viên phải xác nhận đồng ý cho phép xử lý dữ liệu bằng AI trước khi hệ thống thực hiện gửi bản ghi âm đi chấm phát âm, tạo nhận xét AI hoặc mở Phiên gia sư. | UC-SH-01 (6a), UC-SH-02 (5a, 5c), UC-SH-03, AC-SH-11, AC-SH-25 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-SH-05 | Sau mỗi lượt chấm phát âm thành công, hệ thống tự động cập nhật thời điểm hoạt động gần nhất của bài học ở chế độ Shadowing. Khi học viên đã có ít nhất một lượt đọc cho tất cả các câu trong bài thì chế độ Shadowing của bài đó được đánh dấu hoàn thành; các lần đọc lại sau đó không làm thay đổi thời điểm hoàn thành đầu tiên. | UC-SH-01, AC-SH-05 |
| BR-SH-06 | Khi học viên mở lại một bài học đang luyện dở, hệ thống khôi phục trạng thái của từng câu đã đọc dựa trên lượt đọc mới nhất của câu đó (gồm điểm tổng, 4 điểm thành phần, từng từ, từng âm vị kèm mẹo sửa, video khẩu hình và nhận xét AI đã lưu), kèm theo điểm cao nhất và tổng số lần đã đọc của câu; các câu chưa có lượt đọc nào ở chế độ Shadowing không có dữ liệu kết quả. | UC-SH-01 (2a), AC-SH-02 |
| BR-SH-07 | Ở mục Luyện, các câu chưa có lượt đọc nào trong bài bị che phần chữ (chỉ hiển thị dấu câu), còn các câu đã đọc hiển thị đầy đủ chữ kèm điểm cao nhất và số lần đọc. Khi học viên chuyển sang mục Xem thì toàn bộ các câu trong bài đều hiển thị đầy đủ chữ. | UC-SH-01 (3a), AC-SH-01, AC-SH-03 |
| BR-SH-28 | Khi tạo Phiên gia sư, hệ thống chưa trừ năng lượng AI ngay mà chỉ trừ 3 năng lượng AI khi gia sư thực sự nói câu đầu tiên trong vòng 15 giây kể từ lúc tạo; nếu quá 15 giây không bắt đầu được thì phiên tự đóng với trạng thái lỗi kết nối và không trừ năng lượng. Mỗi phiên kéo dài tối đa 10 phút; trong một ngày học viên chỉ được có tối đa 5 phiên không bắt đầu được. | UC-SH-03 (3a, 4a, 8a), AC-SH-30, AC-SH-31, AC-SH-37 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-SH-08 | Khi hiển thị phiên âm ngay dưới từng từ của câu, nếu số lượng từ của chuỗi phiên âm khớp với số lượng từ của câu thì hệ thống gắn phiên âm tương ứng dưới mỗi từ; nếu lệch số từ thì hệ thống hiển thị phiên âm của cả câu thành một dòng chung. | UC-SH-01, AC-SH-04 |
| BR-SH-09 | Bản ghi âm gửi đi chấm phát âm phải là tệp âm thanh định dạng WAV chuẩn (PCM 16-bit, đơn kênh mono, tần số lấy mẫu 16 kHz) và có thời lượng từ 0,5 giây đến 30 giây. | UC-SH-01 (6a), AC-SH-12 |
| BR-SH-10 | Mọi ký hiệu âm vị giọng Mỹ do dịch vụ chấm trả về đều được chuyển đổi sang bảng 44 âm vị chuẩn của hệ thống (nguyên âm đứng trước âm `r` chuyển thành nguyên âm đôi tương ứng; nguyên âm gộp `r` như trong từ "morning" chuyển thành nguyên âm dài hoặc nguyên âm đôi tương ứng mà không tách thêm âm `r`). Nếu xuất hiện ký hiệu lạ chưa có trong bảng chuyển đổi thì hệ thống vẫn hiển thị ký hiệu gốc cho học viên, lưu lượt đọc kèm cảnh báo để bổ sung sau. | UC-SH-02 (1a), AC-SH-16 |
| BR-SH-11 | Đối với mỗi âm vị trong lượt đọc, hệ thống lưu đồng thời ký hiệu gốc, âm thực tế đã chuyển đổi, âm đích (được ghép theo đúng vị trí từ phiên âm mẫu của câu khi số lượng âm bằng nhau) và âm ứng viên khác có điểm cao nhất. | UC-SH-02, AC-SH-17, AC-SH-21 |
| BR-SH-12 | Mẹo sửa phát âm bằng tiếng Việt và video khẩu hình luôn được lấy theo âm đích cần sửa của từ (hoặc theo âm thực tế nếu không ghép được âm đích), dựa trên bộ mẹo chuẩn cho 44 âm vị của hệ thống; nếu âm chưa có mẹo riêng thì để trống, không lấy mô tả giọng Anh chung để tránh sai lệch với bài giọng Mỹ. | UC-SH-02, AC-SH-18, AC-SH-21, AC-SH-20 |
| BR-SH-13 | Hệ thống chỉ giữ tạm bản ghi âm của lượt vừa đọc ngay trên trình duyệt để học viên nghe lại ("Giọng tôi") hoặc nghe nối tiếp với câu mẫu ("So sánh"); hệ thống không lưu trữ tệp âm thanh của học viên về lâu dài nên khi xem lại các lượt đọc cũ trong lịch sử sẽ không còn âm thanh để nghe lại. | UC-SH-01 (8a), AC-SH-06, AC-SH-07 |
| BR-SH-14 | Khi tạo nhận xét AI cho một lượt đọc, hệ thống chỉ gửi văn bản câu mẫu, điểm số, danh sách các từ và các âm yếu của lượt đó tới dịch vụ AI, tuyệt đối không gửi tệp ghi âm của học viên. Mỗi lượt đọc có tối đa một nhận xét AI; sau khi tạo lần đầu, các lần yêu cầu xem lại (hoặc gửi trùng đồng thời) đều lấy lại bản đã lưu mà không gọi lại AI và không trừ thêm năng lượng. | UC-SH-02 (5a), AC-SH-22, AC-SH-23, AC-SH-24 |
| BR-SH-15 | Học viên chỉ được tạo ghi chú ở chế độ Shadowing cho câu đã có ít nhất một lượt đọc Shadowing; nội dung ghi chú không được chỉ chứa khoảng trắng và dài tối đa 1000 ký tự. Mỗi câu có tối đa một ghi chú ở chế độ Shadowing, hoàn toàn độc lập với ghi chú của câu đó ở chế độ Nghe chép. | UC-SH-01 (8b), AC-SH-08 |
| BR-SH-29 | Trong Phiên gia sư, học viên hoặc gia sư chỉ được chọn đổi sang luyện các từ có mặt trong câu hiện tại (không phân biệt hoa thường và dấu câu); nếu từ được chọn chưa có trong Danh sách từ lỗi ban đầu thì hệ thống thêm từ đó vào danh sách với âm trọng tâm là âm đích có điểm thấp nhất của từ ở lượt đọc gốc. | UC-SH-03 (5a), AC-SH-32 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-SH-16 | Kết quả của từng từ trong câu sau khi chấm được phân thành 4 trạng thái: **đọc đúng**, **đọc sai**, **bỏ sót** (từ có trong câu mẫu nhưng học viên không đọc) và **đọc thừa** (từ học viên đọc thêm nhưng không có trong câu mẫu). | UC-SH-02, AC-SH-15 |
| BR-SH-17 | Một âm vị được hệ thống đánh dấu là "cần sửa" (để đưa vào thống kê âm hay sai và gửi cho nhận xét AI) khi âm đó có điểm dưới 60 hoặc là một phụ âm mà dịch vụ chấm nhận diện khác với âm đích của câu mẫu dù đạt điểm cao. Các nguyên âm nhận diện khác âm đích nhưng điểm từ 60 trở lên không bị đánh dấu lỗi vì là hiện tượng nối hoặc lướt âm tự nhiên. | UC-SH-02, AC-SH-17 |
| BR-SH-18 | Danh sách lịch sử lượt đọc của một câu hiển thị toàn bộ các lượt đã chấm thành công ở chế độ Shadowing của câu đó, sắp xếp từ lượt mới nhất đến lượt cũ nhất, mỗi lượt hiển thị thời điểm đọc, điểm tổng và 4 điểm thành phần (độ chính xác, độ trôi chảy, độ đầy đủ, ngữ điệu). | UC-SH-01 (8a), AC-SH-07 |
| BR-SH-19 | Sau khi chấm một lượt đọc Shadowing đạt dưới 60 điểm và câu đó chưa có trong danh sách Câu cần ôn của Shadowing, hệ thống hiển thị hộp hỏi "Lưu câu này để ôn lại?". Câu chỉ được thêm vào danh sách khi học viên chọn "Lưu" (nếu chọn "Không" hoặc đóng hộp hỏi thì không thêm, và lần sau đọc dưới 60 điểm hệ thống vẫn hỏi lại). Học viên cũng có thể chủ động ghim bất kỳ câu nào đã có lượt đọc Shadowing vào danh sách mà không cần qua hộp hỏi. | UC-SH-04 (1a, 1b, 4a), AC-SH-40, AC-SH-41, AC-SH-43 |
| BR-SH-20 | Khi câu đang nằm trong danh sách Câu cần ôn của Shadowing và học viên đọc được từ 80 điểm trở lên (không tính các lượt đọc trong Phiên gia sư), hệ thống hiển thị hộp hỏi "Câu này đã tốt rồi. Bỏ khỏi danh sách ôn?". Câu chỉ rời danh sách khi học viên chọn "Bỏ khỏi danh sách" hoặc chủ động bấm "Đã ổn" / "Bỏ khỏi Câu cần ôn" (nếu điểm từ 60 đến 79 thì hệ thống không hỏi và giữ nguyên). Việc gỡ câu khỏi danh sách không làm xóa lịch sử các lượt đã đọc. | UC-SH-04 (2a, 2b, 5a), AC-SH-41, AC-SH-42, AC-SH-44, AC-SH-45 |
| BR-SH-21 | Danh sách Câu cần ôn của chế độ Shadowing hoàn toàn độc lập với danh sách Câu cần ôn của chế độ Nghe chép; trên trang "Từ & câu đã lưu", các câu của hai chế độ được hiển thị chung kèm nhãn chế độ riêng và bộ lọc theo từng chế độ. | UC-SH-04 (5a), AC-SH-44 |
| BR-SH-27 | Khi Chế độ gia sư đang bật, sau mỗi lượt đọc câu, hệ thống chỉ tự động hiển thị lời mời mở Phiên gia sư nếu đã cách lần mời gần nhất trong bài ít nhất 3 lượt đọc và câu vừa đọc có từ dưới 60 điểm hoặc có âm đích cần sửa lặp lại ở ít nhất 1 trong 2 lượt đọc gần nhất của bài. | UC-SH-03 (1a), AC-SH-29 |
| BR-SH-30 | Trong Phiên gia sư, mỗi từ lỗi có tối đa 3 lượt đọc; nếu âm trọng tâm của từ đạt từ 80 điểm trở lên hoặc đã hết 3 lượt thì chuyển sang từ kế tiếp (chọn lại từ đó sẽ được cấp 3 lượt mới; nếu lỗi dịch vụ chấm hoặc đổi từ khi đang chấm thì không tính lượt). Khi hết các từ trong danh sách, học viên đọc lại cả câu tối đa 3 lượt để hoàn tất phiên; các lượt đọc trong phiên không tạo lượt đọc Shadowing mới và không làm thay đổi điểm gốc của câu trong bài. | UC-SH-03, AC-SH-33, AC-SH-34, AC-SH-35 |
| BR-SH-31 | Trong Phiên gia sư, nếu học viên nói lạc đề 1 hoặc 2 lượt liên tiếp thì gia sư nhắc nhở quay lại bài học; nếu nói lạc đề 3 lượt liên tiếp thì hệ thống tự động kết thúc phiên ngay lập tức (nếu có 1 lượt đúng chủ đề xen giữa thì bộ đếm lạc đề liên tiếp đặt lại về 0). | UC-SH-03 (5b), AC-SH-36 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-SH-22 | Việc chấm phát âm các lượt đọc ở chế độ Shadowing hoàn toàn miễn phí, không giới hạn số lượt đọc trong ngày đối với cả tài khoản gói Free lẫn gói Pro và không làm tiêu tốn năng lượng AI. | UC-SH-01, AC-SH-01, AC-SH-05 |
| BR-SH-23 | Hạn mức năng lượng AI mỗi ngày theo gói (BR-PR-11); mỗi lần tạo mới nhận xét AI cho một lượt đọc tiêu tốn 1 năng lượng AI và mỗi Phiên gia sư bắt đầu thành công tiêu tốn 3 năng lượng AI. | UC-SH-02 (5a, 5c), UC-SH-03 (3a), AC-SH-22, AC-SH-25, AC-SH-28, AC-SH-30, AC-SH-38 |
| BR-SH-24 | Bộ đếm số năng lượng AI đã sử dụng trong ngày được tính theo múi giờ Việt Nam và tự động đặt lại về 0 vào lúc 00:00 mỗi ngày. | UC-SH-02, AC-SH-28 |
| BR-SH-25 | Khi có quá nhiều yêu cầu chấm phát âm gửi đồng thời vượt quá khả năng xử lý tức thời, hệ thống thông báo dịch vụ đang bận để học viên thử lại mà không khóa toàn bộ tính năng chấm phát âm; chỉ khi dịch vụ chấm gặp lỗi ngắt kết nối liên tiếp thì hệ thống mới tạm ngưng gửi yêu cầu để bảo vệ hệ thống. | UC-SH-01 (6b), AC-SH-14 |
| BR-SH-26 | Khi yêu cầu tạo nhận xét AI gặp tình trạng dịch vụ AI quá tải trước khi sinh ra chữ đầu tiên, hệ thống tự động thử lại đúng 1 lần sau khoảng 1 giây bằng mô hình dự phòng. Nếu vẫn quá tải, gặp lỗi hoặc học viên đóng trang trước khi nhận xét viết xong, hệ thống hủy kết quả dở dang và hoàn trả lại nguyên vẹn 1 năng lượng AI cho học viên. | UC-SH-02 (5c), AC-SH-26, AC-SH-27 |