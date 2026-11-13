# CD — Quản lý chủ đề và danh mục: Business Rules

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-CD-04 | Chủ đề đang hiển thị cho học viên khi có ít nhất 1 bài học đã xuất bản; chủ đề chưa có bài đã xuất bản ở trạng thái Chưa hiển thị và học viên không thấy. Giáo viên chọn được mọi chủ đề, kể cả chủ đề Chưa hiển thị, khi soạn bài. | UC-CD-01 (Bước 2), UC-CD-02 (Điều kiện sau), AC-CD-01, 05 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-CD-01 | Chủ đề: tên bắt buộc, dài 1 đến 100 ký tự. Tên chủ đề không trùng với chủ đề khác (không phân biệt chữ hoa, chữ thường). | UC-CD-02 (5a, 5b), UC-CD-03 (5a, 5b), AC-CD-07, 08, 12, 13 |
| BR-CD-02 | Danh mục: tên bắt buộc, dài 1 đến 100 ký tự. Tên danh mục không trùng với danh mục khác (không phân biệt chữ hoa, chữ thường). | UC-CD-05 (5a, 5b), UC-CD-06 (5a, 5b), AC-CD-21, 22, 26, 27 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-CD-03 | Chủ đề và danh mục mới luôn được thêm vào cuối danh sách. Sửa tên không làm đổi thứ tự, không làm đổi các bài học hay bộ thẻ đang thuộc về chủ đề hoặc danh mục đó, và liên kết đến chủ đề không đổi theo tên mới. Quản trị viên chỉ xem, thêm và sửa tên; chưa có chức năng xóa hay đổi thứ tự. | UC-CD-02 (Bước 6), UC-CD-03 (Bước 6), UC-CD-05 (Bước 6), UC-CD-06 (Bước 6), AC-CD-05, 10, 19, 24 |
| BR-CD-05 | Danh sách chủ đề và danh mục hiển thị theo thứ tự hiển thị, số bài học và số bộ thẻ chỉ đếm nội dung đã xuất bản. Từ khóa tìm kiếm không phân biệt chữ hoa, chữ thường. | UC-CD-01, UC-CD-04, AC-CD-01, 02, 15, 16 |
| BR-CD-06 | Danh mục được gán cho bộ thẻ khi giáo viên tạo hoặc sửa bộ (BR-BT-14); số bộ thẻ hiển thị ở danh sách danh mục là số bộ đã xuất bản thuộc danh mục đó. | UC-CD-04 (Bước 2), AC-CD-15 |
