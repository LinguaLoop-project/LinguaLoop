package com.lingualoop.backend.vocab.entity;

import com.lingualoop.backend.common.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Danh mục bộ thẻ do quản trị viên quản lý (UC-CD-04 đến 06). {@code created_at} là thứ tự hiển thị: thêm mới đứng cuối
 * danh sách (BR-CD-03); {@code updated_at} là ngày cập nhật, đổi khi sửa tên.
 */
@Entity
@Table(name = "deck_categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DeckCategory extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    public static DeckCategory named(String name) {
        DeckCategory category = new DeckCategory();
        category.name = name;
        return category;
    }

    public void rename(String name) {
        this.name = name;
    }
}
