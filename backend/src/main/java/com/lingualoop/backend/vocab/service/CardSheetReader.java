package com.lingualoop.backend.vocab.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

/**
 * Đọc tệp nhập thẻ Excel (.xlsx, trang tính đầu tiên) hoặc CSV (UTF-8, phân cách dấu phẩy) theo mẫu (BR-NT-07). Dòng
 * đầu là tên cột; dòng hoàn toàn trống bị bỏ qua. Số dòng của mỗi dòng dữ liệu là số dòng khi mở tệp bằng Excel (dòng
 * tên cột là dòng 1). Tệp sai định dạng, thiếu cột bắt buộc hoặc không có dòng dữ liệu ném
 * {@code VOCAB_IMPORT_FILE_INVALID} với {@code details.reason} là {@code FORMAT}, {@code MISSING_COLUMNS} hoặc
 * {@code EMPTY}.
 */
@Component
class CardSheetReader {

    static final String REASON_FORMAT = "FORMAT";
    static final String REASON_MISSING_COLUMNS = "MISSING_COLUMNS";
    static final String REASON_EMPTY = "EMPTY";

    /** Dấu thứ tự byte UTF-8 ở đầu tệp CSV do Excel lưu. */
    static final char BOM = (char) 0xFEFF;

    private static final byte[] ZIP_MAGIC = {0x50, 0x4B, 0x03, 0x04};

    /** Các cột của tệp mẫu theo thứ tự; hai cột đầu bắt buộc. */
    enum Column {
        WORD("Từ vựng", true),
        MEANING_VI("Nghĩa tiếng Việt", true),
        IPA_UK("Phiên âm UK", false),
        IPA_US("Phiên âm US", false),
        POS("Loại từ", false),
        DEFINITION_EN("Định nghĩa (tiếng Anh)", false),
        DEFINITION_VI("Định nghĩa (tiếng Việt)", false),
        EXAMPLE_EN("Ví dụ (tiếng Anh)", false),
        EXAMPLE_VI("Ví dụ (tiếng Việt)", false);

        final String header;
        final boolean required;

        Column(String header, boolean required) {
            this.header = header;
            this.required = required;
        }
    }

    /** Một dòng dữ liệu: số dòng trong tệp và giá trị theo cột (cột không có trong tệp thì không có khóa). */
    record SheetRow(int line, Map<Column, String> values) {

        SheetRow {
            values = Map.copyOf(values);
        }

        String get(Column column) {
            return values.get(column);
        }
    }

    List<SheetRow> read(String filename, byte[] content) {
        String name = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        List<List<String>> table;
        List<Integer> lines = new ArrayList<>();
        if (name.endsWith(".xlsx")) {
            table = readXlsx(content, lines);
        } else if (name.endsWith(".csv")) {
            table = readCsv(content, lines);
        } else {
            throw invalid(REASON_FORMAT);
        }
        if (table.isEmpty()) {
            throw invalid(REASON_EMPTY);
        }
        Map<Column, Integer> indexes = headerIndexes(table.getFirst());
        List<SheetRow> rows = new ArrayList<>();
        for (int i = 1; i < table.size(); i++) {
            List<String> cells = table.get(i);
            if (cells.stream().allMatch(c -> c == null || c.isBlank())) {
                continue;
            }
            Map<Column, String> values = new EnumMap<>(Column.class);
            indexes.forEach((column, index) -> values.put(column, index < cells.size() ? cells.get(index) : ""));
            rows.add(new SheetRow(lines.get(i), values));
        }
        if (rows.isEmpty()) {
            throw invalid(REASON_EMPTY);
        }
        return rows;
    }

    /** Vị trí của từng cột mẫu trong dòng tên cột; tên cột so khớp không phân biệt hoa thường và khoảng trắng thừa. */
    private static Map<Column, Integer> headerIndexes(List<String> header) {
        Map<String, Integer> byName = new HashMap<>();
        for (int i = 0; i < header.size(); i++) {
            byName.putIfAbsent(normalize(header.get(i)), i);
        }
        Map<Column, Integer> indexes = new EnumMap<>(Column.class);
        List<String> missing = new ArrayList<>();
        for (Column column : Column.values()) {
            Integer index = byName.get(normalize(column.header));
            if (index != null) {
                indexes.put(column, index);
            } else if (column.required) {
                missing.add(column.header);
            }
        }
        if (!missing.isEmpty()) {
            throw new BusinessException(ErrorCode.VOCAB_IMPORT_FILE_INVALID,
                    Map.of("reason", REASON_MISSING_COLUMNS, "missingColumns", missing));
        }
        return indexes;
    }

