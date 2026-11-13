# QT — Quản trị tài khoản và giao lại nội dung: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-QT-01 | Chỉ quản trị viên được xem danh sách tài khoản, khóa, mở khóa, đổi vai trò và giao lại nội dung. | UC-QT-01 đến 07 |
| BR-QT-02 | Quản trị viên chỉ khóa và đổi vai trò cho tài khoản Học viên và Giáo viên. Không khóa và không đổi vai trò tài khoản của chính mình hay của quản trị viên khác; việc cấp quyền quản trị viên nằm ngoài module này. Vai trò chỉ đổi giữa Học viên và Giáo viên. | UC-QT-02 (2a), UC-QT-04 (2a), AC-QT-09, 22 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-QT-03 | Khóa tài khoản phải có lý do, dài 1 đến 500 ký tự. Tài khoản bị khóa không đăng nhập được bằng bất kỳ cách nào (BR-TK-10), các phiên đăng nhập đang có bị kết thúc ngay. Mở khóa thì tài khoản dùng lại bình thường, dữ liệu học tập được giữ nguyên, nội dung đã giao lại cho giáo viên khác không tự trả về. | UC-QT-02 (Bước 5, 6; 4a), UC-QT-03, AC-QT-05, 10, 13, 14 |
| BR-QT-04 | Đổi vai trò có hiệu lực ngay. Chỉ đổi vai trò tài khoản đang hoạt động. Giáo viên chỉ được đổi thành Học viên khi không còn bài học hoặc bộ thẻ nào chưa bị xóa thuộc về mình (kể cả bản Nháp); phải giao lại hết trước. Đổi Học viên thành Giáo viên không có điều kiện thêm. | UC-QT-04 (1a, 5a), AC-QT-19, 20, 21, 39 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-QT-05 | Nội dung cần giao là bài học và bộ thẻ đã xuất bản, chưa bị xóa, của giáo viên đã bị khóa. Quản trị viên không xem được bản Nháp (BR-BT-01): bản Nháp không có trong danh sách nội dung cần giao và chỉ được chuyển cùng khi giao toàn bộ nội dung của giáo viên (UC-QT-07), quản trị viên chỉ thấy số lượng. Nội dung đã xuất bản của giáo viên bị khóa vẫn hiển thị cho học viên cho đến khi được xử lý. | UC-QT-02 (Bước 6), UC-QT-05, UC-QT-06, UC-QT-07, AC-QT-06, 25, 27 |
| BR-QT-06 | Giáo viên nhận phải đang hoạt động (không bị khóa), có vai trò Giáo viên và khác giáo viên đang giữ nội dung. | UC-QT-06 (3a, 7a), UC-QT-07 (3a, 7a), AC-QT-32, 34, 41, 43 |
| BR-QT-07 | Giao lại là toàn bộ hoặc không: nếu một mục không giao được thì không mục nào được giao. Nội dung giữ nguyên trạng thái (Nháp hoặc Đã xuất bản), nhóm thẻ, thẻ và tiến độ học của học viên. Tên bộ thẻ và tên bài học không được trùng với nội dung cùng loại đã có của giáo viên nhận (không phân biệt chữ hoa, chữ thường; BR-BT-03). | UC-QT-06 (7b, 7c), UC-QT-07 (7b), AC-QT-29, 35, 36, 38, 44 |
| BR-QT-08 | Báo cáo đang mở của nội dung được giao chuyển theo giáo viên nhận và giữ nguyên trạng thái; báo cáo ở Chờ quản trị viên vẫn chờ quản trị viên (BR-XL-02). Khi nội dung của giáo viên bị khóa đã được giao lại, quản trị viên trả lại báo cáo cho giáo viên chủ mới được (BR-XL-09). | UC-QT-06 (Bước 8), UC-QT-07 (Bước 8), AC-QT-30, 38 |
| BR-QT-09 | Mọi thao tác khóa, mở khóa, đổi vai trò và giao lại nội dung được ghi lại: người thực hiện, thời điểm, tài khoản hoặc nội dung bị tác động, giá trị cũ và mới, lý do (nếu có). Giáo viên nhận được báo khi được giao nội dung. | UC-QT-02 đến 04, 06, 07, AC-QT-05, 29, 38 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-QT-10 | Danh sách tài khoản hiển thị 20 tài khoản mỗi trang, tài khoản mới tham gia ở đầu. Danh sách nội dung cần giao cũng hiển thị 20 mục mỗi trang. | UC-QT-01 (Bước 2), UC-QT-05 (Bước 2), AC-QT-01 |
