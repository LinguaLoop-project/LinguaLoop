# BC — Báo cáo nội dung: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-01 | Chức năng Báo cáo nội dung chỉ dành cho Học viên đã đăng nhập. Học viên chỉ báo cáo trên **câu** (trong bài học) hoặc **thẻ** (trong bộ từ vựng); nút "Báo cáo" chỉ có ở câu và thẻ, không có ở cấp bài học, bộ từ vựng hay video (BR-XL-01). Câu hoặc thẻ phải đang hiển thị hợp lệ cho học viên (bài học hoặc bộ chứa nó đã xuất bản và chưa bị xóa); hệ thống từ chối nhận báo cáo cho nội dung không tồn tại, thuộc bản Nháp, đã gỡ xuất bản hoặc đã xóa. | UC-BC-01 (1, 2a), UC-TC-04 (3f), AC-BC-01, AC-BC-05, AC-TC-31 |
| BR-BC-02 | Học viên chỉ gửi báo cáo. Học viên không xem được danh sách báo cáo đã gửi, trạng thái hay phản hồi của báo cáo; báo cáo chỉ được xem và xử lý bởi Giáo viên và Quản trị viên trong module XL. | UC-BC-01 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-03 | Báo cáo mới gửi được định tuyến theo lý do (BR-XL-01): lý do **Phản cảm** được khởi tạo ở trạng thái **Chờ quản trị viên**; mọi lý do khác được khởi tạo ở trạng thái **Chờ giáo viên**, thuộc giáo viên chủ của nội dung (kể cả khi nội dung chưa có giáo viên chủ, BR-XL-12). Các trạng thái tiếp theo do module XL quản lý và không hiển thị cho học viên. | UC-BC-01, AC-BC-01, 02, 08 |
| BR-BC-04 | Bản ghi báo cáo luôn được giữ lại trong lịch sử xử lý của module XL kể cả khi nội dung gốc bị gỡ xuất bản hoặc bị xóa sau đó. Hệ thống không gửi phản hồi hay kết quả xử lý cho học viên đã báo (BR-XL-01). | UC-BC-01 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-05 | Khi gửi báo cáo, học viên chọn đúng một lý do theo loại nội dung. **Với câu:** `Sai phụ đề tiếng Anh`, `Sai phiên âm (IPA)`, `Sai bản dịch` (bắt buộc kèm bản sửa đúng), `Phụ đề lệch thời gian`, `Phản cảm`, `Khác` (bắt buộc nhập mô tả lỗi). **Với thẻ:** `Sai từ vựng`, `Sai phiên âm (IPA)`, `Sai nghĩa hoặc định nghĩa`, `Sai câu ví dụ` (bắt buộc kèm bản sửa đúng), `Phản cảm`, `Khác` (bắt buộc nhập mô tả lỗi). Lý do `Phụ đề lệch thời gian`, `Phản cảm` và `Khác` bắt buộc nhập mô tả lỗi. Một báo cáo chỉ có một lý do; muốn báo nhiều lỗi thì gửi nhiều báo cáo. | UC-BC-01 (3, 4, 5a), AC-BC-01, AC-BC-02, AC-BC-03, AC-BC-07 |
| BR-BC-06 | Bản sửa đúng và mô tả lỗi được tự động cắt khoảng trắng ở hai đầu, không được chỉ chứa khoảng trắng và có độ dài từ 1 đến 500 ký tự. Bản sửa đúng không được giống hệt nội dung hiện tại của trường cần sửa đã chọn (BR-BC-11). | UC-BC-01 (5a), AC-BC-01, AC-BC-02, AC-BC-03 |
| BR-BC-11 | Mỗi bản sửa đúng gắn với đúng một trường cần sửa. Lý do chỉ có một trường thì trường đó được chọn sẵn: `Sai phụ đề tiếng Anh` → câu tiếng Anh, `Sai bản dịch` → bản dịch, `Sai từ vựng` → từ vựng. Lý do gồm nhiều trường thì học viên chọn một trường trong danh sách kèm giá trị hiện tại: `Sai phiên âm (IPA)` và `Sai phiên âm (IPA)` → IPA Mỹ hoặc IPA Anh; `Sai nghĩa hoặc định nghĩa` → nghĩa tiếng Việt, định nghĩa tiếng Anh hoặc định nghĩa tiếng Việt; `Sai câu ví dụ` → câu ví dụ hoặc bản dịch câu ví dụ. Giáo viên thấy trường đã chọn cạnh bản sửa (UC-XL-01) và bản sửa được áp dụng vào đúng trường đó (BR-XL-10). | UC-BC-01 (Bước 4, 5a), AC-BC-03 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-07 | Báo cáo lỗi nội dung đi vào hàng đợi của giáo viên chủ, người sửa nội dung hoặc từ chối báo cáo; quá 7 ngày chưa xử lý thì giáo viên được nhắc (BR-XL-11). Báo cáo Phản cảm đi thẳng vào hàng đợi của quản trị viên, người gỡ nội dung hoặc từ chối báo cáo (BR-XL-02). | UC-BC-01, AC-BC-01, 08 |
| BR-BC-08 | Một học viên không được gửi báo cáo mới có cùng lý do trên cùng một câu hoặc thẻ cụ thể nếu học viên đó đã có một báo cáo cùng lý do cho đúng câu hoặc thẻ đó mà chưa được xử lý xong (chưa ở trạng thái Đã xử lý hoặc Từ chối). Báo cáo của các học viên khác nhau về cùng câu hoặc thẻ, cùng lý do vẫn được nhận và được gộp thành một dòng cho người xử lý (BR-XL-06). | UC-BC-01 (5b), AC-BC-04 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-09 | Mô tả chi tiết trong mỗi báo cáo dài tối đa 500 ký tự. | UC-BC-01 (5a), AC-BC-03 |

## Bản chụp nội dung

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-BC-10 | Khi lưu báo cáo, hệ thống chụp lại giá trị hiện tại của nội dung bị báo (với câu: câu tiếng Anh, IPA, bản dịch, mốc bắt đầu và kết thúc; với thẻ: từ vựng, phiên âm, nghĩa hoặc định nghĩa, câu ví dụ, ảnh minh họa). Thay ảnh minh họa của thẻ được tính là đã sửa với lý do Phản cảm và Khác (BR-XL-05) và khi gửi yêu cầu xuất bản lại (BR-XL-13); trong chi tiết báo cáo, ảnh hiển thị là "Có ảnh" kèm nhãn đã đổi nếu ảnh khác lúc báo. Bản chụp không hiển thị cho học viên; giáo viên và quản trị viên thấy bản chụp ở mục "Nội dung lúc báo" trong chi tiết báo cáo (UC-XL-01), và module XL dùng bản chụp để kiểm tra nội dung đã được sửa (BR-XL-05). | UC-BC-01 (Bước 6), AC-BC-01 |
