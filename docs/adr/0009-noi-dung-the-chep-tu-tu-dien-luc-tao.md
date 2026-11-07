# Nội dung thẻ được chép từ từ điển lúc tạo thẻ

Status: accepted

Ngày: 2026-11-07

Thẻ của từ đã lưu giữ bản chép của nghĩa tiếng Việt, ví dụ, IPA và đường dẫn âm thanh, lấy từ `dictionary_words` lúc tạo thẻ (thẻ của bộ hệ thống không thuộc quyết định này, xem ADR 0010). Từ điển cập nhật về sau thì thẻ không đổi theo. Lý do: nghĩa trong từ điển nằm trong cột JSON `meanings` và được đánh số theo `no`, nên nhập lại từ điển có thể làm số thứ tự xê dịch; còn thẻ phải đứng yên để học viên không thấy mặt sau thẻ đổi nghĩa giữa hai lần ôn, và để giáo viên sửa được thẻ mà không đụng vào từ điển. `vocab_cards` thêm `word_id` và `meaning_no` (có thể để trống) để biết thẻ lấy từ mục từ nào: dùng để hiện "Đã lưu" trong hộp tra từ và để không tạo trùng thẻ.

## Các phương án đã loại bỏ

- **Thẻ chỉ trỏ vào từ điển, đọc nội dung lúc hiển thị**: không tốn chỗ lưu trùng, nhưng nhập lại từ điển có thể làm thẻ trỏ nhầm nghĩa, và thẻ tự nhập (không có trong từ điển) sẽ phải đi một đường khác.
