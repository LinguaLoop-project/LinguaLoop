package com.lingualoop.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/** Bật tự điền {@code @CreatedDate}/{@code @LastModifiedDate} cho BaseEntity. */
@Configuration(proxyBeanMethods = false)
@EnableJpaAuditing
public class JpaAuditingConfig {
}
