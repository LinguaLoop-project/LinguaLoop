package com.lingualoop.backend.config;

import java.net.URI;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * Client S3 dùng chung. Tạo bean không gọi mạng nên thiếu cấu hình app vẫn khởi động; lỗi credential chỉ lộ ra khi
 * thật sự ký URL hoặc gọi S3.
 */
@Configuration
public class S3Config {

    @Bean(destroyMethod = "close")
    public S3Client s3Client(S3Properties props) {
        var builder = S3Client.builder()
                .region(Region.of(props.region()))
                .credentialsProvider(credentials(props))
                .serviceConfiguration(serviceConfiguration(props));
        if (!props.endpoint().isEmpty()) {
            builder.endpointOverride(URI.create(props.endpoint()));
        }
        return builder.build();
    }

    @Bean(destroyMethod = "close")
    public S3Presigner s3Presigner(S3Properties props) {
        var builder = S3Presigner.builder()
                .region(Region.of(props.region()))
                .credentialsProvider(credentials(props))
                .serviceConfiguration(serviceConfiguration(props));
        if (!props.endpoint().isEmpty()) {
            builder.endpointOverride(URI.create(props.endpoint()));
        }
        return builder.build();
    }

    private static AwsCredentialsProvider credentials(S3Properties props) {
        if (props.hasStaticCredentials()) {
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(props.accessKey(), props.secretKey()));
        }
        return DefaultCredentialsProvider.builder().build();
    }

    /** MinIO/LocalStack cần path-style ({@code endpoint/bucket/key}); AWS thật dùng virtual-hosted. */
    private static S3Configuration serviceConfiguration(S3Properties props) {
        return S3Configuration.builder().pathStyleAccessEnabled(!props.endpoint().isEmpty()).build();
    }
}
