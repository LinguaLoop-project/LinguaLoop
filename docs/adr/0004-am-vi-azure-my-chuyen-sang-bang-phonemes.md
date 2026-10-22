# Âm vị giọng Mỹ của Azure được chuyển sang bảng `phonemes` (Anh-Anh) để lưu, giao diện vẫn hiện ký hiệu Mỹ

Status: accepted (phần lưu trữ được thay bởi ADR 0005)

Bài học là giọng Mỹ (IPA của câu dạng `stoʊnz`, `ˈlɝn`) và Azure chấm với `en-US` trả ký hiệu Mỹ (`oʊ`, `ɝ`, `ɚ`, `ɑ`, `ɛ`, `ɹ`, `ɡ`), còn bảng `phonemes` dùng 44 âm Anh-Anh (`əʊ`, `ɜː`, `ɒ`, `ɪə`, `r`, `g`) và `sentence_attempt_phonemes.phoneme_id` bắt buộc. Nhóm chọn: một bộ chuyển đổi đọc cả chuỗi âm của từ (đổi ký hiệu đơn như `oʊ→əʊ`, `ɝ→ɜː`, `ɹ→r`; gộp nguyên âm trước `ɹ` như `ɪ+ɹ→ɪə`, `ɛ+ɹ→eə`, `ɑ+ɹ→ɑː` nhưng vẫn giữ `r` là một âm riêng để chấm lỗi bỏ âm cuối; `ɑ` đứng riêng thành `ɑː`), phủ đủ bộ âm `en-US` của Azure. Giao diện hiện ký hiệu Mỹ như Azure trả để khớp phiên âm của câu; `phoneme_id` đã chuyển chỉ dùng cho thống kê điểm yếu, Mẹo sửa và video khẩu hình.

Không dùng thư viện chuyển IPA (epitran, panphon) vì chỉ có cho Python và bộ âm của Azure là tập đóng khoảng 40 ký hiệu, bảng viết tay chính xác và kiểm thử hết được. Không đổi bảng `phonemes` sang giọng Mỹ vì mô tả, video khẩu hình và Mẹo sửa đã soạn theo bảng hiện có.

## Consequences

- `hot` và `father` cùng thành `ɑː` (giọng Mỹ không phân biệt), nên thống kê không tách được `ɒ` với `ɑː`.
- Ký hiệu không có trong bảng chuyển đổi vẫn hiện cho người học nhưng không lưu, và ghi log cảnh báo để bổ sung.
- Đổi locale chấm (ví dụ thêm `en-GB`) cần bảng chuyển đổi riêng; dữ liệu cũ vẫn đúng vì lưu theo `phoneme_id`.
