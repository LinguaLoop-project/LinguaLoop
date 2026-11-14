# CD — Quản lý chủ đề và danh mục: Use Case

| Mã UC | Tên | Quản trị viên | Độ ưu tiên | Số AC |
|---|---|:---:|---|:---:|
| UC-CD-01 | Xem danh sách chủ đề | ✓ | Cao | 4 |
| UC-CD-02 | Thêm chủ đề | ✓ | Cao | 5 |
| UC-CD-03 | Sửa tên chủ đề | ✓ | Cao | 5 |
| UC-CD-04 | Xem danh sách danh mục | ✓ | Trung bình | 4 |
| UC-CD-05 | Thêm danh mục | ✓ | Trung bình | 5 |
| UC-CD-06 | Sửa tên danh mục | ✓ | Trung bình | 5 |

---

### UC-CD-01: Xem danh sách chủ đề

| Mục | Nội dung |
|---|---|
| Tác nhân | Quản trị viên |
| Mô tả | Cho phép quản trị viên xem, tìm kiếm và lọc danh sách chủ đề bài học. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập với vai trò Quản trị viên. |
| Điều kiện sau | Hệ thống hiển thị danh sách chủ đề phù hợp với điều kiện tìm kiếm của tác nhân. |
| Luồng chính | 1. Tác nhân chọn mục "Chủ đề" trong menu quản trị.<br>2. Hệ thống hiển thị tổng số chủ đề và danh sách chủ đề theo thứ tự hiển thị, mỗi chủ đề gồm: tên, số bài học đã xuất bản, trạng thái hiển thị (Đang hiển thị hoặc Chưa hiển thị, BR-CD-04) và ngày cập nhật.<br>3. Tác nhân tìm theo tên chủ đề, hoặc lọc theo trạng thái hiển thị.<br>4. Hệ thống hiển thị lại danh sách theo điều kiện tác nhân chọn.<br>5. Tác nhân chọn "Thêm chủ đề" (UC-CD-02) hoặc "Sửa tên" ở một chủ đề (UC-CD-03). |
| Luồng thay thế | Không có |
| Luồng ngoại lệ | **2a. Chưa có chủ đề nào (Xuất phát từ Bước 2)**<br>1. Hệ thống phát hiện chưa có chủ đề nào.<br>2. Hệ thống hiển thị thông báo "Chưa có chủ đề nào" kèm nút "Thêm chủ đề".<br>3. Kết thúc Use Case.<br><br>**4a. Không có chủ đề phù hợp (Xuất phát từ Bước 4)**<br>1. Hệ thống phát hiện không có chủ đề nào khớp từ khóa hoặc bộ lọc.<br>2. Hệ thống hiển thị thông báo "Không tìm thấy chủ đề phù hợp" kèm nút "Xóa bộ lọc".<br>3. Quay lại Bước 3 của Luồng chính. |
| Tiêu chí chấp nhận | **AC-CD-01 — Xem danh sách chủ đề**<br>Given: Hệ thống có 3 chủ đề theo thứ tự hiển thị "Du lịch", "Phỏng vấn", "Ẩm thực"; "Du lịch" có 5 bài học đã xuất bản và 2 bài Nháp, "Ẩm thực" chưa có bài nào.<br>When: Quản trị viên mở mục "Chủ đề".<br>Then: Hệ thống hiển thị "3 chủ đề" theo đúng thứ tự trên, "Du lịch" có số bài đã xuất bản là 5 và trạng thái Đang hiển thị, "Ẩm thực" có số bài là 0 và trạng thái Chưa hiển thị, mỗi chủ đề có đủ tên và ngày cập nhật.<br><br>**AC-CD-02 — Tìm kiếm và lọc**<br>Given: Hệ thống có chủ đề "Du lịch" đang hiển thị và chủ đề "Du học" chưa hiển thị.<br>When: Quản trị viên nhập từ khóa "Du" và lọc trạng thái "Chưa hiển thị".<br>Then: Hệ thống chỉ hiển thị chủ đề "Du học".<br><br>**AC-CD-03 — Chưa có chủ đề**<br>Given: Hệ thống chưa có chủ đề nào.<br>When: Quản trị viên mở mục "Chủ đề".<br>Then: Hệ thống hiển thị "Chưa có chủ đề nào" kèm nút "Thêm chủ đề" và không hiển thị danh sách.<br><br>**AC-CD-04 — Không có chủ đề phù hợp**<br>Given: Không có chủ đề nào có tên chứa "zzz".<br>When: Quản trị viên tìm "zzz".<br>Then: Hệ thống hiển thị "Không tìm thấy chủ đề phù hợp" kèm nút "Xóa bộ lọc", và khi chọn nút này danh sách đầy đủ hiển thị lại. |
| Độ ưu tiên | Cao |

