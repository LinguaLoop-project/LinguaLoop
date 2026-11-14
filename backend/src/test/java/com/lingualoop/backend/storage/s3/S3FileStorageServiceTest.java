package com.lingualoop.backend.storage.s3;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.config.S3Config;
import com.lingualoop.backend.config.S3Properties;
import com.lingualoop.backend.storage.dto.PresignedUpload;
import com.lingualoop.backend.storage.dto.StoredObject;
import com.lingualoop.backend.storage.service.UploadPurpose;

import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/** Ký URL chạy offline bằng presigner thật (credential giả); các lời gọi S3 khác dùng client giả. */
class S3FileStorageServiceTest {

    private static final S3Properties PROPS = new S3Properties("test-bucket", "ap-southeast-2", "AKIATEST",
            "secret", "", "", Duration.ofMinutes(5), Duration.ofHours(1));

    private final UUID userId = UUID.randomUUID();
    private final S3Client s3Client = mock(S3Client.class);
    private final S3Presigner presigner = new S3Config().s3Presigner(PROPS);
    private final S3FileStorageService service = new S3FileStorageService(s3Client, presigner, PROPS);

    @AfterEach
    void closePresigner() {
        presigner.close();
    }

    private String keyOf(String name) {
        return "vocab-decks/" + userId + "/" + name;
    }

    @Test
    void presignUpload_signsPutUrlUnderOwnerFolder() {
        PresignedUpload upload = service.presignUpload(userId, UploadPurpose.DECK_IMAGE, "image/png", 1024);

        assertThat(upload.key()).startsWith(keyOf("")).endsWith(".png");
        assertThat(upload.method()).isEqualTo("PUT");
        assertThat(upload.uploadUrl())
                .contains("test-bucket")
                .contains(upload.key())
                .contains("X-Amz-Signature=")
                .contains("X-Amz-Expires=300")
                .containsIgnoringCase("content-type");
        assertThat(upload.headers()).containsEntry("Content-Type", "image/png");
        assertThat(upload.expiresAt()).isAfter(Instant.now());
    }

    @Test
    void presignUpload_normalizesContentTypeParameters() {
        PresignedUpload upload = service.presignUpload(userId, UploadPurpose.DECK_IMAGE, "Image/JPEG; q=1", 10);

        assertThat(upload.key()).endsWith(".jpg");
        assertThat(upload.headers()).containsEntry("Content-Type", "image/jpeg");
    }

    @Test
    void presignUpload_rejectsTypeNotAllowedForPurpose() {
        assertThatThrownBy(() -> service.presignUpload(userId, UploadPurpose.DECK_IMAGE, "image/gif", 10))
                .isInstanceOf(FieldValidationException.class);
    }

    @Test
    void presignUpload_rejectsEmptyOrTooLargeFile() {
        long max = UploadPurpose.DECK_IMAGE.maxBytes();
        assertThatThrownBy(() -> service.presignUpload(userId, UploadPurpose.DECK_IMAGE, "image/png", 0))
                .isInstanceOf(FieldValidationException.class);
        assertThatThrownBy(() -> service.presignUpload(userId, UploadPurpose.DECK_IMAGE, "image/png", max + 1))
                .isInstanceOf(FieldValidationException.class);
        assertThat(service.presignUpload(userId, UploadPurpose.DECK_IMAGE, "image/png", max).key()).isNotBlank();
    }

