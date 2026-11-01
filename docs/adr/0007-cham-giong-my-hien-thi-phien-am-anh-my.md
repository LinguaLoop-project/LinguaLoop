# Giọng chấm luôn là Anh-Mỹ; phiên âm Anh chỉ để hiển thị và tách riêng khỏi phiên âm Mỹ dùng để chấm

Status: accepted (chốt phần "Chưa quyết" của ADR 0005)

Azure chấm bằng `en-US`; `en-GB` không trả tên âm (ADR 0005) nên không làm được mẹo, video và thống kê theo âm. Nhưng cột `sentences.ipa` lẫn hai giọng (63% câu có dấu hiệu Anh, 28% có dấu hiệu Mỹ, một số có cả hai), nên cùng một câu có thể hiện phiên âm Anh trong khi âm đích lấy ra lại là Mỹ: từ `deliver` hiện `/dɪˈlɪvə/` nhưng Azure chấm âm cuối theo `ɚ`, học viên thấy ô `ə` bị điểm thấp dù đọc đúng phiên âm đang hiện.

## Decision

- **Giọng chấm là giọng Mỹ, và âm đích luôn lấy từ phiên âm Mỹ của câu.**
- **Hai cột phiên âm tách bạch**: `sentences.ipa_us` (nguồn của âm đích, đổi tên từ `ipa`) và `sentences.ipa_uk` (chỉ để hiển thị, không bao giờ dùng để chấm). Học viên chọn xem giọng nào; việc chọn không đổi điểm.
- **Định dạng chung của hai cột**: mỗi từ của câu có đúng một cụm IPA, cách nhau một dấu cách, không có `/` và dấu câu. Token chỉ có dấu câu (vd `-`) không có cụm nào và được bỏ qua khi đếm từ.
- **Không đoán**: thiếu phiên âm của một từ thì cả câu để NULL. `ipa_uk` chỉ có khi câu đã có đủ `ipa_us` chuẩn; espeak-ng đoán được cả tên riêng nên không dùng để quyết định câu nào có phiên âm. Số (Azure tách "twenty-four" thành hai từ nên không ghép được âm đích) và phụ âm co tách rời (`I 'll`, `it 's`, bị CMUdict đọc thành tên chữ cái) cũng để NULL.
- **Nguồn dữ liệu**: `ipa_us` từ CMUdict kèm bảng ghi đè tay; `ipa_uk` từ espeak-ng `en-gb` phiên âm từng từ riêng (đọc cả câu một lượt thì espeak dính các từ chức năng vào nhau, vd `ɒvðə`), chuẩn hoá về bộ âm của bảng `phonemes`. Kết quả là `backend/seed/02_sentences.sql.gz`; công cụ sinh chỉ dùng khi phát triển nên không nằm trong repo.
- **Bảng `phonemes` là bảng âm giọng Mỹ (44 âm), ký hiệu giống Azure en-US trả về.** Đổi ký hiệu tại chỗ, giữ nguyên `id`, nên mẹo, video, thống kê và các lượt đã lưu đi theo âm tương ứng: `iː→i`, `uː→u`, `e→ɛ`, `ɑː→ɑ`, `ɔː→ɔ`, `ɜː→ɝ`, `əʊ→oʊ`, `ɪə→ɪɹ`, `eə→ɛɹ`, `ʊə→ʊɹ`, `r→ɹ`. Phụ âm giữ nguyên, kể cả `g` (Azure trả cả `g` lẫn `ɡ`; bộ chuyển đổi gộp về `g`). Thêm âm `ɚ` (r-hoá không nhấn: teacher, deliver) thay vì gộp vào `ə`. `ɒ` gộp vào `ɑ` vì giọng Mỹ không tách hai âm này (các lượt trỏ vào `ɒ` được chuyển sang `ɑ`, mẹo và cặp tối thiểu của `ɒ` bị xoá theo).
- **Giọng Anh không có hàng trong bảng.** Phiên âm Anh chỉ là chuỗi hiển thị ở `ipa_uk`, không cần ký hiệu của bảng.
- **Nút US/UK ở trang Shadowing chỉ đổi phần hiển thị**, lưu theo trình duyệt (mặc định US). Chọn UK thì dòng phiên âm của câu và "Mẫu" trong chi tiết từ hiện phiên âm Anh, kèm một dòng giải thích luôn hiện ngay dưới nút ("điểm vẫn chấm theo giọng Mỹ"); câu chưa có `ipa_uk` thì hiện phiên âm Mỹ và nói rõ. Ô âm vị **giữ ký hiệu Mỹ** vì đó là âm thật sự được chấm, chỉ thêm dòng nhỏ `≈` ký hiệu Anh gần nhất từ một bảng cố định ở frontend (11 dòng, `ɑ` nêu cả `ɑː / ɒ` thay vì đoán). Mẹo luôn theo giọng Mỹ và có ghi chú. Không đổi ký hiệu chính sang Anh vì điểm của ô `əʊ` thật ra là điểm của âm Mỹ `oʊ`, người đọc theo giọng Anh sẽ hiểu nhầm.
- **`ɔɹ` và `ɑɹ` không có hàng riêng**: Azure trả chúng thành một âm, bộ chuyển đổi chuyển theo nguyên âm (`ɔ`, `ɑ`) và không tách r, như trước. Ba nguyên âm r-hoá `ɪɹ ɛɹ ʊɹ` có hàng riêng.
- **Mẹo sửa âm**: ký hiệu trong lời mẹo đổi theo bảng mới; mẹo của `ɝ oʊ ɪɹ ɛɹ ʊɹ ɑ ɔ ə` được viết lại theo giọng Mỹ và thêm mẹo cho `ɚ`.

