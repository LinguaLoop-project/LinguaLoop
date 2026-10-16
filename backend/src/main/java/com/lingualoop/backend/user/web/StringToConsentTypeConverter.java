package com.lingualoop.backend.user.web;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.user.enums.ConsentType;

/** Đổi path variable {@code ai_processing} / {@code voice_storage} thành enum; giá trị lạ thành 400 qua GlobalExceptionHandler. */
@Component
class StringToConsentTypeConverter implements Converter<String, ConsentType> {

    @Override
    public ConsentType convert(String source) {
        return ConsentType.fromValue(source)
                .orElseThrow(() -> new IllegalArgumentException("Unknown consent type: " + source));
    }
}
