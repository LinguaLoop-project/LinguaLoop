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

### Khi sinh lại seed

File seed là sản phẩm sinh từ bộ dữ liệu JSON. Khi cần cập nhật, sinh lại rồi nén bằng `gzip -9 -n`
(`-n` để file nén không đổi nếu nội dung không đổi) và commit đè lên file cũ; không thêm migration chứa dữ liệu lớn.