## Kết quả đo khi sinh lại (45.271 câu)

- `ipa_us`: 40.183 câu (88,8%); `ipa_uk`: 40.147 câu (88,7%). Phần thiếu chủ yếu là tên riêng của phim hoạt hình, số, và phụ âm co tách rời.
- 36 câu có `ipa_us` nhưng không có `ipa_uk` vì espeak trả ký tự ngoài bộ âm (`ɔ` ở `korea`, `x` ở `bach`).
- 52 câu có khoảng trắng không ngắt (U+00A0) giữa các từ; `\s` của Java không tính nó nên `ExpectedPhonemes.wordsOf` tách theo `[\s\p{Z}]`.

## Consequences

- Hai bản IPA có thể khác nhau ở âm r (`ɚ`/`ə`, `ɹ` cuối từ) và vài nguyên âm; người đọc theo giọng Anh vẫn bị chấm theo âm đích Mỹ. Giao diện phải nói rõ điều này khi hiện phiên âm Anh (việc của frontend).
- Dữ liệu chấm trước đó giữ nguyên số lượng: lượt cũ lưu `phoneme_id` và `target_phoneme_id` nên chỉ đổi cách gọi tên (kiểm tra trên bản sao DB dev: 222 âm đã lưu, 2 dòng nhắm vào `ɒ` chuyển sang `ɑ`). Lượt cũ có `ə` ở vị trí `ɚ` vẫn là `ə`.
- Video khẩu hình đi theo `id` nên các âm đổi tên giữ video cũ của BBC Learning English (giọng Anh). Chín âm có khẩu hình khác giọng Mỹ (`ɝ ɚ oʊ ɑ ɔ ɪɹ ɛɹ ʊɹ ə`) được thay bằng video giọng Mỹ ở `V20261031_2320`, chọn theo tiêu đề và kênh, chưa xem nội dung; `ʊɹ` là ứng viên yếu nhất (video dạy theo từ "pure"). 35 âm còn lại vẫn dùng video giọng Anh vì khẩu hình gần như giống nhau (phụ âm, `æ ɪ ʊ ʌ ɛ i u eɪ aɪ aʊ ɔɪ ɹ`).
- 11,2% câu chưa có phiên âm nên chưa có âm đích: các câu đó vẫn chấm được điểm nhưng không có mẹo và video theo âm.
- Cần đo thêm với Azure thật trước khi coi nguyên âm lệch là không đáng kể, và quyết định cách xử lý `ju` (Azure đôi khi trả một âm `ju` cho `you`, bảng chuyển đổi chưa có).

## Chưa quyết

- Có nới đánh dấu "cần sửa" cho người luyện giọng Anh không (cần lưu ở tài khoản vì "cần sửa" tính ở backend; trước đó phải đo bằng giọng Anh thật xem âm nào bị điểm thấp).
- Cách xử lý `ju` và các âm flap (`better`, `water`) với luật phụ âm lệch của `PhonemeRules`.
