package com.lingualoop.backend.storage.service;

import java.util.UUID;

import com.lingualoop.backend.storage.dto.PresignedUpload;
import com.lingualoop.backend.storage.dto.StoredObject;

/**
 * Lưu tệp người dùng tải lên, dùng chung cho mọi feature. Luồng:
 * <ol>
 * <li>Frontend gọi {@code POST /api/v1/uploads/presign} lấy {@link PresignedUpload}, rồi {@code PUT} tệp thẳng lên
 * S3 bằng {@code uploadUrl} kèm đúng các header trong {@code headers}.</li>
 * <li>Frontend gửi {@code key} trong request nghiệp vụ (vd tạo bộ). Feature gọi {@link #confirmUpload} để chắc tệp
 * đã lên, thuộc người gửi, đúng loại và dung lượng, rồi mới lưu {@code key} vào DB.</li>
 * <li>Khi hiển thị, feature đổi {@code key} thành URL đọc: {@link #publicUrl} nếu thư mục của mục đích được bucket
 * policy cho đọc công khai, ngược lại {@link #presignDownload}.</li>
 * </ol>
 * Trong DB chỉ lưu {@code key}, không lưu URL (URL đã ký hết hạn; đổi bucket/CDN thì key vẫn giữ nguyên).
 */
public interface FileStorageService {

    /** Cấp URL tải lên cho một tệp; key nằm dưới {@code <prefix>/<userId>/}. */
    PresignedUpload presignUpload(UUID userId, UploadPurpose purpose, String contentType, long contentLength);

    /**
     * Kiểm tệp ở {@code key} đã được {@code userId} tải lên đúng mục đích: tồn tại, đúng thư mục của người dùng, đúng
     * loại và không quá dung lượng. Tệp sai bị xóa khỏi S3 rồi ném lỗi.
     */
    StoredObject confirmUpload(UUID userId, UploadPurpose purpose, String key);

    /**
     * Bỏ tệp người dùng đã tải lên nhưng nghiệp vụ không dùng (lưu lỗi, trùng tên...). Chỉ xóa khi {@code key} nằm
     * trong thư mục của {@code userId}, nên gọi được với key do client gửi mà không sợ xóa tệp của người khác.
     */
    void discardUpload(UUID userId, UploadPurpose purpose, String key);

    /** Đọc tối đa {@code length} byte đầu của tệp, để feature kiểm chữ ký định dạng thật (vd JPG/PNG). */
    byte[] readHead(String key, int length);

    /**
     * URL đọc cố định ({@code publicBaseUrl + key}), chỉ dùng cho thư mục bucket policy cho đọc công khai (vd
     * {@code vocab-decks/}). Key rỗng trả {@code null} để DTO giữ trường ảnh trống. Không gọi S3 và không ném lỗi khi
     * thiếu cấu hình (khi đó trả nguyên key), để màn danh sách không hỏng vì kho tệp.
     */
    String publicUrl(String key);

    /** URL đọc tạm thời cho tệp riêng tư trên bucket. */
    String presignDownload(String key);

    /** Xóa tệp; tệp không còn thì bỏ qua. */
    void delete(String key);
}
