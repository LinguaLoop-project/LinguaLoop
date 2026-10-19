package com.lingualoop.backend.dictation.dto.request;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.lingualoop.backend.common.validation.MaxBytes;
import com.lingualoop.backend.practice.enums.DictationLevel;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubmitAttemptRequest(
        @NotNull DictationLevel level,
        @MaxBytes(2000) String typedText,
        Map<Integer, String> blanks,
        @Size(max = 50) List<@NotNull @Min(0) Integer> blankPositions,
        @Size(max = 200) Set<@NotNull @Min(0) Integer> revealedPositions,
        Boolean gaveUp,
        Boolean retry,
        @DecimalMin("0.25") @DecimalMax("2.00") BigDecimal playbackRate,
        @Min(0) @Max(10000) Integer replayCount,
        @Min(0) @Max(3600000) Integer durationMs) {

    /** Các field tuỳ chọn thiếu thì nhận giá trị mặc định (false, 0, tập rỗng); Jackson không nhận null cho kiểu nguyên thủy. */
    public SubmitAttemptRequest {
        gaveUp = gaveUp == null ? Boolean.FALSE : gaveUp;
        retry = retry == null ? Boolean.FALSE : retry;
        replayCount = replayCount == null ? Integer.valueOf(0) : replayCount;
        blanks = blanks == null ? Map.of() : Map.copyOf(blanks);
        blankPositions = blankPositions == null ? List.of() : List.copyOf(blankPositions);
        revealedPositions = revealedPositions == null ? Set.of() : Set.copyOf(revealedPositions);
    }
}
