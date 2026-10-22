# Trình duyệt kết nối thẳng tới Gemini Live bằng ephemeral token, giới hạn thời gian thực thi phía client

Status: accepted. Các con số giới hạn (90 giây, 3 lượt đọc lại, 2 câu hỏi) đã được [ADR 0003](0003-tutor-session-theo-cau-tran-10-phut.md) thay thế; phần kết nối thẳng vẫn đúng.

Âm thanh của Phiên gia sư đi thẳng từ trình duyệt tới Gemini Live, không qua Spring Boot. Chuyển tiếp luồng audio hai chiều qua backend vừa khó làm vừa tăng độ trễ. Backend chỉ làm cổng vào: kiểm tra consent `ai_processing`, trừ hạn mức `tutor_session`, tạo bản ghi phiên, rồi cấp ephemeral token đã khóa model, system prompt và cấu hình, để người dùng không sửa được prompt.

## Consequences

- Cuộc trò chuyện với Gemini do trình duyệt thực thi giới hạn thời gian; người dùng có kỹ thuật có thể kéo dài nó tới hạn của token (12 phút) và có thể dùng token mà không báo `started` để né hạn mức. Phần đi qua backend thì backend tự chặn: phiên đã `started` quá 10 phút cộng dung sai 30 giây bị đóng `timeout` và mọi Lượt chấm Azure sau đó bị từ chối; trần 5 phiên chưa `started` mỗi ngày (BR-TUTOR-06, BR-TUTOR-07).
- Còn lại là rủi ro chấp nhận được với phạm vi tiểu luận, ghi rõ trong báo cáo.
- Việc chấm Lượt chấm vẫn đi qua backend (Azure), nên điểm lưu trong backend là đáng tin dù phần hội thoại chạy phía client.
