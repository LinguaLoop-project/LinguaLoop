# Bộ từ hệ thống nạp từ seed riêng, không sinh từ từ điển

Status: accepted

Ngày: 2026-11-07

Các bộ từ hệ thống được nạp từ tệp seed riêng (`backend/seed/03_vocabulary.sql.gz`, chạy bằng `seed-vocabulary.sh` hoặc `.ps1`) vào `vocab_decks`, `vocab_groups`, `vocab_cards` và `vocab_card_phonetics`, thay vì sinh từ `dictionary_words`. Mỗi thẻ có nội dung riêng (nghĩa, giải thích, ví dụ, ảnh, IPA và âm thanh Anh, Mỹ) và không có `word_id`; phần là nhóm chủ đề của seed, không chia lại theo số thẻ cố định. Lý do: bộ từ vựng có thứ tự, chủ đề, ví dụ và ảnh do người biên soạn chọn, còn từ điển chỉ có danh sách mục từ theo bảng chữ cái và nghĩa số nhỏ nhất thường lạ (vd "about" ra "đây đó, nhiều hướng"); tách riêng cũng để giáo viên sửa bộ từ mà không đụng vào từ điển và ngược lại. Lệnh nạp chạy tay (không chạy khi khởi động) nên prod và Neon chỉ có bộ từ khi người vận hành nạp.

Hệ quả: BR-BT-04 (một từ không xuất hiện ở hai thẻ trong cùng một bộ) chỉ áp cho bộ do giảng viên tạo; seed có 70 thẻ trùng từ trong cùng bộ (54 ở `common-1000`), có thể là các nghĩa khác nhau của một từ nên giữ nguyên. Nội dung seed và đường dẫn ảnh, âm thanh (`assets.parroto.app`) là của bên thứ ba, nên ảnh và âm thanh có thể hỏng nếu bên đó đổi; host lại media là việc để sau. Nghĩa của thẻ không tự cập nhật khi từ điển đổi.

Mức CEFR: seed gốc gán A1 cho mọi thẻ và mọi bộ (trừ Oxford A2), nên đã sửa trong seed. Mỗi thẻ lấy mức của mục từ trùng chữ (không phân biệt hoa thường) trong từ điển, 5.354 trên 6.818 thẻ; thẻ không khớp lấy mức của bộ. Mức của bộ là trung vị mức của các thẻ khớp: Thông dụng và Giao tiếp A2; TOEIC, IELTS và TOEFL B1; Oxford A1 và A2 giữ nguyên. Bộ Tết chỉ có 15 thẻ khớp, quá ít để lấy trung vị, nên đặt tay là A2. Việc đối chiếu với từ điển chỉ làm một lần lúc sinh seed; ứng dụng không đọc từ điển để dựng bộ từ.

## Các phương án đã loại bỏ

- **Sinh bộ từ từ từ điển theo mức CEFR (cách đã làm trước đó)**: không cần dữ liệu thêm, nhưng thẻ không có ví dụ riêng, ảnh, chủ đề, và nghĩa lấy theo số nhỏ nhất thường không đại diện.
- **Nạp bằng migration Flyway**: tự chạy trên mọi môi trường, nhưng tệp seed nặng 13,7 MB không hợp với migration và không thể tắt trên prod.
- **Giữ cờ môi trường để runner nạp khi khởi động**: thêm đường chạy riêng trong ứng dụng, trong khi dữ liệu bài học đã dùng script psql.
