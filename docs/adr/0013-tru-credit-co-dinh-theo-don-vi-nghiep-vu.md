# Trừ credit cố định theo đơn vị nghiệp vụ và ghi chi phí thật

Status: accepted

Ngày: 2026-11-21

Thay phần "Chi phí" của ADR 0012 (tạo bài từ YouTube nay có trừ credit).

Trước đây credit của một lần dùng AI bằng chi phí thực tế của lần đó (khối lượng đầu vào × đơn giá đầu vào + khối lượng đầu ra × đơn giá đầu ra, chia giá trị 1 credit, làm tròn lên). Nay mỗi tính năng tính credit có **một mức credit cố định cho mỗi đơn vị nghiệp vụ** do quản trị viên cấu hình. Chi phí thật vẫn được tính và ghi lại cho từng lần dùng, nhưng chỉ dùng cho thống kê lãi lỗ, không dùng để trừ credit.

| Tính năng | Người dùng | Đơn vị | Mặc định |
|---|---|---|---|
| Nhận xét AI cho lượt đọc (UC-AI-03) | Học viên | lần nhận xét | 2 |
| Phiên gia sư theo câu (UC-AI-02) | Học viên | phiên | 3 |
| Thực hành với AI theo bài (UC-AI-01), cả giọng nói lẫn chat chữ | Học viên | cuộc trò chuyện | 5 |
| Gợi ý bản dịch khi soạn bài (UC-BH-10) | Giáo viên | câu | 1 |
| Tạo bài từ link YouTube (UC-BH-03) | Giáo viên, học viên Pro (bài cá nhân) | bài | 10 |

Lý do:

1. **Học viên biết trước một lần dùng tốn bao nhiêu.** Trừ theo token thì cùng một thao tác lúc rẻ lúc đắt (lịch sử hội thoại dài dần), người học không đoán được, ngại dùng. Các app học và sản phẩm có credit hiển thị (Firefly, Canva) đều tính theo thao tác.
2. **Chi phí mỗi đơn vị bị chặn trên** nên giá cố định không gây lỗ: cuộc trò chuyện theo bài tối đa 5 câu hỏi và 15 phút (BR-AI-11), phiên gia sư tối đa 10 phút (BR-AI-15), nhận xét AI giới hạn độ dài đầu ra, câu tối đa 500 ký tự, video tối đa 15 phút (BR-BH-17). Cuộc trò chuyện theo bài tính theo cuộc chứ không theo lượt vì đã có trần 5 câu hỏi, và chế độ chat chữ chỉ là dự phòng của chế độ giọng nói nên cùng một giá.
3. **Kiểm thử được**: tiêu chí chấp nhận kiểm "trừ đúng N credit", không phụ thuộc số token AI trả về.
4. **TranscriptAPI tính phí theo lần lấy**, đúng dạng giá cố định; trước đây dự án chịu toàn bộ chi phí tạo bài.

Hệ quả:

