package com.lingualoop.backend.shadowing.azure;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;

/**
 * Lấy phần dữ liệu PCM thô (khối "data") của một bản ghi WAV đã được kiểm tra hợp lệ. Azure nhận PCM thô
 * qua luồng đẩy, nên không cần ghi tệp tạm ra đĩa.
 */
final class WavPcm {

    private WavPcm() {
    }

    /** @throws IllegalArgumentException nếu không tìm thấy khối "data" */
    static byte[] extract(byte[] wav) {
        ByteBuffer buf = ByteBuffer.wrap(wav).order(ByteOrder.LITTLE_ENDIAN);
        int pos = 12; // sau "RIFF" <size> "WAVE"
        while (pos + 8 <= wav.length) {
            long size = Integer.toUnsignedLong(buf.getInt(pos + 4));
            int body = pos + 8;
            if (isTag(wav, pos, "data")) {
                // Bản ghi dạng luồng có thể khai báo kích thước 0 hoặc 0xFFFFFFFF: lấy phần thực có.
                int end = (int) Math.min(wav.length, body + size);
                return Arrays.copyOfRange(wav, body, end);
            }
            long next = body + size + (size % 2);
            if (next > wav.length) {
                break;
            }
            pos = (int) next;
        }
        throw new IllegalArgumentException("WAV không có khối data");
    }

    private static boolean isTag(byte[] bytes, int offset, String tag) {
        for (int i = 0; i < 4; i++) {
            if (bytes[offset + i] != (byte) tag.charAt(i)) {
                return false;
            }
        }
        return true;
    }
}
