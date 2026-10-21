package com.lingualoop.backend.shadowing.azure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.support.WavFixtures;

class WavPcmTest {

    @Test
    void extract_dropsTheHeaderAndKeepsEverySample() {
        byte[] wav = WavFixtures.valid(1_000);
        for (int i = 44; i < wav.length; i++) {
            wav[i] = (byte) (i % 251); // dữ liệu nhận ra được, không phải toàn số 0
        }

        byte[] pcm = WavPcm.extract(wav);

        assertThat(pcm).hasSize(1_000 * 32).isEqualTo(Arrays.copyOfRange(wav, 44, wav.length));
    }

    @Test
    void extract_skipsOtherChunksBeforeData() {
        byte[] plain = WavFixtures.valid(500);
        byte[] list = {'L', 'I', 'S', 'T', 4, 0, 0, 0, 'a', 'b', 'c', 'd'};
        ByteBuffer buf = ByteBuffer.allocate(plain.length + list.length).order(ByteOrder.LITTLE_ENDIAN);
        buf.put(plain, 0, 36).put(list).put(plain, 36, plain.length - 36);

        assertThat(WavPcm.extract(buf.array())).hasSize(500 * 32);
    }

    @Test
    void extract_streamingHeaderWithUnknownSize_usesActualBytes() {
        byte[] wav = WavFixtures.valid(1_000);
        wav[40] = wav[41] = wav[42] = wav[43] = (byte) 0xFF;

        assertThat(WavPcm.extract(wav)).hasSize(1_000 * 32);
    }

    @Test
    void extract_withoutDataChunk_fails() {
        assertThatThrownBy(() -> WavPcm.extract(Arrays.copyOf(WavFixtures.valid(500), 36)))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
