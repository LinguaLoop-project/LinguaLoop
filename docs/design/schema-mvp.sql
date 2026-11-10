CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- chống chồng lấn mốc thời gian câu


-- =============================================================================
-- 1. TÀI KHOẢN VÀ XÁC THỰC
-- =============================================================================

-- Hồ sơ tài khoản. Khóa tài khoản bởi quản trị viên = locked_at có giá trị.
CREATE TABLE users (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email             citext NOT NULL UNIQUE,                       -- duy nhất, không phân biệt hoa thường
    password_hash     text,                                         -- NULL = tài khoản chỉ dùng Google
    google_sub        text UNIQUE,                                  -- ID tài khoản Google đã liên kết
    display_name      text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 50),
    avatar_url        text,
    role              text NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher','admin')),
    email_verified_at timestamptz,                                  -- NULL = chưa xác thực
    terms_accepted_at timestamptz,
    onboarded_at      timestamptz,                                  -- NULL = học viên chưa thiết lập hồ sơ
    daily_minutes     smallint NOT NULL DEFAULT 15 CHECK (daily_minutes IN (10,15,20,30)),
    ui_language       text NOT NULL DEFAULT 'vi' CHECK (ui_language IN ('vi','en')),
    timezone          text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',     -- tính streak theo ngày của học viên
    locked_at         timestamptz,
    locked_reason     text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_users_login_method CHECK (password_hash IS NOT NULL OR google_sub IS NOT NULL),
    CONSTRAINT chk_users_locked CHECK ((locked_at IS NULL) = (locked_reason IS NULL))
);

