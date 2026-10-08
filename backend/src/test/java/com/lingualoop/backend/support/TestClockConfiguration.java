package com.lingualoop.backend.support;

import java.time.Clock;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/** Thay bean {@link Clock} bằng {@link MutableClock} để test giả lập thời gian trôi. */
@TestConfiguration(proxyBeanMethods = false)
public class TestClockConfiguration {

    @Bean
    MutableClock mutableClock() {
        return new MutableClock();
    }

    @Bean
    @Primary
    Clock testClock(MutableClock mutableClock) {
        return mutableClock;
    }
}
