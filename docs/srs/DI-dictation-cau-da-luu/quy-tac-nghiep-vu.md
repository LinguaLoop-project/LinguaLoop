# DI — Dictation và câu đã lưu: Business Rules

## Quyền hạn

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-DI-01 | Quyền mở luyện nghe chép đối với bài học gắn nhãn Pro theo BR-PR-13; học viên không đủ quyền bị hệ thống từ chối từ đầu và không hiển thị danh sách câu. | UC-DI-01 (1a), AC-DI-08 |
| BR-DI-02 | Học viên chỉ được xem kết quả, lịch sử lượt làm, ghi chú và danh sách câu cần ôn của chính mình; mọi thao tác truy cập hoặc sửa xóa dữ liệu của học viên khác đều bị hệ thống từ chối như không tồn tại. | UC-DI-01, UC-DI-02, AC-DI-33, AC-DI-37, AC-DI-43 |

## Trạng thái

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-DI-03 | Câu chưa có lượt nộp nào chỉ hiển thị số ô theo độ dài từ trong danh sách câu mà không hiển thị nội dung chữ gốc; chỉ khi câu đã có ít nhất một lượt nộp thì hệ thống mới hiển thị chữ gốc, điểm số, cho phép viết ghi chú và cho phép ghim thủ công vào danh sách Câu cần ôn. | UC-DI-01 (9c), UC-DI-02 (1c), AC-DI-01, AC-DI-36, AC-DI-41 |
| BR-DI-04 | Lượt làm khi tác nhân chọn "Hiện cả câu" được ghi nhận nhãn "Bỏ cuộc" với 0 điểm và toàn bộ từ cần điền ở trạng thái bỏ sót; lượt làm lại một câu đã có kết quả được ghi nhận nhãn "Làm lại". Cả lượt "Bỏ cuộc" và lượt "Làm lại" đều được lưu vào lịch sử câu nhưng không được tính vào thống kê điểm yếu của học viên. | UC-DI-01 (4b, 8a, 8c), AC-DI-24, AC-DI-25, AC-DI-26, AC-DI-32 |
| BR-DI-05 | Điểm hiển thị của một câu trên danh sách câu của bài luôn là điểm của lượt nộp mới nhất (kể cả lượt làm lại hoặc bỏ cuộc). | UC-DI-01 (6, 8a), AC-DI-13, AC-DI-26 |
| BR-DI-20 | Tiến độ nghe chép của một bài học được tính bằng tỷ lệ phần trăm số câu đã có ít nhất một lượt nộp (kể cả lượt làm lại hoặc bỏ cuộc) trên tổng số câu của bài (làm tròn số nguyên); mỗi câu chỉ được tính một lần dù học viên nộp nhiều lượt. | UC-DI-01 (6), AC-DI-28 |

## Dữ liệu hợp lệ

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-DI-06 | Mỗi câu có tối đa một ghi chú riêng cho chế độ Nghe chép với độ dài từ 1 đến 1000 ký tự sau khi bỏ khoảng trắng đầu cuối (không chấp nhận ghi chú rỗng hoặc chỉ chứa khoảng trắng); ghi chú của chế độ Nghe chép hoàn toàn độc lập với ghi chú của chế độ Shadowing trên cùng một câu. | UC-DI-01 (8b, 8d), AC-DI-34, AC-DI-35, AC-DI-38 |
| BR-DI-07 | Hệ thống chỉ cho phép nộp bài kiểm tra câu khi ở mức Normal/Hard ô gõ có ít nhất một ký tự khác khoảng trắng, hoặc ở mức Easy có ít nhất một ô trống được điền chữ hoặc đã mở gợi ý; ở mức Easy nếu tác nhân chỉ điền một phần số ô trống thì các ô để trống vẫn được chấm và tính là "bỏ sót". | UC-DI-01 (4d, 4c), AC-DI-17, AC-DI-19, AC-DI-20 |
| BR-DI-21 | Mỗi yêu cầu nộp bài nghe chép mang một mã định danh duy nhất theo từng học viên để khi hệ thống tự động gửi lại do mất kết nối mạng sẽ không tạo ra lượt làm thứ hai bị trùng lặp. | UC-DI-01 (4e), AC-DI-39 |

