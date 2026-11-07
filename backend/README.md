# LinguaLoop Backend

## Dữ liệu mẫu bài học (seed)

Dữ liệu mẫu (25 chủ đề, 1.712 bài, hơn 45.000 câu) **không** nằm trong Flyway. Flyway chỉ quản lý schema
và dữ liệu tham chiếu nhỏ, nên test và prod không phải chạy hàng chục MB SQL.

Seed nằm ở `backend/seed/` (nén `.sql.gz`, khoảng 6,5MB):

| File | Nội dung |
|---|---|
| `01_topics_lessons.sql.gz` | chủ đề, bài học, icon chủ đề |
| `02_sentences.sql.gz` | câu transcript kèm IPA Mỹ (`ipa_us`) và IPA Anh (`ipa_uk`) |
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

### Dữ liệu từ điển (không nằm trong repo)

Bảng `dictionary_words` (khoảng 157.000 từ: nghĩa tiếng Việt, ví dụ, phiên âm Mỹ và Anh, mức CEFR; nguồn `tflat`) **không**
có trong seed và không được commit: dữ liệu 66MB, nguồn có thể có bản quyền, còn repo này công khai. File nằm ở thư mục
`CrawlLesson/seed-dictionary/` của nhóm (`dictionary_words.final.jsonl` và `import_words.py`); hỏi người phụ trách từ điển
nếu chưa có.

```bash
pip install "psycopg[binary]"
export DATABASE_URL=postgresql://lingualoop:lingualoop@localhost:5432/lingualoop
python import_words.py dictionary_words.final.jsonl --init      # --truncate để nạp lại (xoá bảng trước)
```

DB mới tạo hoặc vừa reset (`docker compose down -v`) sẽ **không có** từ điển cho đến khi nạp lại. Khi bảng rỗng, các nơi tra
từ (popup ở bài học và nghe chép, mục "Từ điển" ở Shadowing) hiện "Từ điển chưa có từ ..." và phần còn lại vẫn chạy bình thường.

### Bộ từ hệ thống (Oxford A1 đến C2)

Các bộ từ được sinh từ `dictionary_words` nên chỉ chạy **sau khi nạp từ điển**. Bật lệnh nhập khi khởi động backend, một lần:

```bash
APP_VOCAB_IMPORT_CATALOG=true ./mvnw spring-boot:run     # Windows PowerShell: $env:APP_VOCAB_IMPORT_CATALOG='true'
```

Mỗi mức CEFR một bộ (`oxford-a1` đến `oxford-c2`) gồm các mục từ gốc xếp theo bảng chữ cái, 20 thẻ một phần, mỗi thẻ lấy nghĩa
có số nhỏ nhất; B2, C1, C2 là bộ Pro. Chạy lại được: từ đã có thẻ thì bỏ qua, từ mới của từ điển được nối vào cuối bộ, nội dung
thẻ đã có không bị ghi đè. Với từ điển đầy đủ khoảng 8.500 thẻ, mất vài giây. Mặc định tắt (biến không đặt) nên prod/Neon
không tự nhập.

### Khi sinh lại seed

File seed là sản phẩm sinh từ bộ dữ liệu JSON. Khi cần cập nhật, sinh lại rồi nén bằng `gzip -9 -n`
(`-n` để file nén không đổi nếu nội dung không đổi) và commit đè lên file cũ; không thêm migration chứa dữ liệu lớn.
