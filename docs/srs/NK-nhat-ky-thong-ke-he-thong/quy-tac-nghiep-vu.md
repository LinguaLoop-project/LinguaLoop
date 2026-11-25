# NK — Nhật ký và thống kê hệ thống: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-NK-01 | Chỉ quản trị viên được xem nhật ký và thống kê hệ thống. Giáo viên chỉ xem thống kê nội dung của mình (module TN). | UC-NK-01 đến 04 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-NK-02 | Nhật ký chỉ đọc: không ai sửa hoặc xóa mục nhật ký. Nhật ký được giữ lâu dài, không tự xóa. | UC-NK-01 |
| BR-NK-03 | Nhật ký ghi các thao tác theo vai trò ở BR-NK-18. Mỗi mục gồm hành động, loại và tên đối tượng, đối tượng chứa (bài học hoặc bộ thẻ của nội dung bị báo cáo), người thực hiện (tên, vai trò), thời điểm, các mục bị đổi kèm giá trị cũ và mới, và lý do hoặc ghi chú nếu thao tác có nhập. Nội dung từng phần theo hành động: thao tác tạo hiển thị thông tin lúc tạo; thao tác sửa hiển thị giá trị trước và sau; thao tác xóa, xuất bản, gỡ xuất bản, khóa, mở khóa không kèm thay đổi vì hành động đã nói rõ trạng thái mới. Tên đối tượng và tên người thực hiện được lưu tại thời điểm ghi, vẫn hiển thị khi đối tượng hoặc tài khoản đã bị xóa. Thao tác do hệ thống tự thực hiện ghi người thực hiện là "Hệ thống". | UC-NK-01 (Bước 2, 6), AC-NK-01, 03 |
| BR-NK-06 | Cách tính chỉ số tổng quan: **người dùng hoạt động trong ngày** là tài khoản có ít nhất một lượt luyện, một lượt ôn thẻ hoặc một lần dùng AI thành công trong ngày; **tài khoản mới** là tài khoản tạo trong khoảng thời gian; **tỷ lệ Pro** = số học viên đang Pro / tổng số học viên; **doanh thu ghi nhận** = tổng, trên các đơn Pro đã thanh toán, của giá đơn × số ngày hiệu lực của đơn nằm trong khoảng ÷ tổng số ngày hiệu lực của đơn (gói nhiều tháng được chia đều theo ngày, không cộng cả giá gói vào một khoảng); **doanh thu thuần** = doanh thu ghi nhận × (1 − phí cổng thanh toán hiện hành, BR-GA-02). Các số doanh thu không trừ hoàn tiền. Số tổng tài khoản và số tài khoản Pro đang hoạt động là số tại thời điểm xem, không đổi theo khoảng thời gian. | UC-NK-02 (Bước 2, 3), UC-NK-04 (Bước 3), AC-NK-09, 10, 14, 21, 24 |
| BR-NK-08 | Thống kê luyện tập tính toàn hệ thống theo cách tính ở BR-TN-02 (lượt luyện, điểm trung bình, tỷ lệ trả lời đúng); lọc được theo gói của học viên (Tất cả, Free, Pro). Mỗi danh sách xếp hạng có tối đa 5 mục; các mục bằng nhau được xếp theo tên tăng dần. | UC-NK-03, AC-NK-16, 17 |
| BR-NK-09 | Thống kê sử dụng AI gồm 5 tính năng tính credit (BR-GA-04). **Lần dùng** là lần được xử lý thành công; **số đơn vị** là tổng đơn vị tính credit của các lần dùng đó, theo đúng đơn vị của bảng dịch vụ tính credit (lần nhận xét, phiên, cuộc trò chuyện, câu, bài); một lần gợi ý bản dịch cho nhiều câu tính nhiều đơn vị. **Credit đã tiêu** là tổng credit đã trừ cho các lần dùng đó (BR-GA-06). **Chi phí thực tế** là tổng chi phí đã ghi của mọi lần dùng, lần lỗi và lượt phát sinh thêm (BR-NK-15) trong khoảng (BR-GA-12), kể cả của tài khoản Free và giáo viên; không gồm chi phí chấm phát âm shadowing và chi phí máy chủ. **Tỷ lệ chi phí dùng thử** = chi phí thực tế của học viên Free (BR-NK-14) ÷ tổng chi phí thực tế; tổng chi phí bằng 0 thì không tính. **Giá bán bình quân mỗi đơn vị** của một tính năng = credit đã tiêu ÷ số đơn vị × giá trị 1 credit (đồng); **chi phí bình quân mỗi đơn vị** = chi phí thực tế của tính năng ÷ số đơn vị; hai số hiển thị kèm tên đơn vị (ví dụ "25 đ / câu"). Tính năng chưa có lần dùng thì không tính hai số này và được liệt kê riêng là chưa có lượt dùng. Tính năng có chi phí bình quân mỗi đơn vị lớn hơn giá bán bình quân mỗi đơn vị được đánh dấu "Lỗ", không phụ thuộc người dùng là Pro, Free hay giáo viên. **Lãi gộp** = doanh thu thuần (BR-NK-06) − chi phí thực tế trong cùng khoảng; **tỷ suất lãi gộp** = lãi gộp ÷ doanh thu thuần, doanh thu thuần bằng 0 thì không tính. Danh sách tài khoản có 10 tài khoản, xếp theo credit đã tiêu giảm dần. | UC-NK-04, AC-NK-21, 22, 24, 26, 27 |
| BR-NK-12 | Gói của học viên dùng để lọc và tách số liệu là **gói tại thời điểm thao tác**: học viên là Pro nếu lúc thao tác có một đơn Pro đã thanh toán còn hiệu lực, ngược lại là Free. Học viên đổi gói giữa khoảng thời gian được tính vào cả hai gói theo từng thao tác. Riêng số học viên đã luyện khi lọc "Tất cả" đếm mỗi học viên một lần. | UC-NK-03 (Bước 2, 5), UC-NK-04 (Bước 2), AC-NK-17, 21 |
| BR-NK-13 | Khi tính thống kê luyện tập: lượt "Làm lại" vẫn được đếm là lượt luyện và tính vào điểm trung bình; lượt "Hiện cả câu" được đếm là lượt luyện nhưng **không** tính vào điểm trung bình nghe chép. Lượt luyện trên câu hoặc thẻ đã bị xóa vẫn được tính. | UC-NK-03 (Bước 2), AC-NK-16, 20 |
| BR-NK-14 | Nhóm người dùng của một lần dùng AI được xác định tại thời điểm dùng: học viên đang Pro (BR-NK-12), học viên Free, giáo viên hoặc quản trị viên. Chi phí thực tế của học viên Free là **chi phí dùng thử** (BR-GA-03), dùng để tính tỷ lệ chi phí dùng thử (BR-NK-09). | UC-NK-04 (Bước 2), AC-NK-21, 27 |
| BR-NK-15 | Lượt phát sinh thêm chi phí trong một lần dùng đã trừ credit (các lượt sau của cuộc trò chuyện, BR-GA-12) được cộng vào chi phí thực tế của tính năng, không đếm là lần dùng, lần lỗi hay lần bị từ chối, và không trừ credit. | UC-NK-04 (Bước 2, 3), AC-NK-21, 26 |
| BR-NK-16 | Hệ thống không có chức năng xóa tài khoản; quản trị viên chỉ khóa tài khoản. Số liệu đã ghi nhận (lượt dùng AI, chi phí thực tế, đơn Pro đã thanh toán, lượt luyện) luôn được giữ, kể cả của tài khoản đang bị khóa. | UC-NK-02, UC-NK-03, UC-NK-04 |
| BR-NK-17 | "Mở đối tượng" trong chi tiết nhật ký mở trang quản trị tương ứng với loại đối tượng: bài học → chi tiết bài học; bộ thẻ → chi tiết bộ thẻ; tài khoản → chi tiết tài khoản; gói Pro → trang gói Pro; cấu hình credit → trang cấu hình credit; báo cáo → bài học hoặc bộ thẻ chứa nội dung bị báo cáo. Đối tượng đã bị xóa thì không có lựa chọn này. | UC-NK-01 (luồng 6a), AC-NK-04 |
| BR-NK-18 | Nhật ký ghi theo mức rủi ro: thao tác của quản trị viên, sự kiện bảo mật tài khoản, xử lý báo cáo và các mốc lớn của nội dung thư viện, liệt kê ở mục "Ma trận ghi nhật ký" bên dưới; thao tác không có trong ma trận thì không ghi. Nhập thẻ từ tệp được ghi **một mục cho cả lần nhập** trên bộ thẻ, ghi chú số thẻ. Không ghi: thao tác chỉ xem; sửa chi tiết nội dung của giáo viên (sửa thông tin bài học, bộ thẻ; thêm, sửa, xóa câu, nhóm thẻ, thẻ; gắn ảnh hàng loạt); hoạt động học của học viên (nghe chép, shadowing, ôn thẻ, dùng AI; số liệu này thuộc thống kê); nội dung cá nhân của học viên Pro; mua và thanh toán gói Pro (đã lưu trong đơn hàng); đăng nhập thành công, đăng xuất, xác thực email; lần hệ thống nhắc giáo viên xử lý báo cáo quá hạn. | UC-NK-01, BR-NT-10, BR-CD-07, BR-TK-18 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-NK-04 | Danh sách nhật ký mặc định lọc 7 ngày gần nhất; khoảng thời gian chọn được là 7, 30, 90 ngày hoặc Tất cả; thao tác mới nhất ở đầu, 50 mục mỗi trang. Lọc được theo vai trò người thực hiện (Học viên, Giáo viên, Quản trị viên, Hệ thống). Các điều kiện lọc kết hợp được với nhau (tất cả cùng đúng). | UC-NK-01, AC-NK-01, 02, 05, 08 |
| BR-NK-07 | Khoảng thời gian xem thống kê là 7, 30 hoặc 90 ngày gần nhất, mặc định 30 ngày; mức tăng giảm so với khoảng liền trước có cùng độ dài. Ngày trong thống kê và biểu đồ tính theo giờ Việt Nam (00:00 đến 23:59); "N ngày gần nhất" gồm hôm nay và N − 1 ngày trước đó. Biểu đồ theo ngày luôn có đủ N ngày; ngày không có dữ liệu hiển thị 0, không bỏ qua. | UC-NK-02, UC-NK-03, UC-NK-04, AC-NK-09, 10, 15, 17, 22 |
| BR-NK-10 | Số liệu thống kê được cập nhật mỗi giờ và luôn hiển thị thời điểm cập nhật gần nhất. Nhật ký cập nhật ngay khi thao tác xảy ra. | UC-NK-02 (Bước 2), UC-NK-03 (Bước 2), UC-NK-04 (Bước 2), AC-NK-09 |

