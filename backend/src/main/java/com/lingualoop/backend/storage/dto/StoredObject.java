package com.lingualoop.backend.storage.dto;

/** Tệp đã nằm trên S3 và đã qua kiểm của {@code FileStorageService#confirmUpload}. */
public record StoredObject(String key, String contentType, long size) {
}
