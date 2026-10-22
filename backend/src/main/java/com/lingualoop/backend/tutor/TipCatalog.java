package com.lingualoop.backend.tutor;

import java.util.Optional;

/** Mẹo sửa phát âm theo âm đích (ký hiệu bảng phonemes), cho người học Việt. */
public interface TipCatalog {

    /** Không có âm vị (từ bị bỏ sót) hoặc âm chưa có mẹo thì rỗng. */
    Optional<String> tipFor(String phoneme);
}
