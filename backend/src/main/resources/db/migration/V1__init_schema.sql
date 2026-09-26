CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE DOMAIN cefr_code     AS text CHECK (VALUE IN ('A1','A2','B1','B2','C1','C2'));
CREATE DOMAIN practice_mode AS text CHECK (VALUE IN ('dictation','shadowing'));
CREATE DOMAIN skill_code    AS text CHECK (VALUE IN ('vocabulary','dictation','shadowing'));
CREATE DOMAIN feature_code  AS text CHECK (VALUE IN
    ('shadowing_assess','ai_feedback','mouth_video','weakness_full'));
CREATE DOMAIN word_form_type AS text CHECK (VALUE IN
    ('noun','verb','adjective','adverb','pronoun','preposition','conjunction','interjection','article','determiner'));


-- =============================================================================
-- 1. NGƯỜI DÙNG, GÓI PRO, ĐỒNG Ý DỮ LIỆU
-- =============================================================================

-- -----------------------------------------------------------------------------
-- users
-- CHỨC NĂNG: hồ sơ tài khoản người dùng.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_uid          text UNIQUE,
    email             citext UNIQUE NOT NULL,
    username          citext UNIQUE,
    password_hash     text,
    avatar_url        text,
    description       text,
    birthday          date,
    gender            text CHECK (gender IN ('male','female','other')),
    ui_language       text NOT NULL DEFAULT 'vi' CHECK (ui_language IN ('vi','en')),
    timezone          text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    max_daily_reviews integer NOT NULL DEFAULT 100 CHECK (max_daily_reviews > 0),
    email_verified    boolean NOT NULL DEFAULT false,
    disabled          boolean NOT NULL DEFAULT false,
    role              text NOT NULL DEFAULT 'student'
                      CHECK (role IN ('student','instructor','admin')),
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- user_subscriptions
-- CHỨC NĂNG: lịch sử các gói PRO của người dùng (mua, gia hạn, hủy, hoàn tiền).
-- Là thực thể riêng vì một người có thể có nhiều lần mua theo thời gian.
-- "Đang là PRO?" KHÔNG lưu cứng mà tính trong view v_user_plan.
-- -----------------------------------------------------------------------------
CREATE TABLE user_subscriptions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status        text NOT NULL CHECK (status IN ('active','cancelled','refunded')),
    price_id      text,
    total_months  integer CHECK (total_months > 0),
    activated_at  timestamptz NOT NULL DEFAULT now(),
    expires_at    timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_user_subscriptions_user ON user_subscriptions(user_id, status);

-- -----------------------------------------------------------------------------
-- user_consents
-- CHỨC NĂNG: nhật ký người dùng đồng ý/thu hồi việc xử lý dữ liệu nhạy cảm
-- (lưu giọng nói, gửi cho AI). Cần làm bằng chứng pháp lý nên giữ lịch sử.
-- -----------------------------------------------------------------------------
CREATE TABLE user_consents (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type   text NOT NULL CHECK (consent_type IN ('voice_storage','ai_processing')),
    policy_version text NOT NULL,
    granted_at     timestamptz NOT NULL DEFAULT now(),
    revoked_at     timestamptz,
    CONSTRAINT chk_consent_order CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);
CREATE UNIQUE INDEX uq_user_consents_active ON user_consents(user_id, consent_type) WHERE revoked_at IS NULL;

-- =============================================================================
-- 2. TỪ ĐIỂN (tra từ)
--    word 1—N meaning (mỗi nghĩa/loại từ một dòng) ; word 1—N pronunciation
-- =============================================================================

