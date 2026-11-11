package com.lingualoop.backend.dictionary.service;

import java.util.List;
import java.util.Optional;

import com.lingualoop.backend.dictionary.dto.MeaningSnapshot;
import com.lingualoop.backend.dictionary.dto.WordView;

public interface DictionaryQueryService {

    int MAX_LIMIT = 30;

    Optional<WordView> lookup(String word);

    List<WordView> search(String query, int limit);

    /**
     * Một nghĩa của một mục từ gốc để chép vào thẻ; rỗng nếu từ hoặc nghĩa không có. {@code headword} được chuẩn hoá
     * như khi tra từ. Dạng chia ("went") không có thẻ riêng nên cũng rỗng: người học lưu nghĩa của từ gốc ("go").
     */
    Optional<MeaningSnapshot> findMeaning(String headword, int meaningNo);

    /** Đổi đường dẫn âm thanh tương đối trong từ điển (hoặc trong thẻ chép từ từ điển) thành URL phát được. */
    String resolveAudioUrl(String path);
}
