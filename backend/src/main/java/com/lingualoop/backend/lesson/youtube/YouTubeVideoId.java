package com.lingualoop.backend.lesson.youtube;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.regex.Pattern;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

/** Lấy ID 11 ký tự từ link YouTube; chỉ nhận các dạng và tên miền quen thuộc, mọi thứ khác bị từ chối. */
public final class YouTubeVideoId {

    private static final Pattern ID = Pattern.compile("^[0-9A-Za-z_-]{11}$");

    private static final Set<String> HOSTS = Set.of(
            "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "www.youtube-nocookie.com");

    private static final Set<String> PATH_PREFIXES = Set.of("embed", "shorts", "live");

    private YouTubeVideoId() {
    }

    /** @throws BusinessException {@code YOUTUBE_LINK_INVALID} nếu không phải link video YouTube hợp lệ */
    public static String parse(String url) {
        String id = extract(url);
        if (id == null || !ID.matcher(id).matches()) {
            throw new BusinessException(ErrorCode.YOUTUBE_LINK_INVALID);
        }
        return id;
    }

    private static String extract(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.trim();
        URI uri;
        try {
            uri = URI.create(trimmed.contains("://") ? trimmed : "https://" + trimmed);
        } catch (IllegalArgumentException e) {
            return null;
        }
        String scheme = uri.getScheme();
        String host = uri.getHost() == null ? null : uri.getHost().toLowerCase(java.util.Locale.ROOT);
        if (host == null || !("https".equals(scheme) || "http".equals(scheme))) {
            return null;
        }
        String path = uri.getRawPath() == null ? "" : uri.getRawPath();
        if ("youtu.be".equals(host) || "www.youtu.be".equals(host)) {
            return firstSegment(path);
        }
        if (!HOSTS.contains(host)) {
            return null;
        }
        if (path.equals("/watch")) {
            return queryParam(uri.getRawQuery(), "v");
        }
        String[] parts = path.split("/");
        // "/embed/<id>": parts = ["", "embed", "<id>"]
        if (parts.length == 3 && PATH_PREFIXES.contains(parts[1])) {
            return parts[2];
        }
        return null;
    }

    private static String firstSegment(String path) {
        String[] parts = path.split("/");
        return parts.length == 2 ? parts[1] : null;
    }

    private static String queryParam(String rawQuery, String name) {
        if (rawQuery == null) {
            return null;
        }
        for (String pair : rawQuery.split("&")) {
            int eq = pair.indexOf('=');
            if (eq > 0 && pair.substring(0, eq).equals(name)) {
                return URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}
