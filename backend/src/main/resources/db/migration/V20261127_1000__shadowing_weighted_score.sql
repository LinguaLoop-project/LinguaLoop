-- Điểm tổng Shadowing do hệ thống tính (BR-SH-23): 50% chính xác + 30% trôi chảy + 20% ngữ điệu, nhân tỉ lệ đầy đủ.
-- Không có điểm ngữ điệu thì chia lại 60% chính xác + 40% trôi chảy. Giữ điểm tổng gốc của Azure ở azure_score để đối chiếu.
ALTER TABLE sentence_attempts
    ADD COLUMN azure_score numeric(5,2) CHECK (azure_score BETWEEN 0 AND 100);

UPDATE sentence_attempts
SET azure_score = total_score
WHERE mode = 'shadowing';

UPDATE sentence_attempts
SET total_score = round(
        least(100, greatest(0,
            (CASE WHEN prosody_score IS NULL
                  THEN 0.6 * accuracy_score + 0.4 * fluency_score
                  ELSE 0.5 * accuracy_score + 0.3 * fluency_score + 0.2 * prosody_score END)
            * least(100, greatest(0, completeness_score)) / 100)), 2)
WHERE mode = 'shadowing'
  AND accuracy_score IS NOT NULL
  AND fluency_score IS NOT NULL
  AND completeness_score IS NOT NULL;
