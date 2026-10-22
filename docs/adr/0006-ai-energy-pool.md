# Bể năng lượng AI chung cho các tính năng LLM, chấm phát âm Shadowing không giới hạn

Status: accepted (thay thế một phần cơ chế hạn mức của ADR 0001, ADR 0002 và lát A)

Ngày: 2026-10-23

## Context

Ban đầu, hệ thống thiết kế ba bộ đếm riêng rẽ cho từng tính năng (`plan_limits` và `usage_counters`):
- `shadowing_assess`: 5 lượt/ngày (Free), 200 lượt/ngày (Pro);
- `ai_feedback`: 5 lượt/ngày (Free), không giới hạn (Pro);
- `tutor_session`: 1 phiên/ngày (Free), không giới hạn (Pro).

Tuy nhiên, qua phân tích chi phí vận hành thực tế và trải nghiệm học viên:
1. **Chi phí Azure Speech Pronunciation Assessment**: Dự án đang dùng tài nguyên Azure Speech `lingualoop-speech-dev` ở bậc F0 (miễn phí) nên không phát sinh chi phí theo lượt chấm. Mỗi câu học viên đọc chỉ kéo dài 2–5 giây, và việc chặn người học ở lượt thứ 5 làm giảm động lực luyện nói (core loop của ứng dụng).
2. **Chi phí thực sự nằm ở các mô hình ngôn ngữ lớn (LLM - Gemini)**: Nhận xét AI gọi mô hình văn bản phân tích ngữ âm, còn Phiên gia sư (Gemini Live API) duy trì kết nối âm thanh hai chiều thời gian thực (tối đa 10 phút/phiên) có chi phí cao hơn hẳn.
3. **Trải nghiệm người dùng với ba bộ đếm rời**: Người học phải theo dõi nhiều con số lẻ tẻ ("còn 3 lượt đọc", "còn 4 lượt nhận xét", "còn 1 lượt gia sư"), gây phân mảnh và gượng ép.

## Decision

1. **Bỏ hoàn toàn bộ đếm `shadowing_assess`**:
   - Chấm phát âm Shadowing bằng Azure hoàn toàn miễn phí và không giới hạn số lượt đối với cả gói Free và Pro.
   - Bỏ cơ chế giữ chỗ nguyên tử (`tryConsume`) và hoàn lượt (`refund`) ở `ShadowingAttemptServiceImpl`.
   - Lịch sử luyện tập vẫn được lưu đầy đủ vào bảng `sentence_attempts` phục vụ thống kê và xem lại.

2. **Quy tụ thành một Bể năng lượng AI duy nhất (`ai_energy`)**:
   - Tất cả các tính năng tiêu tốn tài nguyên LLM dùng chung một bộ đếm `ai_energy`.
   - Mỗi hoạt động có "giá năng lượng" tương ứng:
     | Hoạt động | Mã tính năng/hành động | Giá năng lượng (cost) | Ghi chú |
     |---|---|---|---|
     | Nhận xét AI | `ai_feedback` | 1 | Trừ khi nhận xét được tạo thành công; xem lại bản cũ tốn 0 |
     | Phiên gia sư | `tutor_session` | 3 | Kiểm tra $\ge 3$ khi tạo phiên; chỉ trừ 3 khi phiên `started` |
   - **Hạn mức theo gói**:
     - Gói Free: **8 năng lượng mỗi ngày** (xấp xỉ mức cũ: tương đương 8 nhận xét hoặc 2 phiên gia sư và 2 nhận xét, người học tự do phân bổ theo nhu cầu).
     - Gói Pro: **Không giới hạn** (`limit = NULL` trong `plan_limits`).
   - Chu kỳ làm mới: 00:00 theo giờ Việt Nam (`Asia/Ho_Chi_Minh`).

3. **Cơ chế trừ và hoàn**:
   - `UsageService.tryConsume(userId, feature, cost)`: tăng nguyên tử `used = used + :cost WHERE used + :cost <= :limit`.
   - Khi có lỗi hệ thống phía LLM/mạng, hoàn trả chính xác số năng lượng `cost` đã giữ chỗ.
   - Lỗi `QUOTA_EXCEEDED` trả `feature = ai_energy` kèm `action = ai_feedback | tutor_session` để frontend hiển thị đúng thông điệp và ngữ cảnh nâng cấp.
   - API `GET /me/usage` trả trường `ai_energy` kèm bảng giá `costs` để frontend tự động thích ứng mà không fix cứng số liệu.

## Các phương án đã loại bỏ

1. **Giữ ba bộ đếm riêng rẽ**:
   - *Lý do loại*: Phức tạp cho học viên, không linh hoạt (người thích hỏi gia sư thì hết lượt gia sư nhưng dư nhận xét, người chỉ muốn nhận xét thì thừa phiên gia sư).
2. **Thu phí cả lượt chấm Shadowing bằng năng lượng**:
   - *Lý do loại*: Chấm shadowing là tính năng cốt lõi cần lặp đi lặp lại hàng chục lần mỗi bài học; việc trừ điểm cho mỗi câu đọc sẽ triệt tiêu thói quen luyện tập của người học.

## Consequences

- **Tích cực**:
  - Học viên Free có thể luyện phát âm thoải mái mà không lo hết lượt.
  - Bể năng lượng AI linh hoạt, dễ hiểu, giao diện gọn gàng với một chip chỉ số duy nhất.
  - Dễ dàng định giá các tính năng AI mới trong tương lai (chỉ cần gán cost trong bảng giá).
- **Cần kiểm soát**:
  - Gói Azure miễn phí vẫn có giới hạn của riêng nó (hạn mức giờ âm thanh mỗi tháng và số yêu cầu đồng thời). Theo tài liệu Microsoft Learn (Quotas and limits for Azure Speech, cập nhật 2026-10): bậc F0 chỉ cho **1 yêu cầu nhận dạng thời gian thực đồng thời** (không điều chỉnh được, Azure Portal không hiển thị con số này) và gói miễn phí có **5 giờ âm thanh nhận dạng mỗi tháng**; chưa rõ Pronunciation Assessment có tính riêng hay không. Với 2-5 giây mỗi lượt, 5 giờ tương đương vài nghìn lượt chấm mỗi tháng cho cả hệ thống, nên "không giới hạn" phía ứng dụng vẫn bị chặn bởi quota của Azure. Cần theo dõi mức dùng, và nâng lên S0 khi người dùng đông. Giới hạn đồng thời và phân loại lỗi quá tải của Azure được xử lý ở nhánh riêng `fix/azure-scoring-resilience`.
