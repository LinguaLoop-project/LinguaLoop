package com.lingualoop.backend.user.service;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.common.exception.FieldValidationException;

/**
 * Kiểm ảnh đại diện theo chữ ký đầu tệp: nội dung phải là JPG, PNG hoặc WebP thật, không dựa vào tên tệp hay Content-Type
 * vì phía client đổi được. Dung lượng do S3 chặn khi tải lên và được kiểm lại khi xác nhận tệp.
 */
@Component
class AvatarImageValidator {

    /** Số byte đầu tệp cần đọc: chữ ký WebP là "RIFF" + 4 byte kích thước + "WEBP" = 12 byte. */
    static final int HEAD_BYTES = 12;
    static final String FIELD = "avatar";
    static final String CODE_TYPE = "ImageType";

    private static final byte[] JPG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    private static final byte[] RIFF = {'R', 'I', 'F', 'F'};
    private static final byte[] WEBP = {'W', 'E', 'B', 'P'};

    /** Sai định dạng hoặc rỗng thì ném lỗi 400 trên trường {@code avatar} với mã {@code ImageType}. */
    void validate(byte[] head) {
        if (head == null || !(matches(head, 0, JPG) || matches(head, 0, PNG) || (matches(head, 0, RIFF) && matches(head, 8, WEBP)))) {
            throw new FieldValidationException(FIELD, CODE_TYPE);
        }
    }

    private static boolean matches(byte[] content, int offset, byte[] signature) {
        if (content.length < offset + signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if (content[offset + i] != signature[i]) {
                return false;
            }
        }
        return true;
    }
}
