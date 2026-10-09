ALTER TABLE topics ADD COLUMN icon text;

CREATE VIEW v_lesson_sentence_counts AS
SELECT l.id AS lesson_id, count(s.id) AS sentence_count
FROM lessons l LEFT JOIN sentences s ON s.lesson_id = l.id
GROUP BY l.id;

CREATE INDEX ix_lessons_title_vi_trgm ON lessons USING gin (title_vi gin_trgm_ops);
CREATE INDEX ix_lessons_popular ON lessons (view_count DESC) WHERE deleted_at IS NULL AND status = 'APPROVED';
