package com.lingualoop.backend.shadowing.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.Map;
import java.util.Optional;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Mẹo sửa phát âm tiếng Việt theo âm đích, đọc một lần từ tệp tĩnh {@code pronunciation-tips.json} (khóa là ký hiệu
 * trong bảng {@code phonemes}). Mẹo không nằm trong DB: đổi mẹo là sửa tệp này rồi triển khai lại. Mẹo hiển thị cho cả
 * gói Free lẫn Pro; âm chưa có mẹo thì không hiện gì.
 */
@Component
public class PhonemeTips {

    static final String RESOURCE = "pronunciation-tips.json";

    private final Map<String, String> tips;

    public PhonemeTips() {
        try (InputStream in = new ClassPathResource(RESOURCE).getInputStream()) {
            this.tips = Map.copyOf(new ObjectMapper().readValue(in, new TypeReference<Map<String, String>>() {
            }));
        } catch (IOException e) {
            throw new UncheckedIOException("Không đọc được " + RESOURCE, e);
        }
    }

    public Optional<String> tipFor(String symbol) {
        return symbol == null ? Optional.empty() : Optional.ofNullable(tips.get(symbol));
    }

    /** Toàn bộ ký hiệu có mẹo, để kiểm tra độ phủ so với bảng phonemes. */
    public Map<String, String> all() {
        return tips;
    }
}
