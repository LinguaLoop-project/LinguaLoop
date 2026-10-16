package com.lingualoop.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

/** Bind từ {@code app.consent.*}. */
@Validated
@ConfigurationProperties("app.consent")
public record ConsentProperties(
        /** Phiên bản chính sách ghi vào {@code user_consents.policy_version}; server gán, client không gửi. */
        @NotBlank @DefaultValue("1") String policyVersion) {
}
