package com.lingualoop.backend.user.entity;

import com.lingualoop.backend.user.enums.ConsentType;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class ConsentTypeConverter implements AttributeConverter<ConsentType, String> {

    @Override
    public String convertToDatabaseColumn(ConsentType type) {
        return type == null ? null : type.value();
    }

    @Override
    public ConsentType convertToEntityAttribute(String value) {
        return value == null ? null : ConsentType.fromValue(value)
                .orElseThrow(() -> new IllegalStateException("Unknown consent type in DB: " + value));
    }
}
