package com.lingualoop.backend.dictionary.service;

import java.util.List;
import java.util.Optional;

import com.lingualoop.backend.dictionary.dto.AudioSnapshot;
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

    /**
     * Âm thanh của đúng mục từ {@code headword} (chuẩn hoá như khi tra từ) để chép vào thẻ do giáo viên soạn. Có
     * {@code pos} và từ có phát âm riêng cho loại từ đó (vd "record" danh từ và động từ) thì lấy phát âm của loại từ;
     * không thì lấy phát âm chung. Rỗng nếu từ không có trong từ điển hoặc không có âm thanh nào.
     */
    Optional<AudioSnapshot> findAudio(String headword, String pos);

    /** Đổi đường dẫn âm thanh tương đối trong từ điển (hoặc trong thẻ chép từ từ điển) thành URL phát được. */
    String resolveAudioUrl(String path);
}
