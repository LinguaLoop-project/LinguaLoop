# Báo cáo tiến độ — Tuần 09 (09/11 – 15/11/2026)

- **Đề tài:** Xây dựng nền tảng phát triển năng lực ngôn ngữ thực hành tiếng Anh với sự hỗ trợ của AI - LinguaLoop
- **Nhóm:** Nguyễn Văn Kế, Nguyễn Trí Lâm
- **GVHD:** Cô Mai Anh Thơ
- **Repo:** https://github.com/LinguaLoop-project/LinguaLoop

## 1. Công việc đã làm trong tuần

### Nguyễn Văn Kế

| Công việc                                                                                                                                                                                      | Kết quả                                  | Minh chứng                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------- |
| Hoàn thiện đặc tả use case vai trò giáo viên và quản trị viên, chuyển hạn mức AI sang mô hình credit                                                                                           | Xong, đã merge                           | `441b54f`, PR #53                       |
| Refactor database theo schema MVP đã chốt: baseline schema mới, seed âm vị và tài khoản dev, ví credit AI thay cho quota năng lượng, gói Pro lấy từ `pro_orders`, bảng `audit_logs` dùng chung | Xong, đã merge                           | `4398e5c`, `05da4fd`, `933b81c`, PR #57 |
| Refactor code backend theo schema mới (auth, lesson, practice, shadowing, tutor, dictionary) và tổ chức lại feature theo domain, viết tài liệu cấu trúc dự án                                  | Xong, đã merge                           | `b56cf1b`, `951d371`, `9b19344`, PR #57 |
| Refactor frontend theo API mới (id, ví credit, vai trò giáo viên); seed từ điển và script nạp dữ liệu                                                                                          | Xong, đã merge                           | `1b43d95`, `2a4931f`, PR #57            |
| Sửa lỗi sau refactor: thiếu `created_at` ở `topics`/`deck_categories`, phát âm theo từ loại cho từ đồng tự khác âm, lỗi Sonar ở credit                                                         | Xong, đã merge                           | `89805b7`, `c9e4aa2`, `7c772ca`         |
| Quản lý bộ thẻ từ vựng cho giáo viên và quản trị viên: API tạo/sửa/xóa/đăng bộ thẻ, nhóm thẻ, thẻ; trang quản lý; test phủ các AC còn lại                                                      | Xong, đã merge                           | `302abff`, `55a5b74`, `dafa657`, PR #59 |
| Xử lý báo cáo nội dung (hai luồng xử lý): API, migration, test, cập nhật đặc tả BC/XL                                                                                                          | Đang làm (nhánh `feat/report-two-track`) |                                         |

Việc dự kiến chưa xong:

- Gửi duyệt `feat/lesson-authoring` và `feat/youtube-lesson-import`: chưa mở PR vì phải chuyển hai nhánh sang schema MVP mới, dời sang tuần 10.
- Xử lý báo cáo nội dung: đang làm, dời sang tuần 10.

### Nguyễn Trí Lâm

## 2. Vướng mắc

- Thay đổi thiết kế: bỏ quota năng lượng, chuyển sang ví credit AI theo gói Pro; gom nhật ký nội dung, quản trị, báo cáo vào một bảng `audit_logs` · Đơn giản hóa schema cho bản MVP, đặc tả đã cập nhật ở PR #53.

## 3. Kế hoạch tuần 10 (16/11 – 22/11/2026)

### Nguyễn Văn Kế

| Công việc                                                                                                                                                 | Kết quả mong đợi                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Quản lý bài học (BH): chuyển `feat/lesson-authoring` và `feat/youtube-lesson-import` sang schema MVP; giáo viên tạo, sửa, xóa, đăng bài học               | API và trang soạn bài chạy được, có test, PR gửi duyệt           |
| Xử lý báo cáo nội dung (XL): hoàn thiện nhánh `feat/report-two-track`; học viên gửi báo cáo câu/thẻ, giáo viên và admin xem danh sách, xử lý, ghi nhật ký | API và trang xử lý báo cáo chạy được, có test, PR gửi duyệt      |
| Thống kê nội dung của giáo viên (TN)                                                                                                                      | API và trang thống kê chạy được, có test, PR gửi duyệt           |
| Quản trị tài khoản của quản trị viên (QT): xem danh sách, khóa/mở khóa tài khoản, đổi vai trò                                                             | API và trang quản trị tài khoản chạy được, có test, PR gửi duyệt |

### Nguyễn Trí Lâm

| Công việc | Kết quả mong đợi |
| --------- | ---------------- |
|           |                  |
