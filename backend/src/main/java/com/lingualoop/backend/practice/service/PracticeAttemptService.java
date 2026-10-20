package com.lingualoop.backend.practice.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.lingualoop.backend.practice.dto.request.DictationAttemptRequest;
import com.lingualoop.backend.practice.dto.DictationAttemptDetailView;
import com.lingualoop.backend.practice.dto.DictationAttemptView;

public interface PracticeAttemptService {

    /** Ghi một lượt nghe chép kèm kết quả từng từ. */
    long recordDictationAttempt(DictationAttemptRequest record);

    /** Lượt nghe chép mới nhất của mỗi câu trong bài mà người dùng đã làm, theo thứ tự câu. */
    List<DictationAttemptView> findLatestDictationAttempts(UUID userId, UUID lessonId);

    /** Lượt nghe chép mới nhất của một câu kèm kết quả từng từ; rỗng nếu người dùng chưa làm câu này. */
    Optional<DictationAttemptDetailView> findLatestDictationAttempt(UUID userId, UUID sentenceId);

    /** Vị trí các ô đã khoét ở lượt Easy gần nhất của câu, lượt mới nhất đứng đầu. */
    List<List<Integer>> findRecentBlankPositions(UUID userId, UUID sentenceId, int limit);
}
