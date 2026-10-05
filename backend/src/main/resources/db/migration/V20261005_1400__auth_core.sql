ALTER TABLE users DROP CONSTRAINT users_username_key;
ALTER TABLE users RENAME COLUMN username TO display_name;
ALTER TABLE users ALTER COLUMN display_name TYPE text;  -- tên hiển thị không cần so sánh không phân biệt hoa thường
ALTER TABLE users
    ADD COLUMN onboarded_at      timestamptz,
    ADD COLUMN terms_accepted_at timestamptz;

CREATE TABLE auth_login_attempts (
    email        citext PRIMARY KEY,
    failed_count smallint    NOT NULL DEFAULT 0,
    locked_until timestamptz,
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_refresh_tokens (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    family_id  uuid        NOT NULL,          -- family_id để xác định các refresh token liên quan đến nhau (cùng một lần đăng nhập)
    token_hash text        NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_refresh_user ON auth_refresh_tokens (user_id) WHERE revoked_at IS NULL;
CREATE INDEX ix_refresh_family ON auth_refresh_tokens (family_id);

CREATE TABLE auth_email_tokens (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    purpose    text        NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
    token_hash text        NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    used_at    timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_email_tokens_user ON auth_email_tokens (user_id, purpose, created_at DESC);
