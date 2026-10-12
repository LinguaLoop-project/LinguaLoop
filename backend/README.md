# LinguaLoop Backend

## Dữ liệu mẫu bài học (seed)

Dữ liệu mẫu (25 chủ đề, 1.712 bài, hơn 45.000 câu) **không** nằm trong Flyway. Flyway chỉ quản lý schema
và dữ liệu tham chiếu nhỏ, nên test và prod không phải chạy hàng chục MB SQL.

Seed nằm ở `backend/seed/` (nén `.sql.gz`, khoảng 6,5MB):

| File | Nội dung |
|---|---|
| `01_topics_lessons.sql.gz` | chủ đề, bài học, icon chủ đề |
| `02_sentences.sql.gz` | câu transcript kèm IPA |
| `seed-lessons.sh` / `seed-lessons.ps1` | script nạp |

### Nạp vào DB local

```bash
docker compose up -d postgres
./mvnw spring-boot:run          # để Flyway tạo schema trước, rồi dừng lại
./seed/seed-lessons.sh          # Windows: .\seed\seed-lessons.ps1
```

- Mặc định nạp vào container `postgres` của `compose.yaml`. Muốn nạp DB khác: đặt `DATABASE_URL`
  (dạng `postgresql://user:pass@host:5432/db`, cần có `psql`).
- Các câu lệnh dùng `ON CONFLICT DO UPDATE` nên chạy lại nhiều lần vẫn an toàn.
- Prod/Neon **không** tự nạp seed; muốn nạp thì chạy script có chủ đích.

### Máy đã từng chạy các migration seed cũ

Nhánh `feat/lesson-library` từng có `V20261009_1000`, `V20261009_1001`, `V20261009_1002`. Nếu DB local của bạn
đã chạy chúng, Flyway sẽ báo "applied migration not resolved locally". Cách xử lý đơn giản nhất:
`docker compose down -v && docker compose up -d` rồi nạp lại như trên.

### Khi sinh lại seed

File seed là sản phẩm sinh từ bộ dữ liệu JSON. Khi cần cập nhật, sinh lại rồi nén bằng `gzip -9 -n`
(`-n` để file nén không đổi nếu nội dung không đổi) và commit đè lên file cũ; không thêm migration chứa dữ liệu lớn.
