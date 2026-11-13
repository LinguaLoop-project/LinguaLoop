# BT — Quản lý bộ thẻ từ vựng: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BT-01 | Giáo viên chỉ xem, sửa, xem chi tiết, xuất bản, gỡ xuất bản, xóa và khôi phục các bộ do chính mình tạo; xem được cả bộ Nháp và Đã xuất bản của mình, và các bộ mình đã xóa trong 30 ngày gần nhất ở bộ lọc "Đã xóa". Quản trị viên xem danh sách và xem chi tiết các bộ Đã xuất bản của mọi giáo viên (không thấy bộ Nháp, không thấy bộ đã xóa), lọc được theo giáo viên chủ bộ và gỡ xuất bản; Quản trị viên không thêm, sửa, xóa hay khôi phục bộ thẻ. | UC-BT-01 đến 08, AC-BT-01, 02, 17, 24, 34, 41, 50, 51, 52 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BT-02 | Bộ thẻ có ba trạng thái: Nháp, Đã xuất bản, Đã xóa. Bộ mới tạo luôn là Nháp. Chỉ bộ Đã xuất bản hiển thị cho học viên. Giáo viên xuất bản trực tiếp, không cần quản trị viên duyệt. | UC-BT-02, 05, 06, 07, AC-BT-07, 26 |
| BR-BT-08 | Khi quản trị viên gỡ xuất bản phải nhập lý do, lý do hiển thị cho giáo viên chủ bộ; giáo viên tự gỡ bộ của mình không cần lý do. Gỡ xuất bản không xóa tiến độ học của học viên. Bộ đã gỡ được xuất bản lại khi đủ điều kiện BR-BT-05. | UC-BT-05, 06, AC-BT-27, 32, 33, 36 |
| BR-BT-09 | Chỉ giáo viên chủ bộ xóa được bộ, ở trạng thái Nháp hoặc Đã xuất bản, không cần gỡ xuất bản trước. Xóa bộ Đã xuất bản làm bộ biến mất khỏi thư viện học viên; tiến độ học của học viên được giữ lại và hiển thị lại khi bộ được khôi phục và xuất bản lại. Báo cáo đang mở về bộ xử lý theo BR-XL-08. Quản trị viên không xóa bộ; muốn đưa bộ khỏi học viên thì gỡ xuất bản (BR-BT-08). | UC-BT-07, AC-BT-39, 40, 42 |
| BR-BT-10 | Xóa là xóa tạm: bộ được giữ 30 ngày; chỉ giáo viên chủ bộ khôi phục được; bộ khôi phục luôn về trạng thái Nháp, dù trước khi xóa là Nháp hay Đã xuất bản; quá 30 ngày thì không khôi phục được và không hiển thị ở bộ lọc "Đã xóa". | UC-BT-01 (5a), UC-BT-07, UC-BT-08, AC-BT-04, 39, 40, 45, 47, 56 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BT-03 | Tên bộ bắt buộc, dài 1 đến 100 ký tự, không trùng tên với bộ khác của cùng giáo viên (không phân biệt chữ hoa, chữ thường; bộ đã xóa không tính). | UC-BT-02 (5a, 5b), UC-BT-03 (5a, 5b), UC-BT-08 (6a), AC-BT-10, 11, 19, 20, 46 |
| BR-BT-04 | Quy tắc về thẻ (từ vựng bắt buộc, không trùng từ trong cùng bộ) thuộc module NT, xem BR-NT-03. | UC-NT-04 (7a, 7b), UC-NT-05 (7a, 7b), AC-NT-29, 30, 38, 39 |
| BR-BT-13 | Ảnh minh họa của bộ không bắt buộc, chỉ nhận JPG hoặc PNG, tối đa 2 MB. Bộ không có ảnh hiển thị ảnh mặc định. Giáo viên đổi hoặc xóa ảnh khi sửa bộ. | UC-BT-02 (5c), UC-BT-03 (3a, 5a), AC-BT-08, 12, 16, 19 |
| BR-BT-14 | Mỗi bộ thẻ thuộc tối đa một danh mục, chọn trong danh sách danh mục do quản trị viên quản lý (UC-CD-04); không bắt buộc chọn. Bộ không có danh mục được xếp vào mục "Khác" khi hiển thị. Giáo viên chọn hoặc đổi danh mục khi tạo hoặc sửa bộ; sửa tên danh mục không làm đổi các bộ thuộc danh mục đó (BR-CD-03). | UC-BT-02, UC-BT-03, UC-BT-01, AC-BT-07, 08, 14 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BT-05 | Điều kiện xuất bản: bộ có ít nhất 1 nhóm thẻ và mỗi nhóm thẻ có ít nhất 1 thẻ. Bộ Đã xuất bản luôn phải thỏa điều kiện này; thao tác làm bộ không còn thỏa bị từ chối (BR-NT-05). | UC-BT-05 (2a), UC-NT-01 (3b), UC-NT-03 (3b), UC-NT-06 (3b), AC-BT-29 |
| BR-BT-06 | Bộ thẻ có thể được đánh dấu yêu cầu gói Pro khi tạo hoặc sửa (mặc định là không). Học viên gói Free thấy bộ kèm nhãn Pro nhưng không học được phần nào của bộ (BR-HT-07, BR-PR-14); học viên gói Pro học bình thường. Bật yêu cầu Pro cho bộ đã xuất bản thì học viên gói Free không học tiếp được, tiến độ đã có được giữ; tắt thì học lại được. | UC-BT-01, UC-BT-02, UC-BT-03, UC-BT-05, AC-BT-03, 07, 15 |
| BR-BT-07 | Sửa bộ đã xuất bản có hiệu lực ngay sau khi lưu. Thẻ bị xóa thì tiến độ học của thẻ đó không còn được tính; tiến độ các thẻ còn lại được giữ. | UC-BT-03, UC-NT-03, UC-NT-06, AC-BT-15, AC-NT-16, 41 |
| BR-BT-11 | Xem chi tiết không ghi nhận tiến độ học và không tính vào thống kê học của học viên. | UC-BT-04, AC-BT-22 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BT-12 | Danh sách hiển thị 10 bộ mỗi trang, bộ cập nhật gần nhất ở đầu. | UC-BT-01, AC-BT-02 |
| BR-BT-15 | Khi xem chi tiết bộ, danh sách thẻ của một nhóm hiển thị 20 thẻ mỗi trang theo thứ tự trong nhóm; tìm thẻ theo từ vựng không phân biệt chữ hoa, chữ thường. | UC-BT-04 (Bước 4, 5), AC-BT-53, 54 |
