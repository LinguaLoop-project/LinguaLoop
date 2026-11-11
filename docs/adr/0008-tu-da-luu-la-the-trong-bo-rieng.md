# Từ đã lưu là thẻ trong bộ "Từ đã lưu" riêng của mỗi học viên

Status: accepted

Ngày: 2026-11-07

Từ đã lưu phải được ôn theo lịch như thẻ của bộ từ. Nhưng `user_card_progress` và `vocab_review_logs` khoá theo `card_id`, còn `user_saved_words` chỉ trỏ vào mục từ (`word_id`, `meaning_no`). Vì vậy mỗi học viên có một bộ từ riêng loại "Từ đã lưu", ẩn khỏi danh sách bộ, gồm một phần duy nhất. Lưu một nghĩa thì tạo một thẻ trong bộ đó, và `user_saved_words` có thêm `card_id` trỏ tới thẻ. Từ đó Ôn thẻ chỉ có một hàng đợi, một cách tính SM-2 và một bảng nhật ký, và "Bộ của tôi" ở đợt sau cũng dùng chung mô hình này.

## Các phương án đã loại bỏ

- **Bảng tiến độ riêng cho từ đã lưu**: phải có hai bản SM-2 và hai hàng đợi ôn rồi gộp lại ở giao diện; thống kê điểm yếu từ vựng phải đọc hai nguồn.
- **Từ đã lưu không có lịch ôn, muốn ôn phải thêm vào bộ**: trái với mockup (trạng thái và "ôn lần tới" ở trang Từ đã lưu), và thêm một bước thủ công mà học viên hay bỏ qua.

## Consequences

- `vocab_decks` cần một cột phân loại để nhận ra bộ "Từ đã lưu", tạo bộ đó khi học viên lưu từ lần đầu, và loại bộ đó khỏi danh sách bộ và trang chi tiết bộ.
- Bỏ lưu xoá dòng trong `user_saved_words` nhưng chỉ xoá mềm thẻ, để lưu lại thì khôi phục được tiến độ cũ (BR-HT-04).
