# GA — Quản lý gói Pro và credit AI: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-GA-01 | Chỉ quản trị viên được xem và sửa cấu hình credit, quản lý gói Pro và cấp credit cho giáo viên. Quản trị viên không có chức năng cấp, hủy hay thu hồi gói Pro của học viên; học viên có gói Pro khi mua (module PR). | UC-GA-01 đến 07 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-GA-02 | Thông số quy đổi gồm: giá trị 1 credit tính bằng đồng (số nguyên từ 1 đến 1.000; mặc định 25), phí cổng thanh toán (từ 0% đến 99%; mặc định 3%) và biên lợi nhuận mong muốn (từ 0% đến 99%; mặc định 40%). Tổng phí cổng thanh toán và biên lợi nhuận phải nhỏ hơn 100%. | UC-GA-01 (Bước 2), UC-GA-02 (5a, 5b), AC-GA-01, 08, 09 |
| BR-GA-04 | Bảng đơn giá có 4 hàng cố định: nhận xét AI cho lượt đọc, thực hành với AI theo bài, phiên gia sư theo câu (học viên dùng) và gợi ý dịch và IPA khi soạn bài (giáo viên dùng). Mỗi hàng có đơn giá phần đầu vào và đơn giá phần đầu ra, tính bằng đồng cho mỗi một triệu đơn vị xử lý của dịch vụ AI; giá trị là số nguyên từ 0 đến 100.000.000. Quản trị viên chỉ sửa giá trị, không thêm hay bớt tính năng. Các tính năng shadowing, nghe chép và tra từ điển không tốn credit. | UC-GA-01 (Bước 4), UC-GA-02 (5a), AC-GA-01, 05 |
| BR-GA-07 | Gói Pro gồm: tên gói (1 đến 50 ký tự, không trùng tên với gói khác, không phân biệt chữ hoa, chữ thường), thời hạn (số nguyên từ 1 đến 36 tháng), giá (số nguyên từ 0 đến 100.000.000 đồng) và số credit mỗi tháng (số nguyên từ 0 đến 1.000.000), cùng trạng thái Đang bán hoặc Ngừng bán. Gói mới tạo luôn ở trạng thái Ngừng bán. Không xóa gói, chỉ ngừng bán. Danh sách gói sắp xếp theo thời hạn tăng dần. | UC-GA-03 (Bước 2), UC-GA-04 (6a, 6b), UC-GA-05 (6a, 6b), AC-GA-14, 17, 20, 21, 27 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-GA-05 | Số credit mỗi tháng gợi ý của một gói = giá gói ÷ số tháng của gói × (1 − phí cổng thanh toán) × (1 − biên lợi nhuận) ÷ giá trị 1 credit (đồng), làm tròn xuống. Ví dụ với 1 credit bằng 25 đồng, phí cổng 3%, biên lợi nhuận 40%: gói 1 tháng giá 50.000 đồng cho 1.164 credit mỗi tháng; gói 3 tháng giá 129.000 đồng cho 1.001 credit mỗi tháng; gói 1 năm (12 tháng) giá 500.000 đồng cho 970 credit mỗi tháng. Có thể đặt phí cổng thanh toán 0% nếu không tính khoản này. Số gợi ý chỉ để tham khảo, quản trị viên được sửa trước khi lưu. Số credit đã lưu của gói không tự đổi khi cấu hình đổi. | UC-GA-02 (Bước 8), UC-GA-04 (Bước 4), UC-GA-05 (Bước 4), AC-GA-13, 17, 18, 23 |
| BR-GA-06 | Mỗi lần dùng một tính năng AI, hệ thống trừ credit bằng chi phí thực tế của lần dùng đó: (khối lượng đầu vào × đơn giá đầu vào + khối lượng đầu ra × đơn giá đầu ra) ÷ giá trị 1 credit (đồng), làm tròn lên và tối thiểu 1 credit. Hệ thống không trừ credit nếu lần dùng lỗi do hệ thống. Tài khoản Free trừ credit miễn phí của ngày; tài khoản Pro trừ credit hằng tháng của gói; giáo viên trừ vào số dư do quản trị viên cấp (BR-GA-11). Hệ thống không hiển thị ước tính credit trước khi dùng, chỉ hiển thị credit đã trừ và số dư còn lại sau mỗi lần dùng. Với phiên nhiều lượt, credit được trừ theo từng lượt; nếu hết credit giữa phiên thì lượt đang chạy được hoàn tất rồi phiên dừng, số dư không bị âm. Hết credit thì không dùng thêm AI cho đến khi có credit mới: gói Free vào ngày mới, gói Pro vào tháng mới của gói; không có chức năng mua thêm credit lẻ. Cấu hình mới chỉ áp dụng cho các lần dùng sau thời điểm lưu. | UC-GA-02 (Bước 8), AC-GA-05 |
| BR-GA-08 | Sửa giá, thời hạn hoặc số credit của gói, hoặc ngừng bán gói, chỉ áp dụng cho các lượt mua sau thời điểm lưu; các lượt đã mua giữ nguyên giá, thời hạn và số credit mỗi tháng lúc mua. Học viên chỉ thấy các gói đang bán. Khi ngừng bán gói đang bán cuối cùng, hệ thống cảnh báo nhưng vẫn cho phép. | UC-GA-05, UC-GA-06 (Bước 2, 2a), AC-GA-23, 29, 30, 31 |
| BR-GA-09 | Mọi thao tác sửa cấu hình, thêm gói, sửa gói, bật hoặc ngừng bán gói và cấp credit cho giáo viên được ghi lại: người thực hiện, thời điểm, giá trị cũ và mới (hoặc số credit được cấp), lý do hoặc ghi chú. Màn hình cấu hình credit hiển thị người sửa gần nhất và thời điểm. | UC-GA-01 (Bước 5), UC-GA-02 (Bước 8), UC-GA-04, UC-GA-05, UC-GA-06, UC-GA-07, AC-GA-01, 04 |
| BR-GA-10 | Credit của gói Pro được cấp theo tháng: ngày kích hoạt cấp ngay số credit mỗi tháng của gói, sau đó cứ mỗi tháng (cùng ngày) cấp lại một lần cho đến khi gói hết hạn. Số credit còn lại cuối mỗi tháng không cộng dồn: sang tháng mới số dư credit của gói được đặt lại bằng số credit mỗi tháng. Gói hết hạn thì tài khoản về gói Free, credit của gói không còn dùng được; dữ liệu học tập vẫn được giữ nguyên. Khi học viên gia hạn lúc gói còn hạn, gói mới bắt đầu cấp credit từ ngày hết hạn hiện tại và số dư hiện có giữ nguyên đến hết tháng hiện tại. | Module PR (mua gói Pro) |
| BR-GA-11 | Quản trị viên cấp credit cho tài khoản đang hoạt động có vai trò Giáo viên. Số credit là số nguyên từ 1 đến 1.000.000; ghi chú bắt buộc, dài 1 đến 500 ký tự. Credit cấp cho giáo viên cộng vào số dư riêng, không hết hạn và không đặt lại theo tháng, và chỉ dùng cho tính năng AI khi soạn bài (BR-GA-04). Khi số dư không đủ, giáo viên không dùng được tính năng AI đó nhưng vẫn soạn và sửa nội dung thủ công bình thường. Giáo viên không có credit miễn phí hằng ngày và không mua gói Pro. Giáo viên được báo khi nhận credit. | UC-GA-07, AC-GA-33, 34, 36 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-GA-03 | Credit miễn phí mỗi ngày của gói Free là số nguyên từ 0 đến 10.000 (mặc định 20), đặt lại vào 00:00 mỗi ngày theo giờ Việt Nam và không cộng dồn sang ngày sau; chỉ áp dụng cho tài khoản không có gói Pro còn hạn. Số dư tối thiểu để được bắt đầu một lần dùng tính năng AI là số nguyên từ 0 đến 1.000 (mặc định 5). | UC-GA-01 (Bước 3), UC-GA-02 (5a), AC-GA-01, 04, 12 |