### UC-CD-02: Thêm chủ đề

| Mục | Nội dung |
|---|---|
| Tác nhân | Quản trị viên |
| Mô tả | Cho phép quản trị viên thêm một chủ đề mới để giáo viên xếp bài học vào. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập với vai trò Quản trị viên. |
| Điều kiện sau | Chủ đề mới được lưu vào cuối danh sách, chưa có bài học nào; giáo viên chọn được chủ đề này khi soạn bài. |
| Luồng chính | 1. Tác nhân chọn "Thêm chủ đề".<br>2. Hệ thống hiển thị biểu mẫu trống gồm tên chủ đề.<br>3. Tác nhân nhập tên chủ đề.<br>4. Tác nhân chọn "Lưu".<br>5. Hệ thống kiểm tra thông tin theo BR-CD-01.<br>6. Hệ thống lưu chủ đề vào cuối danh sách, thông báo thành công và hiển thị chủ đề mới trong danh sách (UC-CD-01). |
| Luồng thay thế | Không có |
| Luồng ngoại lệ | **4a. Hủy thêm chủ đề (Xuất phát từ Bước 4)**<br>1. Tác nhân chọn "Hủy".<br>2. Hệ thống đóng biểu mẫu và không lưu gì.<br>3. Kết thúc Use Case.<br><br>**5a. Thiếu hoặc sai thông tin (Xuất phát từ Bước 5)**<br>1. Hệ thống phát hiện tên chủ đề trống hoặc dài quá 100 ký tự.<br>2. Hệ thống không lưu và hiển thị lỗi cạnh mục chưa hợp lệ.<br>3. Quay lại Bước 3 của Luồng chính.<br><br>**5b. Tên chủ đề bị trùng (Xuất phát từ Bước 5)**<br>1. Hệ thống phát hiện đã có một chủ đề khác cùng tên.<br>2. Hệ thống không lưu và yêu cầu đổi tên.<br>3. Quay lại Bước 3 của Luồng chính.<br><br>**6a. Mất kết nối khi lưu (Xuất phát từ Bước 6)**<br>1. Hệ thống không lưu được do mất kết nối.<br>2. Hệ thống thông báo lưu không thành công và giữ nguyên thông tin đã nhập trên biểu mẫu.<br>3. Quay lại Bước 4 của Luồng chính. |
| Tiêu chí chấp nhận | **AC-CD-05 — Thêm chủ đề thành công**<br>Given: Hệ thống có 3 chủ đề.<br>When: Quản trị viên chọn "Thêm chủ đề", nhập tên "Sức khỏe" rồi chọn "Lưu".<br>Then: Hệ thống thông báo thành công, danh sách có 4 chủ đề, chủ đề "Sức khỏe" nằm cuối với số bài là 0 và trạng thái Chưa hiển thị, và giáo viên chọn được chủ đề này khi soạn bài học.<br><br>**AC-CD-06 — Hủy thêm chủ đề**<br>Given: Quản trị viên đã nhập tên vào biểu mẫu.<br>When: Quản trị viên chọn "Hủy".<br>Then: Hệ thống đóng biểu mẫu và số chủ đề không thay đổi.<br><br>**AC-CD-07 — Thiếu hoặc sai thông tin**<br>Given: Quản trị viên để trống tên chủ đề.<br>When: Quản trị viên chọn "Lưu".<br>Then: Hệ thống không lưu, hiển thị lỗi "Tên chủ đề là bắt buộc" cạnh ô tên và giữ nguyên biểu mẫu đang nhập.<br><br>**AC-CD-08 — Tên chủ đề bị trùng**<br>Given: Đã có chủ đề tên "Du lịch".<br>When: Quản trị viên thêm chủ đề mới tên "du lịch".<br>Then: Hệ thống không lưu và yêu cầu đổi tên.<br><br>**AC-CD-09 — Mất kết nối khi lưu**<br>Given: Quản trị viên đã nhập thông tin hợp lệ nhưng mất kết nối.<br>When: Quản trị viên chọn "Lưu".<br>Then: Hệ thống thông báo lưu không thành công, giữ nguyên thông tin đã nhập và cho phép lưu lại khi có kết nối. |
| Độ ưu tiên | Cao |

