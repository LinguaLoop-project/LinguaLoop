# Dữ liệu nạp ngoài Flyway

Flyway chỉ nạp dữ liệu tham chiếu nhỏ (V2: 44 âm vị, cấu hình credit, 2 tài khoản dev). Dữ liệu lớn nạp bằng script ở đây
sau khi DB đã chạy V1 và V2.

## Bài học

`seed-lessons.sh` (hoặc `.ps1`) nạp `01_topics_lessons.sql.gz` rồi `02_sentences.sql.gz`. Mọi bài thuộc giáo viên hệ thống
`00000000-0000-0000-0000-000000000002` (seed trong V2). Chỉ nạp một lần.

## Từ điển (`dictionary_words`)

Script nạp từ điển nằm ngoài repo. Dữ liệu nạp vào cần các cột sau, các cột còn lại có mặc định:

| Cột | Ghi chú |
|---|---|
| `headword` | chữ thường, đã trim, duy nhất |
| `lemma_id` | trỏ về từ gốc ("went" -> "go"), NULL với từ gốc; nạp từ gốc trước hoặc trong cùng giao dịch (khoá ngoại hoãn kiểm tra) |
| `ipa_uk`, `ipa_us`, `audio_uk`, `audio_us` | tuỳ chọn |
| `meanings` | jsonb, mặc định `[]` |

Dạng một phần tử của `meanings`:

```json
{"no":1,"pos":"noun","meaning_vi":"...","definition_en":"...","definition_vi":"...","example_en":"...","example_vi":"..."}
```

`dictionary_words` không còn cột `cefr_level`, `pos_pronunciations`, `source`, `created_at`, `updated_at`.
