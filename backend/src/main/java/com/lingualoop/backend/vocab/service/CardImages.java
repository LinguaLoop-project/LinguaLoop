package com.lingualoop.backend.vocab.service;

import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.storage.service.FileStorageService;
import com.lingualoop.backend.storage.service.UploadPurpose;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Ảnh minh họa của thẻ (BR-NT-03, BR-NT-09) trên S3, mục đích {@link UploadPurpose#CARD_IMAGE}. Cột
 * {@code vocab_cards.image_url} lưu S3 key; hiển thị đổi sang URL đọc công khai. Ghi DB nằm trong giao dịch còn S3
 * thì không, nên ảnh mới chỉ bị bỏ khi giao dịch rollback và ảnh cũ chỉ bị bỏ sau khi commit: lỗi giữa chừng không
 * làm thẻ trỏ tới ảnh đã mất.
 */
@Slf4j
@Component
@RequiredArgsConstructor
class CardImages {

    private final FileStorageService storage;
    private final DeckImageValidator validator;
    private final DeckImageUrls urls;

    /**
     * Ảnh phải nằm trong thư mục của giáo viên, đúng loại và dung lượng (kiểm trên S3), và nội dung thật là JPG/PNG.
     * Sai thì ném lỗi trên trường {@code image} với mã {@code ImageType}.
     */
    void verify(UUID teacherId, String key) {
        try {
            storage.confirmUpload(teacherId, UploadPurpose.CARD_IMAGE, key);
        } catch (BusinessException ex) {
            if (ex.getErrorCode() == ErrorCode.STORAGE_FILE_INVALID) {
                throw new FieldValidationException(DeckImageValidator.FIELD, DeckImageValidator.CODE_TYPE);
            }
            throw ex;
        }
        validator.validate(storage.readHead(key, DeckImageValidator.HEAD_BYTES));
    }

    /** URL đọc của ảnh; key trống trả {@code null}. */
    String url(String key) {
        return urls.resolve(key);
    }

    /** Bỏ ngay một ảnh giáo viên vừa tải lên nhưng không dùng (không khớp thẻ, sai định dạng). */
    void discard(UUID teacherId, String key) {
        if (key == null) {
            return;
        }
        try {
            storage.discardUpload(teacherId, UploadPurpose.CARD_IMAGE, key);
        } catch (RuntimeException ex) {
            log.warn("Không xóa được ảnh thẻ: {}", key, ex);
        }
    }

    /** Ảnh vừa tải lên bị bỏ nếu giao dịch hiện tại rollback (lưu thẻ lỗi). */
    void discardOnRollback(UUID teacherId, String key) {
        if (key == null || !TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    discard(teacherId, key);
                }
            }
        });
    }

    /** Ảnh cũ bị thay hoặc bỏ được xóa sau khi giao dịch commit; không có giao dịch thì xóa ngay. */
    void discardAfterCommit(UUID teacherId, String key) {
        if (key == null) {
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            discard(teacherId, key);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                discard(teacherId, key);
            }
        });
    }
}
