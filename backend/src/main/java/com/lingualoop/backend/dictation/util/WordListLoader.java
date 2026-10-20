package com.lingualoop.backend.dictation.util;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.core.io.ClassPathResource;

/** Đọc file danh sách từ trên classpath: mỗi dòng một mục, bỏ dòng trống và dòng chú thích bắt đầu bằng .. */
public final class WordListLoader {

    private WordListLoader() {
    }

    public static List<String> load(String classpathResource) {
        try (InputStream in = new ClassPathResource(classpathResource).getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8).lines()
                    .map(String::trim)
                    .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                    .toList();
        } catch (IOException e) {
            throw new IllegalStateException("Could not read word list: " + classpathResource, e);
        }
    }
}