### UC-CD-03: Sửa tên chủ đề

| Mục | Nội dung |
|---|---|
| Tác nhân | Quản trị viên |
| Mô tả | Cho phép quản trị viên sửa tên của một chủ đề. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập với vai trò Quản trị viên; chủ đề còn tồn tại. |
| Điều kiện sau | Chủ đề có tên mới; các bài học thuộc chủ đề, thứ tự hiển thị và liên kết đến chủ đề không đổi (BR-CD-03). |
| Luồng chính | 1. Tác nhân chọn "Sửa tên" ở một chủ đề trong danh sách (UC-CD-01).<br>2. Hệ thống hiển thị biểu mẫu với tên hiện có của chủ đề.<br>3. Tác nhân sửa tên.<br>4. Tác nhân chọn "Lưu".<br>5. Hệ thống kiểm tra thông tin theo BR-CD-01.<br>6. Hệ thống lưu thay đổi, làm mới ngày cập nhật, thông báo thành công và hiển thị chủ đề với tên mới; học viên và giáo viên thấy tên mới ở mọi nơi hiển thị chủ đề. |
| Luồng thay thế | Không có |
| Luồng ngoại lệ | **4a. Hủy sửa tên (Xuất phát từ Bước 4)**<br>1. Tác nhân chọn "Hủy".<br>2. Hệ thống đóng biểu mẫu và không lưu thay đổi.<br>3. Kết thúc Use Case.<br><br>**5a. Thiếu hoặc sai thông tin (Xuất phát từ Bước 5)**<br>1. Hệ thống phát hiện tên chủ đề trống hoặc dài quá 100 ký tự.<br>2. Hệ thống không lưu và hiển thị lỗi cạnh mục chưa hợp lệ.<br>3. Quay lại Bước 3 của Luồng chính.<br><br>**5b. Tên chủ đề bị trùng (Xuất phát từ Bước 5)**<br>1. Hệ thống phát hiện đã có một chủ đề khác cùng tên.<br>2. Hệ thống không lưu và yêu cầu đổi tên.<br>3. Quay lại Bước 3 của Luồng chính.<br><br>**6a. Mất kết nối khi lưu (Xuất phát từ Bước 6)**<br>1. Hệ thống không lưu được do mất kết nối.<br>2. Hệ thống thông báo lưu không thành công và giữ nguyên thay đổi trên biểu mẫu.<br>3. Quay lại Bước 4 của Luồng chính. |
| Tiêu chí chấp nhận | **AC-CD-10 — Sửa tên chủ đề thành công**<br>Given: Chủ đề "Du lịch" có 5 bài học đã xuất bản và một học viên đang mở liên kết đến chủ đề này.<br>When: Quản trị viên đổi tên thành "Du lịch và khám phá" rồi chọn "Lưu".<br>Then: Hệ thống thông báo thành công, danh sách hiển thị tên mới và ngày cập nhật mới, chủ đề vẫn có 5 bài học và giữ nguyên thứ tự, các bài học hiển thị chủ đề tên mới, và liên kết cũ đến chủ đề vẫn mở được.<br><br>**AC-CD-11 — Hủy sửa tên**<br>Given: Quản trị viên đã đổi tên trong biểu mẫu nhưng chưa lưu.<br>When: Quản trị viên chọn "Hủy".<br>Then: Hệ thống đóng biểu mẫu và chủ đề giữ nguyên tên cũ.<br><br>**AC-CD-12 — Thiếu hoặc sai thông tin**<br>Given: Quản trị viên xóa trắng ô tên chủ đề.<br>When: Quản trị viên chọn "Lưu".<br>Then: Hệ thống không lưu, hiển thị lỗi "Tên chủ đề là bắt buộc" cạnh ô tên và chủ đề giữ nguyên tên cũ.<br><br>**AC-CD-13 — Tên chủ đề bị trùng**<br>Given: Có hai chủ đề "Du lịch" và "Phỏng vấn".<br>When: Quản trị viên đổi tên "Phỏng vấn" thành "du lịch" rồi lưu.<br>Then: Hệ thống không lưu, yêu cầu đổi tên và chủ đề "Phỏng vấn" giữ nguyên tên cũ.<br><br>**AC-CD-14 — Mất kết nối khi lưu**<br>Given: Quản trị viên đã sửa tên hợp lệ nhưng mất kết nối.<br>When: Quản trị viên chọn "Lưu".<br>Then: Hệ thống thông báo lưu không thành công, giữ nguyên thay đổi trên biểu mẫu và cho phép lưu lại khi có kết nối. |
| Độ ưu tiên | Cao |

