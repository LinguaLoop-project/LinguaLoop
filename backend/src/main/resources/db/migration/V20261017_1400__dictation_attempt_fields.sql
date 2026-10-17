-- Nghe chép 3 mức: thêm cột mô tả lượt, cho phép kết quả "revealed", lọc thống kê.
ALTER TABLE sentence_attempts
    ADD COLUMN level         text CHECK (level IN ('easy','normal','hard')),
    ADD COLUMN playback_rate numeric(3,2),
    ADD COLUMN is_retry      boolean NOT NULL DEFAULT false,
    ADD COLUMN gave_up       boolean NOT NULL DEFAULT false;

ALTER TABLE sentence_attempt_words DROP CONSTRAINT sentence_attempt_words_outcome_check;
ALTER TABLE sentence_attempt_words ADD CONSTRAINT sentence_attempt_words_outcome_check CHECK (outcome IN
    ('correct','omitted','inserted','substituted','misspelled','mispronounced','revealed'));

-- từ được mở (revealed) không có chữ học viên gõ
ALTER TABLE sentence_attempt_words DROP CONSTRAINT chk_word_actual;
ALTER TABLE sentence_attempt_words ADD CONSTRAINT chk_word_actual CHECK (
    (outcome <> 'omitted' OR actual_word IS NULL)
    AND (actual_word IS NOT NULL OR outcome IN ('omitted','mispronounced','revealed')));

-- thống kê lỗi nghe chép: tách theo mức, bỏ lượt làm lại và lượt bỏ cuộc
DROP VIEW v_user_dictation_stats;
CREATE VIEW v_user_dictation_stats AS
SELECT a.user_id,
       (a.attempted_at AT TIME ZONE 'UTC')::date                AS day,
       a.level,
       w.expected_word_class                                    AS word_class,
       count(*)                                                 AS opportunities,
       count(*) FILTER (WHERE w.outcome <> 'correct')           AS errors,
       count(*) FILTER (WHERE w.outcome = 'omitted')            AS omitted,
       count(*) FILTER (WHERE w.outcome = 'substituted')        AS substituted,
       count(*) FILTER (WHERE w.outcome = 'misspelled')         AS misspelled,
       count(*) FILTER (WHERE w.outcome = 'revealed')           AS revealed
FROM sentence_attempt_words w
JOIN sentence_attempts a ON a.id = w.attempt_id
WHERE a.mode = 'dictation' AND w.expected_word_class IS NOT NULL
  AND NOT a.is_retry AND NOT a.gave_up
GROUP BY a.user_id, (a.attempted_at AT TIME ZONE 'UTC')::date, a.level, w.expected_word_class;
