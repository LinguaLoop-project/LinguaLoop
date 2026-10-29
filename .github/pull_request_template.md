## 1. Mô tả

<!-- Nêu vấn đề cần giải quyết và kết quả mong muốn. -->

## 2. Thay đổi chính

<!-- Liệt kê các thay đổi quan trọng, module và quyết định kỹ thuật liên quan. -->

## 3. Cách kiểm tra

### Backend

- [ ] Đã chạy `./mvnw verify`
- [ ] Đã kiểm tra các trường hợp biên liên quan
- [ ] Đã kiểm tra xử lý lỗi và quyền truy cập nếu áp dụng

### Frontend

- [ ] Đã chạy `npm run build`
- [ ] Đã chạy `npx eslint . --max-warnings 0`
- [ ] Đã kiểm tra giao diện/luồng chính nếu áp dụng

### Kiến trúc và dữ liệu

- [ ] Không gọi trực tiếp repository/entity của feature khác; giao tiếp qua service interface theo quy ước dự án
- [ ] Đã kiểm tra ảnh hưởng đến database/migration/API nếu có
- [ ] Đã kiểm tra log, cấu hình và thông báo lỗi để tránh lộ dữ liệu nhạy cảm

> Chỉ đánh dấu các mục đã thực sự kiểm tra. Nếu một mục không áp dụng, ghi rõ `N/A` và lý do trong phần mô tả hoặc ghi chú.

## 4. Sử dụng AI

- [ ] Không sử dụng AI cho phần thay đổi trong PR này
- [ ] Có sử dụng AI cho phần thay đổi trong PR này

Nếu chọn **Có**, điền các mục sau:

- **Thành viên đã dùng AI:** <!-- Tên thành viên -->
- **AI Usage Log ID:** <!-- Ví dụ: AI-KE-012, AI-KE-013; phải khớp file log cá nhân -->
- **AI Error Log ID (nếu có):** <!-- Ví dụ: AI-ERR-KE-004 hoặc NONE -->
- [ ] Đã cập nhật file log cá nhân trong `docs/ai-usage-log/`
- [ ] Đã hiểu phần code/thiết kế do AI đề xuất hoặc sinh và có thể giải thích cách hoạt động
- [ ] Đã kiểm chứng đầu ra phù hợp với yêu cầu; ghi rõ test/bằng chứng ở phần “Cách kiểm tra”
- [ ] Đã đối chiếu tài liệu chính thức đúng thư viện/phiên bản khi cần
- [ ] Đã kiểm tra license và điều khoản sử dụng của mã nguồn, thư viện hoặc dữ liệu bên ngoài được đưa vào
- [ ] Không đưa secret, thông tin xác thực hoặc dữ liệu nhạy cảm trái phép vào prompt/log
- [ ] Nếu phát hiện đầu ra AI sai hoặc thiếu sót có căn cứ, đã ghi vào mục lỗi trong file log cá nhân, kèm hash commit sửa thật (khác commit sinh) và bằng chứng kiểm chứng sau sửa

## 5. Ghi chú cho reviewer

<!-- Nêu rủi ro còn lại, phần chưa kiểm thử, quyết định cần review hoặc ghi N/A. -->
