# NT — Quản lý nhóm thẻ và thẻ từ vựng: Quy trình nghiệp vụ

## 1. Cấu trúc nội dung của bộ

Một bộ thẻ (module BT) gồm nhiều **nhóm thẻ**, mỗi nhóm gồm nhiều **thẻ**. Nhóm thẻ là đơn vị học viên học từng phần và là nơi giáo viên thêm, nhập, gắn ảnh cho thẻ. Nhóm và thẻ hiển thị theo thứ tự thêm vào (BR-NT-06). Một từ chỉ xuất hiện ở một thẻ trong cả bộ (BR-NT-03).

## 2. Soạn nội dung bộ

Mọi thao tác dưới đây thực hiện trên trang của bộ (UC-BT-04), chỉ giáo viên chủ bộ được làm (BR-NT-01).

| Bước | Người thực hiện | UC | Ghi chú |
|---|---|---|---|
| Tạo bộ (Nháp, chưa có nhóm) | Giáo viên | UC-BT-02 | Hệ thống chuyển thẳng đến trang của bộ |
| Thêm nhóm thẻ | Giáo viên | UC-NT-01 | Nhóm mới chưa có thẻ, nằm cuối danh sách |
| Thêm thẻ | Giáo viên | UC-NT-04, UC-NT-07 | Nhập tay, điền sẵn từ từ điển (BR-NT-08) hoặc nhập nhiều thẻ từ Excel/CSV (BR-NT-07, tất cả hoặc không) |
| Gắn ảnh cho thẻ | Giáo viên | UC-NT-05, UC-NT-08 | Từng thẻ khi sửa thẻ, hoặc hàng loạt theo tên tệp (BR-NT-09); tệp nhập không có cột ảnh |
| Lấy âm thanh phát âm | Hệ thống | — | Mỗi lần lưu thẻ, hệ thống lấy âm thanh Anh-Anh, Anh-Mỹ từ từ điển theo từ vựng và loại từ; không có thì học viên nghe giọng đọc của trình duyệt (BR-NT-08) |
| Xuất bản bộ | Giáo viên | UC-BT-05 | Bộ phải có ít nhất 1 nhóm và mỗi nhóm có ít nhất 1 thẻ (BR-BT-05) |

## 3. Sửa nội dung bộ đã xuất bản

Giáo viên vẫn thêm, sửa, xóa nhóm thẻ và thẻ khi bộ đã xuất bản; thay đổi có hiệu lực ngay, học viên thấy khi mở lại hoặc tải lại bộ (BR-NT-06). Bộ phải luôn đủ điều kiện xuất bản (BR-NT-05), nên các thao tác sau bị từ chối và giáo viên phải gỡ xuất bản trước (UC-BT-06):

| Thao tác bị từ chối | UC | Lý do |
|---|---|---|
| Thêm nhóm thẻ mới (nhóm trống) | UC-NT-01 (3a) | Bộ sẽ có nhóm chưa có thẻ |
| Xóa nhóm thẻ duy nhất của bộ | UC-NT-03 (3b) | Bộ sẽ không còn nhóm nào |
| Xóa thẻ cuối cùng của một nhóm | UC-NT-06 (4b) | Nhóm sẽ không còn thẻ |

## 4. Xóa nhóm thẻ và thẻ

Xóa là xóa tạm và phải được xác nhận (BR-NT-04): xóa nhóm thì xóa luôn các thẻ trong nhóm. Nhóm và thẻ đã xóa không hiển thị cho giáo viên và học viên, không tính vào kiểm tra trùng tên, trùng từ; tiến độ học của thẻ bị xóa không còn được tính, tiến độ các thẻ còn lại được giữ (BR-BT-07). Chức năng khôi phục nhóm thẻ, thẻ không thuộc phạm vi hiện tại; khôi phục bộ (UC-BT-08) không khôi phục nhóm thẻ, thẻ đã bị xóa riêng trước đó.

## 5. Quyền theo vai trò

- **Giáo viên chủ bộ**: thêm, sửa, xóa nhóm thẻ và thẻ, nhập thẻ, gắn ảnh (BR-NT-01). Khi quản trị viên giao lại nội dung của giáo viên bị khóa (UC-QT-06, UC-QT-07), giáo viên nhận có các quyền này.
- **Quản trị viên**: chỉ xem nhóm thẻ và thẻ của bộ Đã xuất bản (UC-BT-04); không thêm, sửa, xóa.
- **Học viên**: học các nhóm thẻ của bộ Đã xuất bản (module HT).
