-- =============================================================================
-- Phiên gia sư (lát C, docs/srs/use-cases/TUTOR.md): lời mời, phiên, kết quả từng từ, sự kiện bật/tắt Chế độ gia sư.
-- Không lưu nội dung hội thoại và ghi âm Lượt chấm (BR-TUTOR-09).
-- =============================================================================

-- Tính năng mới có hạn mức theo gói. Domain feature_code là CHECK nên phải thay ràng buộc.
ALTER DOMAIN feature_code DROP CONSTRAINT feature_code_check;
ALTER DOMAIN feature_code ADD CONSTRAINT feature_code_check CHECK (VALUE IN
    ('shadowing_assess','ai_feedback','mouth_video','weakness_full','tutor_session'));

-- Free 1 phiên mỗi ngày (số tạm, BR-TUTOR-07), Pro không giới hạn (NULL).
INSERT INTO plan_limits (plan, feature, period, limit_value) VALUES
    ('free', 'tutor_session', 'day', 1),
    ('pro',  'tutor_session', 'day', NULL);

-- -----------------------------------------------------------------------------
-- tutor_offers
-- CHỨC NĂNG: một Lời mời gia sư đã đưa ra sau một Lượt shadowing. Dùng để giãn cách hai lần mời (ít nhất 3 lượt trong
-- cùng bài, BR-TUTOR-02) và đo tỉ lệ nhận lời. lesson_id lưu thẳng để truy vấn giãn cách không phải nối qua câu.
-- -----------------------------------------------------------------------------
CREATE TABLE tutor_offers (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id   uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    attempt_id  bigint NOT NULL REFERENCES sentence_attempts(id) ON DELETE CASCADE,
    reason      text NOT NULL CHECK (reason IN ('LOW_WORD_SCORE','REPEATED_PHONEME_ERROR')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    accepted_at timestamptz,
    declined_at timestamptz,
    CONSTRAINT chk_tutor_offer_resolved_once CHECK (accepted_at IS NULL OR declined_at IS NULL)
);
CREATE INDEX ix_tutor_offers_user_lesson ON tutor_offers(user_id, lesson_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- tutor_sessions
-- CHỨC NĂNG: một Phiên gia sư về MỘT câu (gắn với Lượt shadowing gốc). outcome và ended_at cùng có hoặc cùng rỗng.
-- started_at rỗng nghĩa là gia sư chưa nói câu đầu; charged chỉ true sau khi đã started (trừ lượt khi started).
-- -----------------------------------------------------------------------------
CREATE TABLE tutor_sessions (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_id        bigint NOT NULL REFERENCES sentence_attempts(id) ON DELETE CASCADE,
    offer_id          uuid REFERENCES tutor_offers(id) ON DELETE SET NULL,
    live_model        text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    started_at        timestamptz,
    ended_at          timestamptz,
    outcome           text CHECK (outcome IN
        ('completed','learner_exit','off_topic','timeout','idle','connect_failed')),
    current_word_key  text,
    off_topic_streak  smallint NOT NULL DEFAULT 0 CHECK (off_topic_streak >= 0),
    sentence_tries    smallint NOT NULL DEFAULT 0 CHECK (sentence_tries >= 0),
    charged           boolean NOT NULL DEFAULT false,
    CONSTRAINT chk_tutor_session_ended CHECK ((outcome IS NULL) = (ended_at IS NULL)),
    CONSTRAINT chk_tutor_session_charged CHECK (NOT charged OR started_at IS NOT NULL)
);
CREATE INDEX ix_tutor_sessions_user ON tutor_sessions(user_id, created_at DESC);
CREATE INDEX ix_tutor_sessions_attempt ON tutor_sessions(attempt_id);
-- Phiên đang mở mà chưa started: job dọn quét theo created_at (hết 15 giây thì connect_failed).
CREATE INDEX ix_tutor_sessions_unstarted ON tutor_sessions(created_at)
    WHERE started_at IS NULL AND ended_at IS NULL;

-- -----------------------------------------------------------------------------
-- tutor_session_words
-- CHỨC NĂNG: Kết quả từng từ của phiên (Danh sách từ lỗi và các từ học viên tự chọn thêm). Hiệu quả của gia sư đo bằng
-- score_before (điểm âm trọng tâm ở Lượt shadowing gốc) và score_after (điểm tốt nhất trong các Lượt chấm).
-- attempts đếm lượt của vòng luyện hiện tại (quay lại từ thì về 0), total_attempts đếm cả phiên.
-- focus_phoneme_id là âm ĐÍCH cần sửa (ADR 0005), rỗng khi từ không có âm (Azure bỏ sót từ).
-- -----------------------------------------------------------------------------
CREATE TABLE tutor_session_words (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id       uuid NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
    position         smallint NOT NULL CHECK (position >= 0),
    word             text NOT NULL,
    word_key         text NOT NULL,
    focus_phoneme_id smallint REFERENCES phonemes(id) ON DELETE RESTRICT,
    score_before     numeric(5,2) NOT NULL CHECK (score_before BETWEEN 0 AND 100),
    score_after      numeric(5,2) CHECK (score_after BETWEEN 0 AND 100),
    attempts         smallint NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    total_attempts   smallint NOT NULL DEFAULT 0 CHECK (total_attempts >= 0),
    status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','passed','needs_practice')),
    CONSTRAINT uq_tutor_session_words_key UNIQUE (session_id, word_key),
    CONSTRAINT uq_tutor_session_words_pos UNIQUE (session_id, position)
);

-- -----------------------------------------------------------------------------
-- tutor_lesson_events
-- CHỨC NĂNG: học viên bật hoặc tắt Chế độ gia sư ở đầu bài và giữa bài, để làm số liệu hiệu quả sau này.
-- -----------------------------------------------------------------------------
CREATE TABLE tutor_lesson_events (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id  uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    event      text NOT NULL CHECK (event IN ('start_on','start_off','toggle_on','toggle_off')),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_tutor_lesson_events_user ON tutor_lesson_events(user_id, created_at DESC);
