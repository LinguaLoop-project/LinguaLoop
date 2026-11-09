-- Phiên ôn thẻ chung (UC-HT-03) trải trên nhiều bộ nên không thuộc một bộ nào: deck_id được để trống. Phiên học một phần
-- vẫn có deck_id và group_id.
ALTER TABLE vocab_study_sessions ALTER COLUMN deck_id DROP NOT NULL;
