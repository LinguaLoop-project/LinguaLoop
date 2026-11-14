package com.lingualoop.backend.vocab.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.vocab.service.CardSheetReader.Column;

/**
 * Tệp mẫu nhập thẻ (UC-NT-07 luồng 5a, AC-NT-49): đủ các cột của {@link Column} theo thứ tự và một dòng ví dụ. Tệp CSV
 * có BOM UTF-8 để Excel mở đúng tiếng Việt; {@link CardSheetReader} bỏ BOM khi đọc.
 */
@Component
class CardImportTemplate {

    /** Dòng ví dụ, cùng thứ tự với {@link Column}. */
    static final List<String> EXAMPLE = List.of("sustain", "duy trì", "/səˈsteɪn/", "/səˈsteɪn/", "động từ",
            "to keep something going over time", "giữ cho điều gì tiếp tục theo thời gian",
            "We need to sustain economic growth.", "Chúng ta cần duy trì tăng trưởng kinh tế.");

    byte[] csv() {
        String header = Stream.of(Column.values()).map(c -> c.header).map(CardImportTemplate::csvField)
                .collect(Collectors.joining(","));
        String example = EXAMPLE.stream().map(CardImportTemplate::csvField).collect(Collectors.joining(","));
        return (CardSheetReader.BOM + header + "\r\n" + example + "\r\n").getBytes(StandardCharsets.UTF_8);
    }

    byte[] xlsx() {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("The tu vung");
            XSSFCellStyle bold = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            bold.setFont(font);
            Row header = sheet.createRow(0);
            Row example = sheet.createRow(1);
            Column[] columns = Column.values();
            for (int i = 0; i < columns.length; i++) {
                header.createCell(i).setCellValue(columns[i].header);
                header.getCell(i).setCellStyle(bold);
                example.createCell(i).setCellValue(EXAMPLE.get(i));
                sheet.setColumnWidth(i, 24 * 256);
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    private static String csvField(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
