package com.lingualoop.backend.vocab.service;

/** Định dạng ảnh minh họa của bộ được nhận (BR-BT-13), xác định từ chữ ký tệp. */
public enum DeckImageType {
    JPG("jpg", "image/jpeg"),
    PNG("png", "image/png");

    private final String extension;
    private final String contentType;

    DeckImageType(String extension, String contentType) {
        this.extension = extension;
        this.contentType = contentType;
    }

    public String extension() {
        return extension;
    }

    public String contentType() {
        return contentType;
    }
}
