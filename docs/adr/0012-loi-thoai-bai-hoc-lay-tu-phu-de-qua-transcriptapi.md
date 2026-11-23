# Lời thoại bài học lấy từ phụ đề YouTube qua TranscriptAPI

Status: accepted

Ngày: 2026-11-18

Khi giáo viên tạo bài từ link YouTube (UC-BH-03), lời thoại và mốc thời gian của từng câu lấy từ phụ đề tiếng Anh có sẵn của video, qua dịch vụ TranscriptAPI (`GET https://transcriptapi.com/api/v2/youtube/transcript`, khóa gửi bằng `Authorization: Bearer`). Ưu tiên phụ đề do người làm, không có thì phụ đề tự động của YouTube. Thông tin video (thời lượng, trạng thái công khai, phát trực tiếp, giới hạn độ tuổi, tiêu đề) vẫn lấy bằng YouTube Data API v3. Code nằm ở `lesson/transcriptapi/`.

Lý do:

1. **Tự lấy phụ đề bằng `yt-dlp` trên server không chạy được.** Thử trên Render ngày 2026-11-17: IP datacenter bị YouTube chặn (`Sign in to confirm you're not a bot`); có cookie thì vẫn thiếu phụ đề vì cần PO token, phải chạy thêm dịch vụ sinh token và thay cookie định kỳ.
2. **Gemini nghe video (cách đã thử trước đó) không đủ tin cậy cho buổi demo.** Model thường xuyên trả 503 quá tải; gửi cả video thì mốc trôi tới 48 giây, phải cắt video thành đoạn 90 giây và gọi tuần tự nên chậm; chi phí token âm thanh và hình do dự án chịu.
3. **TranscriptAPI nhanh và mốc là mốc thật của phụ đề.** Thử thật: lấy phụ đề một video 5 phút trong vài giây.

Hệ quả:

- **Cắt câu** (`CaptionMerger`): phụ đề chia theo độ dài màn hình chứ không theo câu, nên các dòng được nối lại và cắt ở dấu hết câu. Dấu hết câu nằm giữa một dòng thì dòng được tách ở đó, mốc tại chỗ tách ước lượng theo tỉ lệ ký tự trong dòng (phụ đề không có mốc từng từ), sai lệch không quá thời lượng một dòng. Phụ đề tự động không có dấu câu thì cắt ở khoảng lặng hoặc khi câu quá dài. Giáo viên nghe lại và chỉnh mốc, tách hoặc gộp câu ở UC-BH-05.
- **Hậu kiểm trước khi lưu** (`SegmentSanitizer`): sắp theo mốc, không chồng lấn, mỗi câu ít nhất 0,5 giây, không vượt độ dài video, câu tiếng Anh tối đa 500 ký tự (BR-BH-09).
- **Video không có phụ đề tiếng Anh thì không tạo được bài** (7a). Lỗi 408, 429, 503 thử lại tối đa hai lần; lỗi khác hoặc hết lượt TranscriptAPI thì báo không lấy được lời thoại (7b).
- **Chi phí** (phần trừ credit đã được thay bởi ADR 0013: tạo bài trừ credit cố định mỗi bài): TranscriptAPI tính 1 credit của dự án mỗi lần lấy thành công, không tính theo token. Tạo bài không gọi AI; bản dịch để trống, giáo viên tự nhập hoặc tự chọn gợi ý dịch (UC-BH-10, trừ credit theo BR-BH-14). IPA do espeak-ng tạo.
- **Phụ thuộc thêm một dịch vụ trả phí bên thứ ba.** Hết lượt hoặc dịch vụ ngừng thì không tạo được bài mới; bài đã tạo không ảnh hưởng.
- Cấu hình: `YOUTUBE_API_KEY`, `TRANSCRIPT_API_KEY`. Ảnh Docker cài `espeak-ng`, không cài `yt-dlp`.

## Các phương án đã loại bỏ

- **Gemini nghe video**: không cần phụ đề, nhưng chậm, hay quá tải (503), mốc là ước lượng của AI và tốn token. Đã có code và đã gỡ.
- **yt-dlp kèm cookie và plugin PO token**: miễn phí, nhưng phải bảo trì cookie, plugin và một dịch vụ chạy kèm; dễ hỏng ngay trước buổi bảo vệ.
- **Proxy dân dụng xoay vòng**: gỡ được chặn IP nhưng tốn tiền hằng tháng và vẫn cần PO token.
- **Tiện ích trình duyệt lấy phụ đề từ máy giáo viên**: tránh chặn IP nhưng phải viết và phân phối extension, đổi luồng "dán link" của UC-BH-03.
