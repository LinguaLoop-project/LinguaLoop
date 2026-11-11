# LinguaLoop Backend

## Dữ liệu mẫu bài học (seed)

Dữ liệu mẫu (25 chủ đề, 1.068 bài, khoảng 29.700 câu) **không** nằm trong Flyway. Flyway chỉ quản lý schema
và dữ liệu tham chiếu nhỏ, nên test và prod không phải chạy hàng chục MB SQL.

Seed nằm ở `backend/seed/` (nén `.sql.gz`, khoảng 6,5MB):

| File | Nội dung |
|---|---|
| `lessons-1-topics-and-lessons.sql.gz` | chủ đề, bài học, icon chủ đề |
| `lessons-2-sentences.sql.gz` | câu transcript kèm IPA Mỹ (`ipa_us`) và IPA Anh (`ipa_uk`) |
| `seed-lessons.sh` / `seed-lessons.ps1` | script nạp |

### Nạp vào DB local

```bash
docker compose up -d postgres
./mvnw spring-boot:run          # để Flyway tạo schema trước, rồi dừng lại
./seed/seed-lessons.sh          # Windows: .\seed\seed-lessons.ps1
```

- Mặc định nạp vào container `postgres` của `compose.yaml`. Muốn nạp DB khác: đặt `DATABASE_URL`
  (dạng `postgresql://user:pass@host:5432/db`, cần có `psql`).
- Các câu lệnh dùng `ON CONFLICT (id) DO NOTHING` nên chạy lại nhiều lần vẫn an toàn.
- Prod/Neon **không** tự nạp seed; muốn nạp thì chạy script có chủ đích.

### Dữ liệu từ điển

Bảng `dictionary_words` (157.644 từ: nghĩa tiếng Việt, ví dụ, phiên âm Mỹ và Anh; nguồn `tflat`) nạp bằng
`./seed/seed-dictionary.sh` (Windows: `.\seed\seed-dictionary.ps1`) từ `seed/dictionary-words.sql.gz`, giống bài học. Chỉ cần V1.

DB mới tạo hoặc vừa reset (`docker compose down -v`) sẽ **không có** từ điển cho đến khi nạp lại. Khi bảng rỗng, các nơi tra
từ (popup ở bài học và nghe chép, mục "Từ điển" ở Shadowing) hiện "Từ điển chưa có từ ..." và phần còn lại vẫn chạy bình thường.

### Bộ từ vựng hệ thống

Bộ từ vựng là dữ liệu riêng, **không phụ thuộc từ điển** (ADR 0010). Nạp một lần bằng script, giống seed bài học:

```bash
./seed/seed-vocabulary.sh        # Windows PowerShell: ./seed/seed-vocabulary.ps1
# DB khác: đặt DATABASE_URL=postgresql://... trước khi chạy
```

Seed (`seed/vocabulary-decks.sql.gz`) gồm 9 bộ (Thông dụng, Oxford 3000 A1 và A2, TOEIC, IELTS, TOEFL, Tết), 267 phần
(nhóm chủ đề) và 6.748 thẻ kèm IPA và âm thanh Anh, Mỹ. Chạy lại được: các câu lệnh dùng `ON CONFLICT (id) DO NOTHING`, không
tạo trùng và không đụng tới tiến độ học. Ứng dụng không tự nạp khi khởi động nên prod/Neon chỉ có bộ từ khi bạn chạy script.
Chi tiết và những gì đã bỏ khi chuyển sang schema V1: xem [seed/README.md](seed/README.md).

### Khi sinh lại seed

File seed là sản phẩm sinh từ bộ dữ liệu JSON. Khi cần cập nhật, sinh lại rồi nén bằng `gzip -9 -n`
(`-n` để file nén không đổi nếu nội dung không đổi) và commit đè lên file cũ; không thêm migration chứa dữ liệu lớn.
