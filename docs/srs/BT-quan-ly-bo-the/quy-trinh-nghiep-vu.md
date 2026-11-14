# BT — Quản lý bộ thẻ từ vựng: Quy trình nghiệp vụ

## 1. Vòng đời bộ thẻ

Bộ thẻ có ba trạng thái (BR-BT-02): **Nháp**, **Đã xuất bản**, **Đã xóa**. "Đã xóa" là xóa tạm (BR-BT-10): bộ được giữ 30 ngày, khôi phục luôn về Nháp.

| Từ | Đến | Người thực hiện | UC | Ghi chú |
|---|---|---|---|---|
| (chưa có) | Nháp | Giáo viên | UC-BT-02 | Bộ mới chưa có nhóm thẻ, chưa hiển thị cho học viên |
| Nháp | Đã xuất bản | Giáo viên | UC-BT-05 | Phải đủ điều kiện BR-BT-05 |
| Đã xuất bản | Nháp | Quản trị viên (gỡ xuất bản, bắt buộc nhập lý do, BR-BT-08) hoặc Giáo viên (tự gỡ, không cần lý do) | UC-BT-06 | Gỡ không xóa tiến độ học (BR-BT-08); bộ được xuất bản lại khi đủ điều kiện BR-BT-05 |
| Nháp hoặc Đã xuất bản | Đã xóa | Giáo viên chủ bộ | UC-BT-07 | Quản trị viên không xóa bộ (BR-BT-09). Xóa bộ Đã xuất bản làm bộ biến mất khỏi thư viện học viên; tiến độ học được giữ (BR-BT-09) |
| Đã xóa | Nháp | Giáo viên chủ bộ | UC-BT-08 | Chỉ trong 30 ngày kể từ lúc xóa (BR-BT-10) |
| Đã xóa | (hết hạn) | Hệ thống | — | Quá 30 ngày: không khôi phục được, không hiển thị ở bộ lọc "Đã xóa" (BR-BT-10) |

## 2. Quyền theo vai trò

- **Giáo viên**: thao tác trên bộ mình là chủ (BR-BT-01). Chủ bộ đổi khi quản trị viên giao lại nội dung của giáo viên bị khóa (UC-QT-06, UC-QT-07); giáo viên nhận có toàn quyền như chủ bộ.
- **Quản trị viên**: chỉ xem danh sách, xem chi tiết và gỡ xuất bản (BR-BT-01, BR-BT-08); không thêm, sửa, xóa hay khôi phục bộ.
- **Bộ chưa gán chủ**: dữ liệu nhập ban đầu, quản trị viên thấy với chủ bộ "Hệ thống"; không giáo viên nào thao tác được cho đến khi được gán chủ lúc làm sạch dữ liệu.

## 3. Phạm vi danh sách

Danh sách (UC-BT-01) chỉ liệt kê bộ thư viện (không có bộ cá nhân hoặc "Từ đã lưu"). Các quy tắc hiển thị và phân trang nằm ở BR-BT-01, BR-BT-10, BR-BT-12.
