# AI — Thực hành với AI: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-AI-01 | Chức năng Thực hành với AI, Trò chuyện với AI theo câu và Nhận xét AI cho lượt đọc chỉ mở cho các bài học đã xuất bản và chưa bị xóa. Đối với bài học gắn nhãn Pro, quyền truy cập áp dụng theo BR-PR-13 (học viên gói Free bị hệ thống từ chối và mời nâng cấp). | UC-AI-01 (2a), AC-AI-01, AC-AI-09 |
| BR-AI-02 | Học viên phải xác nhận đồng ý cho phép xử lý dữ liệu bằng AI trước khi hệ thống khởi tạo cuộc trò chuyện Thực hành với AI (UC-AI-01), mở Phiên gia sư theo câu (UC-AI-02), tạo Nhận xét AI cho lượt đọc (UC-AI-03) hoặc gửi bản ghi âm đi chấm phát âm (BR-SH-04). | UC-AI-01 (2a), UC-AI-02, UC-AI-03 (2b), AC-AI-01, AC-AI-09, AC-AI-26 |
| BR-AI-03 | Học viên chỉ được xem và thao tác trên các cuộc trò chuyện, phiên gia sư, nhận xét AI và lịch sử hội thoại của chính mình; mọi yêu cầu truy cập vào dữ liệu AI hoặc lượt đọc của học viên khác đều bị hệ thống từ chối và báo không tìm thấy. | UC-AI-01 (1a), UC-AI-02, UC-AI-03 (2b), AC-AI-06, AC-AI-21, AC-AI-26 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-AI-04 | Trong Thực hành với AI theo bài, hệ thống trừ credit theo từng lượt của gia sư AI, sau khi lượt đó được tạo thành công; lượt bị lỗi không bị trừ credit. Nếu dịch vụ AI gặp lỗi không khởi tạo được câu hỏi đầu tiên thì hệ thống đóng phiên với trạng thái lỗi và không trừ credit của học viên. | UC-AI-01 (5a), AC-AI-01, AC-AI-04, AC-AI-11 |
| BR-AI-05 | Toàn bộ nội dung của mỗi cuộc trò chuyện theo bài (gồm các câu hỏi của gia sư, câu trả lời của học viên, nhận xét từng lượt và nhận xét tổng quát cuối phiên) đều được lưu vào lịch sử hội thoại của bài học đó. Khi học viên chọn bắt đầu lại cuộc trò chuyện mới, cuộc trò chuyện cũ được đóng và giữ nguyên trong lịch sử. Việc mở xem lại lịch sử hội thoại không làm tiêu tốn credit. | UC-AI-01 (1a, 4b), AC-AI-04, AC-AI-06 |
| BR-AI-15 | Khi tạo Phiên gia sư theo câu (UC-AI-02), hệ thống chưa trừ credit ngay mà chỉ bắt đầu trừ khi gia sư thực sự nói câu đầu tiên trong vòng 15 giây kể từ lúc tạo, sau đó trừ credit theo từng lượt của gia sư; nếu quá 15 giây không bắt đầu được thì phiên tự đóng với trạng thái lỗi kết nối và không trừ credit. Nếu credit không đủ cho lượt kế tiếp, hệ thống cho hoàn tất lượt đang chạy rồi kết thúc phiên, số dư không bị âm. Mỗi phiên kéo dài tối đa 10 phút; trong một ngày học viên chỉ được có tối đa 5 phiên không bắt đầu được. | UC-AI-02 (3a, 4a, 8a), AC-AI-13, AC-AI-14, AC-AI-20, AC-AI-30 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-AI-06 | Trong Thực hành với AI theo bài, học viên có thể trả lời câu hỏi của gia sư AI bằng một trong hai cách ở mỗi lượt: (a) gõ chữ với độ dài từ 1 đến 1000 ký tự sau khi bỏ khoảng trắng hai đầu; hoặc (b) thu âm giọng nói hợp lệ có thời lượng từ 0,5 giây đến 30 giây và nhận diện được lời nói. Nếu câu trả lời rỗng hoặc bản ghi âm không hợp lệ thì hệ thống không tính lượt và yêu cầu trả lời lại. | UC-AI-01 (4d), AC-AI-02, AC-AI-10 |
| BR-AI-12 | Khi tạo Nhận xét AI cho một lượt đọc Shadowing (UC-AI-03), hệ thống chỉ gửi văn bản câu mẫu, điểm số, danh sách các từ và các âm yếu của lượt đó tới dịch vụ AI, tuyệt đối không gửi tệp ghi âm của học viên. Mỗi lượt đọc có tối đa một nhận xét AI; sau khi tạo lần đầu, các lần yêu cầu xem lại (hoặc gửi trùng đồng thời) đều lấy lại bản đã lưu mà không gọi lại AI và không trừ thêm credit. | UC-AI-03 (2a, 6a), AC-AI-23, AC-AI-24, AC-AI-25 |
| BR-AI-16 | Trong Phiên gia sư theo câu (UC-AI-02), học viên hoặc gia sư chỉ được chọn đổi sang luyện các từ có mặt trong câu hiện tại (không phân biệt hoa thường và dấu câu); nếu từ được chọn chưa có trong Danh sách từ lỗi ban đầu thì hệ thống thêm từ đó vào danh sách với âm trọng tâm là âm đích có điểm thấp nhất của từ ở lượt đọc gốc. | UC-AI-02 (5a), AC-AI-15 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-AI-07 | Toàn bộ câu hỏi và nhận xét của gia sư AI trong phiên Thực hành với AI theo bài phải bám sát nội dung và lời thoại (transcript) của bài học đang mở. Sau mỗi câu trả lời của học viên, AI đối chiếu trực tiếp với diễn biến và nhân vật trong bài (ví dụ: nhắc nhở khi học viên trả lời về bản thân thay vì nói về nhân vật trong video), kèm theo gợi ý diễn đạt tiếng Anh tự nhiên hơn rồi mới đưa ra câu hỏi kế tiếp. | UC-AI-01, AC-AI-02 |
| BR-AI-08 | Ở bất kỳ câu hỏi nào trong cuộc trò chuyện theo bài, học viên đều có thể yêu cầu gợi ý trả lời; gợi ý cung cấp từ vựng và cấu trúc câu mẫu dựa trên lời thoại của bài học và không trừ thêm credit. | UC-AI-01 (4a), AC-AI-03 |
| BR-AI-09 | Khi hoàn thành đủ số câu hỏi của phiên hoặc khi học viên chủ động chọn kết thúc cuộc trò chuyện theo bài (sau khi đã trả lời ít nhất 1 câu), gia sư AI tổng hợp và hiển thị một bản nhận xét tổng quát đánh giá mức độ hiểu nội dung bài học, cách dùng từ, ngữ pháp và điểm cần cải thiện của học viên. | UC-AI-01 (4c), AC-AI-05 |
| BR-AI-14 | Khi Chế độ gia sư đang bật trong Shadowing, sau mỗi lượt đọc câu, hệ thống chỉ tự động hiển thị lời mời mở Phiên gia sư theo câu (UC-AI-02) nếu đã cách lần mời gần nhất trong bài ít nhất 3 lượt đọc và câu vừa đọc có từ dưới 60 điểm hoặc có âm đích cần sửa lặp lại ở ít nhất 1 trong 2 lượt đọc gần nhất của bài. Hệ thống ghi nhận sự kiện khi học viên bật hoặc tắt Chế độ gia sư. | UC-AI-02 (1a), AC-AI-12, AC-AI-22 |
| BR-AI-17 | Trong Phiên gia sư theo câu (UC-AI-02), mỗi từ lỗi có tối đa 3 lượt đọc; nếu âm trọng tâm của từ đạt từ 80 điểm trở lên hoặc đã hết 3 lượt thì chuyển sang từ kế tiếp (chọn lại từ đó sẽ được cấp 3 lượt mới; nếu lỗi dịch vụ chấm hoặc đổi từ khi đang chấm thì không tính lượt). Khi hết các từ trong danh sách, học viên đọc lại cả câu tối đa 3 lượt để hoàn tất phiên; các lượt đọc trong phiên không tạo lượt đọc Shadowing mới và không làm thay đổi điểm gốc của câu trong bài. | UC-AI-02, AC-AI-16, AC-AI-17, AC-AI-18 |
| BR-AI-18 | Trong Phiên gia sư theo câu (UC-AI-02), nếu học viên nói lạc đề 1 hoặc 2 lượt liên tiếp thì gia sư nhắc nhở quay lại bài học; nếu nói lạc đề 3 lượt liên tiếp thì hệ thống tự động kết thúc phiên ngay lập tức (nếu có 1 lượt đúng chủ đề xen giữa thì bộ đếm lạc đề liên tiếp đặt lại về 0). | UC-AI-02 (5b), AC-AI-19 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-AI-10 | Học viên dùng các tính năng AI (Thực hành với AI theo bài, Phiên gia sư theo câu, Nhận xét AI cho lượt đọc) bằng credit: gói Free dùng credit miễn phí hằng ngày (BR-GA-03), gói Pro dùng credit hằng tháng của gói (BR-GA-10, BR-PR-10). Mỗi lần dùng, hệ thống trừ credit theo chi phí thực tế của lần đó, làm tròn lên và tối thiểu 1 credit (BR-GA-06); hệ thống không hiển thị ước tính trước, chỉ hiển thị credit đã trừ và số dư còn lại sau mỗi lần dùng. Muốn bắt đầu một lần dùng, số dư phải đạt mức tối thiểu theo BR-GA-03. Hết credit thì không dùng thêm AI cho đến khi có credit mới: gói Free vào ngày mới, gói Pro vào tháng mới của gói hoặc khi gia hạn; không có chức năng mua thêm credit lẻ. | UC-AI-01 (2b, 4b), UC-AI-02 (3a), UC-AI-03 (3a), AC-AI-01, AC-AI-04, AC-AI-07, AC-AI-08, AC-AI-13, AC-AI-21, AC-AI-23, AC-AI-26, AC-AI-29, AC-AI-30 |
| BR-AI-11 | Mỗi cuộc trò chuyện Thực hành với AI theo bài gồm tối đa 5 lượt câu hỏi từ gia sư AI và kéo dài tối đa 15 phút; khi hết câu hỏi thứ 5 hoặc hết thời gian tối đa, hệ thống tự động chuyển sang bước đưa ra nhận xét tổng quát và kết thúc phiên. | UC-AI-01, AC-AI-05 |
| BR-AI-13 | Khi yêu cầu tạo Nhận xét AI cho lượt đọc (UC-AI-03) gặp tình trạng dịch vụ AI quá tải trước khi sinh ra chữ đầu tiên, hệ thống tự động thử lại đúng 1 lần sau khoảng 1 giây bằng mô hình dự phòng. Nếu vẫn quá tải, gặp lỗi hoặc học viên đóng trang trước khi nhận xét viết xong, hệ thống hủy kết quả dở dang và không trừ credit của học viên. | UC-AI-03 (5a), AC-AI-27, AC-AI-28 |
