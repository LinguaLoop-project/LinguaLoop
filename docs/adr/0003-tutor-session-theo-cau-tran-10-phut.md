# Phiên gia sư theo câu, hội thoại tự do tới trần 10 phút, hỏi bật gia sư một lần đầu bài

Status: accepted. Thay thế các giới hạn của [ADR 0002](0002-tutor-session-ket-noi-thang-bang-ephemeral-token.md).

Học thử cho thấy mô hình "chen ngang 90 giây, sửa đúng một lỗi" quá chật: người học muốn luyện nhiều từ, muốn đổi từ, và không phân biệt được lúc trò chuyện với lúc đọc để chấm. Nhóm đổi sang: phiên làm việc với **cả câu** (nhiều Từ luyện, người học đổi từ được), hội thoại tự do tới **trần 10 phút**, tách hẳn **Chế độ trò chuyện** (không chấm) và **Lượt chấm** (giữ nút để đọc, Azure chấm, tối đa 3 lượt mỗi từ). Giới hạn "dài hay ngắn" không còn tính bằng giây mà bằng **chủ đề**: 3 Lượt lạc đề liên tiếp (backend đếm) thì kết thúc, và im lặng 60 giây gia sư hỏi, 90 giây thì kết thúc. Người học được hỏi bật gia sư **một lần ở đầu bài** kèm công tắc; khi bật, gia sư tự mở (đếm ngược 3 giây, bỏ qua được) sau câu có lỗi, cách nhau ít nhất 3 câu.

## Consequences

- Trần 10 phút khớp với giới hạn kết nối khoảng 10 phút của Gemini Live nên không cần tự nối lại phiên (session resumption) hay nén ngữ cảnh. Muốn hội thoại thật sự không giới hạn thì phải làm hai việc đó và nâng thời hạn ephemeral token; ghi lại như hướng mở rộng.
- Phiên có nhiều từ nên "đạt hay không" của cả phiên không còn nghĩa. Hiệu quả đo bằng **Kết quả từng từ** (điểm âm vị trước/sau, tỉ lệ từ đạt); Kết quả phiên chỉ là lý do kết thúc.
- Backend phải giữ trạng thái từng từ (số lượt, kết quả) và đếm lạc đề; gia sư chỉ làm theo `instruction` trong kết quả tool. Mô hình thỉnh thoảng quên gọi tool nên frontend vẫn nhắc sau một khoảng lặng.
- Gia sư gắn với câu nên không thể ôn tập chéo nhiều câu trong một phiên; người học gọi lại gia sư ở câu khác.
