# QT — Quản trị tài khoản và giao lại nội dung: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-QT-01 | Chỉ quản trị viên được xem danh sách tài khoản, khóa, mở khóa, đổi vai trò và giao lại nội dung. | UC-QT-01 đến 07 |
| BR-QT-02 | Quản trị viên chỉ khóa và đổi vai trò cho tài khoản Học viên và Giáo viên. Không khóa và không đổi vai trò tài khoản của chính mình hay của quản trị viên khác; việc cấp quyền quản trị viên nằm ngoài module này. Vai trò chỉ đổi giữa Học viên và Giáo viên. | UC-QT-02 (5b), UC-QT-04 (5b), AC-QT-09, 22 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-QT-03 | Khóa tài khoản phải có lý do, dài 1 đến 500 ký tự. Tài khoản bị khóa không đăng nhập được bằng bất kỳ cách nào (BR-TK-10), các phiên đăng nhập đang có bị kết thúc ngay; khi đăng nhập, người dùng thấy thông báo tài khoản đã bị khóa và hướng dẫn liên hệ quản trị viên (UC-TK-02, UC-TK-03, nhánh 6a). Gói Pro của học viên bị khóa vẫn tính thời hạn trong thời gian khóa, không được tạm dừng hay hoàn tiền. Mở khóa thì tài khoản dùng lại bình thường, dữ liệu học tập được giữ nguyên, nội dung đã giao lại cho giáo viên khác không tự trả về. | UC-QT-02 (Bước 5, 6; 5c), UC-QT-03, AC-QT-05, 10, 13, 14, 47, 48 |
| BR-QT-04 | Đổi vai trò có hiệu lực ngay. Chỉ đổi vai trò tài khoản đang hoạt động. Giáo viên chỉ được đổi thành Học viên khi không còn bài học thư viện hoặc bộ thẻ thư viện nào chưa bị xóa thuộc về mình (kể cả bản Nháp); phải giao lại hết trước. Khi giáo viên đổi thành Học viên, số dư credit giáo viên còn lại (BR-GA-11) bị hủy; tài khoản về gói Free với số dư 0 và không được tặng credit dùng thử (BR-GA-03). Học viên chỉ được đổi thành Giáo viên khi không có gói Pro còn hạn, vì giáo viên không dùng gói Pro (BR-GA-11); sau khi đổi, credit còn lại của học viên bị hủy và tài khoản có số dư credit giáo viên bằng 0. Nội dung của giáo viên trong module này chỉ gồm bài học thư viện và bộ thẻ thư viện. Bài học cá nhân, bộ thẻ cá nhân và Từ đã lưu của học viên không tính vào điều kiện đổi vai trò, không bao giờ được giao lại, được giữ nguyên khi đổi vai trò và chỉ dùng được khi tài khoản có vai trò Học viên (bài học cá nhân cần gói Pro còn hạn, BR-PR). | UC-QT-04 (5a, 5c, 5d), UC-QT-07, AC-QT-19, 20, 21, 39, 49, 50, 54, 55 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-QT-05 | Nội dung cần giao gồm: bài học thư viện và bộ thẻ thư viện đã xuất bản, chưa bị xóa, của giáo viên đã bị khóa; và bộ thẻ chưa gán chủ (BR-BT-01) chưa bị xóa, hiển thị với giáo viên hiện tại là "Hệ thống" và không có ngày khóa. Quản trị viên không xem được bản Nháp (BR-BT-01): bản Nháp không có trong danh sách nội dung cần giao và chỉ được chuyển cùng khi giao toàn bộ nội dung của giáo viên (UC-QT-07), quản trị viên chỉ thấy số lượng. Nội dung đã xuất bản của giáo viên bị khóa vẫn hiển thị cho học viên cho đến khi được xử lý. Nội dung cần giao được giao theo UC-QT-06, từ danh sách nội dung cần giao (UC-QT-05) hoặc ngay từ chi tiết báo cáo về nội dung của giáo viên bị khóa hoặc chưa có giáo viên chủ (UC-XL-01, BR-XL-12). | UC-QT-02 (Bước 6), UC-QT-05, UC-QT-06 (1a), UC-QT-07, AC-QT-06, 25, 27, 46, 52 |
| BR-QT-06 | Giáo viên nhận phải đang hoạt động (không bị khóa), có vai trò Giáo viên và khác giáo viên đang giữ nội dung. | UC-QT-06 (3a, 7a), UC-QT-07 (3a, 7a), AC-QT-32, 34, 41, 43 |
| BR-QT-07 | Chỉ bài học thư viện và bộ thẻ thư viện được giao lại (BR-QT-04). Giao lại là toàn bộ hoặc không: nếu một mục không giao được thì không mục nào được giao. Nội dung giữ nguyên trạng thái (Nháp hoặc Đã xuất bản), nhóm thẻ, thẻ và tiến độ học của học viên. Tên bộ thẻ và tên bài học không được trùng với nội dung cùng loại đã có của giáo viên nhận (không phân biệt chữ hoa, chữ thường; BR-BT-03). | UC-QT-06 (7b, 7c), UC-QT-07 (7b, 7c), AC-QT-29, 35, 36, 38, 44, 53 |
| BR-QT-08 | Báo cáo đang mở của nội dung được giao chuyển theo giáo viên nhận và giữ nguyên trạng thái; báo cáo lỗi nội dung ở Chờ giáo viên do giáo viên nhận xử lý; báo cáo Phản cảm vẫn do quản trị viên xử lý (BR-XL-01, BR-XL-12). | UC-QT-06 (Bước 8), UC-QT-07 (Bước 8), AC-QT-30, 38 |
| BR-QT-09 | Mọi thao tác khóa, mở khóa, đổi vai trò và giao lại nội dung được ghi lại: người thực hiện, thời điểm, tài khoản hoặc nội dung bị tác động, giá trị cũ và mới, lý do (nếu có). Giáo viên nhận được báo khi được giao nội dung. | UC-QT-02 đến 04, 06, 07, AC-QT-05, 29, 38 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-QT-10 | Danh sách tài khoản hiển thị 20 tài khoản mỗi trang, tài khoản mới tham gia ở đầu. Danh sách nội dung cần giao cũng hiển thị 20 mục mỗi trang. | UC-QT-01 (Bước 2), UC-QT-05 (Bước 2), AC-QT-01 |
