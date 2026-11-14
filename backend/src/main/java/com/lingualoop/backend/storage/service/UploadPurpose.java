package com.lingualoop.backend.storage.service;

import java.util.Collection;
import java.util.Map;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;

import com.lingualoop.backend.security.Role;

/**
 * Mục đích tải tệp. Mỗi mục đích quy định thư mục trên S3, loại tệp và dung lượng cho phép, và vai trò được tải.
 * Feature mới cần tải tệp thì thêm một hằng ở đây (qua PR) thay vì tự viết luồng presign riêng.
 */
public enum UploadPurpose {

    /**
     * Ảnh minh họa của bộ từ (BR-BT-13): JPG/PNG, tối đa 2 MB. Bucket policy cho đọc công khai {@code vocab-decks/*},
     * nên hiển thị bằng {@code FileStorageService#publicUrl}.
     */
    DECK_IMAGE("vocab-decks",
            Map.of("image/jpeg", "jpg", "image/png", "png"),
            2_097_152L,
            Set.of(Role.TEACHER, Role.ADMIN)),

    /**
     * Ảnh minh họa của thẻ do giáo viên soạn (BR-NT-03, BR-NT-09): JPG/PNG, tối đa 2 MB. Nằm dưới {@code vocab-decks/}
     * để dùng chung bucket policy đọc công khai với ảnh bộ; thư mục riêng {@code cards/} nên key của hai mục đích không
     * lẫn nhau khi kiểm chủ sở hữu.
     */
    CARD_IMAGE("vocab-decks/cards",
            Map.of("image/jpeg", "jpg", "image/png", "png"),
            2_097_152L,
            Set.of(Role.TEACHER));

    private final String prefix;
    /** Content-Type cho phép, ánh xạ sang đuôi tệp ghi vào key. */
    private final Map<String, String> contentTypes;
    private final long maxBytes;
    private final Set<Role> roles;

    UploadPurpose(String prefix, Map<String, String> contentTypes, long maxBytes, Set<Role> roles) {
        this.prefix = prefix;
        this.contentTypes = contentTypes;
        this.maxBytes = maxBytes;
        this.roles = roles;
    }

    public String prefix() {
        return prefix;
    }

    public long maxBytes() {
        return maxBytes;
    }

    public boolean accepts(String contentType) {
        return contentType != null && contentTypes.containsKey(contentType);
    }

    /** Đuôi tệp của Content-Type đã kiểm bằng {@link #accepts}. */
    public String extensionOf(String contentType) {
        return contentTypes.get(contentType);
    }

    public Set<String> contentTypes() {
        return contentTypes.keySet();
    }

    public boolean allowedFor(Collection<? extends GrantedAuthority> authorities) {
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> roles.stream().anyMatch(r -> r.authority().equals(a)));
    }
}
