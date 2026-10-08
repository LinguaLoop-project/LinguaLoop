package com.lingualoop.backend.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Bean {@link Clock} dùng chung để test chỉnh được thời gian (khoá đăng nhập, hết hạn token). */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
