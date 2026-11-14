package com.lingualoop.backend.vocab.service;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.common.exception.FieldValidationException;

/**
 * Kiểm ảnh minh họa của bộ (BR-BT-13) theo chữ ký đầu tệp: nội dung phải là JPG hoặc PNG thật. Không dựa vào tên tệp
 * hay Content-Type vì phía client đổi được. Dung lượng tối đa 2 MB do S3 chặn khi tải lên (Content-Length nằm trong
 * chữ ký của presigned URL) và được kiểm lại khi xác nhận tệp.
 */
@Component
public class DeckImageValidator {

    /** Số byte đầu tệp cần đọc để nhận ra định dạng (chữ ký PNG dài nhất, 8 byte). */
    public static final int HEAD_BYTES = 8;

    /** Mã lỗi gắn vào trường {@code image} để frontend dịch: sai định dạng. */
    public static final String CODE_TYPE = "ImageType";

    static final String FIELD = "image";
    private static final byte[] JPG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    /** Trả định dạng theo các byte đầu của ảnh; sai định dạng hoặc rỗng ném lỗi 400 trên trường {@code image}. */
    public DeckImageType validate(byte[] head) {
        if (head != null && startsWith(head, JPG)) {
            return DeckImageType.JPG;
        }
        if (head != null && startsWith(head, PNG)) {
            return DeckImageType.PNG;
        }
        throw new FieldValidationException(FIELD, CODE_TYPE);
    }

    private static boolean startsWith(byte[] content, byte[] signature) {
        if (content.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if (content[i] != signature[i]) {
                return false;
            }
        }
        return true;
    }
}