- **Bỏ số dư tối thiểu để bắt đầu** (`ai_settings.min_balance_to_start`): chỉ cần số dư ≥ credit mỗi đơn vị × số đơn vị.
- **Hiển thị giá trước khi dùng** (ví dụ "Nhận xét AI · 2 credit", "Gợi ý dịch 20 câu · 20 credit"), sau khi dùng hiển thị credit đã trừ và số dư.
- **Trừ một lần cho mỗi đơn vị**, chỉ khi thành công; lỗi do hệ thống không trừ; lỗi một phần (gợi ý dịch) chỉ trừ phần thành công. Phiên gia sư và cuộc trò chuyện theo bài trừ lúc gia sư nói câu đầu, các lượt sau, gợi ý và nhận xét tổng quát không trừ thêm.
- **Chi phí thật của mỗi lần dùng** (`ai_usage_logs.cost_vnd`): tính theo token (gồm cả token suy nghĩ) × đơn giá của tính năng; phiên gia sư và cuộc trò chuyện giọng nói luôn đánh dấu ước tính vì trình duyệt nối thẳng tới Gemini Live: trình duyệt cộng `usageMetadata` của từng tin nhắn Live (Gemini tính lại toàn bộ ngữ cảnh mỗi lượt nên chỉ lấy lần báo cuối sẽ thấp hơn nhiều) và gửi về khi phiên đóng (`POST .../usage`); gửi số bằng 0 thì ước tính theo thời gian từ lúc trừ credit; không gửi được (đóng trang, mất mạng) thì job `LiveCostEstimateJob` ước tính theo thời lượng tối đa của phiên sau thời gian chờ (`app.credit.live-estimate`, mặc định 32 token vào và 16 token ra mỗi giây). Chi phí được điền vào chính dòng `ai_usage_logs` ghi lúc trừ credit của phiên (cột `session_id`), mỗi phiên một dòng và chỉ điền một lần. Số do trình duyệt gửi không dùng để trừ credit nên không cần tin tuyệt đối, chỉ bị chặn trên. Chi phí tính theo đơn giá của tính năng (model chính); lần chạy bằng model dự phòng khác giá chưa được tính riêng (giới hạn chấp nhận ở MVP); tạo bài là chi phí cố định mỗi lần (`fixed_cost_vnd`). Lần lỗi vẫn ghi chi phí nếu dịch vụ đã tính phí. Không tính chi phí chấm phát âm Azure.
- **Đơn giá mặc định** seed theo bảng giá niêm yết lúc triển khai (tỷ giá 26.100 đồng/USD, BR-GA-04), không để 0, để thống kê lãi lỗ có ý nghĩa ngay từ đầu; quản trị viên sửa lại khi nhà cung cấp đổi giá.
- **Gói Pro**: số credit mỗi tháng do quản trị viên đặt, như nhau giữa các kỳ hạn; công thức cũ chuyển thành kiểm tra "biên khi dùng hết credit" và cảnh báo khi thấp hơn biên lợi nhuận tối thiểu (BR-GA-05).
- **Thống kê lãi lỗ** (BR-NK-06, BR-NK-09): doanh thu phân bổ theo ngày và trừ phí cổng thanh toán; lãi gộp = doanh thu thuần − chi phí thật.
- **DB** (migration mới): `ai_feature_prices` thêm `credits_per_use`, `fixed_cost_vnd` và tính năng `lesson_import`; `ai_usage_logs` thêm `cost_vnd`, `quantity`, `model`, `cost_estimated`. Giá đang nằm trong `application.yml` (`tutor-session-cost`, `lesson-chat-cost`) chuyển vào DB để quản trị viên sửa được.
- **Credit dùng thử thay cho credit miễn phí mỗi ngày** (bổ sung 2026-11-22): học viên được tặng một lần 100 credit (`ai_settings.trial_credits`, quản trị viên sửa được) khi dùng ứng dụng lần đầu; không đặt lại, không tặng lại; tài khoản đổi từ giáo viên sang học viên không được tặng (`ai_wallets.trial_granted_at`). Kích hoạt Pro thì bỏ phần dùng thử còn lại, số dư bằng credit tháng của gói; Pro hết hạn thì số dư về 0. Lý do: chi phí tối đa mỗi học viên Free có trần chắc chắn (100 × 25 = 2.500 đồng) thay vì khoảng 15.000 đồng mỗi tháng không giới hạn thời gian; động lực mua Pro rõ; hết cảnh học viên Pro hết credit giữa tháng lại kém hơn học viên Free; ví Free không cần làm mới theo ngày. Các tính năng học cốt lõi (shadowing, nghe chép, ôn thẻ, từ điển) vẫn miễn phí. Không tặng bù cho tài khoản có trước vì ứng dụng chưa phát hành.

## Các phương án đã loại bỏ

- **Giữ trừ theo token thật**: đúng chi phí nhất nhưng học viên không đoán được, phải hiển thị ước tính trước mà ước tính lại không chính xác với hội thoại nhiều lượt.
- **Giá cơ bản cộng phụ phí khi vượt ngưỡng**: không lỗ ở lượt bất thường nhưng quy tắc và tiêu chí chấp nhận phức tạp; các giới hạn kỹ thuật đã chặn được chi phí.
- **Cuộc trò chuyện theo bài tính theo lượt ở chế độ chat chữ**: chế độ chat chữ là dự phòng, cùng trần 5 câu hỏi; hai đơn vị khác nhau cho cùng một cuộc trò chuyện chỉ làm người học khó hiểu.
- **Giữ credit miễn phí mỗi ngày cho gói Free**: tạo thói quen dùng AI hằng ngày nhưng chi phí Free không có trần theo thời gian, học viên ít lý do mua Pro, và học viên Pro hết credit giữa tháng bị kém hơn học viên Free.
- **Credit gói Pro tỷ lệ với giá mỗi tháng**: gói năm được ít credit hơn gói tháng, trái thông lệ và dễ bị khiếu nại.
