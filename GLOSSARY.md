# LinguaLoop

Nền tảng luyện tiếng Anh theo câu: học viên nghe chép và đọc theo (shadowing) các câu trong bài học, hệ thống chấm và theo dõi điểm yếu.

## Ngôn ngữ

### Luyện câu

**Lượt làm**:
Một lần học viên nộp một câu ở một chế độ luyện (nghe chép hoặc shadowing) và nhận điểm.
_Tránh_: lần thử, bài nộp

**Lịch sử lượt làm**:
Tất cả lượt làm của một học viên trên một câu ở một chế độ, kể cả lượt làm lại và lượt bỏ cuộc.
_Tránh_: lịch sử luyện, nhật ký

**Câu cần ôn**:
Câu mà học viên đã chọn lưu để luyện lại ở một chế độ (khi làm kém hoặc tự ghim), nằm trong danh sách cho đến khi học viên bỏ khỏi danh sách hoặc đánh dấu "Đã ổn". Hệ thống chỉ hỏi, không tự thêm hay tự gỡ.
_Tránh_: câu ôn lại, câu yếu, hàng đợi ôn

**Ghi chú**:
Đoạn văn bản riêng tư học viên viết cho một câu ở một chế độ luyện; mỗi học viên có tối đa một ghi chú cho một câu ở mỗi chế độ, ghi chú của hai chế độ độc lập nhau.
_Tránh_: note, bình luận

### Phát âm

**Giọng chấm**:
Giọng mà hệ thống dùng làm chuẩn để chấm phát âm; luôn là giọng Anh-Mỹ, không phụ thuộc phiên âm học viên đang xem.
_Tránh_: giọng (đứng một mình, dễ nhầm với giọng của người nói trong video), accent

**Phiên âm hiển thị**:
Phiên âm của câu mà học viên chọn xem, theo giọng Mỹ hoặc giọng Anh. Chỉ để đọc; không ảnh hưởng đến điểm. Khác với phiên âm từ điển, là của từ khi đứng riêng.
_Tránh_: IPA (đứng một mình), giọng

**Âm đích**:
Âm mà học viên cần đọc ở một vị trí trong từ; luôn lấy từ phiên âm Mỹ của câu, vì giọng chấm là giọng Mỹ.
_Tránh_: âm mẫu, âm chuẩn

### Từ điển

**Mục từ**:
Một từ trong từ điển, kèm mức CEFR, phiên âm và âm thanh theo giọng Mỹ và giọng Anh, và các nghĩa gom theo loại từ. Dạng chia ("things") trỏ về mục từ gốc ("thing").
_Tránh_: từ vựng (dễ nhầm với từ trong bộ từ), entry

**Phiên âm từ điển**:
Phiên âm của một mục từ khi từ đứng riêng, theo giọng Mỹ và giọng Anh. Có thể khác phiên âm hiển thị của chính từ đó trong câu (vd "a" đứng riêng, "to", "you"); không ảnh hưởng đến điểm và không bao giờ dùng làm âm đích.
_Tránh_: phiên âm mẫu, âm mẫu

### Bộ từ

**Thẻ**:
Một nghĩa của một từ để học và ôn, gồm từ, phát âm, loại từ, nghĩa tiếng Việt và ví dụ. Mỗi thẻ chỉ có một nghĩa.
_Tránh_: flashcard, từ vựng, card

**Bộ từ**:
Một tập thẻ chia thành các bài theo thứ tự, do hệ thống cung cấp (vd "3000 Oxford Vocabulary A1") hoặc của riêng một học viên. Bộ hệ thống là dữ liệu riêng, không phải bản sao của từ điển.
_Tránh_: deck, bộ từ vựng

**Phần**:
Một nhóm thẻ cùng chủ đề trong một bộ từ, là đơn vị học viên chọn để học từ mới (vd "Family", 49 thẻ). Số thẻ mỗi phần khác nhau. Giáo viên quản lý gọi là nhóm thẻ (module NT); mỗi nhóm có ít nhất 1 thẻ (BR-BT-05).
_Tránh_: bài, unit, group (vì "bài" là bài học dùng để nghe chép và shadowing)

**Lượt**:
Một đoạn tối đa 10 thẻ liền nhau của một phần, là đơn vị học viên học một lần trong Học từ mới. Phần có 23 thẻ gồm 3 lượt (10, 10, 3).
_Tránh_: bài, vòng, session (phiên học là bản ghi dùng để nhóm nhật ký, không phải một lượt)

**Học từ mới**:
Học các thẻ của một phần qua một trong các cách học (Đoán, Flashcard, Trắc nghiệm, Trắc nghiệm đảo). Mỗi câu trả lời ở mọi cách học đều được chấm theo SM-2 nên thẻ Mới trả lời lần đầu chuyển sang Đang học; trả lời sai thì thẻ xuống cuối lượt để làm lại. Khác với ôn thẻ, là việc làm theo lịch.
_Tránh_: học bài

**Từ đã lưu**:
Một nghĩa của một mục từ mà học viên lưu khi tra từ điển hoặc khi đang học bài. Mỗi từ đã lưu là một thẻ trong bộ "Từ đã lưu" của học viên, nên được ôn như mọi thẻ khác. Một từ có thể được lưu nhiều nghĩa.
_Tránh_: từ của tôi, sổ từ, bookmark

**Trạng thái thẻ**:
Mức nhớ của một học viên với một thẻ: _Mới_ (chưa gặp), _Đang học_ (mới gặp hoặc vừa quên), _Đang ôn_ (khoảng ôn dưới 21 ngày), _Đã thuộc_ (khoảng ôn từ 21 ngày trở lên).
_Tránh_: tiến độ thẻ, độ nhớ (dùng cho vòng phần trăm trên giao diện, không phải trạng thái)

**Ôn thẻ**:
Ôn các thẻ từ vựng đến hạn theo lịch lặp lại ngắt quãng. Chỉ dùng cho bộ từ, không dùng cho câu.
_Tránh_: ôn câu, ôn lại
