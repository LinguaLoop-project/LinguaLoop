/**
 * LinguaLoop — ux-notes.js (Học viên)
 * Nội dung nút "Ghi chú UX" của từng màn: vì sao thiết kế như vậy, tham khảo sản phẩm nào, dựa trên số liệu khảo sát nào.
 * uxOpen() nằm trong shell.js. Nạp sau shell.js.
 */
'use strict';
const UX = {
  today: ['Hôm nay — kế hoạch cá nhân hoá', [
    ['Headspace “Today” · Duolingo path', 'Mở app là thấy <b>một nút chính</b> “Bắt đầu phiên”. Người học 10–30 phút/ngày (24/34) không muốn tự chọn học gì.'],
    ['Focus mode liên tục', 'Bấm 1 lần, hệ thống tự chuyển nghe chép → shadowing → ôn thẻ, thanh tiến độ kính ở trên. Bớt 3–4 lần bấm quay lại trang chủ.'],
    ['Lý do cho từng việc', 'Mỗi việc có dòng “vì sao được giao” (daily_plan_items.reason_text) → minh bạch, giải quyết lời chê “không có lộ trình cá nhân hoá” (14/34).'],
    ['Streak mềm', 'Xong 1 việc bất kỳ là giữ chuỗi (Duolingo). Khi lên chuỗi: lửa phóng to, số lật, pill trượt xuống từ trên.'],
    ['Cosmic Violet (DESIGN.md)', 'Hero kính có 3 vật thể 3D trôi nổi chồng lên mép, parallax theo chuột; mascot Loopi chào người học.'],
  ]],
  weakness: ['Điểm yếu — trực quan hoá', [
    ['ELSA Speak “Skills”, heatmap GitHub', 'Bản đồ 44 âm vị tô màu theo tỉ lệ lỗi: nhìn 1 giây biết âm nào đỏ. Luôn kèm con số % để không phụ thuộc màu. Âm chưa đủ dữ liệu (< 5 lần) làm mờ.'],
    ['Master–detail', 'Chọn âm bên trái → panel phải cố định hiện “hay đọc thành âm gì”, mẹo, cặp âm, nút Luyện ngay. Không rời trang.'],
    ['Xu hướng = động lực', '“Thấy tiến bộ rõ” là động lực số 1 (19/34) → sparkline giảm dần. Bản đầy đủ là quyền lợi Pro.'],
  ]],
  dictation: ['Nghe chép — không rời bàn phím', [
    ['dailydictation.com · Duolingo listening', '<kbd>Ctrl</kbd> phát lại, <kbd>Enter</kbd> kiểm tra / câu tiếp. Người học chép chính tả gõ liên tục, chuột làm đứt nhịp.'],
    ['Diff theo từ, nhãn theo loại từ', 'So từng từ bằng edit distance, tô màu theo outcome và gắn nhãn error_categories (“Bỏ sót từ chức năng”) — đúng thứ 33/34 người “rất cần”.'],
    ['Tốc độ 0.6× mặc định 0.8×', '7/34 gặp khó vì “không đủ thời gian nghe lại” → giảm tốc là mặc định, không phải tuỳ chọn ẩn.'],
    ['Video theo câu', 'Mỗi câu có start_ms/end_ms (bảng sentences). Nút phát chỉ chạy đúng đoạn của câu, thanh dưới video chia theo câu để nghe lại câu đã làm. Phụ đề khoá tới khi kiểm tra để không lộ đáp án. Có chế độ “Chỉ nghe”; bài audio chỉ có thanh câu.'],
    ['Tận dụng chiều ngang', 'Cột phải: tiến độ từng câu, phím tắt, điểm yếu liên quan. Vật thể 3D chỉ 1, nhỏ, trôi rất chậm ở góc để không làm phân tâm.'],
  ]],
  shadowing: ['Shadowing — 3 bước rõ ràng', [
    ['ELSA Speak · Speechling', 'Stepper Nghe mẫu → Đọc theo → Xem lỗi. Mỗi lúc chỉ có 1 hành động chính, nút micro to ở giữa (vùng ngón cái trên mobile).'],
    ['Karaoke highlight', 'Khi nghe mẫu, từng từ sáng lên theo nhịp → người học bắt được ngữ điệu trước khi đọc.'],
    ['Video khớp câu đang luyện', 'Khung video phát đúng đoạn của câu (start_ms → end_ms), có Lặp câu để nghe đi nghe lại trước khi đọc. Nhìn khẩu hình người nói giúp bắt chước dễ hơn.'],
    ['Sóng âm trực tiếp', 'Ghi âm thật bằng MediaRecorder, vẽ sóng theo âm lượng → biết micro đang nhận tiếng.'],
    ['Progressive disclosure', 'Kết quả hiện điểm trước, lỗi âm vị gấp gọn theo từ (mở sẵn lỗi nặng nhất).'],
    ['Paywall theo ngữ cảnh', 'Video khẩu hình & AI nằm đúng chỗ người học cần, làm mờ thay vì ẩn → thấy giá trị trước khi trả tiền (27/34 sẵn sàng trả phí).'],
  ]],
  vocab: ['Từ vựng — nhanh như Cambridge, ôn như Anki', [
    ['parroto.app/vocabulary', 'Tab Bộ từ: bộ hệ thống theo danh mục (Oxford, Giao tiếp, TOEIC, IELTS), lọc tag, bộ đang học lên đầu, bộ tự tạo ở cuối. Trang bộ chia theo bài (vocab_groups), tiến độ 4 trạng thái.'],
    ['Cambridge Dictionary · Google', 'Ô tra lớn, gợi ý tức thì, hiểu cả biến thể (gõ “went” ra “go”). Nghĩa tiếng Việt in đậm đầu tiên, 2 nút UK/US — đúng 2 nhu cầu top (12+12/34).'],
    ['Thẻ tra từ 2 cột (DESIGN.md)', 'Trái 7/12: ảnh → từ gradient + CEFR → loại từ → phát âm → nghĩa. Phải 5/12: họ từ, collocation, đồng/trái nghĩa, độ nhớ, bài học có từ này.'],
    ['Lưu 1 chạm', 'Nút bookmark cạnh từng nghĩa: nảy + hạt toả ra, số trên tab “Ôn thẻ” lật tăng, toast Hoàn tác. 28/34 lưu từ thường xuyên.'],
    ['Anki SM-2 nhưng không thuật ngữ', 'Nút Quên/Khó/Được/Dễ ghi rõ “lần ôn tới” (10 phút, 6 ngày…). Không nói “SRS” vì 22/34 chưa dùng quen.'],
    ['Quizlet trắc nghiệm', 'Trắc nghiệm là cách ôn hiệu quả nhất theo khảo sát (15/34). Đúng: viền xanh, dấu tích vẽ nét, “ting”, +XP. Sai: rung nhẹ, mascot động viên.'],
  ]],
  lessons: ['Bài học — chọn nhanh theo chủ đề', [
    ['parroto.app/topics · YouTube', 'Mỗi chủ đề là một hàng thẻ bài (4 bài nổi bật) kèm “Xem tất cả”. Thẻ bài hiện đủ thứ người học cần để chọn: trình độ CEFR, thời lượng, nguồn YouTube/Audio, lượt học, PRO.'],
    ['Hai chế độ ngay trên thẻ', 'Nút Nghe chép / Shadowing ngay trên thẻ, có thanh tiến độ riêng từng chế độ (user_lesson_mode_progress). Bấm thẳng vào luyện, không cần mở trang chi tiết.'],
    ['Tiếp tục học + gợi ý theo trình độ', '“Tiếp tục học” đặt trên cùng (user_lesson_progress). Hàng “Hợp trình độ B1” lấy từ kết quả kiểm tra trình độ, nối với practice_recommendations.'],
    ['Lọc & tìm', 'Tìm theo tên (index gin_trgm trên lessons.title), lọc Cơ bản/Trung cấp/Nâng cao, sắp theo phổ biến/mới/ngắn, chỉ bài miễn phí. Khi đang lọc, các hàng chủ đề gộp thành 1 lưới kết quả.'],
    ['Tạo bài từ YouTube (PRO)', 'Dán link, AI tách câu và ước lượng CEFR. Bài người dùng tạo đi qua trạng thái PENDING (lessons.status) trước khi công khai.'],
  ]],
  mywords: ['Từ & câu đã lưu — một chỗ cho mọi thứ cần ôn', [
    ['parroto.app Saved Vocabulary · Review', 'Gom 3 loại đã lưu vào 3 tab: từ (user_saved_words), câu cần ôn (user_sentence_review), ghi chú (sentence_notes).'],
    ['Biết từ đến từ đâu', 'Cột Nguồn ghi rõ từ điển, bài học nào hay tự thêm (user_saved_words.source). Bấm tên bài để quay lại đúng ngữ cảnh.'],
    ['Trạng thái nhớ rõ ràng', 'Mới / Đang học / Đang ôn / Đã thuộc theo user_card_progress.status, kèm “Đến hạn” hoặc ngày ôn tới. Có chữ, không chỉ dựa vào màu.'],
    ['Thao tác hàng loạt', 'Chọn nhiều từ → ôn ngay, thêm vào bộ tự tạo, bỏ lưu (có Hoàn tác).'],
    ['Câu tự vào hàng đợi', 'Điểm dưới 60, sai nhiều, nghe lại nhiều lần → câu tự vào danh sách, luyện lại đạt 80 thì tự rời. Người học thấy lý do cho từng câu.'],
  ]],
  auth: ['Đăng nhập & đăng ký — nhanh, ít chữ', [
    ['Duolingo · Notion', 'Nút Google đặt trên cùng: 1 chạm là vào (users.auth_uid). Email + mật khẩu là lựa chọn thứ hai. Cột trái nhắc lại 3 lợi ích chính và Loopi chào.'],
    ['Lỗi ngay dưới ô nhập', 'Kiểm tra khi bấm gửi, báo lỗi dưới đúng ô bằng chữ + biểu tượng, không chỉ tô đỏ. Gõ lại là lỗi biến mất. Tên người dùng kiểm tra trùng ngay khi gõ.'],
    ['Không để lộ tài khoản', 'Đăng nhập sai chỉ báo “email hoặc mật khẩu chưa đúng”, quên mật khẩu luôn báo “nếu email có tài khoản…”. Giới hạn 5 lần thử.'],
    ['Hỏi quyền đúng lúc', 'Không bắt đồng ý lưu giọng nói lúc đăng ký. Hỏi khi ghi âm lần đầu (user_consents), lúc người học hiểu vì sao cần.'],
    ['Xác minh email không chặn', 'Sau khi đăng ký, dẫn thẳng vào bài kiểm tra trình độ trong lúc chờ xác minh (users.email_verified) → có kế hoạch riêng ngay phiên đầu.'],
  ]],
  settings: ['Cài đặt — gom theo việc người dùng muốn làm', [
    ['GitHub · Linear settings', 'Danh mục cố định bên trái, nội dung bên phải. Trên mobile danh mục thành hàng cuộn ngang.'],
    ['Lưu một lần', 'Sửa nhiều ô rồi bấm Lưu trên thanh nổi. Rời trang khi chưa lưu sẽ được hỏi lại. Giao diện sáng/tối và quyền riêng tư áp dụng ngay (có Hoàn tác).'],
    ['Khớp dữ liệu', 'Hồ sơ = users (username, avatar_url, description, birthday, gender); Học tập = max_daily_reviews + thời lượng kế hoạch; Ngôn ngữ = ui_language, timezone; Quyền riêng tư = user_consents; Gói = user_subscriptions, usage_counters.'],
    ['Việc nguy hiểm tách riêng', 'Xoá tài khoản nằm trong khung đỏ, phải gõ lại tên người dùng để xác nhận. Đăng xuất thiết bị khác, huỷ liên kết Google cũng hỏi lại.'],
  ]],
  test: ['Kiểm tra trình độ — nhanh, ít áp lực', [
    ['EF SET · Duolingo English Test', 'Mỗi màn 1 câu, nút to, phím tắt ←/→. Thanh thời gian mảnh chỉ để giữ nhịp, không phạt.'],
    ['Từ giả chống đoán mò', 'Có “flomber”, “trindle”… (assessment_items.pseudo_word). Chọn “Biết” từ giả sẽ trừ điểm từ vựng.'],
    ['Kết quả có khoảng tin cậy', 'Thanh CEFR có dải tin cậy thay vì 1 nhãn cứng → trung thực với độ chính xác của bài test ngắn.'],
    ['Nối thẳng vào kế hoạch', 'Kết quả chỉ ra điểm yếu đầu tiên và dẫn về “Hôm nay” — test không phải ngõ cụt.'],
  ]],
};
