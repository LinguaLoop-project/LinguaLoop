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
| `dictionary-pos-pronunciations.sql.gz` | phát âm riêng theo loại từ (`pos_pronunciations`) cho 44 từ đồng tự khác âm (present, record, use...), IPA từ Wiktionary; nạp sau từ điển |
| `seed-dictionary.sh` / `seed-dictionary.ps1` | script nạp từ điển (Git Bash/Linux/macOS và PowerShell) |
| `vocabulary-decks.sql.gz` | 8 danh mục, 9 bộ từ hệ thống, 267 phần, 6.748 thẻ kèm IPA và âm thanh Anh, Mỹ; chỉ cần V1 |
| `seed-vocabulary.sh` / `seed-vocabulary.ps1` | script nạp bộ từ vựng |

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
(`ON CONFLICT (id) DO UPDATE`): nạp lại sẽ cập nhật các từ đã có bằng dữ liệu trong seed.

Cột nạp vào: `id`, `headword` (chữ thường, duy nhất), `lemma_id` (NULL với từ gốc), `ipa_uk`, `ipa_us`, `audio_uk`,
`audio_us`, `meanings` (jsonb). Một phần tử của `meanings`:

```json
{"no":1,"pos":"noun","meaning_vi":"...","example_en":"...","example_vi":"..."}
```

`audio_uk` và `audio_us` lưu **key** dạng `audio/<tên-file>.mp3`, không lưu URL; backend ghép với `AUDIO_BASE_URL` khi trả
về cho giao diện. Tệp âm thanh nằm trên S3 dưới `dictionary/audio/`, nên `AUDIO_BASE_URL` là gốc bucket (hoặc CDN) cộng
`dictionary/`, vd `https://<bucket>.s3.<region>.amazonaws.com/dictionary/`. Đổi bucket hay CDN chỉ cần đổi biến này, không
đụng DB. Thư mục `dictionary/audio/` phải cho đọc công khai (hoặc đi qua CDN); thiếu `AUDIO_BASE_URL` thì backend trả
nguyên key và giao diện không phát được âm thanh. Hơn 49.000 tệp trong số này lấy từ `assets.parroto.app` (bên thứ ba) và
đã sao chép về bucket của dự án, tên tệp giữ nguyên của nguồn (ký tự ngoài `A-Za-z0-9._-` đổi thành `_`).

`definition_en` và `definition_vi` chưa có dữ liệu (nguồn chỉ có nghĩa tiếng Việt và ví dụ).

Script nạp tiếp `dictionary-pos-pronunciations.sql.gz`: ghi `pos_pronunciations` cho từ đồng tự khác âm, khoá là `pos` của
nghĩa, vd `{"verb":{"ipa_uk":"/pɹɪˈzɛnt/","ipa_us":"/pɹɪˈzɛnt/"}}`. IPA lấy nguyên từ Wiktionary (dump kaikki.org, qua
`dictionary_words.final.jsonl` của FluentDict); danh sách từ và cách gán IPA cho loại từ chọn tay, lý do ghi ở đầu file.
Chỉ ghi loại từ đọc khác phát âm mặc định; chưa có âm thanh riêng nên `audio_*` để trống (giao diện không phát âm thanh
mặc định cho loại từ đó vì đó là cách đọc khác).

## Nạp bộ từ vựng

Sau V1 và migration `V20261114_1000` (cột `vocab_cards.image_url`): `./seed/seed-vocabulary.sh` (Windows:
`.\seed\seed-vocabulary.ps1`). Cùng cách chọn DB như bài học. Chạy lại an toàn (`ON CONFLICT (id) DO NOTHING`), không đụng
tới tiến độ học. Riêng câu INSERT thẻ dùng `DO UPDATE SET image_url = EXCLUDED.image_url`, nên DB đã nạp bộ từ vựng trước
đó nhận được ảnh khi nạp lại, còn các cột khác của thẻ không bị ghi đè.

Bộ là bộ thư viện hệ thống (`kind = 'library'`, `owner_id` trống, `status = 'published'`). Tên danh mục, bộ và phần lấy bản
tiếng Việt. Thứ tự phần và thẻ theo `created_at` (ghi sẵn mốc tăng dần). Khi chuyển từ bản seed cũ đã bỏ: 70 thẻ trùng từ
trong cùng bộ (giữ thẻ xuất hiện đầu tiên, vì `uq_vocab_cards_word`), nhãn của bộ, mức CEFR. Loại từ ngoài danh sách của
`vocab_cards.pos` (`auxiliary verb`) để trống. Nội dung lấy từ Parroto (`assets.parroto.app`); ảnh và âm thanh đã được sao
chép về bucket S3 của dự án, nên seed lưu **key** chứ không lưu URL của Parroto:

- Âm thanh (`audio_uk_url`, `audio_us_url`): key `audio/<tên-file>.mp3`, dùng chung `AUDIO_BASE_URL` với từ điển (thư mục
  `dictionary/` trên S3, xem phần "Nạp từ điển").
- Ảnh (`vocab_decks.image_url`, `vocab_cards.image_url`): key đầy đủ, ghép với `AWS_S3_PUBLIC_BASE_URL` (gốc bucket hoặc
  CloudFront). Ảnh bìa bộ ở `vocab-decks/system/`, ảnh thẻ ở `vocab-decks/cards/system/`. `system` thay cho id người dùng
  trong cách đặt thư mục của ảnh do giáo viên tải lên (`vocab-decks/<userId>/`, `vocab-decks/cards/<userId>/`); bộ seed không
  có chủ, và backend chỉ cho giáo viên xóa hay ghi đè key nằm dưới thư mục có id của chính họ, nên họ không phá được các tệp này.
- Thẻ `oculist` không có ảnh vì ảnh gốc trên Parroto trả lỗi 503 khi chuyển dữ liệu.
- Tên tệp giữ nguyên của nguồn; ký tự ngoài `A-Za-z0-9._-` (dấu cách, dấu `'`) đổi thành `_`.

## Sinh lại file seed

Nén bằng `gzip -9 -n` (`-n` để file không đổi nếu nội dung không đổi) và commit đè lên file cũ. Không thêm migration chứa
dữ liệu lớn.
