-- =============================================================================
-- Nhận xét AI (lát B): mỗi Lượt shadowing chỉ có một nhận xét, và hạn mức theo gói.
-- =============================================================================

-- Một lượt một nhận xét: hai yêu cầu đồng thời cho cùng một lượt không tạo được hai dòng
-- (bên chậm hơn bị từ chối chèn rồi được hoàn lượt).
ALTER TABLE ai_feedback ADD CONSTRAINT uq_ai_feedback_attempt UNIQUE (attempt_id);

-- Free được 5 lượt nhận xét mỗi ngày để thử; Pro không giới hạn (NULL). Giá trị tạm, chỉnh theo chi phí Gemini thực tế.
UPDATE plan_limits SET limit_value = 5    WHERE plan = 'free' AND feature = 'ai_feedback';
UPDATE plan_limits SET limit_value = NULL WHERE plan = 'pro'  AND feature = 'ai_feedback';
