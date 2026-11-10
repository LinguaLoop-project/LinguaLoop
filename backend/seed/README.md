# Dữ liệu mẫu ngoài Flyway

Flyway chỉ nạp dữ liệu tham chiếu nhỏ (V2: 44 âm vị, cấu hình credit AI, 2 tài khoản dev). Dữ liệu lớn nạp bằng script ở
đây, **sau khi** DB đã chạy V1 và V2.

## Các file

| File | Nội dung |
|---|---|
| `lessons-1-topics-and-lessons.sql.gz` | 25 chủ đề và 1.068 bài học (bước 1) |
| `lessons-2-sentences.sql.gz` | khoảng 29.700 câu transcript kèm IPA Mỹ và Anh (bước 2, cần bước 1 xong trước vì câu trỏ tới bài) |
| `seed-lessons.sh` | script nạp cho Linux, macOS, Git Bash |
| `seed-lessons.ps1` | script nạp cho Windows PowerShell |
| `dictionary-words.sql.gz` | 157.644 từ điển (`dictionary_words`), chỉ cần V1; độc lập với bài học |
| `seed-dictionary.sh` / `seed-dictionary.ps1` | script nạp từ điển (Git Bash/Linux/macOS và PowerShell) |

Số trong tên file là thứ tự nạp. Script tự nạp đúng thứ tự, không cần chạy từng file.

## Nạp bài học vào DB local

1. Bật Postgres: `docker compose up -d postgres` (trong thư mục `backend/`).
2. Chạy backend một lần để Flyway tạo schema (V1, V2), rồi dừng: `./mvnw spring-boot:run`.
3. Nạp: `./seed/seed-lessons.sh` (Windows: `.\seed\seed-lessons.ps1`).

Mặc định script nạp vào container `postgres` của `compose.yaml`. Muốn nạp DB khác, đặt `DATABASE_URL`
(dạng `postgresql://user:pass@host:5432/db`, cần có `psql`).

Chạy lại an toàn: câu lệnh dùng `ON CONFLICT (id) DO NOTHING`, nên không nạp trùng.

Mọi bài thuộc giáo viên hệ thống `00000000-0000-0000-0000-000000000002` (tài khoản `teacher@lingualoop.local`, seed trong
V2). Prod không tự nạp seed; chỉ chạy script khi có chủ đích.

## Nạp từ điển

Sau V1: `./seed/seed-dictionary.sh` (Windows: `.\seed\seed-dictionary.ps1`). Cùng cách chọn DB như bài học (`DATABASE_URL`).
Một giao dịch duy nhất; khoá ngoại `lemma_id` hoãn kiểm tra tới COMMIT nên không cần sắp thứ tự từ gốc. Chạy lại an toàn
(`ON CONFLICT DO NOTHING`).

Cột nạp vào: `id`, `headword` (chữ thường, duy nhất), `lemma_id` (NULL với từ gốc), `ipa_uk`, `ipa_us`, `audio_uk`,
`audio_us`, `meanings` (jsonb). Một phần tử của `meanings`:

```json
{"no":1,"pos":"noun","meaning_vi":"...","example_en":"...","example_vi":"..."}
```

`definition_en` và `definition_vi` chưa có dữ liệu (nguồn chỉ có nghĩa tiếng Việt và ví dụ).

## Sinh lại file seed

Nén bằng `gzip -9 -n` (`-n` để file không đổi nếu nội dung không đổi) và commit đè lên file cũ. Không thêm migration chứa
dữ liệu lớn.
