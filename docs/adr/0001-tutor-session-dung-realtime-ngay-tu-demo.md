# Phiên gia sư dùng realtime speech-to-speech (Gemini Live) ngay từ bản demo

Status: accepted

Phiên gia sư là tính năng Must: gia sư AI nói chuyện ngắn với người học về một Lỗi trọng tâm, kiểu mentor, và người học được hỏi tự do. Có một lựa chọn rẻ và dễ kiểm thử hơn: pipeline từng lượt (LLM văn bản cộng Azure TTS). Nhóm vẫn chọn realtime speech-to-speech ngay từ demo, vì cảm giác hội thoại tự nhiên và việc trả lời câu hỏi tự do là giá trị cốt lõi của tính năng. Pipeline không làm được điều đó mà không thêm STT, thêm bước phân loại câu hỏi và chịu độ trễ vài giây mỗi lượt. Nhóm chọn Gemini Live thay vì OpenAI Realtime để cả project chỉ dùng một nhà cung cấp LLM (dùng chung với AI Feedback và gợi ý CEFR).

## Consequences

- Mô hình realtime không chấm được phát âm. Mỗi Lượt đọc lại vẫn được ghi âm riêng và chấm bằng Azure. Gia sư nhận điểm qua kết quả tool `request_retry`.
- Gia sư trả lời bằng giọng nói, nên lượt người học nói (đúng chủ đề hay lạc đề) và Kết quả phiên được ghi lại qua tool (`log_turn`, `end_session`), không qua JSON. Nội dung hội thoại không được lưu.
- Chi phí tính theo phút hội thoại. Phải có giới hạn chi phí trên console. Khi không mở được phiên, hệ thống lùi về AI Feedback văn bản cùng Mẹo sửa.
- Nếu chất lượng tiếng Việt của Gemini Live không đạt, nhóm đổi sang OpenAI gpt-realtime-mini. Phần backend (chấm Lượt đọc lại, hạn mức, lưu phiên) giữ nguyên.
