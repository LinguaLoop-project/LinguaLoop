package com.lingualoop.backend.shadowing.service;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Map;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

/**
 * Kiểm tra bản ghi WAV theo BR-SHADOW-03: PCM 16-bit, mono, 16 kHz, từ 0,5 đến 30 giây, tối đa 1 MB.
 */
public record WavAudio(int durationMs) {

    public static final int MAX_BYTES = 1024 * 1024;
    public static final int MIN_DURATION_MS = 500;
    public static final int MAX_DURATION_MS = 30_000;

    private static final int SAMPLE_RATE = 16_000;
    private static final int BYTES_PER_MS = SAMPLE_RATE * 2 / 1000;

    public static WavAudio parse(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw invalid("empty");
        }
        if (bytes.length > MAX_BYTES) {
            throw invalid("too_large");
        }
        ByteBuffer buf = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        if (bytes.length < 12 || !tag(buf, 0, "RIFF") || !tag(buf, 8, "WAVE")) {
            throw invalid("not_wav");
        }

        boolean formatOk = false;
        long dataBytes = -1;
        int pos = 12;
        while (pos + 8 <= bytes.length) {
            long size = Integer.toUnsignedLong(buf.getInt(pos + 4));
            int body = pos + 8;
            if (tag(buf, pos, "fmt ")) {
                if (size < 16 || body + 16 > bytes.length) {
                    throw invalid("bad_format");
                }
                formatOk = buf.getShort(body) == 1                 // PCM
                        && buf.getShort(body + 2) == 1             // mono
                        && buf.getInt(body + 4) == SAMPLE_RATE
                        && buf.getShort(body + 14) == 16;          // 16-bit
            } else if (tag(buf, pos, "data")) {
                // Bản ghi dạng luồng có thể khai báo kích thước 0 hoặc 0xFFFFFFFF: lấy phần thực có.
                dataBytes = Math.min(size, bytes.length - (long) body);
                break;
            }
            long next = body + size + (size % 2);
            if (next > bytes.length) {
                break;
            }
            pos = (int) next;
        }
        if (!formatOk) {
            throw invalid("bad_format");
        }
        if (dataBytes < 0) {
            throw invalid("no_data");
        }

        int durationMs = (int) (dataBytes / BYTES_PER_MS);
        if (durationMs < MIN_DURATION_MS) {
            throw invalid("too_short");
        }
        if (durationMs > MAX_DURATION_MS) {
            throw invalid("too_long");
        }
        return new WavAudio(durationMs);
    }

    private static boolean tag(ByteBuffer buf, int offset, String tag) {
        if (offset + 4 > buf.limit()) {
            return false;
        }
        for (int i = 0; i < 4; i++) {
            if (buf.get(offset + i) != (byte) tag.charAt(i)) {
                return false;
            }
        }
        return true;
    }

    private static BusinessException invalid(String reason) {
        return new BusinessException(ErrorCode.SHADOWING_AUDIO_INVALID, Map.of("reason", reason));
    }
}
