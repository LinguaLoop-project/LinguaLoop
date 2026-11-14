package com.lingualoop.backend.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bind từ {@code app.storage.s3}. {@code bucket} rỗng thì chức năng tải tệp báo không dùng được, app vẫn khởi động
 * (CI, test). {@code accessKey} rỗng thì SDK tự tìm credential (biến môi trường AWS_*, IAM role khi deploy).
 * {@code endpoint} chỉ đặt khi dùng dịch vụ tương thích S3 (MinIO, LocalStack); để trống là AWS S3 thật.
 * {@code publicBaseUrl} là gốc URL đọc công khai (luôn kết thúc bằng {@code /}); để trống thì tự suy ra từ bucket và
 * region, đổi sang CloudFront chỉ cần đặt biến này.
 */
@ConfigurationProperties("app.storage.s3")
public record S3Properties(
        String bucket,
        String region,
        String accessKey,
        String secretKey,
        String endpoint,
        String publicBaseUrl,
        Duration uploadUrlTtl,
        Duration downloadUrlTtl) {

    public S3Properties {
        bucket = trim(bucket);
        region = region == null || region.isBlank() ? "ap-southeast-2" : region.trim();
        accessKey = trim(accessKey);
        secretKey = trim(secretKey);
        endpoint = stripTrailingSlash(trim(endpoint));
        publicBaseUrl = withTrailingSlash(trim(publicBaseUrl).isEmpty()
                ? defaultPublicBaseUrl(bucket, region, endpoint)
                : trim(publicBaseUrl));
        uploadUrlTtl = uploadUrlTtl == null ? Duration.ofMinutes(5) : uploadUrlTtl;
        downloadUrlTtl = downloadUrlTtl == null ? Duration.ofHours(1) : downloadUrlTtl;
    }

    public boolean configured() {
        return !bucket.isEmpty();
    }

    public boolean hasStaticCredentials() {
        return !accessKey.isEmpty() && !secretKey.isEmpty();
    }

    /** AWS thật dùng virtual-hosted ({@code bucket.s3.region...}); MinIO/LocalStack dùng path-style. */
    private static String defaultPublicBaseUrl(String bucket, String region, String endpoint) {
        if (bucket.isEmpty()) {
            return "";
        }
        if (!endpoint.isEmpty()) {
            return endpoint + "/" + bucket;
        }
        return "https://" + bucket + ".s3." + region + ".amazonaws.com";
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private static String stripTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private static String withTrailingSlash(String value) {
        return value.isEmpty() || value.endsWith("/") ? value : value + "/";
    }
}