-- Đếm sai mật khẩu theo EMAIL (không theo user) để email không tồn tại cũng hiện cùng thông báo.
CREATE TABLE auth_login_attempts (
    email        citext PRIMARY KEY,
    failed_count smallint    NOT NULL DEFAULT 0,
    locked_until timestamptz,
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Refresh token. Cùng family_id = cùng một lần đăng nhập; đổi mật khẩu thì thu hồi các family khác.
CREATE TABLE auth_refresh_tokens (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id  uuid        NOT NULL,
    token_hash text        NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,                               -- 30 ngày không dùng
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_refresh_user ON auth_refresh_tokens(user_id) WHERE revoked_at IS NULL;
CREATE INDEX ix_refresh_family ON auth_refresh_tokens(family_id);

-- Liên kết xác thực email (24 giờ) và đặt lại mật khẩu (30 phút), dùng một lần.
-- "Gửi lại sau 60 giây" tính từ created_at của dòng mới nhất.
CREATE TABLE auth_email_tokens (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose    text        NOT NULL CHECK (purpose IN ('verify_email','reset_password')),
    token_hash text        NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    used_at    timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_email_tokens_user ON auth_email_tokens(user_id, purpose, created_at DESC);

-- Thông báo trong app: giáo viên được giao nội dung, được cấp credit.
CREATE TABLE notifications (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message    text        NOT NULL,
    read_at    timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_notifications_user ON notifications(user_id, created_at DESC);


-- =============================================================================
-- 2. TỪ ĐIỂN
-- Một dòng cho một từ. Các nghĩa nằm trong jsonb vì chỉ đọc nguyên khối; lưu từ = sao chép nghĩa vào thẻ.
-- =============================================================================

CREATE TABLE dictionary_words (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    headword  text NOT NULL UNIQUE,                                 -- lowercase, trim
    lemma_id  uuid REFERENCES dictionary_words(id) DEFERRABLE INITIALLY DEFERRED,   -- "went" -> "go"; NULL với từ gốc
    ipa_uk    text,
    ipa_us    text,
    audio_uk  text,
    audio_us  text,
    -- [{"no":1,"pos":"noun","meaning_vi":"...","definition_en":"...","definition_vi":"...","example_en":"...","example_vi":"..."}]
    meanings  jsonb NOT NULL DEFAULT '[]'
);
CREATE INDEX ix_dictionary_words_trgm  ON dictionary_words USING gin (headword gin_trgm_ops);
CREATE INDEX ix_dictionary_words_lemma ON dictionary_words(lemma_id);


-- =============================================================================
-- 3. CHỦ ĐỀ VÀ DANH MỤC (chỉ xem, thêm, sửa tên; chưa xóa và đổi thứ tự)
-- "Chủ đề hiển thị" = có ít nhất 1 bài đã xuất bản: tính ra, không lưu.
-- =============================================================================

CREATE TABLE topics (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100)
);
CREATE UNIQUE INDEX uq_topics_name ON topics(lower(name));

CREATE TABLE deck_categories (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100)
);
CREATE UNIQUE INDEX uq_deck_categories_name ON deck_categories(lower(name));


-- =============================================================================
-- 4. BÀI HỌC VÀ CÂU
-- =============================================================================

-- kind 'library' = bài của giáo viên, học viên xem trong thư viện khi status = 'published'
-- kind 'personal' = bài cá nhân của học viên Pro, chỉ chủ bài thấy
-- status: bài mới luôn 'draft'; xóa tạm = deleted_at, giữ 30 ngày, khôi phục về 'draft'.
CREATE TABLE lessons (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,   -- giáo viên chủ bài; quản trị viên giao lại nội dung = đổi owner_id
    kind            text NOT NULL DEFAULT 'library' CHECK (kind IN ('library','personal')),
    topic_id        uuid REFERENCES topics(id) ON DELETE RESTRICT,
    title           text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
    youtube_id      text NOT NULL,                                  -- link và ảnh đại diện dựng lại từ id; video không sửa được
    duration_sec    integer NOT NULL CHECK (duration_sec > 0),      -- để kiểm tra mốc câu không vượt độ dài video
    cefr_level      text NOT NULL CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2')),
    is_pro          boolean NOT NULL DEFAULT false,
    status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    unpublish_reason text,                                          -- lý do quản trị viên gỡ, hiện cho giáo viên
    view_count      integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),      -- xếp "nhiều lượt xem"
    deleted_at      timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_lesson_topic CHECK (kind = 'personal' OR topic_id IS NOT NULL)
);
CREATE UNIQUE INDEX uq_lessons_owner_title ON lessons(owner_id, lower(title)) WHERE deleted_at IS NULL;
CREATE INDEX ix_lessons_library ON lessons(topic_id, cefr_level) WHERE kind = 'library' AND status = 'published' AND deleted_at IS NULL;
CREATE INDEX ix_lessons_owner   ON lessons(owner_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX ix_lessons_title_trgm ON lessons USING gin (title gin_trgm_ops);

-- Thứ tự câu = theo start_ms, không có cột sort_order. Xóa câu = deleted_at (giữ lịch sử lượt làm).
CREATE TABLE sentences (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id  uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    text_en    text NOT NULL CHECK (char_length(text_en) BETWEEN 1 AND 500),
    text_vi    text CHECK (char_length(text_vi) <= 500),            -- bắt buộc khi xuất bản, kiểm ở service
    ipa_us     text CHECK (char_length(ipa_us) <= 500),             -- giọng Mỹ, mỗi từ một cụm cách nhau dấu cách; nguồn âm đích khi chấm
    ipa_uk     text CHECK (char_length(ipa_uk) <= 500),             -- giọng Anh, chỉ để hiển thị
    start_ms   integer NOT NULL CHECK (start_ms >= 0),
    end_ms     integer NOT NULL,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_sentence_len CHECK (end_ms - start_ms >= 500),   -- đoạn tối thiểu 0,5 giây
    CONSTRAINT ex_sentence_overlap EXCLUDE USING gist (
        lesson_id WITH =, int4range(start_ms, end_ms) WITH &&) WHERE (deleted_at IS NULL) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX ix_sentences_lesson ON sentences(lesson_id, start_ms) WHERE deleted_at IS NULL;

-- Thích video ở Học thụ động. Số lượt thích = count(*).
CREATE TABLE lesson_likes (
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id  uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id)
);

-- =============================================================================
-- 5. BỘ THẺ TỪ VỰNG: deck -> group -> card
-- =============================================================================

-- kind 'library' = bộ hệ thống (owner_id NULL) hoặc bộ của giáo viên, hiện trong thư viện khi 'published'
-- kind 'personal' = bộ từ cá nhân của học viên
-- kind 'saved' = bộ "Từ đã lưu", mỗi học viên đúng một bộ, ẩn khỏi danh sách bộ
CREATE TABLE vocab_decks (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id         uuid REFERENCES users(id) ON DELETE RESTRICT,
    kind             text NOT NULL DEFAULT 'library' CHECK (kind IN ('library','personal','saved')),
    category_id      uuid REFERENCES deck_categories(id) ON DELETE SET NULL,   -- NULL = mục "Khác"
    name             text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    image_url        text,                                          -- JPG/PNG <= 2 MB
    is_pro           boolean NOT NULL DEFAULT false,
    status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),   -- chỉ có nghĩa với kind 'library'
    unpublish_reason text,
    deleted_at       timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_deck_owner CHECK (owner_id IS NOT NULL OR kind = 'library')
);
-- Tên không trùng trong cùng chủ bộ; bộ hệ thống (owner NULL) cũng không trùng nhau. Bộ "saved" không cần tên duy nhất.
CREATE UNIQUE INDEX uq_vocab_decks_name ON vocab_decks(owner_id, lower(name)) NULLS NOT DISTINCT
    WHERE deleted_at IS NULL AND kind <> 'saved';
CREATE UNIQUE INDEX uq_vocab_decks_saved ON vocab_decks(owner_id) WHERE kind = 'saved';
CREATE INDEX ix_vocab_decks_library ON vocab_decks(category_id) WHERE kind = 'library' AND status = 'published' AND deleted_at IS NULL;

CREATE TABLE vocab_groups (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id    uuid NOT NULL REFERENCES vocab_decks(id) ON DELETE CASCADE,
    name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),                        -- thêm mới = cuối danh sách
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_vocab_groups_id_deck UNIQUE (id, deck_id)
);
CREATE UNIQUE INDEX uq_vocab_groups_name ON vocab_groups(deck_id, lower(name)) WHERE deleted_at IS NULL;

