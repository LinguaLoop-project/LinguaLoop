-- Danh sách bộ thẻ của giáo viên (UC-BT-01): lọc theo chủ bộ, sắp updated_at giảm dần rồi id (BR-BT-12).
CREATE INDEX ix_vocab_decks_owner ON vocab_decks(owner_id, updated_at DESC, id DESC) WHERE kind = 'library';
