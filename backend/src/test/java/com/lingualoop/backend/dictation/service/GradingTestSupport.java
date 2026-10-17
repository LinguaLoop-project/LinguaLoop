package com.lingualoop.backend.dictation.service;

/** Dựng {@link SentenceTokenService} cho test ở package khác (Impl là package-private). */
public final class GradingTestSupport {

    private GradingTestSupport() {
    }

    public static SentenceTokenService tokenService() {
        return new SentenceTokenServiceImpl();
    }
}
