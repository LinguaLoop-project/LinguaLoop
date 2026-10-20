# Đặc tả Use Case — Module LESSON (Thư viện bài học)

Trạng thái: **Nháp**, chờ duyệt. Người phụ trách: Lâm.

Phạm vi: phần học viên xem thư viện, chủ đề, chi tiết bài và transcript (đọc). Luyện nghe chép và nói theo thuộc module khác; soạn bài và duyệt bài thuộc module giảng viên/quản trị.

Quy ước: "bài hiển thị" là bài có trạng thái APPROVED và chưa bị xoá mềm. Mọi endpoint của module yêu cầu đăng nhập. Mã `AC-LESSON-xx` được tham chiếu trong tên test tích hợp (`LessonLibraryIntegrationTest`).

---

### UC-LESSON-01: Xem và lọc thư viện bài

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Xem danh sách bài học, tìm theo từ khoá và lọc theo chủ đề, trình độ, miễn phí, tiến độ. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập. |
| Điều kiện sau | Danh sách phân trang các bài hiển thị khớp bộ lọc. |
| Tiêu chí chấp nhận | **AC-LESSON-01 — Chỉ bài hiển thị**<br>Given: Có bài APPROVED, DRAFT, PENDING, REJECTED và bài APPROVED đã xoá mềm.<br>When: Tác nhân tìm kiếm.<br>Then: Chỉ bài APPROVED chưa xoá mềm xuất hiện.<br><br>**AC-LESSON-02 — Lọc**<br>Given: Có nhiều bài khác chủ đề, trình độ, gói.<br>When: Tác nhân lọc theo chủ đề, trình độ (nhiều mức phân tách bằng dấu phẩy), "chỉ bài miễn phí" hoặc từ khoá.<br>Then: Kết quả là giao của các bộ lọc; từ khoá không phân biệt hoa thường.<br><br>**AC-LESSON-03 — Lọc theo tiến độ**<br>Given: Tác nhân có bài chưa học, đang học, đã hoàn thành.<br>When: Tác nhân lọc `state` = todo, doing hoặc done.<br>Then: Chỉ trả bài đúng trạng thái của riêng tác nhân; giá trị khác ba giá trị trên trả 400 `VALIDATION_FAILED`.<br><br>**AC-LESSON-04 — Phân trang**<br>Given: Có nhiều hơn một trang kết quả.<br>When: Tác nhân yêu cầu trang, kích thước, sắp xếp.<br>Then: Phản hồi theo cấu trúc `PageResponse` (`items`, `page`, `size`, `totalElements`, `totalPages`), mỗi bài kèm số câu. |
| Độ ưu tiên | Cao |

---

### UC-LESSON-02: Xem chủ đề

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Xem danh sách chủ đề và một chủ đề cụ thể kèm số bài và số bài đã hoàn thành. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập. |
| Tiêu chí chấp nhận | **AC-LESSON-05 — Chủ đề**<br>Given: Có chủ đề APPROVED và chủ đề chưa duyệt.<br>When: Tác nhân xem danh sách chủ đề hoặc một chủ đề theo slug.<br>Then: Chỉ chủ đề APPROVED, sắp theo `sort_order`; mỗi chủ đề có tổng số bài hiển thị và số bài tác nhân đã hoàn thành; chủ đề chưa duyệt hoặc không tồn tại trả 404. |
| Độ ưu tiên | Cao |

---

### UC-LESSON-03: Xem chi tiết bài và transcript

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Xem thông tin một bài (kèm chủ đề, bài liên quan) và danh sách câu transcript. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập. |
| Tiêu chí chấp nhận | **AC-LESSON-06 — Chi tiết bài**<br>Given: Bài hiển thị cùng chủ đề có các bài hiển thị khác.<br>When: Tác nhân mở bài theo slug.<br>Then: Nhận thông tin bài, chủ đề, số câu và tối đa 3 bài liên quan (chỉ bài hiển thị, nhiều lượt xem trước).<br>Given: Bài DRAFT, PENDING, REJECTED, đã xoá mềm hoặc slug không tồn tại.<br>When: Tác nhân mở chi tiết hoặc transcript.<br>Then: Hệ thống trả 404 như bài không tồn tại.<br><br>**AC-LESSON-07 — Transcript**<br>Given: Bài hiển thị có nhiều câu.<br>When: Tác nhân mở transcript.<br>Then: Các câu được trả theo thứ tự `sort_order`. |
| Độ ưu tiên | Cao |

---

