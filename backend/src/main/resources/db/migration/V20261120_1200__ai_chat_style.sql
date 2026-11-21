-- Thực hành với AI theo bài (UC-AI-01): kiểu trò chuyện của phiên giọng nói.
-- qa: hỏi đáp; interview: học viên đóng vai nhân vật, gia sư phỏng vấn; retell: học viên kể lại video cho gia sư.
ALTER TABLE ai_conversations
    ADD COLUMN style text NOT NULL DEFAULT 'qa' CHECK (style IN ('qa', 'interview', 'retell'));
