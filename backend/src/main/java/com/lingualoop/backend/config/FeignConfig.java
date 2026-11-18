package com.lingualoop.backend.config;

import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Configuration;

/** Bật Feign cho các client gọi dịch vụ ngoài: Google ({@code auth/google}) YouTube Data API ({@code lesson/youtube}) và TranscriptAPI ({@code lesson/transcriptapi}). */
@Configuration
@EnableFeignClients(basePackages = {
        "com.lingualoop.backend.auth.google",
        "com.lingualoop.backend.lesson.youtube",
        "com.lingualoop.backend.lesson.transcriptapi" })
public class FeignConfig {
}
