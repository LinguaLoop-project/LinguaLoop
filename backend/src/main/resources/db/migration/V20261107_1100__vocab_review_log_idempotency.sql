-- Gửi lại cùng một câu trả lời (mất mạng rồi gửi lại) không được ghi hai dòng nhật ký (BR-VOCAB-12): client sinh một
-- id cho mỗi câu trả lời; (user_id, client_answer_id) là duy nhất. Dòng cũ không có id nên để trống.
ALTER TABLE vocab_review_logs ADD COLUMN client_answer_id uuid;
CREATE UNIQUE INDEX uq_vrl_client_answer ON vocab_review_logs (user_id, client_answer_id) WHERE client_answer_id IS NOT NULL;