### UC-CD-04: Xem danh sách danh mục

| Mục | Nội dung |
|---|---|
| Tác nhân | Quản trị viên |
| Mô tả | Cho phép quản trị viên xem và tìm kiếm danh sách danh mục bộ thẻ từ vựng. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập với vai trò Quản trị viên. |
| Điều kiện sau | Hệ thống hiển thị danh sách danh mục phù hợp với điều kiện tìm kiếm của tác nhân. |
| Luồng chính | 1. Tác nhân chọn mục "Danh mục" trong menu quản trị.<br>2. Hệ thống hiển thị tổng số danh mục và danh sách danh mục theo thứ tự hiển thị, mỗi danh mục gồm: tên, số bộ thẻ đã xuất bản thuộc danh mục và ngày cập nhật.<br>3. Tác nhân tìm theo tên danh mục.<br>4. Hệ thống hiển thị lại danh sách theo từ khóa.<br>5. Tác nhân chọn "Thêm danh mục" (UC-CD-05) hoặc "Sửa tên" ở một danh mục (UC-CD-06). |
| Luồng thay thế | Không có |
| Luồng ngoại lệ | **2a. Chưa có danh mục nào (Xuất phát từ Bước 2)**<br>1. Hệ thống phát hiện chưa có danh mục nào.<br>2. Hệ thống hiển thị thông báo "Chưa có danh mục nào" kèm nút "Thêm danh mục".<br>3. Kết thúc Use Case.<br><br>**4a. Không có danh mục phù hợp (Xuất phát từ Bước 4)**<br>1. Hệ thống phát hiện không có danh mục nào khớp từ khóa.<br>2. Hệ thống hiển thị thông báo "Không tìm thấy danh mục phù hợp" kèm nút "Xóa bộ lọc".<br>3. Quay lại Bước 3 của Luồng chính. |
| Tiêu chí chấp nhận | **AC-CD-15 — Xem danh sách danh mục**<br>Given: Hệ thống có 3 danh mục "Học thuật", "Công việc", "Giao tiếp cơ bản"; "Học thuật" có 4 bộ thẻ đã xuất bản và 1 bộ Nháp.<br>When: Quản trị viên mở mục "Danh mục".<br>Then: Hệ thống hiển thị "3 danh mục" theo thứ tự hiển thị, "Học thuật" có số bộ thẻ đã xuất bản là 4, mỗi danh mục có đủ tên và ngày cập nhật.<br><br>**AC-CD-16 — Tìm kiếm danh mục**<br>Given: Hệ thống có danh mục "Học thuật" và "Công việc".<br>When: Quản trị viên nhập từ khóa "học".<br>Then: Hệ thống chỉ hiển thị danh mục "Học thuật".<br><br>**AC-CD-17 — Chưa có danh mục**<br>Given: Hệ thống chưa có danh mục nào.<br>When: Quản trị viên mở mục "Danh mục".<br>Then: Hệ thống hiển thị "Chưa có danh mục nào" kèm nút "Thêm danh mục" và không hiển thị danh sách.<br><br>**AC-CD-18 — Không có danh mục phù hợp**<br>Given: Không có danh mục nào có tên chứa "zzz".<br>When: Quản trị viên tìm "zzz".<br>Then: Hệ thống hiển thị "Không tìm thấy danh mục phù hợp" kèm nút "Xóa bộ lọc", và khi chọn nút này danh sách đầy đủ hiển thị lại. |
| Độ ưu tiên | Trung bình |

