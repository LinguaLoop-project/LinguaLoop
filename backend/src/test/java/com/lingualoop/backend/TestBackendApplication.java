package com.lingualoop.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;

/** Chạy app với Postgres của Testcontainers, không cần compose ({@code ./mvnw spring-boot:test-run}). */
public class TestBackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(BackendApplication::main).with(LocalPostgres.class).run(args);
	}

	/** Container là bean để Spring Boot tự khởi động, nối datasource và tắt khi app dừng. */
	@TestConfiguration(proxyBeanMethods = false)
	static class LocalPostgres {

		@Bean
		@ServiceConnection
		PostgreSQLContainer postgresContainer() {
			return new PostgreSQLContainer("postgres:17-alpine");
		}
	}
}