-- Thẻ mang nội dung riêng (sao chép từ từ điển khi lưu từ). deck_id lưu thêm để kiểm "không trùng từ trong bộ".
-- Bỏ lưu một nghĩa = deleted_at (ẩn thẻ, giữ tiến độ); lưu lại đúng nghĩa đó = bỏ deleted_at.
CREATE TABLE vocab_cards (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id            uuid NOT NULL,
    group_id           uuid NOT NULL,
    word               text NOT NULL CHECK (char_length(word) BETWEEN 1 AND 100),
    meaning_vi         text NOT NULL CHECK (char_length(meaning_vi) <= 500),
    pos                text CHECK (pos IN ('noun','verb','adjective','adverb','preposition','pronoun','conjunction',
                                           'determiner','interjection','phrasal verb','idiom','phrase','collocation','modal verb')),
    ipa_uk             text,
    ipa_us             text,
    audio_uk_url       text,
    audio_us_url       text,
    definition_en      text CHECK (char_length(definition_en) <= 500),
    definition_vi      text CHECK (char_length(definition_vi) <= 500),
    example_en         text CHECK (char_length(example_en) <= 500),
    example_vi         text CHECK (char_length(example_vi) <= 500),
    -- chỉ có với thẻ trong "Từ đã lưu":
    dict_word_id       uuid REFERENCES dictionary_words(id) ON DELETE SET NULL,
    dict_meaning_no    integer,                                     -- số thứ tự nghĩa trong dictionary_words.meanings
    source_sentence_id uuid REFERENCES sentences(id) ON DELETE SET NULL,   -- câu gốc đang học, hiện ở mặt sau thẻ
    deleted_at         timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (group_id, deck_id) REFERENCES vocab_groups(id, deck_id) ON DELETE CASCADE,
    CONSTRAINT chk_card_dict CHECK ((dict_word_id IS NULL) = (dict_meaning_no IS NULL))
);
CREATE UNIQUE INDEX uq_vocab_cards_word  ON vocab_cards(deck_id, lower(word)) WHERE deleted_at IS NULL AND dict_word_id IS NULL;
CREATE UNIQUE INDEX uq_vocab_cards_saved ON vocab_cards(deck_id, dict_word_id, dict_meaning_no) WHERE dict_word_id IS NOT NULL;
CREATE INDEX ix_vocab_cards_group ON vocab_cards(group_id, created_at) WHERE deleted_at IS NULL;


-- =============================================================================
-- 6. HỌC TỪ VỰNG: SM-2, phiên, nhật ký
-- =============================================================================

-- Có dòng = thẻ đã được trả lời ít nhất một lần; chưa có dòng = thẻ "Mới".
-- Trạng thái KHÔNG lưu: Đang học = repetitions < 2; Đang ôn = repetitions >= 2 và interval_days < 21; Đã thuộc = interval_days >= 21.
CREATE TABLE user_card_progress (
    user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id       uuid NOT NULL REFERENCES vocab_cards(id) ON DELETE CASCADE,
    ease_factor   numeric(3,2) NOT NULL DEFAULT 2.50 CHECK (ease_factor >= 1.30),
    interval_days integer NOT NULL DEFAULT 0 CHECK (interval_days >= 0),
    repetitions   smallint NOT NULL DEFAULT 0 CHECK (repetitions >= 0),     -- số lần nhớ liên tiếp
    due_at        timestamptz NOT NULL,
    updated_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, card_id)
);
CREATE INDEX ix_ucp_due ON user_card_progress(user_id, due_at);

-- Mỗi lần mở một phần học hoặc bắt đầu lượt ôn là một phiên. Dùng cho "Lịch sử luyện tập".
CREATE TABLE vocab_sessions (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id    uuid REFERENCES vocab_decks(id) ON DELETE SET NULL,      -- NULL = ôn chung nhiều bộ
    kind       text NOT NULL CHECK (kind IN ('learn','review')),
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at   timestamptz
);
CREATE INDEX ix_vocab_sessions_user ON vocab_sessions(user_id, started_at DESC);

