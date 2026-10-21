package com.lingualoop.backend.dictation.dto.request;

import com.lingualoop.backend.common.validation.MaxBytes;

import jakarta.validation.constraints.Min;

/**
 * Xin lộ một từ. Có position thì lộ từ ở vị trí token đó (Easy, Normal); không thì lộ từ đầu
 * tiên chưa đúng trong typedText (gợi ý ở Hard).
 */
public record RevealWordRequest(@Min(0) Integer position, @MaxBytes(2000) String typedText) {
}
