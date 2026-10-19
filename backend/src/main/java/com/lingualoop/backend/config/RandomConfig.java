package com.lingualoop.backend.config;

import java.util.concurrent.ThreadLocalRandom;
import java.util.random.RandomGenerator;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Nguồn ngẫu nhiên dùng chung, an toàn đa luồng; test thay được để có kết quả cố định. */
@Configuration
public class RandomConfig {

    @Bean
    public RandomGenerator randomGenerator() {
        return () -> ThreadLocalRandom.current().nextLong();
    }
}