    @Test
    void presignUpload_withoutBucket_reportsUnavailable() {
        S3Properties empty = new S3Properties("", null, null, null, null, null, null, null);
        S3FileStorageService unconfigured = new S3FileStorageService(s3Client, presigner, empty);

        assertThatThrownBy(() -> unconfigured.presignUpload(userId, UploadPurpose.DECK_IMAGE, "image/png", 10))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.STORAGE_UNAVAILABLE);
    }

    @Test
    void confirmUpload_returnsObjectWhenValid() {
        String key = keyOf("a.png");
        when(s3Client.headObject(any(HeadObjectRequest.class)))
                .thenReturn(HeadObjectResponse.builder().contentType("image/png").contentLength(500L).build());

        StoredObject stored = service.confirmUpload(userId, UploadPurpose.DECK_IMAGE, key);

        assertThat(stored).isEqualTo(new StoredObject(key, "image/png", 500));
    }

    @Test
    void confirmUpload_rejectsKeyOfAnotherUser() {
        String key = "vocab-decks/" + UUID.randomUUID() + "/a.png";

        assertThatThrownBy(() -> service.confirmUpload(userId, UploadPurpose.DECK_IMAGE, key))
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.STORAGE_UPLOAD_NOT_FOUND);
        verify(s3Client, never()).headObject(any(HeadObjectRequest.class));
    }

    @Test
    void confirmUpload_rejectsPathTraversal() {
        String key = keyOf("../other/a.png");

        assertThatThrownBy(() -> service.confirmUpload(userId, UploadPurpose.DECK_IMAGE, key))
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.STORAGE_UPLOAD_NOT_FOUND);
    }

    @Test
    void confirmUpload_missingObject_reportsNotFound() {
        when(s3Client.headObject(any(HeadObjectRequest.class))).thenThrow(NoSuchKeyException.builder().build());

        assertThatThrownBy(() -> service.confirmUpload(userId, UploadPurpose.DECK_IMAGE, keyOf("a.png")))
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.STORAGE_UPLOAD_NOT_FOUND);
    }

    @Test
    void confirmUpload_invalidObject_isDeletedAndRejected() {
        when(s3Client.headObject(any(HeadObjectRequest.class)))
                .thenReturn(HeadObjectResponse.builder().contentType("text/html").contentLength(10L).build());

        assertThatThrownBy(() -> service.confirmUpload(userId, UploadPurpose.DECK_IMAGE, keyOf("a.png")))
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.STORAGE_FILE_INVALID);
        verify(s3Client).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void confirmUpload_s3Down_reportsUnavailable() {
        when(s3Client.headObject(any(HeadObjectRequest.class)))
                .thenThrow(SdkClientException.create("connection refused"));

        assertThatThrownBy(() -> service.confirmUpload(userId, UploadPurpose.DECK_IMAGE, keyOf("a.png")))
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.STORAGE_UNAVAILABLE);
    }

    @Test
    void readHead_requestsByteRange() {
        byte[] png = {(byte) 0x89, 0x50, 0x4E, 0x47};
        when(s3Client.getObjectAsBytes(any(GetObjectRequest.class)))
                .thenAnswer(inv -> {
                    GetObjectRequest req = inv.getArgument(0);
                    assertThat(req.range()).isEqualTo("bytes=0-3");
                    return ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), png);
                });

        assertThat(service.readHead(keyOf("a.png"), 4)).containsExactly(png);
    }

    @Test
    void presignDownload_signsGetUrl() {
        String url = service.presignDownload(keyOf("a.png"));

        assertThat(url).contains(keyOf("a.png")).contains("X-Amz-Expires=3600");
    }

    @Test
    void publicUrl_joinsDefaultBaseUrlAndKey() {
        assertThat(service.publicUrl(keyOf("a.png")))
                .isEqualTo("https://test-bucket.s3.ap-southeast-2.amazonaws.com/" + keyOf("a.png"));
        assertThat(service.publicUrl(null)).isNull();
        assertThat(service.publicUrl(" ")).isNull();
    }

    @Test
    void publicUrl_withoutBucket_returnsKeyInsteadOfFailing() {
        S3Properties empty = new S3Properties("", null, null, null, null, null, null, null);
        S3FileStorageService unconfigured = new S3FileStorageService(s3Client, presigner, empty);

        assertThat(unconfigured.publicUrl("vocab-decks/a.png")).isEqualTo("vocab-decks/a.png");
    }

    @Test
    void discardUpload_deletesOnlyOwnKey() {
        service.discardUpload(userId, UploadPurpose.DECK_IMAGE, keyOf("a.png"));
        verify(s3Client).deleteObject(any(DeleteObjectRequest.class));

        service.discardUpload(userId, UploadPurpose.DECK_IMAGE, "vocab-decks/" + UUID.randomUUID() + "/b.png");
        service.discardUpload(userId, UploadPurpose.DECK_IMAGE, "dictionary/x.mp3");
        service.discardUpload(userId, UploadPurpose.DECK_IMAGE, null);
        verify(s3Client).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void publicBaseUrl_customOrEndpoint_isNormalized() {
        assertThat(new S3Properties("b", null, null, null, null, "https://cdn.example.com", null, null)
                .publicBaseUrl()).isEqualTo("https://cdn.example.com/");
        assertThat(new S3Properties("b", null, null, null, "http://localhost:4566/", null, null, null)
                .publicBaseUrl()).isEqualTo("http://localhost:4566/b/");
        assertThat(new S3Properties("", null, null, null, null, null, null, null).publicBaseUrl()).isEmpty();
    }

    @Test
    void delete_swallowsS3Errors() {
        when(s3Client.deleteObject(any(DeleteObjectRequest.class)))
                .thenThrow(SdkClientException.create("connection refused"));

        service.delete(keyOf("a.png"));

        verify(s3Client).deleteObject(any(DeleteObjectRequest.class));
    }
}
