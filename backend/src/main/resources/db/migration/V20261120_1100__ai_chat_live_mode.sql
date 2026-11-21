-- Thực hành với AI theo bài (UC-AI-01): chế độ giọng nói qua Gemini Live.
-- mode: 'live' là phiên nói chuyện qua Gemini Live (trừ credit cố định một lần), 'text' là chat chữ dự phòng (trừ theo lượt).
-- charged: phiên live đã trừ credit; chặn trừ hai lần khi trình duyệt báo "started" lặp lại.
ALTER TABLE ai_conversations
    ADD COLUMN mode    text    NOT NULL DEFAULT 'text' CHECK (mode IN ('text', 'live')),
    ADD COLUMN charged boolean NOT NULL DEFAULT false;