-- Nhật ký mỗi câu trả lời. client_request_id chống ghi trùng khi gửi lại do mất mạng.
CREATE TABLE vocab_review_logs (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id           uuid NOT NULL REFERENCES vocab_cards(id) ON DELETE CASCADE,
    session_id        uuid REFERENCES vocab_sessions(id) ON DELETE SET NULL,
    mode              text NOT NULL CHECK (mode IN ('flashcard','guess','quiz','reverse_quiz')),
    is_correct        boolean NOT NULL,
    quality           smallint NOT NULL CHECK (quality IN (1,3,4,5)),       -- Quên, Khó, Được, Dễ
    response_ms       integer CHECK (response_ms >= 0),
    client_request_id uuid NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_vocab_review_request UNIQUE (user_id, client_request_id)
);
CREATE INDEX ix_vrl_user_time ON vocab_review_logs(user_id, created_at DESC);
CREATE INDEX ix_vrl_card ON vocab_review_logs(card_id);


-- =============================================================================
-- 7. NGỮ ÂM (dữ liệu tĩnh 44 âm vị giọng Mỹ)
-- =============================================================================

-- Mẹo sửa là MỘT mẹo cho mỗi âm đích, nên gộp vào đây thay cho phoneme_confusions.
-- Video khẩu hình luôn là nội dung Pro: khóa ở service, không cần cột cờ.
CREATE TABLE phonemes (
    id              smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    symbol          text NOT NULL UNIQUE,
    kind            text NOT NULL CHECK (kind IN ('vowel','diphthong','consonant')),
    example_word    text,
    tip_vi          text,
    mouth_video_url text
);


-- =============================================================================
-- 8. NGHE CHÉP VÀ SHADOWING
-- =============================================================================

-- Mỗi lần nộp một câu. mode='dictation': gõ lại; mode='shadowing': ghi âm chấm bằng Azure (không lưu file âm thanh).
-- Tiến độ bài, điểm cao nhất, điểm lượt mới nhất, streak, "đã hoàn thành" đều tính ra từ bảng này.
CREATE TABLE sentence_attempts (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sentence_id        uuid NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
    mode               text NOT NULL CHECK (mode IN ('dictation','shadowing')),
    total_score        numeric(5,2) NOT NULL CHECK (total_score BETWEEN 0 AND 100),
    client_request_id  uuid,                                        -- chống trùng khi gửi lại; NULL với shadowing
    created_at         timestamptz NOT NULL DEFAULT now(),
    -- chỉ nghe chép:
    level              text CHECK (level IN ('easy','normal','hard')),
    submitted_text     text,
    listen_count       smallint NOT NULL DEFAULT 0 CHECK (listen_count >= 0),
    is_retry           boolean NOT NULL DEFAULT false,              -- "Làm lại" và lượt ôn câu: không tính điểm yếu
    gave_up            boolean NOT NULL DEFAULT false,              -- "Hiện cả câu": 0 điểm, không tính điểm yếu
    -- chỉ shadowing (4 điểm thành phần của Azure):
    accuracy_score     numeric(5,2) CHECK (accuracy_score BETWEEN 0 AND 100),
    fluency_score      numeric(5,2) CHECK (fluency_score BETWEEN 0 AND 100),
    completeness_score numeric(5,2) CHECK (completeness_score BETWEEN 0 AND 100),
    prosody_score      numeric(5,2) CHECK (prosody_score BETWEEN 0 AND 100),
    CONSTRAINT chk_attempt_dictation CHECK (mode <> 'dictation' OR
        (level IS NOT NULL AND accuracy_score IS NULL AND fluency_score IS NULL AND completeness_score IS NULL AND prosody_score IS NULL)),
    CONSTRAINT chk_attempt_shadowing CHECK (mode <> 'shadowing' OR
        (level IS NULL AND submitted_text IS NULL AND NOT is_retry AND NOT gave_up))
);
CREATE INDEX ix_sa_user_sentence ON sentence_attempts(user_id, sentence_id, mode, created_at DESC);
CREATE INDEX ix_sa_user_time     ON sentence_attempts(user_id, created_at DESC);
CREATE INDEX ix_sa_sentence      ON sentence_attempts(sentence_id);   -- thống kê nội dung cho giáo viên (TN)
CREATE UNIQUE INDEX uq_sa_request ON sentence_attempts(user_id, client_request_id) WHERE client_request_id IS NOT NULL;

-- Kết quả từng từ. Dictation Easy chỉ lưu các từ bị khoét thành ô trống. Dữ liệu gốc của thống kê lỗi (không có bảng lỗi riêng).
CREATE TABLE sentence_attempt_words (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    attempt_id     bigint NOT NULL REFERENCES sentence_attempts(id) ON DELETE CASCADE,
    position       smallint NOT NULL,
    expected_word  text,                                            -- NULL khi từ thừa
    actual_word    text,                                            -- NULL khi bỏ sót / đã lộ
    outcome        text NOT NULL CHECK (outcome IN
        ('correct','omitted','inserted','substituted','misspelled','mispronounced','revealed')),
    word_class     text CHECK (word_class IN ('function','content','inflected','number','proper','other')),   -- cho thống kê TH-05
    is_homophone   boolean NOT NULL DEFAULT false,                  -- nhãn "từ đồng âm"
    accuracy_score numeric(5,2) CHECK (accuracy_score BETWEEN 0 AND 100),     -- chỉ shadowing
    CONSTRAINT uq_attempt_word_pos UNIQUE (attempt_id, position),
    CONSTRAINT chk_word_inserted CHECK ((outcome = 'inserted') = (expected_word IS NULL))
);

