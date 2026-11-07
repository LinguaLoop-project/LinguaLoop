package com.lingualoop.backend.vocab.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Nhập các bộ hệ thống khi khởi động nếu bật {@code app.vocab.import-catalog} (biến môi trường
 * {@code APP_VOCAB_IMPORT_CATALOG=true}). Mặc định tắt: từ điển được nạp riêng nên chỉ chạy sau khi nạp từ điển, và
 * chạy lại sau khi từ điển có từ mới để nối thẻ mới vào cuối bộ.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.vocab.import-catalog", havingValue = "true")
class VocabCatalogRunner implements ApplicationRunner {

    private final VocabCatalogImporter importer;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Importing vocab catalog from the dictionary");
        log.info("Vocab catalog import done: {} new cards", importer.importCatalog());
    }
}
