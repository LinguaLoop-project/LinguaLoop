package com.lingualoop.backend.lesson.entity;

import com.lingualoop.backend.common.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Chủ đề bài học do quản trị viên quản lý (UC-CD-01 đến 03). {@code created_at} là thứ tự hiển thị: thêm mới đứng cuối
 * danh sách (BR-CD-03); {@code updated_at} là ngày cập nhật, đổi khi sửa tên.
 */
@Entity
@Table(name = "topics")
@Getter
@Setter
public class Topic extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    public static Topic named(String name) {
        Topic topic = new Topic();
        topic.name = name;
        return topic;
    }
}
