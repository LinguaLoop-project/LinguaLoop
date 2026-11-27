package com.lingualoop.backend;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Một Postgres cho cả lần chạy test. Mỗi tổ hợp cấu hình test (khác {@code @Import}, {@code @MockitoBean}, ...) là một
 * Spring context riêng; nếu container là bean thì mỗi context dựng thêm một Postgres và chúng cùng sống tới khi JVM
 * thoát. Container ở đây là biến static: khởi động một lần, mọi context dùng chung, không context nào tắt được nó; Ryuk
 * của Testcontainers dọn khi JVM thoát. Các test vì vậy dùng chung một cơ sở dữ liệu và phải tự tách dữ liệu (tiền tố
 * tên ngẫu nhiên, lọc theo id vừa tạo).
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

	/**
	 * Spring giữ tới 32 context trong bộ nhớ đệm, mỗi context một pool kết nối tới cùng Postgres này. Pool giữ mặc định
	 * 10 (có test chạy 8 luồng đồng thời) nhưng context đang nằm chờ trả bớt kết nối sau 10 giây, và
	 * {@code max_connections} đủ cho 32 pool đầy (mặc định của Postgres chỉ 100).
	 */
	private static final int MAX_CONNECTIONS = 400;
	private static final int POOL_SIZE = 10;

	static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine")
			.withCommand("postgres", "-c", "max_connections=" + MAX_CONNECTIONS);

	static {
		POSTGRES.start();
	}

	@Bean
	DynamicPropertyRegistrar postgresProperties() {
		return registry -> {
			registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
			registry.add("spring.datasource.username", POSTGRES::getUsername);
			registry.add("spring.datasource.password", POSTGRES::getPassword);
			registry.add("spring.datasource.hikari.maximum-pool-size", () -> POOL_SIZE);
			registry.add("spring.datasource.hikari.minimum-idle", () -> 1);
			registry.add("spring.datasource.hikari.idle-timeout", () -> 10_000);
		};
	}
}
