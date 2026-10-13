package com.lingualoop.backend.lesson.entity;

import com.lingualoop.backend.common.entity.BaseEntity;
import com.lingualoop.backend.lesson.enums.LessonStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "topics")
@Getter
@Setter
public class Topic extends BaseEntity {

    @Column(name = "slug", unique = true, nullable = false)
    private String slug;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "name_vi")
    private String nameVi;

    @Column(name = "tag")
    private String tag;

    @Column(name = "content_type", nullable = false)
    private String contentType = "";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private LessonStatus status = LessonStatus.APPROVED;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "icon")
    private String icon;
}