-- -----------------------------------------------------------------------------
-- dictionary_words
-- CHỨC NĂNG: danh mục các từ vựng (mục từ). Mỗi từ đúng MỘT dòng, dù có nhiều nghĩa.
-- -----------------------------------------------------------------------------
CREATE TABLE dictionary_words (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    headword    text NOT NULL,
    cefr_level  cefr_code,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_dictionary_words_headword UNIQUE (headword)
);
CREATE INDEX ix_dictionary_words_trgm ON dictionary_words USING gin (headword gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- dictionary_meanings
-- CHỨC NĂNG: từng nghĩa/loại từ của một mục từ ("hello" = exclamation + noun...).
-- Các biến thể từ (số nhiều, quá khứ...) phụ thuộc loại từ nên nằm ở bảng này.
-- -----------------------------------------------------------------------------
CREATE TABLE dictionary_meanings (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    word_id        uuid NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
    meaning_no     integer NOT NULL DEFAULT 1,
    pos            word_form_type NOT NULL,
    definition_en  text NOT NULL,
    example_en     text,
    translation_vi text,
    definition_vi  text,
    example_vi     text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_dictionary_meanings UNIQUE (word_id, meaning_no),
    CONSTRAINT uq_dictionary_meanings_id_word UNIQUE (id, word_id)
);
CREATE INDEX ix_dictionary_meanings_word ON dictionary_meanings(word_id);

-- -----------------------------------------------------------------------------
-- dictionary_word_forms
-- CHỨC NĂNG: các biến thể hình thái của một nghĩa (số nhiều, quá khứ, so sánh hơn...),
-- vd "go" -> "goes/going/went/gone". Phụ thuộc loại từ (pos) nên gắn vào meaning_id.
-- -----------------------------------------------------------------------------
CREATE TABLE dictionary_word_forms (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meaning_id  uuid NOT NULL REFERENCES dictionary_meanings(id) ON DELETE CASCADE,
    form_type   word_form_type NOT NULL,
    form_value  text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_word_forms UNIQUE (meaning_id, form_type, form_value)
);
CREATE INDEX ix_word_forms_value ON dictionary_word_forms (lower(form_value));
CREATE INDEX ix_word_forms_meaning ON dictionary_word_forms (meaning_id);

-- -----------------------------------------------------------------------------
-- dictionary_pronunciations
-- CHỨC NĂNG: phát âm (IPA + file audio) của mục từ theo từng giọng. Phát âm phụ thuộc
-- pos (vd "present" danh từ/tính từ đọc khác động từ) nên gắn theo (word_id, pos),
-- không gắn theo meaning_id để tránh trùng lặp giữa các nghĩa cùng pos.
-- -----------------------------------------------------------------------------
CREATE TABLE dictionary_pronunciations (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    word_id    uuid NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
    pos        word_form_type NOT NULL,
    accent     text NOT NULL CHECK (accent IN ('uk','us','kk','ipa')),
    text       text,
    audio_url  text,
    CONSTRAINT uq_dictionary_pronunciations UNIQUE (word_id, pos, accent),
    CONSTRAINT uq_dictionary_pronunciations_id_accent UNIQUE (id, pos, accent)
);

-- -----------------------------------------------------------------------------
-- user_saved_words
-- CHỨC NĂNG: "Từ vựng của tôi" – các từ người dùng lưu lại. Hỗ trợ HAI mức lưu:
--   * lưu MỘT NGHĨA  (tra từ điển, chọn đúng nghĩa cần)  -> meaning_id có giá trị
--   * lưu CẢ TỪ      (bấm lưu trong bài học shadowing)   -> meaning_id = NULL, hiển thị mọi nghĩa/loại từ
-- Nội dung (nghĩa, loại từ, ví dụ, phát âm) KHÔNG lưu ở đây mà lấy từ bảng từ điển;
-- view v_user_saved_word_meanings gộp cả hai mức về cùng một dạng để hiển thị.
-- -----------------------------------------------------------------------------
CREATE TABLE user_saved_words (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_id     uuid NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
    meaning_id  uuid,
    sentence_id uuid,
    source      text NOT NULL DEFAULT 'dictionary' CHECK (source IN ('dictionary','lesson','manual')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_saved_meaning_word
        FOREIGN KEY (meaning_id, word_id) REFERENCES dictionary_meanings(id, word_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX uq_user_saved_whole   ON user_saved_words(user_id, word_id)    WHERE meaning_id IS NULL;
CREATE UNIQUE INDEX uq_user_saved_meaning ON user_saved_words(user_id, meaning_id) WHERE meaning_id IS NOT NULL;
CREATE INDEX ix_user_saved_words_user ON user_saved_words(user_id, created_at DESC);

-- =============================================================================
-- 3. BỘ TỪ VỰNG:  deck -> group -> card
--    Deck hệ thống (owner_id NULL) và deck người dùng tự tạo dùng chung bảng.
--    Tổng số bài/thẻ KHÔNG lưu (dữ liệu tính ra): xem view v_vocab_deck_counts.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- vocab_deck_categories
-- CHỨC NĂNG: danh mục nhóm các bộ từ vựng (Oxford, TOEIC, IELTS...). Bảng tham chiếu nhỏ.
-- -----------------------------------------------------------------------------
CREATE TABLE vocab_deck_categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text UNIQUE NOT NULL,
    name_en     text NOT NULL,
    name_vi     text,
    sort_order  integer NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- vocab_decks
-- CHỨC NĂNG: một bộ từ vựng (vd "3000 Từ Vựng Oxford A2"), của hệ thống hoặc của người dùng.
-- -----------------------------------------------------------------------------
CREATE TABLE vocab_decks (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id      uuid REFERENCES users(id) ON DELETE CASCADE,
    category_id   uuid REFERENCES vocab_deck_categories(id) ON DELETE SET NULL,
    slug          text,
    name          text NOT NULL,
    name_vi       text,
    difficulty    cefr_code,
    thumbnail_url text,
    is_pro        boolean NOT NULL DEFAULT false,
    visibility    text NOT NULL DEFAULT 'private' CHECK (visibility IN ('system','private','public')),
    status        text NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('DRAFT','PENDING','APPROVED','REJECTED')),
    sort_order    integer NOT NULL DEFAULT 0,
    deleted_at    timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_deck_system_owner CHECK ((visibility = 'system') = (owner_id IS NULL))
);
CREATE UNIQUE INDEX uq_vocab_decks_slug ON vocab_decks(slug) WHERE slug IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_vocab_decks_owner    ON vocab_decks(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_vocab_decks_category ON vocab_decks(category_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX ix_vocab_decks_public   ON vocab_decks(status, sort_order) WHERE visibility = 'public' AND deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- vocab_deck_tags
-- CHỨC NĂNG: nhãn của deck (thuộc tính nhiều giá trị -> bảng con). Dùng lọc/tìm deck.
-- -----------------------------------------------------------------------------
CREATE TABLE vocab_deck_tags (
    deck_id  uuid NOT NULL REFERENCES vocab_decks(id) ON DELETE CASCADE,
    tag      text NOT NULL,
    PRIMARY KEY (deck_id, tag)
);
CREATE INDEX ix_vocab_deck_tags_tag ON vocab_deck_tags(tag);

-- -----------------------------------------------------------------------------
-- vocab_groups
-- CHỨC NĂNG: một "Bài"/"Unit" trong deck; đơn vị học (vd 22 thẻ mỗi bài).
-- -----------------------------------------------------------------------------
CREATE TABLE vocab_groups (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id     uuid NOT NULL REFERENCES vocab_decks(id) ON DELETE CASCADE,
    name        text NOT NULL,
    name_vi     text,
    sort_order  integer NOT NULL DEFAULT 0,
    deleted_at  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_vocab_groups_id_deck UNIQUE (id, deck_id)
);
CREATE UNIQUE INDEX uq_vocab_groups_order ON vocab_groups(deck_id, sort_order) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- vocab_cards
-- CHỨC NĂNG: một thẻ từ vựng trong một bài. Giữ nội dung riêng (nghĩa, giải thích, ví dụ, ảnh)
-- để deck tùy biến được; meaning_id chỉ là liên kết tùy chọn tới nghĩa gốc trong từ điển.
-- Deck của thẻ suy ra qua group_id (không lưu deck_id để tránh dư thừa).
-- -----------------------------------------------------------------------------
CREATE TABLE vocab_cards (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id       uuid NOT NULL REFERENCES vocab_groups(id) ON DELETE CASCADE,
    word           text NOT NULL,
    pos            text,
    translation_vi text,
    explanation_en text,
    explanation_vi text,
    example_en     text,
    example_vi     text,
    image_url      text,
    difficulty     cefr_code,
    sort_order     integer NOT NULL DEFAULT 0,
    deleted_at     timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_vocab_cards_order ON vocab_cards(group_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX ix_vocab_cards_word    ON vocab_cards(lower(word));

-- -----------------------------------------------------------------------------
-- vocab_card_phonetics
-- CHỨC NĂNG: phát âm riêng của thẻ theo giọng Anh/Mỹ (thẻ tự tạo hoặc audio riêng),
-- không tham chiếu bảng từ điển.
-- -----------------------------------------------------------------------------
CREATE TABLE vocab_card_phonetics (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id    uuid NOT NULL REFERENCES vocab_cards(id) ON DELETE CASCADE,
    accent     text NOT NULL CHECK (accent IN ('uk','us')),
    ipa        text,
    audio_url  text,
    CONSTRAINT uq_vocab_card_phonetics UNIQUE (card_id, accent),
    CONSTRAINT chk_vocab_card_phonetics_source
        CHECK (ipa IS NOT NULL OR audio_url IS NOT NULL)
);

-- =============================================================================
-- 4. HỌC TỪ VỰNG: tiến độ SRS (SM-2), phiên học, nhật ký trả lời
-- =============================================================================

-- -----------------------------------------------------------------------------
-- user_card_progress
-- CHỨC NĂNG: trạng thái học của MỘT người dùng trên MỘT thẻ, gồm dữ liệu lặp lại ngắt quãng (SM-2).
-- Số lần ôn = correct_count + incorrect_count (không lưu riêng). Deck của thẻ suy ra qua thẻ->bài.
-- -----------------------------------------------------------------------------
CREATE TABLE user_card_progress (
    user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id          uuid NOT NULL REFERENCES vocab_cards(id) ON DELETE CASCADE,
    status           text NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new','learning','reviewing','mastered')),
    correct_count    integer NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    incorrect_count  integer NOT NULL DEFAULT 0 CHECK (incorrect_count >= 0),
    easiness_factor  numeric(4,2) NOT NULL DEFAULT 2.50 CHECK (easiness_factor >= 1.30),
    interval_days    integer NOT NULL DEFAULT 0 CHECK (interval_days >= 0),
    repetitions      integer NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
    next_review_at   timestamptz,
    last_reviewed_at timestamptz,
    notes            text,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, card_id)
);
CREATE INDEX ix_ucp_due ON user_card_progress(user_id, next_review_at) WHERE status <> 'mastered';
CREATE INDEX ix_ucp_card ON user_card_progress(card_id);

-- -----------------------------------------------------------------------------
-- vocab_study_sessions
-- CHỨC NĂNG: một phiên học từ vựng (bắt đầu, hoạt động cuối, kết thúc) để tiếp tục phiên dở dang
-- và xem lịch sử. Các số đếm (số thẻ đã học/ôn) tính từ vocab_review_logs, không lưu ở đây.
-- -----------------------------------------------------------------------------
CREATE TABLE vocab_study_sessions (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id          uuid NOT NULL REFERENCES vocab_decks(id) ON DELETE CASCADE,
    group_id         uuid,
    session_type     text NOT NULL DEFAULT 'learn' CHECK (session_type IN ('learn','review')),
    started_at       timestamptz NOT NULL DEFAULT now(),
    last_activity_at timestamptz NOT NULL DEFAULT now(),
    ended_at         timestamptz,
    CONSTRAINT fk_vss_group_deck
        FOREIGN KEY (group_id, deck_id) REFERENCES vocab_groups(id, deck_id) ON DELETE SET NULL (group_id)
);
CREATE INDEX ix_vss_user ON vocab_study_sessions(user_id, last_activity_at DESC);
CREATE UNIQUE INDEX uq_vss_open_session ON vocab_study_sessions(user_id) WHERE ended_at IS NULL;

-- -----------------------------------------------------------------------------
-- vocab_review_logs
-- CHỨC NĂNG: nhật ký MỖI lần người dùng trả lời một thẻ (bảng sự kiện, chỉ thêm). Nguồn cho thống kê
-- độ chính xác và hồ sơ điểm yếu từ vựng.
-- -----------------------------------------------------------------------------
CREATE TABLE vocab_review_logs (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id      uuid NOT NULL REFERENCES vocab_cards(id) ON DELETE CASCADE,
    session_id   uuid REFERENCES vocab_study_sessions(id) ON DELETE SET NULL,
    mode         text NOT NULL CHECK (mode IN ('guess','flashcard','quiz','reverse_quiz','repeat')),
    is_correct   boolean NOT NULL,
    quality      smallint CHECK (quality BETWEEN 0 AND 5),
    response_ms  integer CHECK (response_ms >= 0),
    reviewed_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_vrl_user_time ON vocab_review_logs(user_id, reviewed_at DESC);
CREATE INDEX ix_vrl_card      ON vocab_review_logs(card_id);

-- =============================================================================
-- 5. TOPIC -> BÀI HỌC -> CÂU  (nội dung cho Dictation & Shadowing)
--    Số bài trong topic KHÔNG lưu: xem view v_topic_lesson_counts.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- topics
-- CHỨC NĂNG: chủ đề gom các bài học (vd "Daily English Conversation", "Movie short clip").
-- -----------------------------------------------------------------------------
CREATE TABLE topics (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug          text UNIQUE NOT NULL,
    name          text NOT NULL,
    name_vi       text,
    tag           text,
    content_type  text NOT NULL DEFAULT '' CHECK (content_type IN ('','audio','shadowing')),
    status        text NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('DRAFT','PENDING','APPROVED','REJECTED')),
    created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
    sort_order    integer NOT NULL DEFAULT 0,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_topics_list ON topics(status, sort_order);
CREATE INDEX ix_topics_tag  ON topics(tag);

-- -----------------------------------------------------------------------------
-- lessons
-- CHỨC NĂNG: một bài học (video YouTube/audio) được cắt thành câu để luyện dictation và shadowing.
-- -----------------------------------------------------------------------------
CREATE TABLE lessons (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id       uuid NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
    slug           text UNIQUE NOT NULL,
    title          text NOT NULL,
    title_vi       text,
    description    text,
    duration_sec   integer CHECK (duration_sec >= 0),
    difficulty     cefr_code,
    source_type    text NOT NULL DEFAULT 'youtube' CHECK (source_type IN ('youtube','audio','video')),
    source_url     text,
    thumbnail_url  text,
    is_pro         boolean NOT NULL DEFAULT false,
    status         text NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('DRAFT','PENDING','APPROVED','REJECTED')),
    created_by     uuid REFERENCES users(id) ON DELETE SET NULL,
    sort_order     integer NOT NULL DEFAULT 0,
    view_count     integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
    deleted_at     timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_lessons_topic  ON lessons(topic_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX ix_lessons_filter ON lessons(status, difficulty, is_pro) WHERE deleted_at IS NULL;
CREATE INDEX ix_lessons_title_trgm ON lessons USING gin (title gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- sentences
-- CHỨC NĂNG: từng câu thoại của bài học, kèm mốc thời gian trong video. Đơn vị luyện của cả
-- dictation (nghe rồi gõ) lẫn shadowing (nghe rồi đọc theo).
-- -----------------------------------------------------------------------------
CREATE TABLE sentences (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id   uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    sort_order  integer NOT NULL,
    text        text NOT NULL,
    text_vi     text,
    ipa         text,
    start_ms    integer NOT NULL CHECK (start_ms >= 0),
    end_ms      integer NOT NULL,
    cefr_level  cefr_code,
    cefr_source text NOT NULL DEFAULT 'editor_guess'
                CHECK (cefr_source IN ('editor_guess','ai_suggested','instructor_reviewed')),
    cefr_suggested_by_ai cefr_code,
    ai_model    text,
    ai_confidence numeric(4,3) CHECK (ai_confidence BETWEEN 0 AND 1),
    reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_sentences_time CHECK (end_ms > start_ms),
    CONSTRAINT uq_sentences_order UNIQUE (lesson_id, sort_order),
    CONSTRAINT chk_sentence_cefr_review CHECK (
        (cefr_source = 'instructor_reviewed') = (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE INDEX ix_sentences_cefr_pending ON sentences(cefr_source) WHERE cefr_source = 'ai_suggested';

ALTER TABLE user_saved_words
    ADD CONSTRAINT fk_saved_words_sentence FOREIGN KEY (sentence_id) REFERENCES sentences(id) ON DELETE SET NULL;

-- =============================================================================
-- 6. THAM CHIẾU NGỮ ÂM & PHÂN LOẠI LỖI (dữ liệu tĩnh do biên tập, ít thay đổi)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- phonemes
-- CHỨC NĂNG: danh mục âm vị IPA của tiếng Anh (~44 âm) kèm nội dung hướng dẫn phát âm
-- (mô tả, video khẩu hình). Là nền để chấm và gợi ý ở mức âm vị.
-- -----------------------------------------------------------------------------
CREATE TABLE phonemes (
    id              smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    symbol          text NOT NULL UNIQUE,
    kind            text NOT NULL CHECK (kind IN ('vowel','diphthong','consonant')),
    example_word    text,
    description_vi  text,
    mouth_video_url text,
    is_pro_content  boolean NOT NULL DEFAULT true
);

-- -----------------------------------------------------------------------------
-- error_categories
-- CHỨC NĂNG: nhãn nhóm lỗi hiển thị cho người dùng và làm mục tiêu luyện tập ("Rụng phụ âm cuối",
-- "Bỏ sót từ chức năng"). Với lỗi dictation, (word_class, outcome) xác định nhóm để đếm
-- lỗi và số "cơ hội" trực tiếp từ sentence_attempt_words mà không cần cột phân loại lưu sẵn.
-- -----------------------------------------------------------------------------
CREATE TABLE error_categories (
    id              smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code            text NOT NULL UNIQUE,
    skill           skill_code NOT NULL,
    parent_id       smallint REFERENCES error_categories(id) ON DELETE SET NULL,
    name_vi         text NOT NULL,
    description_vi  text,
    word_class      text CHECK (word_class IN ('function','content','inflected','number','proper','other')),
    outcome         text CHECK (outcome IN ('omitted','substituted','misspelled')),
    is_active       boolean NOT NULL DEFAULT true,
    CONSTRAINT chk_error_category_pair CHECK ((word_class IS NULL) = (outcome IS NULL)),
    CONSTRAINT chk_error_category_dictation CHECK (word_class IS NULL OR skill = 'dictation'),
    CONSTRAINT uq_error_category_class_outcome UNIQUE (word_class, outcome)
);

-- -----------------------------------------------------------------------------
-- phoneme_confusions
-- CHỨC NĂNG: bảng tri thức "nhầm âm" theo tiếng mẹ đẻ: âm cần đọc -> âm người học hay đọc thành,
-- kèm mẹo sửa. Gợi ý tĩnh này miễn phí; AI chỉ cá nhân hóa thêm cho PRO.
-- -----------------------------------------------------------------------------
CREATE TABLE phoneme_confusions (
    id                  integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    l1                  text NOT NULL DEFAULT 'vi',
    target_phoneme_id   smallint NOT NULL REFERENCES phonemes(id) ON DELETE CASCADE,
    produced_phoneme_id smallint REFERENCES phonemes(id) ON DELETE CASCADE,
    category_id         smallint NOT NULL REFERENCES error_categories(id) ON DELETE RESTRICT,
    tip_vi              text NOT NULL,
    CONSTRAINT chk_confusion_distinct CHECK (produced_phoneme_id IS DISTINCT FROM target_phoneme_id),
    CONSTRAINT uq_phoneme_confusions UNIQUE NULLS NOT DISTINCT (l1, target_phoneme_id, produced_phoneme_id)
);
CREATE INDEX ix_phoneme_confusions_category ON phoneme_confusions(category_id);

-- -----------------------------------------------------------------------------
-- minimal_pairs
-- CHỨC NĂNG: cặp từ chỉ khác nhau một âm (ship/sheep) để luyện phân biệt âm.
-- -----------------------------------------------------------------------------
CREATE TABLE minimal_pairs (
    id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    phoneme_a_id smallint NOT NULL REFERENCES phonemes(id) ON DELETE CASCADE,
    phoneme_b_id smallint NOT NULL REFERENCES phonemes(id) ON DELETE CASCADE,
    word_a_id    uuid NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
    word_b_id    uuid NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
    position     text CHECK (position IN ('initial','medial','final')),
    CONSTRAINT chk_pair_phonemes CHECK (phoneme_a_id < phoneme_b_id),
    CONSTRAINT chk_pair_words    CHECK (word_a_id <> word_b_id),
    CONSTRAINT uq_minimal_pairs  UNIQUE (word_a_id, word_b_id)
);
CREATE INDEX ix_minimal_pairs_phonemes ON minimal_pairs(phoneme_a_id, phoneme_b_id);

-- =============================================================================
-- 7. DICTATION & SHADOWING: tiến độ, lượt làm bài, kết quả từng từ/âm vị
--    Mọi điểm trung bình/tổng hợp tính bằng view từ sentence_attempts (không lưu trùng).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- user_lesson_progress
-- CHỨC NĂNG: người dùng đã bắt đầu/hoàn thành một bài học (mức bài). Mức từng chế độ ở bảng dưới.
-- Trạng thái = suy ra từ completed_at (NULL = đang học).
-- -----------------------------------------------------------------------------
CREATE TABLE user_lesson_progress (
    user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id         uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    started_at        timestamptz NOT NULL DEFAULT now(),
    last_activity_at  timestamptz NOT NULL DEFAULT now(),
    completed_at      timestamptz,
    PRIMARY KEY (user_id, lesson_id),
    CONSTRAINT chk_ulp_order CHECK (completed_at IS NULL OR completed_at >= started_at)
);
CREATE INDEX ix_ulp_user_activity ON user_lesson_progress(user_id, last_activity_at DESC);

-- -----------------------------------------------------------------------------
-- user_lesson_mode_progress
-- CHỨC NĂNG: tiến độ của người dùng trên một bài theo từng chế độ (dictation / shadowing).
-- Khác độ mịn với bảng trên (bài × chế độ) nên tách bảng để không lặp dữ liệu cấp bài.
-- Điểm trung bình tính ở view v_user_lesson_mode_scores.
-- -----------------------------------------------------------------------------
CREATE TABLE user_lesson_mode_progress (
    user_id         uuid NOT NULL,
    lesson_id       uuid NOT NULL,
    mode            practice_mode NOT NULL,
    started_at      timestamptz NOT NULL DEFAULT now(),
    completed_at    timestamptz,
    total_time_sec  integer NOT NULL DEFAULT 0 CHECK (total_time_sec >= 0),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, lesson_id, mode),
    FOREIGN KEY (user_id, lesson_id) REFERENCES user_lesson_progress(user_id, lesson_id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- sentence_attempts
-- CHỨC NĂNG: mỗi LẦN nộp bài cho một câu (dictation: gõ lại; shadowing: ghi âm và chấm bởi Azure).
-- Bảng sự kiện lớn nhất. Bài học của lượt = suy ra qua sentence_id -> sentences.lesson_id.
-- -----------------------------------------------------------------------------
CREATE TABLE sentence_attempts (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sentence_id       uuid NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
    mode              practice_mode NOT NULL,
    submitted_text    text,
    audio_url         text,
    audio_expires_at  timestamptz,
    is_baseline       boolean NOT NULL DEFAULT false,
    provider          text,
    score             numeric(5,2) CHECK (score BETWEEN 0 AND 100),
    accuracy_score    numeric(5,2) CHECK (accuracy_score BETWEEN 0 AND 100),
    fluency_score     numeric(5,2) CHECK (fluency_score BETWEEN 0 AND 100),
    completeness_score numeric(5,2) CHECK (completeness_score BETWEEN 0 AND 100),
    prosody_score     numeric(5,2) CHECK (prosody_score BETWEEN 0 AND 100),
    duration_ms       integer CHECK (duration_ms >= 0),
    replay_count      integer NOT NULL DEFAULT 0 CHECK (replay_count >= 0),
    attempted_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_attempt_dictation_fields CHECK (mode = 'shadowing' OR (audio_url IS NULL AND provider IS NULL AND
                accuracy_score IS NULL AND fluency_score IS NULL AND completeness_score IS NULL AND prosody_score IS NULL)),
    CONSTRAINT chk_attempt_shadowing_fields CHECK (mode = 'dictation' OR submitted_text IS NULL),
    CONSTRAINT chk_attempt_baseline CHECK (NOT is_baseline OR audio_url IS NOT NULL)
);
CREATE INDEX ix_sa_user_time     ON sentence_attempts(user_id, attempted_at DESC);
CREATE INDEX ix_sa_user_sentence ON sentence_attempts(user_id, sentence_id, mode);
CREATE INDEX ix_sa_sentence      ON sentence_attempts(sentence_id);
CREATE INDEX ix_sa_audio_expiry  ON sentence_attempts(audio_expires_at) WHERE audio_url IS NOT NULL;

-- -----------------------------------------------------------------------------
-- sentence_attempt_words
-- CHỨC NĂNG: kết quả TỪNG TỪ của một lượt làm bài, dùng chung cho cả hai chế độ:
--   dictation = kết quả căn chỉnh câu gõ với đáp án; shadowing = lỗi phát âm ở mức từ (Azure).
-- Đây là dữ liệu gốc để thống kê lỗi (không cần bảng "sự kiện lỗi" riêng).
-- -----------------------------------------------------------------------------
CREATE TABLE sentence_attempt_words (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    attempt_id          bigint NOT NULL REFERENCES sentence_attempts(id) ON DELETE CASCADE,
    position            smallint NOT NULL,
    expected_word       text,
    actual_word         text,
    outcome             text NOT NULL CHECK (outcome IN
        ('correct','omitted','inserted','substituted','misspelled','mispronounced')),
    expected_word_class text CHECK (expected_word_class IN ('function','content','inflected','number','proper','other')),
    accuracy_score      numeric(5,2) CHECK (accuracy_score BETWEEN 0 AND 100),
    CONSTRAINT uq_attempt_words_pos UNIQUE (attempt_id, position),
    CONSTRAINT chk_word_expected CHECK ((outcome = 'inserted') = (expected_word IS NULL)),
    CONSTRAINT chk_word_actual   CHECK ((outcome <> 'omitted' OR actual_word IS NULL)
                                    AND (actual_word IS NOT NULL OR outcome IN ('omitted','mispronounced')))
);
CREATE INDEX ix_saw_class_outcome ON sentence_attempt_words(expected_word_class, outcome);

-- -----------------------------------------------------------------------------
-- sentence_attempt_phonemes
-- CHỨC NĂNG: kết quả TỪNG ÂM VỊ trong một từ của lượt shadowing (điểm + âm bị nhầm nếu có).
-- Nguồn cho thống kê "yếu âm nào". Ánh xạ sang mẹo sửa bằng phoneme_confusions
-- qua (phoneme_id, produced_phoneme_id) nên không lưu khóa mẹo ở đây.
-- -----------------------------------------------------------------------------
CREATE TABLE sentence_attempt_phonemes (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    attempt_word_id     bigint NOT NULL REFERENCES sentence_attempt_words(id) ON DELETE CASCADE,
    position            smallint NOT NULL,
    phoneme_id          smallint NOT NULL REFERENCES phonemes(id) ON DELETE RESTRICT,
    accuracy_score      numeric(5,2) NOT NULL CHECK (accuracy_score BETWEEN 0 AND 100),
    produced_phoneme_id smallint REFERENCES phonemes(id) ON DELETE RESTRICT,
    produced_score      numeric(5,2) CHECK (produced_score BETWEEN 0 AND 100),
    CONSTRAINT uq_attempt_phonemes_pos UNIQUE (attempt_word_id, position),
    CONSTRAINT chk_phoneme_produced CHECK (produced_phoneme_id IS DISTINCT FROM phoneme_id)
);
CREATE INDEX ix_sap_phoneme ON sentence_attempt_phonemes(phoneme_id, produced_phoneme_id);

-- -----------------------------------------------------------------------------
-- ai_feedback
-- CHỨC NĂNG: lời gợi ý cải thiện do AI sinh cho MỘT lượt shadowing (tính năng PRO), kèm thông tin
-- phiên bản để kiểm soát chất lượng và chi phí. Mẹo dùng chung nằm ở phoneme_confusions.
-- -----------------------------------------------------------------------------
CREATE TABLE ai_feedback (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    attempt_id      bigint NOT NULL REFERENCES sentence_attempts(id) ON DELETE CASCADE,
    content         text NOT NULL,
    model           text NOT NULL,
    prompt_version  text NOT NULL,
    input_tokens    integer CHECK (input_tokens >= 0),
    output_tokens   integer CHECK (output_tokens >= 0),
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_ai_feedback_attempt ON ai_feedback(attempt_id);

-- -----------------------------------------------------------------------------
-- user_sentence_review
-- CHỨC NĂNG: hàng đợi ÔN LẠI các câu người dùng làm kém. Chỉ lưu TRẠNG THÁI hàng đợi;
-- điểm tốt nhất/gần nhất/đã hoàn thành tính từ view v_user_sentence_stats.
-- -----------------------------------------------------------------------------
CREATE TABLE user_sentence_review (
    user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sentence_id      uuid NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
    mode             practice_mode NOT NULL,
    status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved')),
    reason           text NOT NULL CHECK (reason IN ('low_score','many_mistakes','replayed_often','manual')),
    priority         integer NOT NULL DEFAULT 0,
    created_at       timestamptz NOT NULL DEFAULT now(),
    last_reviewed_at timestamptz,
    PRIMARY KEY (user_id, sentence_id, mode)
);
CREATE INDEX ix_usr_queue ON user_sentence_review(user_id, priority DESC) WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- sentence_notes
-- CHỨC NĂNG: ghi chú cá nhân của người dùng trên một câu (Ghi chú của tôi).
-- -----------------------------------------------------------------------------
CREATE TABLE sentence_notes (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sentence_id  uuid NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
    content      text NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_sentence_notes_user ON sentence_notes(user_id, sentence_id);

-- =============================================================================
-- 8. KIỂM TRA ĐẦU VÀO (ước tính trình độ theo thang CEFR)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- assessment_items
-- CHỨC NĂNG: ngân hàng câu hỏi của bài kiểm tra. Có 3 loại; kỹ năng suy ra từ loại câu hỏi.
--   vocab_yes_no: hỏi "bạn có biết từ này không" (gồm cả từ giả để phát hiện đoán mò);
--   dictation_sentence / shadowing_sentence: dùng lại câu trong bảng sentences.
-- -----------------------------------------------------------------------------
CREATE TABLE assessment_items (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type    text NOT NULL CHECK (item_type IN ('vocab_yes_no','dictation_sentence','shadowing_sentence')),
    cefr_level   cefr_code NOT NULL,
    difficulty   numeric(6,3),
    word_id      uuid REFERENCES dictionary_words(id) ON DELETE CASCADE,
    pseudo_word  text,
    sentence_id  uuid REFERENCES sentences(id) ON DELETE CASCADE,
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_item_shape CHECK (
        (item_type = 'vocab_yes_no' AND sentence_id IS NULL AND num_nonnulls(word_id, pseudo_word) = 1)
        OR (item_type IN ('dictation_sentence','shadowing_sentence')
            AND sentence_id IS NOT NULL AND word_id IS NULL AND pseudo_word IS NULL))
);
CREATE INDEX ix_assessment_items_pick ON assessment_items(item_type, cefr_level) WHERE is_active;

-- -----------------------------------------------------------------------------
-- assessment_sessions
-- CHỨC NĂNG: một lần làm bài kiểm tra (đầu vào hoặc đo lại định kỳ) của người dùng.
-- -----------------------------------------------------------------------------
CREATE TABLE assessment_sessions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind          text NOT NULL CHECK (kind IN ('initial','retest')),
    status        text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned')),
    started_at    timestamptz NOT NULL DEFAULT now(),
    completed_at  timestamptz,
    CONSTRAINT chk_assessment_completed CHECK ((status = 'completed') = (completed_at IS NOT NULL))
);
CREATE INDEX ix_assessment_sessions_user ON assessment_sessions(user_id, started_at DESC);

-- -----------------------------------------------------------------------------
-- assessment_responses
-- CHỨC NĂNG: câu trả lời của người dùng cho từng câu hỏi trong một lần làm bài.
-- Câu vocab_yes_no lưu đáp án Có/Không; câu dictation/shadowing trỏ tới lượt làm bài
-- trong sentence_attempts (dùng lại kết quả chấm, không sao chép điểm).
-- -----------------------------------------------------------------------------
CREATE TABLE assessment_responses (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id        uuid NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    item_id           uuid NOT NULL REFERENCES assessment_items(id) ON DELETE RESTRICT,
    presented_order   smallint NOT NULL,
    answered_yes      boolean,
    attempt_id        bigint REFERENCES sentence_attempts(id) ON DELETE SET NULL,
    response_time_ms  integer CHECK (response_time_ms >= 0),
    answered_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_assessment_response UNIQUE (session_id, item_id),
    CONSTRAINT uq_assessment_order    UNIQUE (session_id, presented_order)
);
CREATE INDEX ix_assessment_responses_item ON assessment_responses(item_id);

-- -----------------------------------------------------------------------------
-- assessment_results
-- CHỨC NĂNG: kết quả của một lần làm bài THEO TỪNG KỸ NĂNG (3 dòng/lần) – một bảng con thay vì
-- nhóm cột lặp. Điểm nội bộ là thước đo chính; nhãn CEFR chỉ là ước tính hiển thị.
-- -----------------------------------------------------------------------------
CREATE TABLE assessment_results (
    session_id         uuid NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    skill              skill_code NOT NULL,
    score              numeric(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    cefr_level         cefr_code,
    ci_low             numeric(5,2),
    ci_high            numeric(5,2),
    items_answered     smallint NOT NULL CHECK (items_answered > 0),
    algorithm_version  text NOT NULL,
    PRIMARY KEY (session_id, skill),
    CONSTRAINT chk_result_ci CHECK (ci_low IS NULL OR ci_high IS NULL OR ci_low <= ci_high)
);

-- =============================================================================
-- 9. HỒ SƠ ĐIỂM YẾU & KẾ HOẠCH LUYỆN TẬP
--    Tỉ lệ lỗi/điểm yếu KHÔNG lưu: tính bằng view v_user_phoneme_stats, v_user_dictation_stats,
--    v_user_vocab_stats từ dữ liệu gốc (tránh lưu trùng dữ liệu tính ra).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- practice_recommendations
-- CHỨC NĂNG: bài luyện được ĐỀ XUẤT cho người dùng để sửa một điểm yếu (cặp âm nhầm hoặc nhóm lỗi
-- dictation), kèm trạng thái và kết quả. Có vòng đời riêng nên là bảng riêng: cho phép đo
-- gợi ý có hiệu quả không.
-- -----------------------------------------------------------------------------
CREATE TABLE practice_recommendations (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    confusion_id      integer REFERENCES phoneme_confusions(id) ON DELETE SET NULL,
    error_category_id smallint REFERENCES error_categories(id) ON DELETE SET NULL,
    kind              text NOT NULL CHECK (kind IN ('minimal_pair','sentence','vocab_card')),
    minimal_pair_id   integer REFERENCES minimal_pairs(id) ON DELETE CASCADE,
    sentence_id       uuid REFERENCES sentences(id) ON DELETE CASCADE,
    card_id           uuid REFERENCES vocab_cards(id) ON DELETE CASCADE,
    status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','skipped','expired')),
    due_at            timestamptz NOT NULL DEFAULT now(),
    done_at           timestamptz,
    outcome_score     numeric(5,2) CHECK (outcome_score BETWEEN 0 AND 100),
    created_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_rec_ref CHECK (
        (kind = 'minimal_pair' AND minimal_pair_id IS NOT NULL AND sentence_id IS NULL AND card_id IS NULL) OR
        (kind = 'sentence'     AND sentence_id     IS NOT NULL AND minimal_pair_id IS NULL AND card_id IS NULL) OR
        (kind = 'vocab_card'   AND card_id         IS NOT NULL AND minimal_pair_id IS NULL AND sentence_id IS NULL)),
    CONSTRAINT chk_rec_target CHECK (kind = 'vocab_card' OR num_nonnulls(confusion_id, error_category_id) >= 1),
    CONSTRAINT chk_rec_done CHECK ((status = 'done') = (done_at IS NOT NULL))
);
CREATE INDEX ix_rec_user_pending ON practice_recommendations(user_id, due_at) WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- daily_plans
-- CHỨC NĂNG: kế hoạch luyện của MỘT ngày cho một người dùng. Phải lưu để kế hoạch ổn định trong
-- ngày (không đổi mỗi lần mở app) và đo được mức tuân thủ. "Hoàn thành" suy ra từ các mục con.
-- -----------------------------------------------------------------------------
CREATE TABLE daily_plans (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_date        date NOT NULL,
    time_budget_min  smallint NOT NULL CHECK (time_budget_min > 0),
    generated_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_daily_plans UNIQUE (user_id, plan_date)
);

-- -----------------------------------------------------------------------------
-- daily_plan_items
-- CHỨC NĂNG: từng việc trong kế hoạch ngày, kèm lý do hiển thị để người dùng hiểu vì sao được giao.
-- -----------------------------------------------------------------------------
CREATE TABLE daily_plan_items (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plan_id            uuid NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
    position           smallint NOT NULL,
    kind               text NOT NULL CHECK (kind IN ('srs_review','weakness_drill','lesson_task','retest')),
    card_count         smallint CHECK (card_count > 0),
    recommendation_id  bigint REFERENCES practice_recommendations(id) ON DELETE SET NULL,
    lesson_id          uuid REFERENCES lessons(id) ON DELETE CASCADE,
    mode               practice_mode,
    est_minutes        smallint NOT NULL CHECK (est_minutes > 0),
    reason_text        text NOT NULL,
    completed_at       timestamptz,
    CONSTRAINT uq_plan_item_pos UNIQUE (plan_id, position),
    CONSTRAINT chk_plan_item_shape CHECK (
        (kind = 'srs_review'     AND card_count IS NOT NULL AND recommendation_id IS NULL AND lesson_id IS NULL AND mode IS NULL) OR
        (kind = 'weakness_drill' AND recommendation_id IS NOT NULL AND card_count IS NULL AND lesson_id IS NULL AND mode IS NULL) OR
        (kind = 'lesson_task'    AND lesson_id IS NOT NULL AND mode IS NOT NULL AND card_count IS NULL AND recommendation_id IS NULL) OR
        (kind = 'retest'         AND card_count IS NULL AND recommendation_id IS NULL AND lesson_id IS NULL AND mode IS NULL))
);

-- =============================================================================
-- 10. GÓI FREE/PRO VÀ GIỚI HẠN SỬ DỤNG
-- =============================================================================

-- -----------------------------------------------------------------------------
-- plan_limits
-- CHỨC NĂNG: cấu hình quyền lợi theo gói và tính năng (luật kinh doanh là dữ liệu, đổi không cần
-- triển khai lại). limit_value: NULL = không giới hạn; 0 = tắt hẳn.
-- -----------------------------------------------------------------------------
CREATE TABLE plan_limits (
    plan         text NOT NULL CHECK (plan IN ('free','pro')),
    feature      feature_code NOT NULL,
    period       text NOT NULL CHECK (period IN ('day','month','none')),
    limit_value  integer CHECK (limit_value >= 0),
    PRIMARY KEY (plan, feature)
);

-- -----------------------------------------------------------------------------
-- usage_counters
-- CHỨC NĂNG: bộ đếm số lượt đã dùng của từng người dùng theo tính năng và chu kỳ. Bảng riêng vì cần
-- tăng nguyên tử có điều kiện (chống vượt hạn mức khi nhiều yêu cầu đồng thời); đếm lại từ
-- log trên đường nóng vừa chậm vừa dễ sai.
-- -----------------------------------------------------------------------------
CREATE TABLE usage_counters (
    user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature       feature_code NOT NULL,
    period_start  date NOT NULL,
    used          integer NOT NULL DEFAULT 0 CHECK (used >= 0),
    PRIMARY KEY (user_id, feature, period_start)
);


-- =============================================================================
-- 11. VAI TRÒ & NHẬT KÝ NỘI DUNG
--    Giảng viên (role='instructor') tự đăng nội dung, KHÔNG qua PENDING chờ admin duyệt
--    (admin không có chuyên môn ngôn ngữ để đánh giá đúng/sai nội dung). Thay chặn-trước
--    bằng giám sát-sau: ghi log bất biến mọi thao tác tạo/sửa/xóa/đăng nội dung, cộng với
--    content_error_reports để người dùng báo lỗi, admin chỉ duyệt/xử lý khi có báo cáo.
--    Admin vẫn gác PENDING cho nội dung do học viên tạo (rủi ro spam/lạm dụng, không phải
--    rủi ro chuyên môn).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- content_audit_log
-- CHỨC NĂNG: nhật ký bất biến (chỉ thêm) mọi thao tác tạo/sửa/xóa/đăng trên nội dung do
-- giảng viên/học viên tạo (topics, lessons, vocab_decks, vocab_cards...). Thay cho việc admin
-- duyệt trước: cho phép truy vết ai làm gì, lúc nào, để xử lý khi có báo lỗi hoặc phát hiện
-- bất thường. entity_id không đặt FK cứng vì trỏ tới nhiều bảng khác nhau và bản ghi gốc có
-- thể đã bị xóa hẳn (không muốn mất lịch sử theo CASCADE).
-- -----------------------------------------------------------------------------
CREATE TABLE content_audit_log (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id    uuid REFERENCES users(id) ON DELETE SET NULL,
    actor_role  text NOT NULL CHECK (actor_role IN ('student','instructor','admin')),
    action      text NOT NULL CHECK (action IN ('create','update','delete','publish','unpublish')),
    entity_type text NOT NULL,
    entity_id   uuid NOT NULL,
    diff        jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_content_audit_entity ON content_audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX ix_content_audit_actor  ON content_audit_log(actor_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- content_error_reports
-- CHỨC NĂNG: người dùng báo lỗi nội dung (topic, lesson, sentence, vocab_deck, vocab_card,
-- dictionary_word...) để admin hậu kiểm. entity_id không đặt FK cứng như content_audit_log
-- (trỏ nhiều bảng khác nhau, không mất báo cáo nếu nội dung gốc bị xóa). Khi admin sửa nội
-- dung để xử lý báo cáo, thao tác đó được ghi lại ở content_audit_log; audit_log_id chỉ nối
-- sang bản ghi log tương ứng, không bắt buộc (có báo cáo không cần sửa gì, vd báo sai nhưng
-- kiểm tra lại thấy đúng).
-- -----------------------------------------------------------------------------
CREATE TABLE content_error_reports (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reporter_id   uuid REFERENCES users(id) ON DELETE SET NULL,
    entity_type   text NOT NULL,
    entity_id     uuid NOT NULL,
    reason        text NOT NULL CHECK (reason IN
        ('wrong_content','wrong_translation','wrong_cefr','audio_issue','offensive','spam','other')),
    description   text,
    status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','rejected')),
    reviewed_by   uuid REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at   timestamptz,
    resolution_note text,
    audit_log_id  bigint REFERENCES content_audit_log(id) ON DELETE SET NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_report_reviewed CHECK ((status IN ('resolved','rejected')) = (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE INDEX ix_content_error_reports_entity ON content_error_reports(entity_type, entity_id);
CREATE INDEX ix_content_error_reports_queue  ON content_error_reports(status, created_at) WHERE status IN ('pending','reviewing');


-- =============================================================================
-- 12. VIEW: dữ liệu TÍNH RA
-- =============================================================================

CREATE VIEW v_user_plan AS
SELECT u.id AS user_id,
       CASE WHEN s.user_id IS NULL THEN 'free' ELSE 'pro' END AS plan
FROM users u
LEFT JOIN (SELECT DISTINCT user_id
           FROM user_subscriptions
           WHERE status IN ('active','cancelled') AND (expires_at IS NULL OR expires_at > now())) s
       ON s.user_id = u.id;

CREATE VIEW v_user_saved_word_meanings AS
SELECT s.id AS saved_id, s.user_id, s.created_at, s.sentence_id,
       w.id AS word_id, w.headword, w.cefr_level,
       m.id AS meaning_id, m.meaning_no, m.pos,
       m.translation_vi, m.definition_en, m.definition_vi, m.example_en, m.example_vi
FROM user_saved_words s
JOIN dictionary_words w    ON w.id = s.word_id
JOIN dictionary_meanings m ON m.word_id = s.word_id
                          AND (s.meaning_id IS NULL OR m.id = s.meaning_id);

CREATE VIEW v_vocab_deck_counts AS
SELECT d.id AS deck_id,
       count(DISTINCT g.id) FILTER (WHERE g.deleted_at IS NULL)                         AS total_groups,
       count(c.id)          FILTER (WHERE g.deleted_at IS NULL AND c.deleted_at IS NULL) AS total_cards
FROM vocab_decks d
LEFT JOIN vocab_groups g ON g.deck_id = d.id
LEFT JOIN vocab_cards  c ON c.group_id = g.id
GROUP BY d.id;

CREATE VIEW v_topic_lesson_counts AS
SELECT t.id AS topic_id,
       count(l.id) FILTER (WHERE l.deleted_at IS NULL) AS total_lessons
FROM topics t
LEFT JOIN lessons l ON l.topic_id = t.id
GROUP BY t.id;

CREATE VIEW v_user_group_progress AS
SELECT ucp.user_id, c.group_id,
       count(*)                                                    AS cards_started,
       count(*) FILTER (WHERE ucp.status = 'mastered')             AS cards_mastered,
       count(*) FILTER (WHERE ucp.next_review_at <= now()
                          AND ucp.status <> 'mastered')            AS cards_due
FROM user_card_progress ucp
JOIN vocab_cards c ON c.id = ucp.card_id AND c.deleted_at IS NULL
GROUP BY ucp.user_id, c.group_id;

CREATE VIEW v_user_vocab_stats AS
SELECT user_id,
       count(*)                                                    AS total_cards,
       count(*) FILTER (WHERE status = 'new')                      AS new_cards,
       count(*) FILTER (WHERE status = 'learning')                 AS learning_cards,
       count(*) FILTER (WHERE status = 'reviewing')                AS reviewing_cards,
       count(*) FILTER (WHERE status = 'mastered')                 AS mastered_cards,
       count(*) FILTER (WHERE next_review_at <= now()
                          AND status <> 'mastered')                AS due_cards,
       sum(correct_count + incorrect_count)                        AS total_reviews,
       round(100.0 * sum(correct_count)
             / NULLIF(sum(correct_count + incorrect_count), 0), 2) AS accuracy
FROM user_card_progress
GROUP BY user_id;

CREATE VIEW v_user_sentence_stats AS
SELECT user_id, sentence_id, mode,
       count(*)                                                    AS attempt_count,
       max(score)                                                  AS best_score,
       (array_agg(score ORDER BY attempted_at DESC))[1]            AS last_score,
       max(attempted_at)                                           AS last_attempt_at
FROM sentence_attempts
GROUP BY user_id, sentence_id, mode;

CREATE VIEW v_user_lesson_mode_scores AS
SELECT st.user_id, s.lesson_id, st.mode,
       count(*)                 AS sentences_attempted,
       round(avg(st.best_score), 2) AS average_score
FROM v_user_sentence_stats st
JOIN sentences s ON s.id = st.sentence_id
GROUP BY st.user_id, s.lesson_id, st.mode;

CREATE VIEW v_user_phoneme_stats AS
SELECT a.user_id,
       (a.attempted_at AT TIME ZONE 'UTC')::date                AS day,
       p.phoneme_id,
       count(*)                                                 AS opportunities,
       count(*) FILTER (WHERE p.accuracy_score < 60)            AS errors
FROM sentence_attempt_phonemes p
JOIN sentence_attempt_words w ON w.id = p.attempt_word_id
JOIN sentence_attempts a      ON a.id = w.attempt_id
GROUP BY a.user_id, (a.attempted_at AT TIME ZONE 'UTC')::date, p.phoneme_id;

CREATE VIEW v_user_dictation_stats AS
SELECT a.user_id,
       (a.attempted_at AT TIME ZONE 'UTC')::date                AS day,
       w.expected_word_class                                    AS word_class,
       count(*)                                                 AS opportunities,
       count(*) FILTER (WHERE w.outcome <> 'correct')           AS errors,
       count(*) FILTER (WHERE w.outcome = 'omitted')            AS omitted,
       count(*) FILTER (WHERE w.outcome = 'substituted')        AS substituted,
       count(*) FILTER (WHERE w.outcome = 'misspelled')         AS misspelled
FROM sentence_attempt_words w
JOIN sentence_attempts a ON a.id = w.attempt_id
WHERE a.mode = 'dictation' AND w.expected_word_class IS NOT NULL
GROUP BY a.user_id, (a.attempted_at AT TIME ZONE 'UTC')::date, w.expected_word_class;

CREATE VIEW v_user_current_level AS
SELECT DISTINCT ON (s.user_id, r.skill)
       s.user_id, r.skill, r.score, r.cefr_level, r.ci_low, r.ci_high, s.completed_at
FROM assessment_results r
JOIN assessment_sessions s ON s.id = r.session_id
WHERE s.status = 'completed'
ORDER BY s.user_id, r.skill, s.completed_at DESC;


-- =============================================================================
-- 13. TRIGGER tự cập nhật updated_at cho mọi bảng có cột này
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
    FOR t IN
        SELECT c.table_name
        FROM information_schema.columns c
        JOIN information_schema.tables tb
          ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
        WHERE c.table_schema = current_schema()
          AND c.column_name = 'updated_at'
          AND tb.table_type = 'BASE TABLE'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$I
             FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
    END LOOP;
END $$;
