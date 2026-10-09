# LinguaLoop Backend

## Database Migrations & Seeds

Dự án sử dụng Flyway để quản lý migrations và nạp dữ liệu mẫu (seeds).

### Dữ liệu mẫu (Seed Data)

Dữ liệu bài học mẫu được đặt trực tiếp trong thư mục `src/main/resources/db/migration/`:
- `V20261009_1000__seed_topics_lessons.sql`
- `V20261009_1001__seed_sentences.sql`

Các file này có tổng dung lượng khoảng 37MB.

**Lưu ý cho Team:**
- Khi chạy `docker compose up` hoặc khởi động Spring Boot lần đầu, Flyway sẽ tự động thực thi các file này để nạp 25 chủ đề, 1.712 bài học và hơn 45.000 câu vào database cục bộ.
- Quá trình này có thể mất thêm một chút thời gian ở lần chạy đầu tiên.
- Các lệnh trong file seed đã sử dụng cơ chế `ON CONFLICT DO UPDATE`, nên an toàn khi chạy lại nhiều lần (idempotent).
- Nếu dữ liệu trên database Neon đã được nhập thủ công và bạn không muốn ghi đè chúng, hãy đánh dấu các phiên bản migration này là đã chạy bằng cách:
  - Sử dụng Flyway CLI: `flyway repair`
  - Hoặc thêm thuộc tính `spring.flyway.skip-executing-migrations=true` (hoặc tương tự) cho riêng các file này khi cần bảo lưu dữ liệu.

**Phát triển tiếp theo:**
Khi tạo các bảng/cột mới cần thay đổi schema của `topics`, `lessons`, hay `sentences`, vui lòng:
1. Đảm bảo phiên bản (version prefix) của migration script MỚI phải đứng TRƯỚC (nhỏ hơn) `V20261009_1000...` nếu muốn áp dụng cấu trúc mới trước khi seed chạy. Hoặc lớn hơn nếu là script cập nhật cấu trúc / dữ liệu sinh ra sau khi đã seed. 
2. Tránh chỉnh sửa trực tiếp nội dung file seed lớn để hạn chế phình dung lượng git.
