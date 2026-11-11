# Truy vết AC → test: AI-thuc-hanh-voi-ai

> Nguồn AC: `docs/srs/AI-thuc-hanh-voi-ai/usecase.md`. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng`. Quay lại [mục lục](../TRACEABILITY-AC-TEST.md).

Tổng hợp: 30 AC, 0 đã có test, 0 một phần, 30 thiếu.

| AC | Tên | UC | Loại | Test | Trạng thái |
|---|---|---|:---:|---|---|
| AC-AI-01 | Khởi tạo cuộc trò chuyện theo nội dung bài học và trừ hạn mức AI chung | UC-AI-01 |  |  | Thiếu |
| AC-AI-02 | Trả lời bằng giọng nói hoặc gõ chữ và nhận phản hồi đối chiếu với nhân vật trong bài | UC-AI-01 |  |  | Thiếu |
| AC-AI-03 | Xin gợi ý trả lời cho câu hỏi hiện tại | UC-AI-01 |  |  | Thiếu |
| AC-AI-04 | Bắt đầu lại cuộc trò chuyện | UC-AI-01 |  |  | Thiếu |
| AC-AI-05 | Kết thúc cuộc trò chuyện và nhận xét tổng quát về bài nói | UC-AI-01 |  |  | Thiếu |
| AC-AI-06 | Xem lại lịch sử hội thoại của riêng tác nhân không tốn credit | UC-AI-01 |  |  | Thiếu |
| AC-AI-07 | Từ chối khi không đủ credit để bắt đầu | UC-AI-01 |  |  | Thiếu |
| AC-AI-08 | Học viên gói Pro dùng AI theo credit của gói, không giới hạn số lượt | UC-AI-01 |  |  | Thiếu |
| AC-AI-09 | Từ chối khi bài học thuộc gói Pro đối với gói Free | UC-AI-01 |  |  | Thiếu |
| AC-AI-10 | Nhắc nhở khi câu trả lời trống hoặc bản ghi âm không hợp lệ | UC-AI-01 |  |  | Thiếu |
| AC-AI-11 | Không trừ credit khi lỗi khởi tạo và cho phép thử lại khi lỗi giữa phiên | UC-AI-01 |  |  | Thiếu |
| AC-AI-12 | Tự động mời gia sư khi có từ dưới 60 điểm hoặc lỗi âm vị lặp lại và đảm bảo giãn cách 3 câu | UC-AI-02 |  |  | Thiếu |
| AC-AI-13 | Tạo Phiên gia sư khi đủ credit tối thiểu (kể cả câu đã đọc tốt) | UC-AI-02 |  |  | Thiếu |
| AC-AI-14 | Chỉ trừ credit khi phiên thực sự bắt đầu trong 15 giây | UC-AI-02 |  |  | Thiếu |
| AC-AI-30 | Hết credit giữa phiên gia sư thì hoàn tất lượt đang chạy rồi dừng | UC-AI-02 |  |  | Thiếu |
| AC-AI-15 | Đổi từ đang luyện sang bất kỳ từ nào có trong câu | UC-AI-02 |  |  | Thiếu |
| AC-AI-16 | Chấm lượt đọc từ trong phiên: đạt từ 80 điểm hoặc hết 3 lượt thì chuyển từ kế tiếp | UC-AI-02 |  |  | Thiếu |
| AC-AI-17 | Đọc lại cả câu khi hết danh sách từ lỗi và không làm đổi điểm lượt gốc | UC-AI-02 |  |  | Thiếu |
| AC-AI-18 | Lỗi chấm âm thanh hoặc đổi từ khi đang chờ chấm không làm mất lượt của từ | UC-AI-02 |  |  | Thiếu |
| AC-AI-19 | Nhắc nhở và tự động dừng phiên khi học viên nói lạc đề 3 lần liên tiếp | UC-AI-02 |  |  | Thiếu |
| AC-AI-20 | Tự động đóng phiên khi quá trần 10 phút và bảo toàn lý do kết thúc | UC-AI-02 |  |  | Thiếu |
| AC-AI-21 | Từ chối tạo phiên khi không đủ credit hoặc thao tác trên lượt của người khác | UC-AI-02 |  |  | Thiếu |
| AC-AI-22 | Ghi nhận sự kiện bật tắt Chế độ gia sư | UC-AI-02 |  |  | Thiếu |
| AC-AI-23 | Tạo nhận xét AI lần đầu xuất chữ chạy dần và trừ credit | UC-AI-03 |  |  | Thiếu |
| AC-AI-24 | Xem lại nhận xét AI đã lưu hoặc gửi trùng đồng thời chỉ tính một lần credit | UC-AI-03 |  |  | Thiếu |
| AC-AI-25 | Làm mới thẻ nhận xét AI khi đọc lượt mới | UC-AI-03 |  |  | Thiếu |
| AC-AI-26 | Chặn nhận xét AI khi không đủ credit hoặc lượt đọc của người khác | UC-AI-03 |  |  | Thiếu |
| AC-AI-27 | Tự thử lại mô hình dự phòng khi AI quá tải trước khi có chữ | UC-AI-03 |  |  | Thiếu |
| AC-AI-28 | Không trừ credit khi AI lỗi hoặc đóng trang giữa chừng | UC-AI-03 |  |  | Thiếu |
| AC-AI-29 | Xem số dư credit và tự đặt lại credit miễn phí lúc 00:00 | UC-AI-03 |  |  | Thiếu |
