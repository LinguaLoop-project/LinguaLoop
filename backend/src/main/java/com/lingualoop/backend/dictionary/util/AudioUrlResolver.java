package com.lingualoop.backend.dictionary.util;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.config.AudioProperties;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AudioUrlResolver {

    private final AudioProperties audioProperties;

    public String resolve(String path) {
        if (path == null) {
            return null;
        }
        String base = audioProperties.baseUrl();
        if (base == null || base.isBlank()) {
            return path;
        }
        return stripTrailingSlashes(base) + "/" + stripLeadingSlashes(path);
    }

    private static String stripTrailingSlashes(String s) {
        int end = s.length();
        while (end > 0 && s.charAt(end - 1) == '/') {
            end--;
        }
        return s.substring(0, end);
    }

    private static String stripLeadingSlashes(String s) {
        int start = 0;
        while (start < s.length() && s.charAt(start) == '/') {
            start++;
        }
        return s.substring(start);
    }
}
