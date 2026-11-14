package com.lingualoop.backend.vocab.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.common.exception.ErrorResponse;
import com.lingualoop.backend.common.exception.FieldValidationException;

/**
 * Kiểm ảnh minh họa của bộ theo chữ ký tệp (BR-BT-13, UC-BT-02 5c). Dung lượng do S3 chặn khi tải lên nên không thuộc
 * validator này (xem {@code S3FileStorageServiceTest}).
 */
class DeckImageValidatorTest {

    private static final byte[] JPG_SIGNATURE = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};

    private final DeckImageValidator validator = new DeckImageValidator();

    /** Tệp có chữ ký {@code signature} được đệm tới đúng {@code size} byte. */
    static byte[] fileOf(byte[] signature, int size) {
        byte[] content = Arrays.copyOf(signature, size);
        Arrays.fill(content, signature.length, size, (byte) 0x11);
        return content;
    }

    /** {@link DeckImageValidator#HEAD_BYTES} byte đầu của một JPG thật, như service đọc từ S3. */
    static byte[] jpgHead() {
        return fileOf(JPG_SIGNATURE, DeckImageValidator.HEAD_BYTES);
    }

    static byte[] pngHead() {
        return fileOf(PNG_SIGNATURE, DeckImageValidator.HEAD_BYTES);
    }

    static byte[] pdfHead() {
        return Arrays.copyOf("%PDF-1.7\n%%EOF".getBytes(StandardCharsets.US_ASCII), DeckImageValidator.HEAD_BYTES);
    }

    private static ErrorResponse.FieldError errorOf(Runnable call) {
        try {
            call.run();
        } catch (FieldValidationException ex) {
            return ex.fieldErrors().get(0);
        }
        throw new AssertionError("Không ném FieldValidationException");
    }

    @Test
    void validate_pdfFile_throwsFieldValidation_AC_BT_12() {
        ErrorResponse.FieldError error = errorOf(() -> validator.validate(pdfHead()));

        assertThat(error.field()).isEqualTo("image");
        assertThat(error.code()).isEqualTo(DeckImageValidator.CODE_TYPE);
    }

    /** Tên tệp và Content-Type không được truyền vào validator: chỉ nội dung quyết định. */
    @Test
    void validate_pdfRenamedPng_rejectedByMagicBytes_AC_BT_69() {
        assertThat(errorOf(() -> validator.validate(pdfHead())).code()).isEqualTo(DeckImageValidator.CODE_TYPE);
        // chỉ 4 byte đầu giống PNG mà thiếu phần còn lại của chữ ký cũng bị từ chối
        byte[] halfPng = fileOf(new byte[] {(byte) 0x89, 'P', 'N', 'G'}, DeckImageValidator.HEAD_BYTES);
        assertThatThrownBy(() -> validator.validate(halfPng)).isInstanceOf(FieldValidationException.class);
    }

    @Test
    void validate_realPngAndJpgSignatures_accepted_AC_BT_69() {
        assertThat(validator.validate(pngHead())).isEqualTo(DeckImageType.PNG);
        assertThat(validator.validate(jpgHead())).isEqualTo(DeckImageType.JPG);
        assertThat(DeckImageType.JPG.extension()).isEqualTo("jpg");
        assertThat(DeckImageType.PNG.extension()).isEqualTo("png");
    }

    @Test
    void validate_emptyOrTruncatedFile_rejected_AC_BT_69() {
        assertThatThrownBy(() -> validator.validate(new byte[0])).isInstanceOf(FieldValidationException.class);
        assertThatThrownBy(() -> validator.validate(null)).isInstanceOf(FieldValidationException.class);
        assertThatThrownBy(() -> validator.validate(new byte[] {(byte) 0xFF, (byte) 0xD8}))
                .isInstanceOf(FieldValidationException.class);
    }
}