## Điều kiện

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-DI-08 | Chấm điểm câu nghe chép không phân biệt chữ hoa, chữ thường và bỏ qua dấu câu: ở mức Normal và Hard hệ thống đối chiếu từng từ đã gõ với câu gốc để phân loại kết quả (đúng, bỏ sót, nhầm từ, sai chính tả, từ thừa) và tính điểm trên tổng số từ của câu; ở mức Easy hệ thống chỉ chấm các ô trống và tính điểm bằng tỷ lệ phần trăm làm tròn của số ô đúng trên tổng số ô trống. | UC-DI-01 (5), AC-DI-13, AC-DI-18 |
| BR-DI-09 | Khi từ học viên gõ sai nằm cùng nhóm từ đồng âm với từ đúng của câu gốc (ví dụ "their" và "there"), hệ thống tính từ đó là lỗi sai chính tả và gắn thêm nhãn "từ đồng âm" trên kết quả từ đó. | UC-DI-01 (5a), AC-DI-15 |
| BR-DI-10 | Ở mức Easy, hệ thống tự động chọn từ 1 đến 3 từ làm ô trống ưu tiên theo điểm yếu của tác nhân (ô đầu tiên chọn từ nhóm từ có tỷ lệ lỗi cao trong 30 ngày gần nhất theo BR-TH-05, các ô sau ưu tiên đủ hai nhóm từ khác nhau), đảm bảo không có hai ô trống liền nhau và không bao giờ khoét tên riêng hoặc từ cảm thán; khi tác nhân chọn làm lại câu ở mức Easy, hệ thống chọn bộ ô trống mới tránh các từ đã khoét ở những lượt gần đây (nếu câu quá ngắn không có từ nào khoét được thì thông báo và cho chuyển câu đó sang mức Normal mà không đổi mức ưa thích). | UC-DI-01 (2b, 2d, 8a), AC-DI-18, AC-DI-21, AC-DI-27 |
| BR-DI-11 | Tác nhân được xin gợi ý (lộ từ) không giới hạn số lần trước khi nộp: ở mức Easy và Normal hệ thống lộ chữ đúng tại đúng ô được chọn, ở mức Hard hệ thống lộ từ đầu tiên chưa đúng theo thứ tự từ trái sang dưới dạng dòng gợi ý bên dưới ô gõ (nếu các từ đã gõ đều đúng hết thì thông báo đã đúng và không lộ thêm); mọi từ đã lộ đều bị đánh dấu "đã lộ" và tính là sai khi chấm điểm. | UC-DI-01 (4a, 4f), AC-DI-22, AC-DI-23 |
| BR-DI-12 | Nếu tác nhân đổi mức độ khó (Easy, Normal, Hard) khi đã gõ dở một phần câu, hệ thống giữ nguyên chữ đã gõ và mức độ khó của câu hiện tại, chỉ áp dụng mức độ khó mới từ câu tiếp theo. | UC-DI-01 (2c), AC-DI-14 |
| BR-DI-13 | Trình phát cho phép chọn tốc độ phát `0,5`, `0,75` hoặc `1` lần tốc độ gốc và chỉ phát đúng đoạn âm thanh của câu hiện tại rồi tự dừng; số lần nghe tăng thêm 1 mỗi khi bấm phát hoặc chọn câu chưa làm từ danh sách (chọn câu đã làm chỉ phát lại mà không tăng số lần nghe, chuyển câu bằng nút trước/sau hoặc tự tua trên thanh video khi ô gõ trống thì không tăng số lần nghe; nếu đang gõ dở mà tua thanh video thì giữ nguyên câu hiện tại). | UC-DI-01 (3, 7a, 7b, 3a), AC-DI-02, AC-DI-04, AC-DI-05, AC-DI-06, AC-DI-07 |
| BR-DI-14 | Khi hoàn thành câu cuối cùng của bài, hệ thống tính điểm trung bình của các câu đã làm (không tính các câu chỉ có lượt bỏ cuộc); nếu điểm trung bình đạt từ 80 điểm trở lên và tác nhân chưa làm ở mức Hard, hệ thống gợi ý làm lại toàn bộ bài ở mức khó hơn kế tiếp (nếu mọi câu đều bỏ cuộc thì hiển thị "Chưa có điểm" và không gợi ý). | UC-DI-01 (8, 8e, 8f), AC-DI-28, AC-DI-29, AC-DI-30, AC-DI-31, AC-DI-16 |
| BR-DI-15 | Hệ thống không tự động thêm hay tự động gỡ câu khỏi danh sách Câu cần ôn của chế độ Nghe chép: khi nộp lượt làm đạt dưới 60 điểm (kể cả lượt bỏ cuộc hoặc làm lại) mà câu chưa có trong danh sách thì hệ thống hiển thị hộp hỏi lưu câu; khi đạt từ 80 điểm trở lên mà câu đang có trong danh sách thì hiển thị hộp hỏi bỏ câu; từ 60 đến 79 điểm thì không hỏi và giữ nguyên trạng thái. Đóng hộp hỏi bằng phím Esc hoặc bấm ra ngoài được coi là giữ nguyên trạng thái trước đó ("Không" khi hỏi lưu, "Giữ lại" khi hỏi bỏ), không ghi nhớ lựa chọn "Không" cho các lượt nộp sau, và tạm ngưng các phím tắt chuyển câu của trang khi hộp hỏi đang mở. | UC-DI-02 (2, 3, 2a, 2b), AC-DI-40, AC-DI-44, AC-DI-45 |
| BR-DI-16 | Danh sách Câu cần ôn của chế độ Nghe chép sắp xếp theo điểm của lượt gần nhất từ thấp đến cao; nếu hai câu bằng điểm nhau thì câu mới được thêm vào danh sách hơn sẽ đứng trước. Việc gỡ câu khỏi danh sách không làm mất lịch sử các lượt làm đã lưu của câu đó. | UC-DI-02 (4, 5, 5a), AC-DI-42 |

## Giới hạn số

| Mã | Quy tắc | Áp dụng trong |
|---|---|---|
| BR-DI-17 | Ngưỡng điểm để hệ thống hỏi lưu câu vào danh sách Câu cần ôn sau một lượt nộp nghe chép là dưới 60 điểm (từ 0 đến 59 điểm). | UC-DI-02 (2, 3), AC-DI-40 |
| BR-DI-18 | Ngưỡng điểm để hệ thống hỏi gỡ câu khỏi danh sách Câu cần ôn (hoặc gợi ý nâng mức độ khó khi hoàn thành bài) là từ 80 điểm trở lên (từ 80 đến 100 điểm). | UC-DI-01 (8), UC-DI-02 (2a), AC-DI-29, AC-DI-40 |
| BR-DI-19 | Độ dài tối đa của một ghi chú câu là 1000 ký tự. | UC-DI-01 (8b, 8d), AC-DI-35 |