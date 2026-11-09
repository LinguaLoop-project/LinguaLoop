# XL — Xử lý báo cáo học viên: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-XL-01 | Phạm vi: báo cáo của học viên về **câu** của bài học và **thẻ** của bộ thẻ từ vựng. Báo cáo về bài học hay bộ thẻ nguyên bộ nằm ngoài phạm vi module này. Báo cáo về nội dung có giáo viên chủ thuộc giáo viên chủ và ở trạng thái Chờ giáo viên. Báo cáo về nội dung chưa có giáo viên chủ (ví dụ bộ thẻ hệ thống) đi thẳng đến quản trị viên ở trạng thái Chờ quản trị viên (BR-XL-12). | UC-XL-01 đến 06, UC-XL-04 (1d), AC-XL-57 |
| BR-XL-03 | Giáo viên chỉ xem báo cáo về nội dung của mình. Quản trị viên xem báo cáo ở mọi trạng thái của mọi giáo viên nhưng chỉ thao tác ở trạng thái Chờ quản trị viên. Khi mở danh sách, hệ thống lọc sẵn báo cáo đang chờ tác nhân xử lý: giáo viên thấy Chờ giáo viên và Yêu cầu sửa, quản trị viên thấy Chờ quản trị viên; tác nhân bỏ lọc để xem tất cả. Danh sách hiển thị 10 dòng mỗi trang, báo cáo mới nhất ở đầu và có thể chọn sắp xếp "Chờ lâu nhất". Quản trị viên được lọc theo giáo viên chủ. Ô tìm kiếm chỉ khớp tên bài học hoặc tên bộ thẻ chứa nội dung bị báo, không phân biệt chữ hoa, chữ thường. | UC-XL-01, AC-XL-01, 02, 46, 49, 50, 51, 56 |
| BR-XL-09 | Quản trị viên chỉ trả lại báo cáo cho giáo viên chủ còn hoạt động. Nếu tài khoản giáo viên chủ đã bị khóa hoặc nội dung chưa có giáo viên chủ thì không trả lại được, quản trị viên xử lý bằng cách Từ chối hoặc gỡ nội dung và đóng báo cáo; nội dung chưa có giáo viên chủ sau khi được gán cho giáo viên thì trả lại được. | UC-XL-05 (5b), AC-XL-35 |
| BR-XL-10 | Chỉ quản trị viên thấy tên học viên đã báo. Giáo viên chỉ thấy lý do, mô tả, số báo cáo và ngày gửi, không thấy tên hay tài khoản học viên (phù hợp BR-TN-05). | UC-XL-01 (Bước 3, 8), AC-XL-01, 48 |
| BR-XL-12 | Mọi báo cáo về nội dung có giáo viên chủ đều đi qua giáo viên chủ trước. Quản trị viên chỉ xử lý báo cáo ở trạng thái Chờ quản trị viên, tức báo cáo giáo viên đã chuyển lên (UC-XL-04), báo cáo tự chuyển sau 7 ngày hoặc khi giáo viên chủ bị khóa (BR-XL-11). Ngoại lệ duy nhất: báo cáo về nội dung chưa có giáo viên chủ đi thẳng đến quản trị viên. Quản trị viên không sửa được nội dung nên với báo cáo này chỉ Từ chối hoặc gỡ nội dung và đóng báo cáo, cho đến khi nội dung được gán cho giáo viên khác; sau khi gán, báo cáo đang mở thuộc về giáo viên nhận. Học viên chỉ gửi báo cáo và không xem được trạng thái hay phản hồi của báo cáo. | UC-XL-01, UC-XL-04, UC-XL-06, AC-XL-57 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-XL-02 | Báo cáo có 5 trạng thái: Chờ giáo viên, Chờ quản trị viên, Yêu cầu sửa, Đã xử lý, Từ chối. Giáo viên chủ: ở Chờ giáo viên được sửa, từ chối hoặc chuyển cho quản trị viên; ở Yêu cầu sửa chỉ được sửa. Quản trị viên: ở Chờ quản trị viên được từ chối, trả lại giáo viên yêu cầu sửa, hoặc gỡ nội dung và đóng báo cáo. Hệ thống tự chuyển báo cáo Chờ giáo viên và Yêu cầu sửa sang Chờ quản trị viên theo BR-XL-11. Đã xử lý và Từ chối là trạng thái kết thúc, không đổi nữa. | UC-XL-02 (1a), UC-XL-03 (1a), UC-XL-04 (1a, 1c), UC-XL-05 (1a), UC-XL-06 (1a), AC-XL-09, 17, 25, 31, 40 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-XL-04 | Lý do từ chối, ghi chú khi chuyển, nội dung yêu cầu sửa, ghi chú xử lý và lý do gỡ đều bắt buộc, dài 1 đến 500 ký tự. Lý do từ chối và ghi chú xử lý được lưu trong lịch sử xử lý, hiển thị cho giáo viên và quản trị viên, và không gửi cho học viên; ghi chú khi chuyển và nội dung yêu cầu sửa chỉ giữa giáo viên và quản trị viên; lý do gỡ chỉ giáo viên chủ thấy. | UC-XL-02 (5a), UC-XL-03 (7a), UC-XL-04 (5a), UC-XL-05 (5a), UC-XL-06 (5a), AC-XL-11, 21, 27, 33, 45 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-XL-05 | Giáo viên chỉ đánh dấu Đã xử lý khi nội dung bị báo đã được sửa sau thời điểm học viên gửi báo cáo (kiểm tra qua nhật ký thao tác trên nội dung). Nếu báo cáo không đúng thì phải Từ chối. | UC-XL-03 (7b), AC-XL-22 |
| BR-XL-06 | Báo cáo trùng là các báo cáo cùng nội dung bị báo và cùng lý do. Khi xử lý một báo cáo (từ chối, đã xử lý, chuyển, trả lại, gỡ nội dung) thì các báo cáo trùng đang cùng trạng thái được xử lý cùng kết quả. Trong danh sách, các báo cáo trùng đang cùng trạng thái gộp thành một dòng kèm số báo cáo. | UC-XL-01 (Bước 3), UC-XL-02 đến 06, AC-XL-16, 39, 47 |
| BR-XL-07 | Mọi thao tác trên báo cáo, kể cả việc hệ thống tự chuyển, được ghi vào lịch sử xử lý gồm người thực hiện (hoặc "Hệ thống"), vai trò, thời điểm, trạng thái mới và ghi chú; lịch sử không sửa được và hiển thị trong chi tiết báo cáo. | UC-XL-01 (Bước 8), UC-XL-02 đến 06, AC-XL-07, 08, 14, 30, 37, 52 |
| BR-XL-08 | Nếu nội dung bị báo đã bị xóa thì không sửa được và không gỡ được; báo cáo chỉ còn được Từ chối. | UC-XL-01 (8b), UC-XL-03 (3a), UC-XL-06 (2a), AC-XL-06, 19, 42 |
| BR-XL-11 | Hệ thống tự chuyển báo cáo sang Chờ quản trị viên khi báo cáo ở Chờ giáo viên quá 7 ngày kể từ ngày gửi (với nhóm báo cáo trùng, tính từ báo cáo cũ nhất của nhóm), hoặc khi báo cáo ở Yêu cầu sửa quá 7 ngày kể từ ngày quản trị viên trả lại, hoặc ngay khi giáo viên chủ bị khóa. Hạn sửa 7 ngày được hiển thị cho giáo viên ở báo cáo Yêu cầu sửa. Lịch sử xử lý ghi "Hệ thống tự chuyển" kèm lý do; chi tiết báo cáo hiển thị cho quản trị viên thông báo giáo viên chủ đã bị khóa khi đó là lý do. | UC-XL-01 (8), UC-XL-04 (1c), UC-XL-05, AC-XL-30, 52, 53, 54, 58, 59 |
| BR-XL-13 | Giáo viên chỉ áp dụng được bản sửa đề xuất của báo cáo có kèm bản sửa (lỗi phụ đề tiếng Anh, IPA, bản dịch của câu; sai từ vựng, phiên âm, nghĩa hoặc định nghĩa, câu ví dụ của thẻ). Khi áp dụng, hệ thống ghi bản sửa vào đúng trường tương ứng và tính là một lần sửa nội dung của giáo viên (thỏa BR-XL-05); nếu nhóm báo cáo trùng có nhiều bản sửa khác nhau thì giáo viên chọn một bản. Sau khi áp dụng, giáo viên vẫn nhập ghi chú rồi Đánh dấu đã xử lý. Báo cáo Phụ đề lệch thời gian, Phản cảm và Khác không có bản sửa nên không có nút này; giáo viên sửa tay ở màn hình sửa. | UC-XL-03 (2a), AC-XL-60, 61, 62 |
