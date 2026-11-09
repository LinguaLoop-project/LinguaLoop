# NT — Quản lý nhóm thẻ và thẻ từ vựng: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-NT-01 | Chỉ giáo viên tạo ra bộ mới thêm, sửa, xóa được nhóm thẻ và thẻ của bộ đó, dù bộ đang Nháp hay Đã xuất bản. Quản trị viên không thao tác trên nhóm thẻ và thẻ. Bộ Đã xóa không được thao tác. | UC-NT-01 đến 07 (1a, 1b), AC-NT-02, 10, 17, 25, 34, 42, 50 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-NT-02 | Nhóm thẻ chỉ có tên. Tên nhóm thẻ bắt buộc, dài 1 đến 100 ký tự, không trùng tên với nhóm thẻ khác trong cùng bộ (không phân biệt chữ hoa, chữ thường). | UC-NT-01 (7a, 7b), UC-NT-02 (7a, 7b), AC-NT-05, 06, 14 |
| BR-NT-03 | Thẻ gồm: từ vựng (bắt buộc), nghĩa tiếng Việt (bắt buộc), phiên âm, loại từ, định nghĩa (phần tiếng Anh, phần tiếng Việt), ví dụ (phần tiếng Anh, phần tiếng Việt); các mục còn lại tùy chọn. Loại từ chọn một trong: danh từ, động từ, tính từ, trạng từ, giới từ, đại từ, liên từ, từ hạn định, thán từ, cụm động từ, thành ngữ, cụm từ, kết hợp từ, động từ khuyết thiếu. Từ vựng dài 1 đến 100 ký tự; nghĩa tiếng Việt, định nghĩa, ví dụ mỗi mục tối đa 500 ký tự. Một từ không xuất hiện ở hai thẻ trong cùng một bộ, kể cả khác nhóm thẻ (BR-BT-04). | UC-NT-04 (7a, 7b), UC-NT-05 (7a, 7b), UC-NT-07 (6b), AC-NT-29, 30, 38, 39, 54 |
| BR-NT-07 | Nhập thẻ từ Excel hoặc CSV: tệp .xlsx hoặc .csv theo mẫu (tệp CSV mã hóa UTF-8, dòng đầu là tên cột, phân cách bằng dấu phẩy), tối đa 2 MB và 500 dòng dữ liệu mỗi lần. Các cột: Từ vựng, Nghĩa tiếng Việt, Phiên âm, Loại từ, Định nghĩa (tiếng Anh), Định nghĩa (tiếng Việt), Ví dụ (tiếng Anh), Ví dụ (tiếng Việt); hai cột đầu bắt buộc có giá trị. Mỗi dòng phải thỏa BR-NT-03. Chỉ cần một dòng sai thì không thẻ nào được nhập, hệ thống báo số dòng và lý do. Các thẻ nhập thành công được thêm vào cuối nhóm theo thứ tự dòng. | UC-NT-07 (4a, 6a, 6b, 6c), AC-NT-48, 49, 53, 54, 55 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-NT-04 | Xóa nhóm thẻ thì xóa luôn mọi thẻ trong nhóm. Xóa nhóm thẻ hoặc thẻ phải được tác nhân xác nhận và là xóa tạm: dữ liệu được giữ lại 30 ngày để có thể khôi phục, giáo viên và học viên không còn thấy; chức năng khôi phục nhóm thẻ và thẻ chưa có trong phạm vi hiện tại. Thẻ đã xóa tạm không tính vào kiểm tra trùng từ. Tiến độ học của thẻ bị xóa không còn được tính, tiến độ các thẻ còn lại được giữ (BR-BT-07). | UC-NT-03, UC-NT-06, AC-NT-16, 41 |
| BR-NT-05 | Bộ Đã xuất bản luôn phải còn ít nhất 1 nhóm thẻ có ít nhất 1 thẻ; thao tác xóa nhóm thẻ hoặc xóa thẻ làm bộ không còn đáp ứng điều kiện này bị từ chối, giáo viên phải gỡ xuất bản bộ trước. Học viên chỉ thấy các nhóm thẻ có ít nhất 1 thẻ. | UC-NT-03 (3b), UC-NT-06 (3b), AC-NT-20, 45 |
| BR-NT-06 | Thay đổi nhóm thẻ và thẻ có hiệu lực ngay sau khi lưu, kể cả bộ đã xuất bản (BR-BT-07). Nhóm thẻ mới được thêm vào cuối danh sách nhóm của bộ; thẻ mới được thêm vào cuối nhóm. Sửa không làm đổi vị trí. | UC-NT-01 (8), UC-NT-02 (8), UC-NT-04 (8), UC-NT-05 (8), UC-NT-07 (8), AC-NT-01, 09, 23, 32, 48 |
