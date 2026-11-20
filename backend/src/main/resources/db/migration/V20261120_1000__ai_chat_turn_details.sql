-- Thực hành với AI theo bài (UC-AI-01): chi tiết từng lượt và đảm bảo mỗi bài chỉ có một cuộc trò chuyện đang mở.
ALTER TABLE ai_conversation_messages
    ADD COLUMN better    text,                          -- cách nói tự nhiên hơn (dòng role='student')
    ADD COLUMN hint      text,                          -- gợi ý đã tạo cho câu hỏi (dòng role='tutor'); lưu để bấm lại không tạo mới
    ADD COLUMN via_voice boolean NOT NULL DEFAULT false; -- câu trả lời đi bằng giọng nói (dòng role='student')

-- mode: 'live' là phiên nói chuyện qua Gemini Live (trừ credit cố định một lần), 'text' là chat chữ dự phòng (trừ theo lượt).
-- charged: phiên live đã trừ credit; chặn trừ hai lần khi trình duyệt báo "started" lặp lại.
ALTER TABLE ai_conversations
    ADD COLUMN mode    text    NOT NULL DEFAULT 'text' CHECK (mode IN ('text', 'live')),
    ADD COLUMN charged boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX uq_ai_conv_active ON ai_conversations(user_id, lesson_id) WHERE status = 'active';
