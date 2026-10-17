package com.lingualoop.backend.audit.entity;

import com.lingualoop.backend.audit.enums.AuditAction;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AuditActionConverter implements AttributeConverter<AuditAction, String> {

    @Override
    public String convertToDatabaseColumn(AuditAction action) {
        return action == null ? null : action.value();
    }

    @Override
    public AuditAction convertToEntityAttribute(String value) {
        return value == null ? null : AuditAction.fromValue(value)
                .orElseThrow(() -> new IllegalStateException("Unknown audit action in DB: " + value));
    }
}