-- Kết quả từng âm vị (chỉ shadowing). Lỗi = accuracy < 60, hoặc phụ âm nghe ra khác âm đích.
CREATE TABLE sentence_attempt_phonemes (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    attempt_word_id   bigint NOT NULL REFERENCES sentence_attempt_words(id) ON DELETE CASCADE,
    position          smallint NOT NULL,
    target_phoneme_id smallint REFERENCES phonemes(id),             -- âm đích ghép từ ipa_us của câu
    heard_phoneme_id  smallint REFERENCES phonemes(id),             -- âm Azure nhận ra (đã đổi sang bảng phonemes)
    alt_phoneme_id    smallint REFERENCES phonemes(id),             -- ứng viên khác điểm cao nhất, cho "hay đọc nhầm thành"
    accuracy_score    numeric(5,2) NOT NULL CHECK (accuracy_score BETWEEN 0 AND 100),
    CONSTRAINT uq_attempt_phoneme_pos UNIQUE (attempt_word_id, position),
    CONSTRAINT chk_phoneme_known CHECK (target_phoneme_id IS NOT NULL OR heard_phoneme_id IS NOT NULL)
);
CREATE INDEX ix_sap_target ON sentence_attempt_phonemes(target_phoneme_id);

-- Danh sách "Câu cần ôn": hai danh sách riêng cho hai chế độ. Bỏ khỏi danh sách = xóa dòng.
-- Thứ tự theo điểm lượt gần nhất từ bảng sentence_attempts; "đã ôn hôm nay" = last_reviewed_at.
CREATE TABLE user_sentence_review (
    user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sentence_id      uuid NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
    mode             text NOT NULL CHECK (mode IN ('dictation','shadowing')),
    reason           text NOT NULL CHECK (reason IN ('low_score','manual')),
    created_at       timestamptz NOT NULL DEFAULT now(),
    last_reviewed_at timestamptz,
    PRIMARY KEY (user_id, sentence_id, mode)
);

-- Ghi chú câu: tối đa một ghi chú cho mỗi (câu, chế độ).
CREATE TABLE sentence_notes (
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sentence_id uuid NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
    mode        text NOT NULL CHECK (mode IN ('dictation','shadowing')),
    content     text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 1000),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, sentence_id, mode)
);


-- =============================================================================
-- 9. TÍNH NĂNG AI
-- =============================================================================

