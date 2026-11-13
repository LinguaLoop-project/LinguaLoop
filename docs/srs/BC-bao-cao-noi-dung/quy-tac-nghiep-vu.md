# BC — Báo cáo nội dung: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-01 | Chức năng Báo cáo nội dung chỉ dành cho Học viên đã đăng nhập. Học viên chỉ báo cáo trên **câu** (trong bài học) hoặc **thẻ** (trong bộ từ vựng); nút "Báo cáo" chỉ có ở câu và thẻ, không có ở cấp bài học, bộ từ vựng hay video (BR-XL-01). Câu hoặc thẻ phải đang hiển thị hợp lệ cho học viên (bài học hoặc bộ chứa nó đã xuất bản và chưa bị xóa); hệ thống từ chối nhận báo cáo cho nội dung không tồn tại, thuộc bản Nháp, đã gỡ xuất bản hoặc đã xóa. | UC-BC-01 (1, 2a), UC-TC-04 (3f), AC-BC-01, AC-BC-05, AC-TC-31 |
| BR-BC-02 | Học viên chỉ gửi báo cáo. Học viên không xem được danh sách báo cáo đã gửi, trạng thái hay phản hồi của báo cáo; báo cáo chỉ được xem và xử lý bởi Giáo viên và Quản trị viên trong module XL. | UC-BC-01 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-03 | Báo cáo mới gửi được khởi tạo ở trạng thái **Chờ giáo viên** của module XL (BR-XL-02), hoặc **Chờ quản trị viên** nếu nội dung chưa có giáo viên chủ (BR-XL-01); các trạng thái tiếp theo do module XL quản lý và không hiển thị cho học viên. | UC-BC-01, AC-BC-01, AC-BC-06 |
| BR-BC-04 | Bản ghi báo cáo luôn được giữ lại trong lịch sử xử lý của module XL kể cả khi nội dung gốc bị gỡ xuất bản hoặc bị xóa sau đó. Hệ thống không gửi phản hồi hay kết quả xử lý cho học viên đã báo (BR-XL-12). | UC-BC-01 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-05 | Khi gửi báo cáo, học viên chọn đúng một lý do theo loại nội dung. **Với câu:** `Lỗi phụ đề tiếng Anh`, `Lỗi IPA`, `Lỗi bản dịch` (bắt buộc kèm bản sửa đúng), `Phụ đề lệch thời gian`, `Phản cảm`, `Khác` (bắt buộc nhập mô tả lỗi). **Với thẻ:** `Sai từ vựng`, `Sai phiên âm`, `Sai nghĩa hoặc định nghĩa`, `Sai câu ví dụ` (bắt buộc kèm bản sửa đúng), `Phản cảm`, `Khác` (bắt buộc nhập mô tả lỗi). Một báo cáo chỉ có một lý do; muốn báo nhiều lỗi thì gửi nhiều báo cáo. | UC-BC-01 (3, 4, 5a), AC-BC-01, AC-BC-02, AC-BC-03, AC-BC-07 |
| BR-BC-06 | Bản sửa đúng và mô tả lỗi được tự động cắt khoảng trắng ở hai đầu, không được chỉ chứa khoảng trắng và có độ dài từ 1 đến 500 ký tự. Bản sửa đúng không được giống hệt nội dung hiện tại của trường tương ứng (với câu: phụ đề tiếng Anh, IPA hoặc bản dịch; với thẻ: từ vựng, phiên âm, nghĩa hoặc định nghĩa, câu ví dụ). | UC-BC-01 (5a), AC-BC-01, AC-BC-02, AC-BC-03 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-07 | Báo cáo sau khi tạo thành công đi vào hàng đợi xử lý (module XL) của Giáo viên chủ nội dung trước; giáo viên sửa nội dung, từ chối hoặc chuyển lên Quản trị viên, và báo cáo cũng tự chuyển lên Quản trị viên sau 7 ngày hoặc khi giáo viên chủ bị khóa (BR-XL-11). Ngoại lệ duy nhất: báo cáo về nội dung chưa có giáo viên chủ đi thẳng đến Quản trị viên (BR-XL-12). | UC-BC-01, AC-BC-01 |
| BR-BC-08 | Một học viên không được gửi báo cáo mới có cùng lý do trên cùng một câu hoặc thẻ cụ thể nếu học viên đó đã có một báo cáo cùng lý do cho đúng câu hoặc thẻ đó mà chưa được xử lý xong (chưa ở trạng thái Đã xử lý hoặc Từ chối). Báo cáo của các học viên khác nhau về cùng câu hoặc thẻ, cùng lý do vẫn được nhận và được gộp thành một dòng cho người xử lý (BR-XL-06). | UC-BC-01 (5b), AC-BC-04 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-09 | Mô tả chi tiết trong mỗi báo cáo dài tối đa 500 ký tự. | UC-BC-01 (5a), AC-BC-03 |
