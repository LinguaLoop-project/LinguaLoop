# TC — Tra cứu và học thụ động: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TC-01 | Mọi chức năng xem thư viện, chủ đề, chi tiết bài học, học thụ động và tra từ điển đều yêu cầu học viên đã đăng nhập. Quyền xem lời thoại, xem video Pro và luyện tập đối với bài học gắn nhãn Pro theo BR-PR-13. | UC-TC-01, UC-TC-02 (4a, 4b), UC-TC-04, AC-TC-08, AC-TC-10, AC-TC-14, AC-TC-15, AC-TC-18, AC-TC-32 |
| BR-TC-02 | Tiến độ bài học, điểm cao nhất từng câu, danh sách bài đang học, trạng thái thích video và trạng thái lưu nghĩa từ điển hiển thị cho học viên nào thì chỉ tính trên dữ liệu của chính học viên đó, hoàn toàn tách biệt với học viên khác. | UC-TC-01, UC-TC-02, UC-TC-03, UC-TC-04, AC-TC-04, AC-TC-21 |
| BR-TC-13 | Nguồn video trong mục Học thụ động chỉ bao gồm các bài học video ngắn đã xuất bản do hệ thống cung cấp; học viên không có quyền tự đăng tải video lên mục Học thụ động. | UC-TC-04, AC-TC-25, AC-TC-32 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TC-03 | Học viên chỉ được nhìn thấy và truy cập các bài học và video học thụ động đang ở trạng thái Đã xuất bản và chưa bị xóa mềm, cùng các chủ đề đang hiển thị (có ít nhất 1 bài học đã xuất bản, BR-CD-04); mọi bài học ở trạng thái Nháp hoặc đã xóa mềm, hay chủ đề chưa hiển thị, đều bị ẩn khỏi danh sách và báo không tìm thấy nếu truy cập trực tiếp. | UC-TC-01 (2a, 3a), UC-TC-02 (2a), UC-TC-04, AC-TC-01, AC-TC-06, AC-TC-07, AC-TC-11, AC-TC-12, AC-TC-25 |
| BR-TC-16 | Mỗi học viên có tối đa một lượt thích trên mỗi video học thụ động; bấm nút Thích khi chưa thích sẽ chuyển sang Đã thích và tăng số lượt thích của video thêm 1, bấm lại khi Đã thích sẽ hủy thích và giảm số lượt thích đi 1 (gửi lặp lại cùng một thao tác không làm tăng/giảm số lượt thích nhiều lần). | UC-TC-04 (3b), AC-TC-27 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TC-04 | Khi lọc thư viện bài học, kết quả trả về phải thỏa mãn đồng thời tất cả các bộ lọc đang chọn (chủ đề, trình độ, chỉ bài miễn phí, tiến độ và từ khóa không phân biệt chữ hoa hay thường). Bộ lọc tiến độ chỉ chấp nhận một trong ba giá trị: `chưa học`, `đang học`, `đã hoàn thành`; mọi giá trị khác đều bị từ chối. | UC-TC-01 (4b), AC-TC-03, AC-TC-04, AC-TC-09 |
| BR-TC-05 | Danh sách các câu lời thoại của một bài học hiển thị hoặc cung cấp cho các chế độ luyện tập luôn được sắp xếp theo đúng thứ tự câu đã quy định trong bài học. | UC-TC-02, AC-TC-13, AC-TC-18 |
| BR-TC-06 | Khi học viên tra từ điển bằng ô tìm kiếm hoặc bấm vào một từ trong câu của bài học (kể cả khi từ đó đang ở dạng chia số nhiều, chia thì như "went", "books"), hệ thống tự động nhận diện và hiển thị mục từ gốc ("go", "book") không phân biệt chữ hoa hay chữ thường. | UC-TC-03, AC-TC-19, AC-TC-20, AC-TC-22, AC-TC-23 |
| BR-TC-07 | Mỗi mục từ trong hộp tra từ điển hiển thị phiên âm, âm thanh phát âm giọng Anh và giọng Mỹ, và chia thành từng nghĩa riêng biệt kèm loại từ, nghĩa tiếng Việt, câu ví dụ và trạng thái "Lưu" hoặc "Đã lưu" của từng nghĩa đối với học viên đang xem. | UC-TC-03, AC-TC-19, AC-TC-21 |
| BR-TC-15 | Trong mục Học thụ động, học viên được chọn tốc độ phát `0,5`, `0,75`, `1`, `1,25` hoặc `1,5` lần tốc độ gốc và bật/tắt hiển thị phụ đề; lựa chọn tốc độ phát và trạng thái bật/tắt phụ đề được giữ nguyên xuyên suốt khi học viên cuộn sang các video tiếp theo trong cùng phiên xem. | UC-TC-04 (3a), AC-TC-26 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TC-08 | Phần trăm tiến độ nghe chép của một bài học trên thư viện và trang chi tiết bài được tính bằng số câu đã có ít nhất một lượt nộp nghe chép (kể cả lượt làm lại hoặc bỏ cuộc) chia cho tổng số câu của bài rồi làm tròn đến hàng đơn vị; mỗi câu chỉ tính 1 lần dù nộp nhiều lượt, bài chưa làm câu nào hiển thị $0\%$. | UC-TC-01, UC-TC-02, AC-TC-05, AC-TC-16 |
| BR-TC-09 | Trên danh sách câu lời thoại của trang chi tiết bài học, mỗi câu hiển thị riêng huy hiệu điểm cao nhất đã làm tròn đến hàng đơn vị của chế độ Nghe chép và chế độ Shadowing; câu chưa có lượt làm ở chế độ nào thì không hiển thị huy hiệu của chế độ đó. | UC-TC-02, AC-TC-17 |
| BR-TC-14 | Khi xem Học thụ động, hệ thống chỉ phát video đang hiển thị trên màn hình và tự động dừng video trước đó ngay khi học viên cuộn qua; lời thoại hiển thị chạy đồng bộ theo mốc thời gian của từng câu trong video. Khi học viên mở hộp Tra từ điển hoặc mở biểu mẫu Báo cáo nội dung, video đang xem tự động tạm dừng và phát tiếp khi đóng hộp thoại. | UC-TC-04 (3c, 3f), AC-TC-25, AC-TC-28 |
| BR-TC-17 | Khi học viên chọn "Lưu câu" trong lúc xem Học thụ động, câu lời thoại đang phát được thêm vào danh sách Câu cần ôn (chế độ Shadowing, lý do ghim tay) ngay cả khi học viên chưa có lượt đọc nào cho câu đó (vì ở Học thụ động toàn bộ lời thoại đã được hiển thị công khai); bấm lại nút "Đã lưu câu" sẽ gỡ câu đó khỏi danh sách. | UC-TC-04 (3d), AC-TC-29 |
| BR-TC-18 | Mỗi video trong mục Học thụ động luôn gắn với một bài học đã xuất bản của hệ thống; khi học viên chọn chuyển sang luyện bài từ video đang xem, hệ thống dừng phát video thụ động và mở trực tiếp màn hình Thực hành shadowing (UC-SH-01) của bài học đó. | UC-TC-04 (3e), AC-TC-30 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-TC-10 | Trên trang tổng quan Thư viện bài học, mục "Tiếp tục học" hiển thị tối đa 3 bài học mà học viên đang học gần nhất; phần danh sách theo chủ đề hiển thị tối đa 4 bài học có nhiều lượt xem nhất cho mỗi chủ đề đang hiển thị. | UC-TC-01, AC-TC-02 |
| BR-TC-11 | Kết quả tìm kiếm và lọc bài học luôn được chia theo trang, mỗi bài trong trang hiển thị kèm tổng số câu của bài và thông tin phân trang (danh sách bài, trang hiện tại, kích thước trang, tổng số bài, tổng số trang). | UC-TC-01, AC-TC-05 |
| BR-TC-12 | Trang chi tiết một bài học hiển thị tối đa 3 bài học liên quan cùng chủ đề với bài đang xem (chỉ lấy các bài học hiển thị hợp lệ và ưu tiên bài có nhiều lượt xem hơn đứng trước). | UC-TC-02, AC-TC-11 |