## Ma trận ghi nhật ký (BR-NK-18)

| Vai trò người thực hiện | Đối tượng | Thao tác được ghi | Quy tắc nguồn |
|---|---|---|---|
| Giáo viên | Bài học | Tạo (thêm từ YouTube), xuất bản, gỡ xuất bản, xóa, khôi phục | UC-BH-03, 06 đến 09 |
| Giáo viên | Bộ thẻ | Tạo, xuất bản, gỡ xuất bản, xóa, khôi phục; nhập thẻ từ tệp (một mục cho cả lần nhập) | BR-BT-16, BR-NT-10 |
| Giáo viên | Báo cáo | Xử lý (kể cả áp dụng bản sửa đề xuất), từ chối | BR-XL-07 |
| Quản trị viên | Tài khoản | Khóa, mở khóa, đổi vai trò, giao lại nội dung, cấp credit cho giáo viên | BR-QT-09, BR-GA-09 |
| Quản trị viên | Cấu hình credit | Sửa cấu hình | BR-GA-09 |
| Quản trị viên | Gói Pro | Thêm, sửa, bật bán, ngừng bán | BR-GA-09 |
| Quản trị viên | Bài học, bộ thẻ | Gỡ xuất bản (trực tiếp hoặc theo báo cáo) | UC-BH-07, UC-BT-06, BR-XL-07 |
| Quản trị viên | Báo cáo | Từ chối, gỡ nội dung và đóng báo cáo, duyệt hoặc từ chối xuất bản lại | BR-XL-07 |
| Quản trị viên | Chủ đề, danh mục | Tạo, sửa tên (khi có chức năng quản lý chủ đề, danh mục) | BR-CD-07 |
| Học viên | Báo cáo | Gửi báo cáo câu hoặc thẻ | BR-XL-07 |
| Hệ thống | Báo cáo | Tự đóng | BR-XL-07 |
| Hệ thống | Tài khoản | Tạm khóa đăng nhập vì sai mật khẩu nhiều lần | BR-TK-18 |
| Mọi vai trò (chính chủ tài khoản) | Tài khoản | Đặt lại mật khẩu, tạo hoặc đổi mật khẩu | BR-TK-18 |
