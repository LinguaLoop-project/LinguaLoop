package com.lingualoop.backend.vocab.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.vocab.service.CardSheetReader.Column;
import com.lingualoop.backend.vocab.service.CardSheetReader.SheetRow;

/** Đọc tệp nhập thẻ theo BR-NT-07: tách CSV, khớp tên cột, số dòng và các lỗi tệp. */
class CardSheetReaderTest {

    private final CardSheetReader reader = new CardSheetReader();

    private List<SheetRow> readCsv(String text) {
        return reader.read("the.CSV", text.getBytes(StandardCharsets.UTF_8));
    }

    private static String reasonOf(Throwable ex) {
        BusinessException be = (BusinessException) ex;
        assertThat(be.getErrorCode()).isEqualTo(ErrorCode.VOCAB_IMPORT_FILE_INVALID);
        return (String) be.getDetails().get("reason");
    }

    @Test
    void parseCsv_quotedFieldsWithCommaQuoteAndNewline() {
        List<List<String>> table = CardSheetReader.parseCsv("a,\"b, c\",\"say \"\"hi\"\"\"\r\n\"x\ny\",,z");

        assertThat(table).containsExactly(List.of("a", "b, c", "say \"hi\""), List.of("x\ny", "", "z"));
    }

    @Test
    void parseCsv_unclosedQuote_rejectedAsFormat() {
        assertThatThrownBy(() -> CardSheetReader.parseCsv("a,\"b"))
                .satisfies(ex -> assertThat(reasonOf(ex)).isEqualTo("FORMAT"));
    }

    @Test
    void read_csvWithBomAndReorderedColumns_mapsByHeaderName() {
        List<SheetRow> rows = readCsv(CardSheetReader.BOM + "  nghĩa TIẾNG việt ,Từ vựng,Cột lạ\nduy trì,sustain,x\n");

        assertThat(rows).hasSize(1);
        assertThat(rows.getFirst().get(Column.WORD)).isEqualTo("sustain");
        assertThat(rows.getFirst().get(Column.MEANING_VI)).isEqualTo("duy trì");
        assertThat(rows.getFirst().get(Column.POS)).isNull();
    }

    @Test
    void read_blankRowsSkipped_lineNumbersMatchSpreadsheetRows() {
        List<SheetRow> rows = readCsv("Từ vựng,Nghĩa tiếng Việt\napple,táo\n,\nbanana,chuối");

        assertThat(rows).extracting(SheetRow::line).containsExactly(2, 4);
    }

    @Test
    void read_missingRequiredColumn_rejected() {
        assertThatThrownBy(() -> readCsv("Từ vựng,Loại từ\napple,danh từ"))
                .satisfies(ex -> assertThat(reasonOf(ex)).isEqualTo("MISSING_COLUMNS"));
    }

    @Test
    void read_headerOnly_rejectedAsEmpty() {
        assertThatThrownBy(() -> readCsv("Từ vựng,Nghĩa tiếng Việt\n\n"))
                .satisfies(ex -> assertThat(reasonOf(ex)).isEqualTo("EMPTY"));
    }

    @Test
    void read_invalidUtf8OrOtherExtensionOrFakeXlsx_rejectedAsFormat() {
        byte[] latin1 = "Từ vựng,Nghĩa tiếng Việt\ncafé,cà phê".getBytes(StandardCharsets.ISO_8859_1);

        assertThatThrownBy(() -> reader.read("the.csv", latin1))
                .satisfies(ex -> assertThat(reasonOf(ex)).isEqualTo("FORMAT"));
        assertThatThrownBy(() -> reader.read("the.txt", "x".getBytes(StandardCharsets.UTF_8)))
                .satisfies(ex -> assertThat(reasonOf(ex)).isEqualTo("FORMAT"));
        assertThatThrownBy(() -> reader.read("the.xlsx", "not a zip".getBytes(StandardCharsets.UTF_8)))
                .satisfies(ex -> assertThat(reasonOf(ex)).isEqualTo("FORMAT"));
    }

    @Test
    void read_templateFiles_roundTripExampleRow() {
        CardImportTemplate template = new CardImportTemplate();

        for (List<SheetRow> rows : List.of(reader.read("mau.csv", template.csv()),
                reader.read("mau.xlsx", template.xlsx()))) {
            assertThat(rows).hasSize(1);
            SheetRow row = rows.getFirst();
            assertThat(row.line()).isEqualTo(2);
            assertThat(row.get(Column.WORD)).isEqualTo("sustain");
            assertThat(row.get(Column.EXAMPLE_VI)).isEqualTo(CardImportTemplate.EXAMPLE.getLast());
            assertThat(CardPos.fromCell(row.get(Column.POS))).contains("verb");
        }
    }
}
