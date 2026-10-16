package com.lingualoop.backend.user.service;

import java.util.Set;
import java.util.UUID;

import com.lingualoop.backend.user.enums.ConsentType;

/** Cổng duy nhất để feature khác (shadowing...) kiểm tra và ghi sự đồng ý xử lý dữ liệu của người dùng. */
public interface ConsentService {

    /** Người dùng có đang đồng ý loại này; chưa so sánh phiên bản chính sách. */
    boolean hasConsent(UUID userId, ConsentType type);

    Set<ConsentType> getGrantedTypes(UUID userId);

    /** Idempotent: đã đồng ý rồi thì không làm gì. */
    void grant(UUID userId, ConsentType type);

    /** Idempotent, không xoá bản ghi mà chỉ đặt {@code revoked_at}; chưa đồng ý thì không làm gì. */
    void revoke(UUID userId, ConsentType type);
}
