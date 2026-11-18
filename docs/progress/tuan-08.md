# Báo cáo tiến độ — Tuần 08 (02/11 – 08/11/2026)

- **Đề tài:** Xây dựng nền tảng phát triển năng lực ngôn ngữ thực hành tiếng Anh với sự hỗ trợ của AI - LinguaLoop
- **Nhóm:** Nguyễn Văn Kế, Nguyễn Trí Lâm
- **GVHD:** Cô Mai Anh Thơ
- **Repo:** https://github.com/LinguaLoop-project/LinguaLoop

## 1. Công việc đã làm trong tuần

### Nguyễn Văn Kế

| Công việc                                                                                                                                                                                                                                                                       | Kết quả                                                                    | Minh chứng                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------- |
| Rà soát lại toàn bộ module của hệ thống, chốt phạm vi thiết kế các tính năng để nộp báo cáo cho khoa                                                                                                                                                                            | Xong                                                                       | Tài liệu trong `docs/srs/` |
| Chia lại cấu trúc đặc tả use case theo từng module (mỗi module có thư mục riêng: use case, quy tắc nghiệp vụ, quy trình nghiệp vụ)                                                                                                                                              | Xong, chờ gộp vào nhánh chính                                              | `693b9a7`                  |
| Hoàn thiện đặc tả use case cho vai trò giáo viên và quản trị viên: quản lý bộ thẻ (BT), quản lý nhóm thẻ (NT), quản lý chủ đề/danh mục (CD), xử lý báo cáo (XL), quản trị tài khoản (QT), gói và hạn mức AI (GA), nhật ký và thống kê hệ thống (NK), xem thống kê nội dung (TN) | Đang hoàn thiện, đã sửa trên nhánh `docs/srs-cau-truc-module`, chưa commit | Thư mục `docs/srs/`        |
| Tạo bài học từ video YouTube: lấy phụ đề, tách câu, bổ sung phiên âm IPA và bản dịch                                                                                                                                                                                            | Xong, chưa gửi duyệt (nhánh `feat/youtube-lesson-import`)                  | `9cabd92`                  |
| Trang soạn bài của giáo viên cho luồng nhập từ YouTube                                                                                                                                                                                                                          | Xong, chưa gửi duyệt (nhánh `feat/youtube-lesson-import`)                  | `97e5493`                  |
| Họp với Lâm thống nhất cách chia nhiệm vụ để hoàn thành các module còn lại                                                                                                                                                                                                      | Xong                                                                       |                            |

### Nguyễn Trí Lâm

## 2. Vướng mắc

- Phạm vi tính năng lớn so với thời gian còn lại · Đã rà soát module, chốt phạm vi để nộp khoa; việc ít quan trọng sẽ cắt trước nếu trễ.

## 3. Kế hoạch tuần 09 (09/11 – 15/11/2026)

### Nguyễn Văn Kế

| Công việc                                                                                        | Kết quả mong đợi                                                                   |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Cùng Lâm rà soát lại database (bảng, cột, ràng buộc theo đặc tả đã chốt)                         | Danh sách thay đổi cần làm; migration mới (nếu có) được báo chủ bảng trước khi tạo |
| Gửi duyệt `feat/lesson-authoring` và `feat/youtube-lesson-import`                                | 2 PR được mở, CI chạy thành công, Lâm duyệt                                        |
| Quản lý bộ thẻ từ vựng (giáo viên/admin): tạo, sửa, xóa, đăng bộ thẻ; thêm                       | API và trang quản lý bộ thẻ chạy được, có test, PR gửi duyệt                       |
| Xử lý báo cáo nội dung: học viên gửi báo lỗi; admin xem danh sách, đổi trạng thái, ghi chú xử lý | API và trang xử lý báo cáo chạy được, có test, PR gửi duyệt                        |
| Hoàn thiện và commit đặc tả use case giáo viên, admin                                            | Nhánh `docs/srs-cau-truc-module` được commit, mở PR                                |

### Nguyễn Trí Lâm

| Công việc                    | Kết quả mong đợi        |
| ---------------------------- | ----------------------- |
| Cùng Kế rà soát lại database | Chốt danh sách thay đổi |
