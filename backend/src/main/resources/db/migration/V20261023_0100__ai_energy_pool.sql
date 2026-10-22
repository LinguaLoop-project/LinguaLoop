-- =============================================================================
-- Bể năng lượng AI chung (ADR 0006, BR-QUOTA-01):
-- 1. Thêm 'ai_energy' vào domain feature_code (giữ các giá trị cũ vì usage_counters còn lưu lịch sử).
-- 2. Bỏ các dòng hạn mức cũ của shadowing_assess, ai_feedback, tutor_session khỏi plan_limits.
-- 3. Thiết lập hạn mức mới cho ai_energy: Free 8 năng lượng/ngày, Pro không giới hạn (NULL).
-- =============================================================================

ALTER DOMAIN feature_code DROP CONSTRAINT feature_code_check;
ALTER DOMAIN feature_code ADD CONSTRAINT feature_code_check CHECK (VALUE IN
    ('shadowing_assess','ai_feedback','mouth_video','weakness_full','tutor_session','ai_energy'));

DELETE FROM plan_limits WHERE feature IN ('shadowing_assess', 'ai_feedback', 'tutor_session');

INSERT INTO plan_limits (plan, feature, period, limit_value) VALUES
    ('free', 'ai_energy', 'day', 8),
    ('pro',  'ai_energy', 'day', NULL);
