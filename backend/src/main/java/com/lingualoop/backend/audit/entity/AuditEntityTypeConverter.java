package com.lingualoop.backend.audit.entity;

import com.lingualoop.backend.audit.enums.AuditEntityType;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AuditEntityTypeConverter implements AttributeConverter<AuditEntityType, String> {

    @Override
    public String convertToDatabaseColumn(AuditEntityType type) {
        return type == null ? null : type.value();
    }

    @Override
    public AuditEntityType convertToEntityAttribute(String value) {
        return value == null ? null : AuditEntityType.fromValue(value)
                .orElseThrow(() -> new IllegalStateException("Unknown audit entity type in DB: " + value));
    }
}
