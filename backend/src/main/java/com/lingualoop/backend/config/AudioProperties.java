package com.lingualoop.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;


@Validated
@ConfigurationProperties("app.audio")
public record AudioProperties(@DefaultValue("") String baseUrl) {
}