### UC-LESSON-04: Bài dành cho gói Pro

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Bài Pro xem được thông tin nhưng chỉ người dùng gói Pro còn hạn mới đọc được transcript và luyện. |
| Tiêu chí chấp nhận | **AC-LESSON-08 — Bài Pro**<br>Given: Bài Pro hiển thị.<br>When: Học viên gói miễn phí hoặc gói Pro đã hết hạn xem chi tiết và danh sách.<br>Then: Bài có `locked = true`; xem transcript trả 403 `LESSON_PRO_REQUIRED`.<br>When: Học viên có gói Pro còn hạn xem.<br>Then: `locked = false` và đọc được transcript. |
| Độ ưu tiên | Cao |

---

### UC-LESSON-05: Truy cập và trang tổng quan

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Trang tổng quan thư viện gồm "tiếp tục học" và các bài nổi bật theo chủ đề. |
| Tiêu chí chấp nhận | **AC-LESSON-09 — Yêu cầu đăng nhập**<br>Given: Yêu cầu không có token.<br>When: Gọi bất kỳ endpoint thư viện, chủ đề, chi tiết, transcript.<br>Then: Hệ thống trả 401.<br><br>**AC-LESSON-10 — Tổng quan**<br>Given: Tác nhân có bài đang học.<br>When: Tác nhân mở tổng quan.<br>Then: `continueLessons` gồm các bài đang học (mới nhất trước, tối đa 3); `topicRows` gồm tối đa 4 bài nhiều lượt xem của mỗi chủ đề; số truy vấn cơ sở dữ liệu không tăng theo số chủ đề. |
| Độ ưu tiên | Trung bình |

---

### UC-LESSON-06: Hợp đồng đọc bài và câu cho luyện tập (nội bộ)

| Mục | Nội dung |
|---|---|
| Tác nhân | Feature dictation / shadowing (gọi nội bộ qua `SentenceQueryService`) |
| Mô tả | Cung cấp thông tin bài, danh sách câu và kiểm tra quyền luyện một bài. |
| Tiêu chí chấp nhận | **AC-LESSON-11 — Đọc bài và câu**<br>Given: Bài APPROVED có các câu.<br>When: Gọi đọc bài theo id hoặc slug, đọc câu theo bài hoặc theo id câu.<br>Then: Trả đúng dữ liệu, câu theo thứ tự `sort_order`; bài hoặc câu của bài chưa duyệt, đã xoá mềm hoặc không tồn tại trả rỗng.<br><br>**AC-LESSON-12 — Quyền luyện**<br>Given: Bài Pro, bài thường, bài chưa duyệt.<br>When: Kiểm tra quyền luyện của người dùng.<br>Then: Bài thường cho phép; bài Pro cho phép khi gói Pro còn hạn, ngược lại báo `LESSON_PRO_REQUIRED`; bài không hiển thị báo `NOT_FOUND`. |
| Độ ưu tiên | Cao |

---

### UC-LESSON-07: Xem tiến độ nghe chép và điểm từng câu

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Cho phép tác nhân thấy mình đã nghe chép được bao nhiêu phần của một bài và điểm cao nhất của từng câu. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập. |
| Điều kiện sau | Thư viện và trang chi tiết bài hiển thị tiến độ nghe chép; danh sách câu hiển thị điểm cao nhất. |
| Tiêu chí chấp nhận | **AC-LESSON-13 — Tiến độ nghe chép**<br>Given: Bài có 3 câu; tác nhân đã nộp ít nhất một lượt nghe chép (kể cả làm lại hoặc bỏ cuộc) cho 2 câu.<br>When: Tác nhân xem thư viện hoặc trang chi tiết bài.<br>Then: Tiến độ nghe chép là 67% (số câu có kết quả chia tổng số câu, làm tròn); mỗi câu chỉ tính một lần dù nộp nhiều lượt; bài chưa làm hiển thị 0%; học viên khác không ảnh hưởng.<br><br>**AC-LESSON-14 — Điểm cao nhất từng câu**<br>Given: Tác nhân đã nộp nhiều lượt cho một câu, điểm 40 và 86,6.<br>When: Tác nhân xem danh sách câu của bài.<br>Then: Câu đó hiển thị điểm cao nhất 87 (làm tròn); câu chưa có điểm không hiển thị điểm. |
| Độ ưu tiên | Trung bình |

---

### Chưa thuộc phạm vi (ghi chú)

- Lọc theo chế độ luyện (`mode`) và phần trăm tiến độ của shadowing: chờ dữ liệu từ shadowing (tiến độ nghe chép đã có, xem AC-LESSON-13).
- Hoàn thành cả bài (`user_lesson_progress.completed_at`): chưa quy định khi nào một bài được coi là hoàn thành, nên chưa được ghi.
