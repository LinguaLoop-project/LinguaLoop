package com.lingualoop.backend.audit.entity;

import com.lingualoop.backend.security.Role;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AuditActorRoleConverter implements AttributeConverter<Role, String> {

    @Override
    public String convertToDatabaseColumn(Role role) {
        return role == null ? null : role.value();
    }

    @Override
    public Role convertToEntityAttribute(String value) {
        return value == null ? null : Role.fromValue(value)
                .orElseThrow(() -> new IllegalStateException("Unknown actor role in DB: " + value));
    }
}
