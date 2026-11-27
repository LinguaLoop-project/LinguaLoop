-- Cấp độ CEFR của bộ thư viện (BR-BT-16): giáo viên gắn khi tạo hoặc sửa, không bắt buộc (NULL = chưa gắn). Dùng để tự
-- chọn bộ từ mới khởi đầu cho học viên chưa học bộ nào (BR-HT-32).
ALTER TABLE vocab_decks
    ADD COLUMN cefr_level text CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2'));

-- Câu luyện thêm của Phiên ôn tập hằng ngày (BR-HT-31): câu học viên đã luyện nhưng không nằm trong Câu cần ôn. Bảng chỉ
-- ghi lần ôn và lần bỏ qua gần nhất trong ngày, để câu không bị chọn lại hôm nay và được tính vào số câu đã ôn; câu không
-- được thêm vào user_sentence_review (BR-HT-22).
CREATE TABLE user_sentence_extra (
    user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sentence_id      uuid NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
    mode             text NOT NULL CHECK (mode IN ('dictation','shadowing')),
    last_reviewed_at timestamptz,
    last_skipped_at  timestamptz,
    PRIMARY KEY (user_id, sentence_id, mode)
);
