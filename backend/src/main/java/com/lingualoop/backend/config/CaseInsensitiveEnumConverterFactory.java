package com.lingualoop.backend.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.converter.ConverterFactory;

/**
 * Đổi tham số request ({@code @RequestParam}, {@code @PathVariable}) sang enum không phân biệt hoa thường, để API
 * dùng giá trị chữ thường ({@code student}, {@code locked}) mà enum vẫn đặt tên theo chuẩn Java. Giá trị không khớp ném
 * {@link IllegalArgumentException}, Spring trả 400 {@code BAD_REQUEST}.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
final class CaseInsensitiveEnumConverterFactory implements ConverterFactory<String, Enum> {

    @Override
    public <T extends Enum> Converter<String, T> getConverter(Class<T> targetType) {
        return source -> {
            String value = source.trim();
            if (value.isEmpty()) {
                return null;
            }
            for (T constant : targetType.getEnumConstants()) {
                if (constant.name().equalsIgnoreCase(value)) {
                    return constant;
                }
            }
            throw new IllegalArgumentException("No enum constant " + targetType.getSimpleName() + "." + value);
        };
    }
}
