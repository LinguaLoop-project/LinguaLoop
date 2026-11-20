package com.lingualoop.backend.lesson.dto.request;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Tạo lại gợi ý (UC-BH-10). Màn Sửa câu gửi đúng các câu cần điền theo phạm vi và cách điền giáo viên chọn ("chỉ ô còn
 * trống" thì chỉ gửi câu có ô trống), kèm câu tiếng Anh đang nhập (kể cả chưa lưu).
 *
 * @param translation gợi ý bản dịch bằng AI
 * @param ipa         tạo IPA bằng công cụ phiên âm
 */
public record SuggestSentencesRequest(
        @NotEmpty @Size(max = 500) List<@Valid @NotNull Item> sentences,
        boolean translation,
        boolean ipa) {

    public record Item(@NotNull UUID id, @NotBlank @Size(max = 500) String textEn) {
    }
}
