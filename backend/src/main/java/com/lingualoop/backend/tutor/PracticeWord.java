package com.lingualoop.backend.tutor;

/**
 * Từ luyện: một từ trong câu mà Phiên gia sư làm việc với.
 *
 * @param phoneme âm vị trọng tâm của từ; null khi từ không có âm vị nào (Azure bỏ sót từ)
 * @param score   điểm âm vị trọng tâm lúc đầu (hoặc điểm từ nếu không có âm vị); là mốc "trước"
 * @param tipVi   Mẹo sửa, null nếu âm vị chưa có trong TipCatalog
 */
public record PracticeWord(String word, String phoneme, double score, String tipVi) {

    public String key() {
        return Words.normalize(word);
    }
}
