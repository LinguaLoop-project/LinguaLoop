# AI — Thực hành với AI: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-AI-01 | Chức năng Thực hành với AI (trò chuyện theo bài) chỉ mở cho các bài học đã được duyệt và chưa bị xóa. Nếu bài học được gắn nhãn Pro thì chỉ học viên có gói Pro còn hạn mới được bắt đầu cuộc trò chuyện; học viên dùng gói Free bị hệ thống từ chối và mời nâng cấp. | UC-AI-01 (2a), AC-AI-01, AC-AI-09 |
| BR-AI-02 | Học viên phải xác nhận đồng ý cho phép xử lý dữ liệu bằng AI trước khi hệ thống khởi tạo cuộc trò chuyện với gia sư AI. | UC-AI-01 (2a), AC-AI-01, AC-AI-09 |
| BR-AI-03 | Học viên chỉ được xem và thao tác trên các cuộc trò chuyện cũng như lịch sử hội thoại của chính mình; mọi yêu cầu truy cập vào cuộc trò chuyện của học viên khác đều bị hệ thống từ chối và báo không tìm thấy. | UC-AI-01 (1a), AC-AI-06 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-AI-04 | Hệ thống chỉ tính và trừ năng lượng AI của cuộc trò chuyện khi gia sư AI khởi tạo thành công câu hỏi mở đầu của phiên; nếu dịch vụ AI gặp lỗi không khởi tạo được câu hỏi đầu tiên thì hệ thống đóng phiên với trạng thái lỗi và hoàn trả lại toàn bộ năng lượng AI cho học viên. | UC-AI-01 (5a), AC-AI-01, AC-AI-04, AC-AI-11 |
| BR-AI-05 | Toàn bộ nội dung của mỗi cuộc trò chuyện (gồm các câu hỏi của gia sư, câu trả lời của học viên, nhận xét từng lượt và nhận xét tổng quát cuối phiên) đều được lưu vào lịch sử hội thoại của bài học đó. Khi học viên chọn bắt đầu lại cuộc trò chuyện mới, cuộc trò chuyện cũ được đóng và giữ nguyên trong lịch sử. Việc mở xem lại lịch sử hội thoại không làm tiêu tốn năng lượng AI. | UC-AI-01 (1a, 4b), AC-AI-04, AC-AI-06 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-AI-06 | Học viên có thể trả lời câu hỏi của gia sư AI bằng một trong hai cách ở mỗi lượt: (a) gõ chữ với độ dài từ 1 đến 1000 ký tự sau khi bỏ khoảng trắng hai đầu; hoặc (b) thu âm giọng nói hợp lệ có thời lượng từ 0,5 giây đến 30 giây và nhận diện được lời nói. Nếu câu trả lời rỗng hoặc bản ghi âm không hợp lệ thì hệ thống không tính lượt và yêu cầu trả lời lại. | UC-AI-01 (4d), AC-AI-02, AC-AI-10 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-AI-07 | Toàn bộ câu hỏi và nhận xét của gia sư AI trong phiên phải bám sát nội dung và lời thoại (transcript) của bài học đang mở. Sau mỗi câu trả lời của học viên, AI đối chiếu trực tiếp với diễn biến và nhân vật trong bài (ví dụ: nhắc nhở khi học viên trả lời về bản thân thay vì nói về nhân vật trong video), kèm theo gợi ý diễn đạt tiếng Anh tự nhiên hơn rồi mới đưa ra câu hỏi kế tiếp. | UC-AI-01, AC-AI-02 |
| BR-AI-08 | Ở bất kỳ câu hỏi nào trong cuộc trò chuyện, học viên đều có thể yêu cầu gợi ý trả lời; gợi ý cung cấp từ vựng và cấu trúc câu mẫu dựa trên lời thoại của bài học và không trừ thêm năng lượng AI ngoài mức phí của phiên trò chuyện. | UC-AI-01 (4a), AC-AI-03 |
| BR-AI-09 | Khi hoàn thành đủ số câu hỏi của phiên hoặc khi học viên chủ động chọn kết thúc cuộc trò chuyện (sau khi đã trả lời ít nhất 1 câu), gia sư AI tổng hợp và hiển thị một bản nhận xét tổng quát đánh giá mức độ hiểu nội dung bài học, cách dùng từ, ngữ pháp và điểm cần cải thiện của học viên. | UC-AI-01 (4c), AC-AI-05 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-AI-10 | Mỗi cuộc trò chuyện Thực hành với AI theo bài (hoặc mỗi lần chọn Bắt đầu lại cuộc trò chuyện mới) tiêu tốn 3 năng lượng AI, tính chung vào quỹ 8 năng lượng AI mỗi ngày của gói Free cùng với chế độ Trò chuyện với AI theo câu và Nhận xét AI (BR-SH-23). Học viên dùng gói Pro không bị giới hạn số cuộc trò chuyện trong ngày. | UC-AI-01 (2b, 4b), AC-AI-01, AC-AI-04, AC-AI-07, AC-AI-08 |
| BR-AI-11 | Mỗi cuộc trò chuyện Thực hành với AI theo bài gồm tối đa 5 lượt câu hỏi từ gia sư AI và kéo dài tối đa 15 phút; khi hết câu hỏi thứ 5 hoặc hết thời gian tối đa, hệ thống tự động chuyển sang bước đưa ra nhận xét tổng quát và kết thúc phiên. | UC-AI-01, AC-AI-05 |