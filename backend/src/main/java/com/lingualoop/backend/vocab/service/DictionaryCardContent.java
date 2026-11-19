package com.lingualoop.backend.vocab.service;

import com.lingualoop.backend.dictionary.dto.MeaningSnapshot;
import com.lingualoop.backend.vocab.dto.request.CardRequest;

/**
 * Đổi một nghĩa trong từ điển thành nội dung thẻ (ADR 0009, BR-HT-02, BR-HT-28). Dùng chung cho "Từ đã lưu" và việc thêm
 * thẻ nhanh vào bộ cá nhân để hai nơi cắt độ dài và chọn loại từ giống nhau.
 */
final class DictionaryCardContent {

    /** Cột văn bản của thẻ tối đa 500 ký tự (BR-NT-03). */
    static final int MAX_TEXT = 500;
    static final int MAX_WORD = 100;
    static final int MAX_IPA = 100;

    private DictionaryCardContent() {
    }

    /** Loại từ thẻ nhận (CHECK của {@code vocab_cards.pos}); loại khác trong từ điển thì để trống. */
    static String pos(String dictionaryPos) {
        return dictionaryPos != null && CardPos.VI_LABELS.containsKey(dictionaryPos) ? dictionaryPos : null;
    }

    /** Từ điển hiếm khi dài hơn giới hạn của thẻ nên cắt bớt thay vì báo lỗi. */
    static String clip(String text, int max) {
        return text == null || text.length() <= max ? text : text.substring(0, max);
    }

    static String clip(String text) {
        return clip(text, MAX_TEXT);
    }

    /** Nội dung thẻ (không ảnh) của một nghĩa; nghĩa tiếng Việt trống thì để chuỗi rỗng như "Từ đã lưu". */
    static CardRequest toCard(MeaningSnapshot meaning) {
        return new CardRequest(clip(meaning.headword(), MAX_WORD),
                clip(meaning.meaningVi() == null ? "" : meaning.meaningVi()),
                clip(meaning.ipaUk(), MAX_IPA), clip(meaning.ipaUs(), MAX_IPA), pos(meaning.pos()),
                clip(meaning.definitionEn()), clip(meaning.definitionVi()), clip(meaning.exampleEn()),
                clip(meaning.exampleVi()));
    }
}