### UC-CD-05: Thêm danh mục

| Mục | Nội dung |
|---|---|
| Tác nhân | Quản trị viên |
| Mô tả | Cho phép quản trị viên thêm một danh mục mới để phân loại bộ thẻ từ vựng. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập với vai trò Quản trị viên. |
| Điều kiện sau | Danh mục mới được lưu vào cuối danh sách, chưa có bộ thẻ nào. |
| Luồng chính | 1. Tác nhân chọn "Thêm danh mục".<br>2. Hệ thống hiển thị biểu mẫu trống gồm tên danh mục.<br>3. Tác nhân nhập tên danh mục.<br>4. Tác nhân chọn "Lưu".<br>5. Hệ thống kiểm tra thông tin theo BR-CD-02.<br>6. Hệ thống lưu danh mục vào cuối danh sách, thông báo thành công và hiển thị danh mục mới trong danh sách (UC-CD-04). |
| Luồng thay thế | Không có |
| Luồng ngoại lệ | **4a. Hủy thêm danh mục (Xuất phát từ Bước 4)**<br>1. Tác nhân chọn "Hủy".<br>2. Hệ thống đóng biểu mẫu và không lưu gì.<br>3. Kết thúc Use Case.<br><br>**5a. Thiếu hoặc sai thông tin (Xuất phát từ Bước 5)**<br>1. Hệ thống phát hiện tên danh mục trống hoặc dài quá 100 ký tự.<br>2. Hệ thống không lưu và hiển thị lỗi cạnh mục chưa hợp lệ.<br>3. Quay lại Bước 3 của Luồng chính.<br><br>**5b. Tên danh mục bị trùng (Xuất phát từ Bước 5)**<br>1. Hệ thống phát hiện đã có một danh mục khác cùng tên.<br>2. Hệ thống không lưu và yêu cầu đổi tên.<br>3. Quay lại Bước 3 của Luồng chính.<br><br>**6a. Mất kết nối khi lưu (Xuất phát từ Bước 6)**<br>1. Hệ thống không lưu được do mất kết nối.<br>2. Hệ thống thông báo lưu không thành công và giữ nguyên thông tin đã nhập trên biểu mẫu.<br>3. Quay lại Bước 4 của Luồng chính. |
| Tiêu chí chấp nhận | **AC-CD-19 — Thêm danh mục thành công**<br>Given: Hệ thống có 3 danh mục.<br>When: Quản trị viên chọn "Thêm danh mục", nhập tên "Luyện thi" rồi chọn "Lưu".<br>Then: Hệ thống thông báo thành công, danh sách có 4 danh mục và danh mục "Luyện thi" nằm cuối với số bộ thẻ là 0.<br><br>**AC-CD-20 — Hủy thêm danh mục**<br>Given: Quản trị viên đã nhập tên vào biểu mẫu.<br>When: Quản trị viên chọn "Hủy".<br>Then: Hệ thống đóng biểu mẫu và số danh mục không thay đổi.<br><br>**AC-CD-21 — Thiếu hoặc sai thông tin**<br>Given: Quản trị viên để trống tên danh mục.<br>When: Quản trị viên chọn "Lưu".<br>Then: Hệ thống không lưu, hiển thị lỗi "Tên danh mục là bắt buộc" cạnh ô tên và giữ nguyên biểu mẫu đang nhập.<br><br>**AC-CD-22 — Tên danh mục bị trùng**<br>Given: Đã có danh mục tên "Học thuật".<br>When: Quản trị viên thêm danh mục mới tên "học thuật".<br>Then: Hệ thống không lưu và yêu cầu đổi tên.<br><br>**AC-CD-23 — Mất kết nối khi lưu**<br>Given: Quản trị viên đã nhập thông tin hợp lệ nhưng mất kết nối.<br>When: Quản trị viên chọn "Lưu".<br>Then: Hệ thống thông báo lưu không thành công, giữ nguyên thông tin đã nhập và cho phép lưu lại khi có kết nối. |
| Độ ưu tiên | Trung bình |

### UC-CD-06: Sửa tên danh mục

