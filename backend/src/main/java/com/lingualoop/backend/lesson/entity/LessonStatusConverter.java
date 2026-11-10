package com.lingualoop.backend.lesson.entity;

import com.lingualoop.backend.lesson.enums.LessonStatus;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Lưu {@link LessonStatus} dưới dạng chữ thường như CHECK của cột {@code lessons.status}. */
@Converter
public class LessonStatusConverter implements AttributeConverter<LessonStatus, String> {

    @Override
    public String convertToDatabaseColumn(LessonStatus status) {
        return status == null ? null : status.value();
    }

    @Override
    public LessonStatus convertToEntityAttribute(String value) {
        return value == null ? null : LessonStatus.fromValue(value);
    }
}
