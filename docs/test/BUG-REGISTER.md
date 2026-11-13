# Sổ đăng ký lỗi

> Lỗi được theo dõi trên GitHub Issues (mẫu `.github/ISSUE_TEMPLATE/bug_report.yml`). Sổ này là bản tóm tắt dùng làm minh chứng và để `tools/test-report/generate.py` đếm lỗi Critical/Blocker còn mở. Thêm một dòng cho mỗi lỗi, không xóa dòng cũ.

## Mức độ

| Mức | Định nghĩa | Ví dụ |
|---|---|---|
| Blocker | Chặn cả hệ thống hoặc luồng chính, không có cách tránh | Không đăng nhập được, ứng dụng không khởi động |
| Critical | Mất hoặc sai dữ liệu, lỗ hổng bảo mật, sập một chức năng chính | Thanh toán không ghi nhận, lộ dữ liệu người khác |
| Major | Một chức năng sai nhưng có cách tránh | Chấm điểm sai ở một ca đặc biệt |
| Minor | Sai giao diện, thông báo, chính tả | Sai màu, sai câu chữ |

## Mức độ khác ưu tiên

**Mức độ (Severity)** nói lỗi nặng đến đâu về mặt kỹ thuật. **Ưu tiên (Priority)** nói nên sửa sớm đến đâu. Hai thứ có thể khác nhau: lỗi sai chính tả ở trang chủ trước buổi bảo vệ là Minor nhưng ưu tiên cao.

| Ưu tiên | Nghĩa |
|---|---|
| P1 | Sửa ngay, chặn việc khác |
| P2 | Sửa trong tuần |
| P3 | Sửa khi có thời gian, trước tuần 12 |

## Nơi lưu từng thông tin

Sổ này chỉ tóm tắt. Mô tả, các bước tái hiện, kết quả mong đợi và kết quả thực tế nằm trong **GitHub Issue** (cột Issue); không chép sang đây để tránh lệch hai nơi.

## Vòng đời

`Mới` → `Đã xác nhận` → `Đang sửa` → `Đã sửa` → `Đã kiểm lại` → `Đóng`

Điều kiện đóng: có bản sửa đã gộp vào `main`, có **test hồi quy** tái hiện lỗi và pass trên CI, người báo hoặc người khác đã kiểm lại.

## Danh sách lỗi

| ID | Tiêu đề | Mức độ | Trạng thái | Ưu tiên | Người xử lý | AC liên quan | Issue | Test hồi quy | Ngày mở | Ngày đóng |
|---|---|---|---|---|---|---|---|---|---|---|

<!-- Mẫu một dòng (đổi XXX thành số thứ tự, ví dụ BUG-001). Giữ nguyên thứ tự 4 cột đầu vì script báo cáo đọc theo vị trí:
| BUG-XXX | Đăng nhập sai 5 lần không khóa | Critical | Đóng | P1 | Kế | AC-TK-13 | #123 | LoginIntegrationTest.login_fifthWrongPassword_locksAccountFor15Minutes_AC_TK_13 | 2026-11-01 | 2026-11-02 |
-->