| Mục | Nội dung |
|---|---|
| Tác nhân | Quản trị viên |
| Mô tả | Cho phép quản trị viên sửa tên của một danh mục. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập với vai trò Quản trị viên; danh mục còn tồn tại. |
| Điều kiện sau | Danh mục có tên mới; các bộ thẻ thuộc danh mục và thứ tự hiển thị không đổi (BR-CD-03). |
| Luồng chính | 1. Tác nhân chọn "Sửa tên" ở một danh mục trong danh sách (UC-CD-04).<br>2. Hệ thống hiển thị biểu mẫu với tên hiện có của danh mục.<br>3. Tác nhân sửa tên.<br>4. Tác nhân chọn "Lưu".<br>5. Hệ thống kiểm tra thông tin theo BR-CD-02.<br>6. Hệ thống lưu thay đổi, làm mới ngày cập nhật, thông báo thành công và hiển thị danh mục với tên mới; học viên và giáo viên thấy tên mới ở mọi nơi hiển thị danh mục. |
| Luồng thay thế | Không có |
| Luồng ngoại lệ | **4a. Hủy sửa tên (Xuất phát từ Bước 4)**<br>1. Tác nhân chọn "Hủy".<br>2. Hệ thống đóng biểu mẫu và không lưu thay đổi.<br>3. Kết thúc Use Case.<br><br>**5a. Thiếu hoặc sai thông tin (Xuất phát từ Bước 5)**<br>1. Hệ thống phát hiện tên danh mục trống hoặc dài quá 100 ký tự.<br>2. Hệ thống không lưu và hiển thị lỗi cạnh mục chưa hợp lệ.<br>3. Quay lại Bước 3 của Luồng chính.<br><br>**5b. Tên danh mục bị trùng (Xuất phát từ Bước 5)**<br>1. Hệ thống phát hiện đã có một danh mục khác cùng tên.<br>2. Hệ thống không lưu và yêu cầu đổi tên.<br>3. Quay lại Bước 3 của Luồng chính.<br><br>**6a. Mất kết nối khi lưu (Xuất phát từ Bước 6)**<br>1. Hệ thống không lưu được do mất kết nối.<br>2. Hệ thống thông báo lưu không thành công và giữ nguyên thay đổi trên biểu mẫu.<br>3. Quay lại Bước 4 của Luồng chính. |
| Tiêu chí chấp nhận | **AC-CD-24 — Sửa tên danh mục thành công**<br>Given: Danh mục "Học thuật" có 4 bộ thẻ đã xuất bản.<br>When: Quản trị viên đổi tên thành "Học thuật và thi cử" rồi chọn "Lưu".<br>Then: Hệ thống thông báo thành công, danh sách hiển thị tên mới và ngày cập nhật mới, danh mục vẫn có 4 bộ thẻ và giữ nguyên thứ tự.<br><br>**AC-CD-25 — Hủy sửa tên**<br>Given: Quản trị viên đã đổi tên trong biểu mẫu nhưng chưa lưu.<br>When: Quản trị viên chọn "Hủy".<br>Then: Hệ thống đóng biểu mẫu và danh mục giữ nguyên tên cũ.<br><br>**AC-CD-26 — Thiếu hoặc sai thông tin**<br>Given: Quản trị viên xóa trắng ô tên danh mục.<br>When: Quản trị viên chọn "Lưu".<br>Then: Hệ thống không lưu, hiển thị lỗi "Tên danh mục là bắt buộc" cạnh ô tên và danh mục giữ nguyên tên cũ.<br><br>**AC-CD-27 — Tên danh mục bị trùng**<br>Given: Có hai danh mục "Học thuật" và "Công việc".<br>When: Quản trị viên đổi tên "Công việc" thành "học thuật" rồi lưu.<br>Then: Hệ thống không lưu, yêu cầu đổi tên và danh mục "Công việc" giữ nguyên tên cũ.<br><br>**AC-CD-28 — Mất kết nối khi lưu**<br>Given: Quản trị viên đã sửa tên hợp lệ nhưng mất kết nối.<br>When: Quản trị viên chọn "Lưu".<br>Then: Hệ thống thông báo lưu không thành công, giữ nguyên thay đổi trên biểu mẫu và cho phép lưu lại khi có kết nối. |
| Độ ưu tiên | Trung bình |
