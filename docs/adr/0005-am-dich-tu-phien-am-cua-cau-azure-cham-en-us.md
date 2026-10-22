# Âm đích lấy từ phiên âm của câu, Azure chấm en-US, lưu cả ký hiệu gốc và ứng viên âm

Status: accepted (thay phần lưu trữ của ADR 0004)

Đo trên Azure thật ngày 2026-10-20 (en-US, IPA, `NBestPhonemeCount = 5`, bản ghi giọng người và giọng máy) cho thấy:

- **en-GB không trả tên âm**: `Phoneme` và `Syllable` đều rỗng, kể cả trong `NBestPhonemes`; chỉ còn điểm từng âm. Không làm được mẹo, video hay thống kê theo âm bằng en-GB, nên vẫn chấm `en-US`.
- **`Phoneme` của en-US là cách đọc Azure chọn**, thường trùng âm mẫu nhưng có thể là một biến thể và vẫn chấm cao: lời mẫu "if" đọc thành "iv" thì Azure báo `v` và chấm 100. Chỉ xét "âm dưới 60 điểm" sẽ bỏ sót lỗi này.
- **Âm nghe được nằm trong `NBestPhonemes`** (5 ứng viên kèm điểm).
- Azure gộp nguyên âm với `ɹ` thành một âm khi sau đó là phụ âm hoặc hết từ (`ɑɹ` ở park, `ɪɹ` ở near).

ADR 0004 lưu `phoneme_id` là âm Azure báo đã quy đổi sang bảng Anh-Anh, bỏ ký hiệu gốc và bỏ cả âm không quy đổi được, nên không biết âm cần luyện là âm nào và không xử lý lại được khi sửa bộ chuyển đổi.

## Decision

Mỗi âm của một lượt lưu ba thứ tách bạch, trong `sentence_attempt_phonemes`:

- `azure_symbol`: ký hiệu gốc Azure trả (không bao giờ bị bỏ, kể cả âm không quy đổi được);
- `phoneme_id` (nullable): cách đọc Azure báo, đã quy đổi sang bảng `phonemes` bằng `AzurePhonemeMapper`;
- `target_phoneme_id` (nullable): **âm đích**, ghép theo vị trí giữa phiên âm của câu (`sentences.ipa`, qua cùng bộ chuyển đổi, nguyên âm gộp với `ɹ` như Azure) và âm Azure báo, chỉ khi số âm của từ bằng nhau; không ghép được thì để rỗng chứ không đoán;
- `produced_phoneme_id` và `produced_score`: ứng viên khác cao điểm nhất trong `NBestPhonemes` (dữ liệu để dùng về sau, chưa hiện cho người học).

Một âm **cần sửa** khi điểm dưới 60, hoặc khi là phụ âm khác âm đích dù điểm cao (`PhonemeRules.needsFix`, một nguồn cho giao diện, nhận xét AI và view thống kê). Nguyên âm lệch nhau không bị đánh dấu vì thường là rút gọn bình thường trong lời nói (ɪ/ə).

Mẹo và video theo âm đích (rồi mới đến âm Azure báo khi không có âm đích). Chỉ hiện mẹo đã duyệt trong `phoneme_confusions`; không dùng mô tả chung của `phonemes.description_vi` làm dự phòng vì soạn theo giọng Anh và có thể trái với bài giọng Mỹ. `v_user_phoneme_stats` thống kê theo âm đích.

Mở lại bài dùng âm đích đã lưu; dòng cũ (trước khi có cột) tính lại từ phiên âm hiện tại của câu.

## Chưa quyết

Chuẩn phát âm đích Anh-Anh cho bài giọng Mỹ. Hiện âm đích là phiên âm Mỹ của câu đã quy đổi, chưa phải phiên âm Anh. Cần một nguồn phiên âm Anh theo từ (bảng phát âm từ điển có `accent = 'uk'`) và quyết định sản phẩm về shadowing với audio giọng Mỹ; en-GB không giúp được vì không trả tên âm.

## Consequences

- Giữ được dữ liệu Azure gốc để kiểm tra và xử lý lại.
- Phụ âm `f`/`v` ở cuối từ vẫn khó phân biệt ngay với Azure (cả hai cùng 100 trong ứng viên của giọng máy), nên cờ "cần sửa" có thể bỏ sót hoặc báo thừa ở cặp này.
- Từ lệch số âm giữa phiên âm câu và Azure (vd `ɛ ɹ` + nguyên âm) không có âm đích; quy tắc gộp `ɹ` dựa trên quan sát vài từ, cần bổ sung khi gặp từ lệch.
- `NBestPhonemes` tốn thêm dữ liệu trả về nhưng không thêm lượt gọi Azure.
