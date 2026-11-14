package com.lingualoop.backend.storage.s3;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.config.S3Properties;
import com.lingualoop.backend.storage.dto.PresignedUpload;
import com.lingualoop.backend.storage.dto.StoredObject;
import com.lingualoop.backend.storage.service.FileStorageService;
import com.lingualoop.backend.storage.service.UploadPurpose;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

/**
 * {@link FileStorageService} trên AWS S3 (hoặc dịch vụ tương thích). Backend không nhận byte của tệp: chỉ ký URL để
 * client tải thẳng lên bucket, rồi kiểm lại bằng HEAD khi feature xác nhận.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class S3FileStorageService implements FileStorageService {

    static final String FIELD_CONTENT_TYPE = "contentType";
    static final String FIELD_SIZE = "size";
    /** Mã lỗi trường để frontend dịch: loại tệp không cho phép, quá dung lượng. */
    static final String CODE_TYPE = "UploadType";
    static final String CODE_SIZE = "MaxBytes";

    private static final int NOT_FOUND = 404;

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3Properties props;

    @Override
    public PresignedUpload presignUpload(UUID userId, UploadPurpose purpose, String contentType, long contentLength) {
        String type = normalize(contentType);
        if (!purpose.accepts(type)) {
            throw new FieldValidationException(FIELD_CONTENT_TYPE, CODE_TYPE);
        }
        if (contentLength <= 0 || contentLength > purpose.maxBytes()) {
            throw new FieldValidationException(FIELD_SIZE, CODE_SIZE);
        }
        requireConfigured();

        String key = ownerPrefix(purpose, userId) + UUID.randomUUID() + "." + purpose.extensionOf(type);
        // Content-Type và Content-Length nằm trong chữ ký: client gửi khác (đổi loại, tệp to hơn) thì S3 trả 403.
        PutObjectRequest put = PutObjectRequest.builder()
                .bucket(props.bucket())
                .key(key)
                .contentType(type)
                .contentLength(contentLength)
                .build();
        try {
            PresignedPutObjectRequest signed = s3Presigner.presignPutObject(PutObjectPresignRequest.builder()
                    .signatureDuration(props.uploadUrlTtl())
                    .putObjectRequest(put)
                    .build());
            return new PresignedUpload(key, signed.url().toString(), "PUT",
                    Map.of("Content-Type", type), signed.expiration());
        } catch (SdkException e) {
            log.warn("Không ký được URL tải lên S3: {}", e.getMessage());
            throw new BusinessException(ErrorCode.STORAGE_UNAVAILABLE);
        }
    }

    @Override
    public StoredObject confirmUpload(UUID userId, UploadPurpose purpose, String key) {
        if (!ownedBy(userId, purpose, key)) {
            throw new BusinessException(ErrorCode.STORAGE_UPLOAD_NOT_FOUND);
        }
        requireConfigured();

        HeadObjectResponse head;
        try {
            head = s3Client.headObject(HeadObjectRequest.builder().bucket(props.bucket()).key(key).build());
        } catch (NoSuchKeyException e) {
            throw new BusinessException(ErrorCode.STORAGE_UPLOAD_NOT_FOUND);
        } catch (S3Exception e) {
            if (e.statusCode() == NOT_FOUND) {
                throw new BusinessException(ErrorCode.STORAGE_UPLOAD_NOT_FOUND);
            }
            throw unavailable(e);
        } catch (SdkException e) {
            throw unavailable(e);
        }

        String type = normalize(head.contentType());
        long size = head.contentLength() == null ? 0 : head.contentLength();
        if (!purpose.accepts(type) || size <= 0 || size > purpose.maxBytes()) {
            delete(key);
            throw new BusinessException(ErrorCode.STORAGE_FILE_INVALID);
        }
        return new StoredObject(key, type, size);
    }

    @Override
    public void discardUpload(UUID userId, UploadPurpose purpose, String key) {
        if (ownedBy(userId, purpose, key)) {
            delete(key);
        }
    }

    @Override
    public byte[] readHead(String key, int length) {
        if (length <= 0) {
            return new byte[0];
        }
        requireConfigured();
        try {
            return s3Client.getObjectAsBytes(GetObjectRequest.builder()
                    .bucket(props.bucket())
                    .key(key)
                    .range("bytes=0-" + (length - 1))
                    .build()).asByteArray();
        } catch (NoSuchKeyException e) {
            throw new BusinessException(ErrorCode.STORAGE_UPLOAD_NOT_FOUND);
        } catch (SdkException e) {
            throw unavailable(e);
        }
    }

    @Override
    public String publicUrl(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }
        return props.publicBaseUrl() + key;
    }

    @Override
    public String presignDownload(String key) {
        requireConfigured();
        try {
            return s3Presigner.presignGetObject(GetObjectPresignRequest.builder()
                    .signatureDuration(props.downloadUrlTtl())
                    .getObjectRequest(GetObjectRequest.builder().bucket(props.bucket()).key(key).build())
                    .build()).url().toString();
        } catch (SdkException e) {
            throw unavailable(e);
        }
    }

    @Override
    public void delete(String key) {
        if (key == null || key.isBlank() || !props.configured()) {
            return;
        }
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(props.bucket()).key(key).build());
        } catch (SdkException e) {
            // Tệp mồ côi trên S3 không làm hỏng nghiệp vụ; lifecycle rule của bucket dọn sau.
            log.warn("Không xóa được tệp S3 {}: {}", key, e.getMessage());
        }
    }

    private static String ownerPrefix(UploadPurpose purpose, UUID userId) {
        return purpose.prefix() + "/" + userId + "/";
    }

    /** Chỉ nhận key trong thư mục của chính người gửi: chặn việc gắn hoặc xóa tệp của người khác. */
    private static boolean ownedBy(UUID userId, UploadPurpose purpose, String key) {
        return key != null && key.startsWith(ownerPrefix(purpose, userId)) && !key.contains("..");
    }

    /** Bỏ tham số kèm theo (vd {@code ; charset=...}) và chữ hoa trước khi so với danh sách cho phép. */
    private static String normalize(String contentType) {
        if (contentType == null) {
            return "";
        }
        int semicolon = contentType.indexOf(';');
        String base = semicolon >= 0 ? contentType.substring(0, semicolon) : contentType;
        return base.trim().toLowerCase(Locale.ROOT);
    }

    private void requireConfigured() {
        if (!props.configured()) {
            throw new BusinessException(ErrorCode.STORAGE_UNAVAILABLE);
        }
    }

    private static BusinessException unavailable(SdkException e) {
        log.warn("Lỗi gọi S3: {}", e.getMessage());
        return new BusinessException(ErrorCode.STORAGE_UNAVAILABLE);
    }
}