-- Nhận xét AI cho một lượt shadowing, tối đa một nhận xét mỗi lượt.
CREATE TABLE ai_feedback (
    attempt_id bigint PRIMARY KEY REFERENCES sentence_attempts(id) ON DELETE CASCADE,
    content    text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Thực hành với AI theo bài: tối đa 5 câu hỏi, 15 phút, lưu toàn bộ hội thoại.
CREATE TABLE ai_conversations (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id  uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','error')),
    summary    text,                                                -- nhận xét tổng quát cuối phiên
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at   timestamptz
);
CREATE INDEX ix_ai_conv_user_lesson ON ai_conversations(user_id, lesson_id, started_at DESC);

CREATE TABLE ai_conversation_messages (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role            text NOT NULL CHECK (role IN ('tutor','student')),
    content         text NOT NULL,
    feedback        text,                                           -- nhận xét lượt trả lời (chỉ dòng role='student')
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_ai_msg_conv ON ai_conversation_messages(conversation_id, id);

-- Lời mời gia sư đã đưa ra sau một lượt shadowing, để giãn cách >= 3 lượt trong bài.
CREATE TABLE tutor_offers (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    uuid   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id  uuid   NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    attempt_id bigint NOT NULL REFERENCES sentence_attempts(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_tutor_offers_user_lesson ON tutor_offers(user_id, lesson_id, created_at DESC);

-- Phiên gia sư theo câu, tối đa 10 phút. started_at NULL = gia sư chưa nói câu đầu (chưa trừ credit).
-- Không lưu nội dung hội thoại, chỉ kết quả từng từ.
CREATE TABLE tutor_sessions (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_id       bigint NOT NULL REFERENCES sentence_attempts(id) ON DELETE CASCADE,   -- lượt shadowing gốc
    created_at       timestamptz NOT NULL DEFAULT now(),
    started_at       timestamptz,
    ended_at         timestamptz,
    outcome          text CHECK (outcome IN ('completed','learner_exit','off_topic','timeout','idle','connect_failed')),
    current_position smallint NOT NULL DEFAULT 0,                   -- từ đang luyện
    off_topic_streak smallint NOT NULL DEFAULT 0 CHECK (off_topic_streak >= 0),   -- 3 lần liên tiếp thì kết thúc
    sentence_tries   smallint NOT NULL DEFAULT 0 CHECK (sentence_tries >= 0),     -- lượt đọc lại cả câu, tối đa 3
    CONSTRAINT chk_tutor_session_ended CHECK ((outcome IS NULL) = (ended_at IS NULL))
);
CREATE INDEX ix_tutor_sessions_user ON tutor_sessions(user_id, created_at DESC);

-- Danh sách từ lỗi của phiên; hiệu quả đo bằng score_before và score_after.
CREATE TABLE tutor_session_words (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id       uuid NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
    position         smallint NOT NULL,
    word             text NOT NULL,
    focus_phoneme_id smallint REFERENCES phonemes(id),              -- âm đích cần sửa; NULL nếu từ không có âm
    score_before     numeric(5,2) NOT NULL CHECK (score_before BETWEEN 0 AND 100),
    score_after      numeric(5,2) CHECK (score_after BETWEEN 0 AND 100),
    attempts         smallint NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),   -- lượt của vòng hiện tại
    status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','passed','needs_practice')),
    CONSTRAINT uq_tutor_word_pos UNIQUE (session_id, position)
);


-- =============================================================================
-- 10. CREDIT AI
-- Thay cho plan_limits + usage_counters. Quy tắc cấp credit theo gói (Free theo ngày, Pro theo tháng,
-- giáo viên do quản trị viên cấp) nằm ở service; DB chỉ giữ số dư và nhật ký.
-- =============================================================================

-- Cấu hình quy đổi, đúng một dòng.
CREATE TABLE ai_settings (
    id                   smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    credit_value_vnd     integer      NOT NULL DEFAULT 25 CHECK (credit_value_vnd BETWEEN 1 AND 1000),
    gateway_fee_pct      numeric(4,1) NOT NULL DEFAULT 3  CHECK (gateway_fee_pct BETWEEN 0 AND 99),
    margin_pct           numeric(4,1) NOT NULL DEFAULT 40 CHECK (margin_pct BETWEEN 0 AND 99),
    free_daily_credits   integer      NOT NULL DEFAULT 20 CHECK (free_daily_credits BETWEEN 0 AND 10000),
    min_balance_to_start integer      NOT NULL DEFAULT 5  CHECK (min_balance_to_start BETWEEN 0 AND 1000),
    updated_by           uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at           timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_ai_settings_margin CHECK (gateway_fee_pct + margin_pct < 100)
);

-- Bảng đơn giá, 4 hàng cố định, đồng cho mỗi một triệu đơn vị xử lý.
CREATE TABLE ai_feature_prices (
    feature           text PRIMARY KEY CHECK (feature IN ('shadowing_feedback','lesson_chat','tutor_session','lesson_suggest')),
    input_price_vnd   bigint NOT NULL DEFAULT 0 CHECK (input_price_vnd BETWEEN 0 AND 100000000),
    output_price_vnd  bigint NOT NULL DEFAULT 0 CHECK (output_price_vnd BETWEEN 0 AND 100000000)
);

-- Số dư credit hiện tại. resets_at = lần đặt lại kế tiếp (Free: 00:00 giờ VN; Pro: mỗi tháng của gói); NULL = không đặt lại (giáo viên).
-- Đến hạn thì service nạp lại số dư theo gói rồi dời resets_at (lazy, không cần job).
-- Trừ credit: UPDATE ... SET balance = greatest(balance - :cost, 0) (lượt đang chạy được hoàn tất, không âm).
CREATE TABLE ai_wallets (
    user_id    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance    integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
    resets_at  timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mỗi lần dùng AI. Nguồn cho thống kê sử dụng AI: lần dùng thành công, lần lỗi, lần bị từ chối vì hết credit, credit đã tiêu.
CREATE TABLE ai_usage_logs (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature          text NOT NULL REFERENCES ai_feature_prices(feature),
    status           text NOT NULL CHECK (status IN ('success','failed','rejected_no_credit')),
    input_units      integer NOT NULL DEFAULT 0 CHECK (input_units >= 0),
    output_units     integer NOT NULL DEFAULT 0 CHECK (output_units >= 0),
    credits_charged  integer NOT NULL DEFAULT 0 CHECK (credits_charged >= 0),   -- 0 nếu failed hoặc rejected
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_ai_usage_time ON ai_usage_logs(created_at DESC);
CREATE INDEX ix_ai_usage_user ON ai_usage_logs(user_id, created_at DESC);


-- =============================================================================
-- 11. GÓI PRO VÀ THANH TOÁN
-- =============================================================================

-- Gói do quản trị viên cấu hình. Không xóa, chỉ ngừng bán. Gói mới tạo luôn ở trạng thái ngừng bán.
CREATE TABLE pro_plans (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name              text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
    months            smallint NOT NULL CHECK (months BETWEEN 1 AND 36),
    price_vnd         integer  NOT NULL CHECK (price_vnd BETWEEN 0 AND 100000000),
    credits_per_month integer  NOT NULL CHECK (credits_per_month BETWEEN 0 AND 1000000),
    on_sale           boolean  NOT NULL DEFAULT false,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_pro_plans_name ON pro_plans(lower(name));

-- Một đơn = một lần mua/gia hạn. Sao chép giá, thời hạn, credit lúc mua nên sửa gói không ảnh hưởng đơn cũ.
-- Đơn chờ thanh toán hết hạn sau 15 phút. Chỉ lời gọi IPN của VNPay mới đổi sang 'paid' (trình duyệt quay về returnUrl không đáng tin).
-- vnp_TxnRef gửi cho VNPay = id đơn bỏ dấu gạch ngang (không cần cột riêng). Số tiền gửi VNPay = amount_vnd x 100.
-- Chống kích hoạt hai lần: UPDATE ... WHERE id = ? AND status = 'pending', và vnpay_transaction_no là UNIQUE.
-- Gia hạn: starts_at = max(now, ends_at của đơn đang hiệu lực).
-- "Học viên Pro" = có đơn paid với starts_at <= now < ends_at: xem view v_active_pro.
CREATE TABLE pro_orders (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id           uuid REFERENCES pro_plans(id) ON DELETE SET NULL,
    plan_name         text     NOT NULL,
    months            smallint NOT NULL,
    credits_per_month integer  NOT NULL,
    amount_vnd        integer  NOT NULL CHECK (amount_vnd >= 0),
    status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','expired','failed')),
    vnpay_transaction_no text UNIQUE,                               -- vnp_TransactionNo do VNPay trả về
    vnpay_response_code  text,                                      -- vnp_ResponseCode ('00' = thành công), để tra khi đơn 'failed'
    created_at        timestamptz NOT NULL DEFAULT now(),
    expires_at        timestamptz NOT NULL,                         -- created_at + 15 phút
    paid_at           timestamptz,
    starts_at         timestamptz,
    ends_at           timestamptz,
    CONSTRAINT chk_order_paid CHECK ((status = 'paid') = (paid_at IS NOT NULL AND starts_at IS NOT NULL AND ends_at IS NOT NULL))
);
CREATE INDEX ix_pro_orders_user ON pro_orders(user_id, created_at DESC);
CREATE INDEX ix_pro_orders_active ON pro_orders(user_id, ends_at) WHERE status = 'paid';


-- =============================================================================
-- 12. BÁO CÁO NỘI DUNG VÀ NHẬT KÝ
-- =============================================================================

-- Báo cáo chỉ trên câu hoặc thẻ. Giáo viên chủ = chủ bài/bộ chứa nội dung (tra qua join, tự đổi khi quản trị viên giao lại nội dung).
-- Lịch sử xử lý nằm trong audit_logs (target_type='report'), nên không có bảng sự kiện riêng.
-- Báo cáo trùng = cùng câu/thẻ + cùng lý do + cùng trạng thái: gộp khi hiển thị, không lưu.
CREATE TABLE content_reports (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sentence_id       uuid REFERENCES sentences(id) ON DELETE CASCADE,
    card_id           uuid REFERENCES vocab_cards(id) ON DELETE CASCADE,
    reason            text NOT NULL,                                -- danh sách lý do theo loại nội dung, kiểm ở service
    suggested_fix     text CHECK (char_length(suggested_fix) BETWEEN 1 AND 500),   -- bản sửa đúng, bắt buộc với một số lý do
    description       text CHECK (char_length(description) BETWEEN 1 AND 500),     -- bắt buộc với lý do "Khác"
    status            text NOT NULL DEFAULT 'waiting_teacher' CHECK (status IN
        ('waiting_teacher','waiting_admin','fix_requested','resolved','rejected')),
    status_changed_at timestamptz NOT NULL DEFAULT now(),           -- hạn tự chuyển lên quản trị viên sau 7 ngày
    created_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_report_target CHECK (num_nonnulls(sentence_id, card_id) = 1)
);
-- Chặn cùng học viên báo lại cùng lý do trên cùng câu/thẻ khi báo cáo cũ còn mở.
CREATE UNIQUE INDEX uq_report_open_sentence ON content_reports(reporter_id, sentence_id, reason)
    WHERE sentence_id IS NOT NULL AND status NOT IN ('resolved','rejected');
CREATE UNIQUE INDEX uq_report_open_card ON content_reports(reporter_id, card_id, reason)
    WHERE card_id IS NOT NULL AND status NOT IN ('resolved','rejected');
CREATE INDEX ix_reports_queue ON content_reports(status, created_at);

-- Nhật ký thao tác, chỉ thêm, không sửa hay xóa. Dùng cho: màn nhật ký, lịch sử xử lý báo cáo,
-- kiểm "nội dung đã được sửa sau khi học viên báo", khóa/mở khóa/đổi vai trò/giao lại nội dung, đổi cấu hình credit.
-- Tên đối tượng và tên người thực hiện lưu tại thời điểm ghi để vẫn hiển thị khi đã bị xóa.
CREATE TABLE audit_logs (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id    uuid REFERENCES users(id) ON DELETE SET NULL,       -- NULL = "Hệ thống" (tự chuyển báo cáo)
    actor_name  text NOT NULL,
    actor_role  text NOT NULL CHECK (actor_role IN ('student','teacher','admin','system')),
    action      text NOT NULL,                                      -- create, update, delete, publish, unpublish, lock, ...
    target_type text NOT NULL,                                      -- lesson, sentence, deck, group, card, topic, category, user, plan, settings, report, ...
    target_id   uuid,
    target_name text,
    changes     jsonb,                                              -- {"field":{"old":..,"new":..}}
    note        text,                                               -- lý do / ghi chú
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_time   ON audit_logs(created_at DESC);
CREATE INDEX ix_audit_target ON audit_logs(target_type, target_id, created_at DESC);
CREATE INDEX ix_audit_actor  ON audit_logs(actor_id, created_at DESC);


-- =============================================================================
-- 13. VIEW (chỉ những thứ được dùng ở nhiều nơi hoặc có công thức dễ sai)
-- =============================================================================

-- Học viên Pro còn hạn.
CREATE VIEW v_active_pro AS
SELECT user_id, max(ends_at) AS ends_at
FROM pro_orders
WHERE status = 'paid' AND starts_at <= now() AND ends_at > now()
GROUP BY user_id;

-- Thống kê lỗi nghe chép theo loại từ: chỉ lượt nộp ĐẦU TIÊN của mỗi câu, bỏ làm lại và bỏ cuộc.
CREATE VIEW v_user_dictation_stats AS
WITH first_attempt AS (
    SELECT DISTINCT ON (user_id, sentence_id) id, user_id, created_at
    FROM sentence_attempts
    WHERE mode = 'dictation' AND NOT is_retry AND NOT gave_up
    ORDER BY user_id, sentence_id, created_at
)
SELECT f.user_id,
       (f.created_at AT TIME ZONE 'UTC')::date                      AS day,
       w.word_class,
       count(*)                                                     AS total_words,
       count(*) FILTER (WHERE w.outcome IN ('omitted','substituted','misspelled')) AS wrong_words
FROM first_attempt f
JOIN sentence_attempt_words w ON w.attempt_id = f.id
WHERE w.word_class IS NOT NULL
GROUP BY f.user_id, (f.created_at AT TIME ZONE 'UTC')::date, w.word_class;

-- Thống kê theo âm vị cho Bản đồ 44 âm vị: lỗi = điểm < 60, hoặc phụ âm nghe ra khác âm đích.
CREATE VIEW v_user_phoneme_stats AS
SELECT a.user_id,
       (a.created_at AT TIME ZONE 'UTC')::date                      AS day,
       COALESCE(p.target_phoneme_id, p.heard_phoneme_id)            AS phoneme_id,
       count(*)                                                     AS total,
       count(*) FILTER (WHERE p.accuracy_score < 60
                           OR (p.target_phoneme_id IS NOT NULL
                               AND p.heard_phoneme_id IS DISTINCT FROM p.target_phoneme_id
                               AND tgt.kind = 'consonant' AND heard.kind = 'consonant')) AS errors
FROM sentence_attempt_phonemes p
JOIN sentence_attempt_words w ON w.id = p.attempt_word_id
JOIN sentence_attempts a      ON a.id = w.attempt_id
LEFT JOIN phonemes tgt        ON tgt.id = p.target_phoneme_id
LEFT JOIN phonemes heard      ON heard.id = p.heard_phoneme_id
GROUP BY a.user_id, (a.created_at AT TIME ZONE 'UTC')::date, COALESCE(p.target_phoneme_id, p.heard_phoneme_id);

-- Điểm cao nhất, điểm lượt gần nhất, số lượt của từng câu theo chế độ.
CREATE VIEW v_user_sentence_stats AS
SELECT user_id, sentence_id, mode,
       count(*)                                           AS attempt_count,
       max(total_score)                                   AS best_score,
       (array_agg(total_score ORDER BY created_at DESC))[1] AS last_score,
       max(created_at)                                    AS last_attempt_at
FROM sentence_attempts
GROUP BY user_id, sentence_id, mode;

-- Số câu (chưa xóa) của mỗi bài, cho thư viện bài học.
CREATE VIEW v_lesson_sentence_counts AS
SELECT l.id AS lesson_id, count(s.id) AS sentence_count
FROM lessons l
LEFT JOIN sentences s ON s.lesson_id = l.id AND s.deleted_at IS NULL
GROUP BY l.id;
