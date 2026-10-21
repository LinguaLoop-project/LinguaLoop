package com.lingualoop.backend.support;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/** Tạo bản ghi WAV giả (im lặng) cho test shadowing. */
public final class WavFixtures {

    private WavFixtures() {
    }

    /** WAV PCM 16-bit mono 16 kHz, độ dài {@code durationMs}. */
    public static byte[] valid(int durationMs) {
        return wav(1, 16_000, 16, durationMs * 32);
    }

    public static byte[] wav(int channels, int sampleRate, int bits, int dataBytes) {
        ByteBuffer buf = ByteBuffer.allocate(44 + dataBytes).order(ByteOrder.LITTLE_ENDIAN);
        buf.put("RIFF".getBytes()).putInt(36 + dataBytes).put("WAVE".getBytes());
        buf.put("fmt ".getBytes()).putInt(16).putShort((short) 1).putShort((short) channels)
                .putInt(sampleRate).putInt(sampleRate * channels * bits / 8)
                .putShort((short) (channels * bits / 8)).putShort((short) bits);
        buf.put("data".getBytes()).putInt(dataBytes);
        return buf.array();
    }
}