    private static String normalize(String text) {
        if (text == null) {
            return "";
        }
        return Normalizer.normalize(text, Normalizer.Form.NFC).strip().replaceAll("\\s+", " ")
                .toLowerCase(Locale.ROOT);
    }

    // ------------------------------------------------------------------ Excel

    private static List<List<String>> readXlsx(byte[] content, List<Integer> lines) {
        if (content.length < ZIP_MAGIC.length || !Arrays.equals(content, 0, ZIP_MAGIC.length, ZIP_MAGIC, 0,
                ZIP_MAGIC.length)) {
            throw invalid(REASON_FORMAT);
        }
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(content))) {
            if (workbook.getNumberOfSheets() == 0) {
                return List.of();
            }
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();
            List<List<String>> table = new ArrayList<>();
            for (Row row : sheet) {
                List<String> cells = new ArrayList<>();
                for (int c = 0; c < Math.max(row.getLastCellNum(), 0); c++) {
                    Cell cell = row.getCell(c);
                    cells.add(cell == null ? "" : formatter.formatCellValue(cell));
                }
                if (table.isEmpty() && cells.stream().allMatch(String::isBlank)) {
                    continue;
                }
                table.add(cells);
                lines.add(row.getRowNum() + 1);
            }
            return table;
        } catch (IOException | RuntimeException ex) {
            throw invalid(REASON_FORMAT);
        }
    }

    // ------------------------------------------------------------------ CSV

    private static List<List<String>> readCsv(byte[] content, List<Integer> lines) {
        String text;
        try {
            text = StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(content)).toString();
        } catch (CharacterCodingException ex) {
            throw invalid(REASON_FORMAT);
        }
        List<List<String>> table = parseCsv(text);
        for (int i = 0; i < table.size(); i++) {
            lines.add(i + 1);
        }
        return table;
    }

    /**
     * Tách CSV theo RFC 4180: phân cách dấu phẩy, ô có dấu phẩy, xuống dòng hoặc dấu nháy kép được bọc trong nháy kép,
     * nháy kép trong ô viết thành hai nháy kép. Bỏ BOM đầu tệp. Nháy kép mở mà không đóng ném lỗi định dạng.
     */
    static List<List<String>> parseCsv(String text) {
        List<List<String>> records = new ArrayList<>();
        List<String> fields = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean quoted = false;
        boolean wasQuoted = false;
        int i = !text.isEmpty() && text.charAt(0) == BOM ? 1 : 0;
        while (i < text.length()) {
            char c = text.charAt(i);
            if (quoted) {
                if (c == '"' && i + 1 < text.length() && text.charAt(i + 1) == '"') {
                    field.append('"');
                    i++;
                } else if (c == '"') {
                    quoted = false;
                } else {
                    field.append(c);
                }
            } else if (c == '"' && field.isEmpty() && !wasQuoted) {
                quoted = true;
                wasQuoted = true;
            } else if (c == ',') {
                fields.add(field.toString());
                field.setLength(0);
                wasQuoted = false;
            } else if (c == '\n') {
                fields.add(field.toString());
                records.add(fields);
                fields = new ArrayList<>();
                field.setLength(0);
                wasQuoted = false;
            } else if (c != '\r') {
                field.append(c);
            }
            i++;
        }
        if (quoted) {
            throw invalid(REASON_FORMAT);
        }
        if (!field.isEmpty() || !fields.isEmpty() || wasQuoted) {
            fields.add(field.toString());
            records.add(fields);
        }
        return records;
    }

    private static BusinessException invalid(String reason) {
        return new BusinessException(ErrorCode.VOCAB_IMPORT_FILE_INVALID, Map.of("reason", reason));
    }
}
