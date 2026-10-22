# Đặc tả Use Case — Module SHADOWING (Luyện nói theo)

Trạng thái: **Nháp**, chờ duyệt. Người phụ trách: Lâm.

Phạm vi lát A: học viên ghi âm đọc lại một câu, nhận điểm do Azure chấm ở mức câu, từ và âm vị, xem hạn mức trong ngày và tiếp tục bài đang dở. **Chưa gồm** Phiên gia sư (lát C). Lát B (Mẹo sửa, video khẩu hình, Nhận xét AI) có ở UC-SHADOW-07 trở đi; Nhận xét AI dùng Gemini bản văn bản (cấu hình `GEMINI_API_KEY`). Thuật ngữ theo `CONTEXT.md`: Lượt shadowing, Kết quả chấm phát âm.

Quy ước: mọi endpoint yêu cầu đăng nhập. "Gói" là kết quả của `SubscriptionQueryService`. Mã `AC-SHADOW-xx` được tham chiếu trong tên test tích hợp (`ShadowingAttemptIntegrationTest`, `ShadowingUsageIntegrationTest`) và test đơn vị (`AzurePhonemeMapperTest`, `WavAudioTest`, `UsageServiceTest`).

Đồng ý xử lý bằng AI (`ai_processing`) do module Người dùng của Kế cung cấp qua `ConsentService`. Đến khi có bản thật, hệ thống dùng bản tạm `StubConsentService` luôn trả "đã đồng ý" (xem BR-SHADOW-06); Kế thay bản tạm bằng bản đọc `user_consents` mà không đổi interface.

---

### UC-SHADOW-01: Chấm một lượt đọc

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Gửi bản ghi âm đọc lại một câu của bài; hệ thống chấm bằng Azure, lưu Lượt shadowing và trả kết quả. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập, câu thuộc bài hiển thị, tác nhân được phép luyện bài (bài Pro cần gói Pro). |
| Điều kiện sau | Có một dòng `sentence_attempts` (chế độ shadowing) kèm kết quả từng từ và từng âm vị; tiến độ bài được cập nhật (chấm phát âm hoàn toàn miễn phí, không giới hạn lượt và không trừ năng lượng AI). |
| Tiêu chí chấp nhận | **AC-SHADOW-01 — Chấm và lưu**<br>Given: Câu hợp lệ, đã đồng ý, ghi âm WAV hợp lệ.<br>When: Gửi ghi âm.<br>Then: Trả 200 với điểm câu, độ chính xác, độ trôi chảy, độ đầy đủ, ngữ điệu (nếu có), văn bản nhận dạng, danh sách từ (điểm, loại lỗi, âm vị); lưu đúng một lượt, các từ theo thứ tự, các âm vị đã chuyển được.<br><br>**AC-SHADOW-02 — Loại lỗi của từ**<br>Given: Azure báo từ đúng, đọc sai, bỏ sót, thừa.<br>When: Lưu kết quả từng từ.<br>Then: Lưu lần lượt `correct`, `mispronounced`, `omitted` (không có từ thực tế), `inserted` (không có từ mong đợi).<br><br>**AC-SHADOW-03 — Free không giới hạn lượt**<br>Given: Gói Free đã dùng nhiều lượt trong ngày (kể cả quá 5 lượt).<br>When: Gửi ghi âm.<br>Then: Chấm bình thường, không bị chặn 429 `QUOTA_EXCEEDED`.<br><br>**AC-SHADOW-04 — Pro không giới hạn lượt**<br>Given: Gói Pro.<br>When: Gửi ghi âm.<br>Then: Chấm bình thường không giới hạn.<br><br>**AC-SHADOW-05 — Lỗi Azure không ảnh hưởng bộ đếm**<br>Given: Dịch vụ chấm báo lỗi.<br>When: Gửi ghi âm.<br>Then: Trả 502 `SHADOWING_SCORING_UNAVAILABLE`; không lưu lượt; không ảnh hưởng bộ đếm nào.<br><br>**AC-SHADOW-06 — Không nghe thấy tiếng nói**<br>Given: Azure không nhận dạng được lời nói.<br>When: Gửi ghi âm.<br>Then: Trả 422 `SHADOWING_NO_SPEECH`; không lưu lượt; không ảnh hưởng bộ đếm nào.<br><br>**AC-SHADOW-07 — Ghi âm không hợp lệ**<br>Given: Tệp rỗng, không phải WAV, không phải PCM 16-bit mono 16 kHz, ngắn hơn 0,5 giây hoặc dài hơn 30 giây.<br>When: Gửi ghi âm.<br>Then: Trả 400 `SHADOWING_AUDIO_INVALID`; không gọi Azure, không trừ năng lượng.<br><br>**AC-SHADOW-08 — Chưa đồng ý xử lý bằng AI**<br>Given: `ConsentService` báo chưa đồng ý.<br>When: Gửi ghi âm.<br>Then: Trả 403 `AI_CONSENT_REQUIRED`; không gọi Azure.<br><br>**AC-SHADOW-09 — Câu hoặc bài không hợp lệ**<br>Given: Câu không tồn tại, hoặc câu thuộc bài Pro còn tác nhân là Free.<br>When: Gửi ghi âm.<br>Then: Lần lượt trả 404 `NOT_FOUND` và 403 `LESSON_PRO_REQUIRED`.<br><br>**AC-SHADOW-10 — Yêu cầu đăng nhập**<br>Given: Yêu cầu không có token.<br>When: Gọi bất kỳ endpoint của module.<br>Then: Trả 401.<br><br>**AC-SHADOW-11 — Đồng thời không bị chặn hạn mức**<br>Given: Nhiều yêu cầu chấm gửi cùng lúc.<br>When: Hệ thống xử lý.<br>Then: Mọi yêu cầu hợp lệ đều được chấm bình thường; không bị từ chối bởi hạn mức.<br><br>**AC-SHADOW-37 — Free chấm quá 5 lượt vẫn thành công**<br>Given: Tác nhân Free đã thực hiện 5 lượt chấm hôm nay.<br>When: Gửi lượt chấm thứ 6.<br>Then: Trả 200 chấm thành công; lưu lượt mới trong `sentence_attempts`; bộ đếm năng lượng AI `ai_energy` không đổi. |
| Độ ưu tiên | Cao |

---

### UC-SHADOW-02: Chuyển âm vị của Azure sang bảng âm vị

| Mục | Nội dung |
|---|---|
| Tác nhân | Hệ thống (nội bộ) |
| Mô tả | Âm vị giọng Mỹ Azure trả về được chuyển sang bảng `phonemes` để lưu (ADR 0004). Kết quả trả cho học viên cũng dùng ký hiệu của bảng `phonemes` (cùng hệ với IPA mẫu của câu); âm chưa chuyển được giữ ký hiệu Azure. |
| Tiêu chí chấp nhận | **AC-SHADOW-12 — Phủ toàn bộ bộ âm en-US**<br>Given: Mọi âm vị mà Azure có thể trả cho en-US.<br>When: Chuyển đổi.<br>Then: Mỗi âm cho ra một ký hiệu có trong bảng `phonemes`.<br><br>**AC-SHADOW-13 — Quy tắc theo ngữ cảnh**<br>Given: Chuỗi âm của từ có nguyên âm đứng trước `ɹ` (vd `n ɪ ɹ`).<br>When: Chuyển đổi.<br>Then: Nguyên âm đổi thành nguyên âm đôi tương ứng (`ɪ→ɪə`, `ɛ→eə`, `ʊ→ʊə`); âm `r` vẫn giữ riêng.<br>Given: Azure trả nguyên âm kèm r thành một âm duy nhất (vd `ɔɹ` ở "morning", đo từ Azure thật).<br>Then: Chuyển theo nguyên âm (`ɔɹ→ɔː`, `ɑɹ→ɑː`, `ɪɹ→ɪə`, `ɛɹ→eə`, `ʊɹ→ʊə`), không tách thêm âm `r`.<br><br>**AC-SHADOW-14 — Âm lạ**<br>Given: Ký hiệu không có trong bảng chuyển đổi.<br>When: Lưu kết quả.<br>Then: Âm đó vẫn nằm trong phản hồi cho học viên và được lưu với `phoneme_id` rỗng kèm ký hiệu gốc `azure_symbol` (để xử lý lại khi bổ sung bộ chuyển đổi); hệ thống ghi cảnh báo; phần còn lại của lượt vẫn lưu bình thường. |
| Độ ưu tiên | Cao |

---

### UC-SHADOW-03: Tiếp tục bài đang dở

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Mở lại bài và thấy lại đầy đủ kết quả của từng câu như lúc vừa chấm: điểm tổng và điểm thành phần, từng từ, từng âm vị kèm mẹo sửa và video khẩu hình (theo gói), cùng nhận xét AI đã lưu. |
| Tiêu chí chấp nhận | **AC-SHADOW-15 — Lượt mới nhất của từng câu**<br>Given: Tác nhân đã đọc vài câu của bài, có câu đọc nhiều lần.<br>When: Gọi `GET /lessons/{slug}/shadowing-attempts/latest`.<br>Then: Với mỗi câu đã đọc trả lượt mới nhất (điểm, thời điểm, các từ kèm điểm và loại lỗi), điểm cao nhất và số lần đọc; câu chưa đọc không xuất hiện; không lẫn dữ liệu của người khác hay của chế độ nghe chép.<br><br>**AC-SHADOW-33 — Khôi phục đầy đủ**<br>Given: Lượt đã chấm, có âm yếu, có thể đã có nhận xét AI.<br>When: Gọi `GET /lessons/{slug}/shadowing-attempts/latest`.<br>Then: Mỗi câu kèm điểm chính xác, trôi chảy, đầy đủ, ngữ điệu; từng từ có danh sách âm vị (ký hiệu bảng phonemes, điểm), âm dưới 60 kèm mẹo sửa và `mouthVideo` (Free: khoá, không lộ đường dẫn); `aiFeedback` là nhận xét đã lưu hoặc rỗng.<br><br>**AC-SHADOW-34 — Âm mẫu và cách đọc Azure báo**<br>Given: Câu có phiên âm mẫu; Azure báo cách đọc của từng âm (thường là âm mẫu, nhưng có thể là một biến thể, vd `if` đọc thành "iv" Azure báo `v` và vẫn chấm 100).<br>When: Chấm lượt hoặc mở lại bài.<br>Then: Mỗi âm có `symbol` (Azure báo) và `expected` (âm mẫu cùng vị trí, ghép khi số âm bằng nhau; null nếu không ghép được). `tip` và `mouthVideo` là của âm cần sửa (`expected`, hoặc `symbol` khi không có). Phiên âm mẫu (giọng Mỹ) được chuyển bằng cùng bộ chuyển đổi với âm Azure (ADR 0004) nên hai bên so được với nhau. Âm chưa có mẹo thì không hiện mẹo (không dùng mô tả chung của bảng `phonemes`, soạn theo giọng Anh nên có thể trái bài giọng Mỹ).<br><br>**AC-SHADOW-35 — Âm cần sửa**<br>Given: Một âm đọc dưới 60 điểm, hoặc một phụ âm Azure báo khác âm mẫu dù điểm cao (vd cần `f` nhưng báo `v` được 100).<br>When: Chấm lượt hoặc mở lại bài.<br>Then: Âm đó có `needsFix = true` và được tính vào "âm hay sai" cùng dữ liệu gửi cho nhận xét AI (theo âm mẫu). Nguyên âm khác âm mẫu không bị đánh dấu vì thường là rút gọn bình thường (ɪ/ə).<br><br>**AC-SHADOW-36 — Mô hình âm đích**<br>Given: Câu có phiên âm mẫu; Azure báo cách đọc từng âm kèm ứng viên (NBestPhonemes).<br>When: Chấm lượt.<br>Then: Mỗi âm lưu `azure_symbol` (gốc), `phoneme_id` (cách đọc Azure báo, đã chuyển), `target_phoneme_id` (âm đích ghép từ phiên âm câu, rỗng nếu không ghép được) và ứng viên khác cao điểm nhất (`produced_phoneme_id`, `produced_score`). Mở lại bài dùng âm đích đã lưu; dòng cũ chưa có thì tính lại từ phiên âm hiện tại. `v_user_phoneme_stats` thống kê theo âm đích, lỗi là điểm dưới 60 hoặc phụ âm khác âm đích.<br><br>**AC-SHADOW-16 — Bài không hợp lệ**<br>Given: Slug không tồn tại, hoặc bài Pro với tác nhân Free.<br>When: Gọi endpoint trên.<br>Then: Trả 404 hoặc 403 `LESSON_PRO_REQUIRED`. |
| Độ ưu tiên | Cao |

---

### UC-SHADOW-04: Xem hạn mức trong ngày

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Xem số lượt đã dùng, giới hạn và số còn lại của các tính năng có hạn mức. |
| Tiêu chí chấp nhận | **AC-SHADOW-17 — Hạn mức theo gói**<br>Given: Tác nhân Free đã dùng năng lượng AI hôm nay.<br>When: Gọi `GET /me/usage`.<br>Then: `ai_energy` có `used`, `limit=8`, `remaining`; trả kèm bảng giá `costs` (`ai_feedback=1`, `tutor_session=3`); không còn trường `shadowing_assess`; tác nhân Pro nhận `limit` và `remaining` rỗng (không giới hạn).<br><br>**AC-SHADOW-18 — Sang ngày mới**<br>Given: Tác nhân đã dùng năng lượng AI hôm qua (theo giờ Việt Nam).<br>When: Sang 00:00.<br>Then: Số năng lượng AI đã dùng bắt đầu lại từ 0. |
| Độ ưu tiên | Cao |

---

### UC-SHADOW-05: Cập nhật tiến độ bài

| Mục | Nội dung |
|---|---|
| Tác nhân | Hệ thống (nội bộ, qua `LessonProgressService.recordActivity`) |
| Mô tả | Mỗi Lượt shadowing ghi nhận tiến độ của bài ở chế độ shadowing. |
| Tiêu chí chấp nhận | **AC-SHADOW-19 — Lượt đầu tiên**<br>Given: Tác nhân chưa luyện bài này.<br>When: Chấm xong lượt đầu.<br>Then: Có dòng tiến độ bài và tiến độ chế độ shadowing; `last_activity_at` là thời điểm vừa chấm.<br><br>**AC-SHADOW-20 — Hoàn thành chế độ**<br>Given: Bài có N câu, tác nhân đã đọc N−1 câu.<br>When: Chấm lượt cho câu còn lại.<br>Then: Tiến độ chế độ shadowing có `completed_at`; đọc lại một câu không đổi `completed_at`. |
| Độ ưu tiên | Trung bình |

---

### UC-SHADOW-06: Trang luyện shadowing (giao diện)

Kiểm thử thủ công theo mockup `design/mockups-student-v2/shadowing.html`, ở cả gói Free và Pro (nút thử ở thanh trên).

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| 1 | Mở bài lần đầu | Hiện danh sách câu, không có chip giới hạn số lượt shadowing (chấm không giới hạn); chưa có điểm |
| 2 | Bấm mic, cấp quyền, đọc, dừng | Có trạng thái đang ghi (đồng hồ, sóng), rồi "đang chấm", rồi điểm câu và các từ tô theo điểm |
| 3 | Bấm một từ | Mở ô chi tiết: âm vị kèm điểm, âm nào dưới 60 được đánh dấu |
| 4 | "Nghe lại của tôi" / "So sánh" | Phát bản ghi gần nhất trong trình duyệt, rồi câu mẫu |
| 5 | Đọc nhiều lượt liên tục (kể cả quá 5 lượt) | Không bị chặn hạn mức, không hiện hộp hết lượt shadowing; vẫn tiếp tục ghi âm và chấm bình thường |
| 6 | Chuyển sang Pro bằng nút thử | Giao diện Pro có hiệu lực ngay, không cần tải lại trang |
| 7 | Từ chối quyền micro | Hiện hướng dẫn cấp quyền, nút thử lại |
| 8 | Mất mạng hoặc server lỗi lúc chấm | Báo lỗi, nút thử lại; không ảnh hưởng bộ đếm nào |
| 9 | Đóng bài rồi mở lại | Hiện "Tiếp tục từ câu x · đã đọc y/z" và điểm cũ của từng câu |
| 10 | Slug sai, bài Pro với Free | Trang "không tìm thấy bài" / hộp nâng cấp |
| 11 | Bấm một câu trong danh sách (tab Luyện) | Chọn câu đó và phát ngay đoạn mẫu: video tua tới đúng đoạn, hoặc tệp âm thanh phát từ đúng giây, hoặc giọng tổng hợp nếu không có |
| 12 | Danh sách ở tab Luyện | Câu chưa đọc bị che chữ (chỉ còn dấu câu); câu đã đọc hiện chữ, điểm cao nhất và số lần |
| 13 | Bấm "Xem" (hoặc Alt+W) | Danh sách hiện chữ mọi câu; bấm "Xem từ câu n" phát liền mạch, câu đang nói sáng và danh sách tự cuộn theo; "Dừng" dừng lại |
| 14 | Ở tab Xem, bấm một câu trong danh sách | Tua tới câu đó và xem tiếp từ đây |
| 15 | Bấm ⚙ Cài đặt | Có ba công tắc: hiện phiên âm, hiện bản dịch, phụ đề khi xem. Đổi thì giao diện đổi ngay và giữ nguyên sau khi tải lại trang |
| 16 | Bấm "Ẩn video" (bài YouTube) | Khung video thu về 0 nhưng âm thanh vẫn phát; "Hiện video" khôi phục |
| 18 | Mở bài có phiên âm của câu | Mỗi từ hiện phiên âm ngay bên dưới (`/ɪf/`, `/θɪŋz/`…) khi số từ phiên âm bằng số từ của câu; lệch số từ thì hiện phiên âm cả câu thành một dòng; tắt công tắc "Hiện phiên âm" thì ẩn |
| 19 | Thanh phía trên video | Có nguồn phát, đồng hồ `00:02.0 / 00:50`, thanh các câu trên trục thời gian (câu đang chọn màu nhấn, câu đã đọc màu xanh, bấm vào một đoạn để chuyển và phát câu đó), nút "Ẩn video" |
| 20 | Hàng điều khiển ở tab Luyện | Một hàng: ← ↻ ▶ → · tốc độ · Giọng tôi · So sánh · nút mic; từ được tô sáng theo lời đang phát; màn hình hẹp thì tự xuống dòng, không cuộn ngang |
| 21 | Sau khi chấm | Khối điểm, chip Cao nhất / số lần đọc / các chỉ số, chip lỗi (từ bỏ sót, từ thừa, âm dưới 60), lời nhắn, "Nghe mẫu" và "Câu tiếp" (câu cuối thì "Hoàn thành"); danh sách bên phải có tiến độ cả bài và các âm hay sai |
| 22 | Chi tiết một từ có âm yếu | Dưới tên từ và phiên âm có hộp mẹo sửa (biểu tượng bóng đèn); Pro thấy nút "Video khẩu hình âm /x/" mở video ngay trong ô; Free thấy hộp khoá có nhãn PRO và nút "Mở với Pro" mở hộp mời nâng cấp |
| 23 | Nhận xét AI sau khi chấm | Dưới khối điểm có thẻ "Nhận xét AI" với nút "Xem nhận xét AI"; bấm thì hiện "AI đang viết nhận xét…" rồi nội dung kèm chip năng lượng AI; hết năng lượng thì hiện thông báo và nút "Mở với Pro"; lỗi thì có nút "Thử lại" và nói rõ năng lượng không bị trừ; đọc lại câu thì thẻ về trạng thái đầu. Chữ chạy ra ngay khi AI viết (có con trỏ nhấp nháy), không phải chờ cả đoạn |
| 17 | Phím tắt ở tab Luyện | Space ghi âm/dừng, nhả Ctrl nghe mẫu, R nghe lại giọng mình, C so sánh; Alt+←/→ đổi câu; Alt+W/Alt+P đổi tab. Không kích hoạt khi đang gõ vào ô nhập; Space nhường cho nút đang được focus |

---

### UC-SHADOW-07: Mẹo sửa cho âm đọc yếu

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Âm vị nào đọc dưới 60 điểm thì kết quả chấm kèm một mẹo ngắn bằng tiếng Việt (vị trí lưỡi, môi, hơi) lấy từ bảng `phoneme_confusions` theo âm đích. Mẹo hiện trong ô chi tiết của từ. |
| Điều kiện tiên quyết | Có Kết quả chấm của một lượt (UC-SHADOW-01). Mẹo có ở cả gói Free và Pro. |
| Tiêu chí chấp nhận | **AC-SHADOW-21 — Mẹo theo âm đích**<br>Given: Một âm có trong bảng mẹo (vd `θ`).<br>When: Chấm lượt.<br>Then: Mọi âm có mẹo đều có trường `tip` và `mouthVideo` (kể cả âm đạt điểm), âm không có mẹo thì rỗng. Giao diện mặc định chọn âm yếu đầu tiên; người học bấm âm nào thì xem mẹo và video của âm đó. Bảng mẹo phủ đủ 44 âm của bảng `phonemes` (14 âm người Việt hay sai có mẹo riêng từ đầu: `θ ð ʃ ʒ z v r s t d l ɪ iː æ`; 30 âm còn lại được rút gọn từ hướng dẫn phát âm, bỏ các câu nói riêng về giọng Anh, chờ người có chuyên môn ngữ âm duyệt). |
| Độ ưu tiên | Trung bình |

---

### UC-SHADOW-08: Video khẩu hình (nội dung Pro)

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Âm đọc dưới 60 điểm có video khẩu hình riêng. Gói Pro xem được; gói Free thấy hộp khoá kèm nút mở với Pro. |
| Điều kiện tiên quyết | Âm có `mouth_video_url` trong bảng `phonemes`; quyền xem theo hạn mức tính năng `mouth_video` của gói. |
| Điều kiện sau | Không có bộ đếm: Pro không giới hạn. |
| Tiêu chí chấp nhận | **AC-SHADOW-22 — Khoá ở server**<br>Given: Âm có video.<br>When: Gói Free chấm lượt.<br>Then: `mouthVideo` có `locked = true` và `url` rỗng, không bao giờ lộ đường dẫn.<br>Given: Gói Pro.<br>Then: `mouthVideo.locked = false` và có `url`.<br><br>**AC-SHADOW-23 — Mẹo lỗi không làm mất kết quả**<br>Given: Tra mẹo hoặc video gặp lỗi.<br>When: Chấm lượt.<br>Then: Kết quả chấm vẫn được trả bình thường, chỉ thiếu mẹo và video; lượt không bị hoàn. |
| Độ ưu tiên | Trung bình |

---

### UC-SHADOW-09: Nhận xét AI cho một lượt

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Sau khi có điểm, học viên xin AI viết vài dòng nhận xét tiếng Việt về lượt đọc (khen điểm tốt, nêu lỗi chính, gợi ý luyện). AI chỉ nhận chữ và điểm của lượt (từ, điểm từng từ, âm yếu), không nhận âm thanh. Mỗi lượt có tối đa một nhận xét, lưu lại kèm model, phiên bản prompt và số token. |
| Điều kiện tiên quyết | Lượt là của chính tác nhân; đã đồng ý xử lý bằng AI (`AI_PROCESSING`). |
| Điều kiện sau | Có một dòng `ai_feedback` cho lượt; bộ đếm `ai_feedback` của ngày tăng 1 (chỉ lần tạo đầu). |
| Tiêu chí chấp nhận | **AC-SHADOW-24 — Tạo một lần, sau đó trả bản đã lưu**<br>Given: Lượt chưa có nhận xét, tác nhân còn lượt.<br>When: Xin nhận xét.<br>Then: Trả 200 với nội dung, `cached = false`, số lượt đã dùng tăng 1; lưu model, phiên bản prompt, số token.<br>Given: Lượt đã có nhận xét.<br>When: Xin lại.<br>Then: Trả đúng nhận xét đã lưu, `cached = true`, không gọi AI, không trừ thêm lượt. Dữ liệu gửi AI chỉ có chữ câu mẫu, điểm, từng từ và âm yếu (ký hiệu bảng phonemes).<br><br>**AC-SHADOW-25 — Chỉ lượt của mình**<br>Given: Lượt của người khác hoặc không tồn tại.<br>When: Xin nhận xét.<br>Then: Trả 404, không gọi AI.<br><br>**AC-SHADOW-26 — Cần đồng ý AI**<br>Given: Chưa đồng ý xử lý bằng AI.<br>When: Xin nhận xét.<br>Then: Trả 403 `AI_CONSENT_REQUIRED`, không trừ lượt, không gọi AI.<br><br>**AC-SHADOW-27 — Hạn mức theo gói**<br>Given: Gói Free đã dùng 5 lượt nhận xét trong ngày.<br>When: Xin nhận xét cho lượt khác.<br>Then: Trả 429 `QUOTA_EXCEEDED`, không lưu gì. Gói Pro không giới hạn.<br><br>**AC-SHADOW-28 — AI lỗi thì trả lượt**<br>Given: AI lỗi, quá thời gian chờ hoặc mạch đang mở.<br>When: Xin nhận xét.<br>Then: Trả 502 `AI_FEEDBACK_UNAVAILABLE`, bộ đếm về giá trị trước, không lưu nhận xét.<br><br>**AC-SHADOW-30 — Chữ chạy ra dần**<br>Given: Lượt chưa có nhận xét, tác nhân còn lượt.<br>When: Xin nhận xét qua `POST /shadowing-attempts/{id}/ai-feedback/stream`.<br>Then: Phản hồi là luồng Server-Sent Events: các sự kiện `delta` (đoạn chữ mới) đến ngay khi AI viết, rồi một sự kiện `done` (nhận xét đầy đủ, `cached`, mức dùng); kết quả lưu và tính lượt như UC thường. Lượt đã có nhận xét thì báo một lần với cả nội dung rồi `done` với `cached = true`, không trừ lượt.<br><br>**AC-SHADOW-31 — Lỗi khi phát dần**<br>Given: Lỗi trước đoạn chữ đầu tiên (không phải lượt của mình, chưa đồng ý AI, hết lượt, AI lỗi).<br>When: Xin nhận xét phát dần.<br>Then: Trả mã HTTP và JSON lỗi như bình thường, không phát luồng. Lỗi sau khi đã có chữ: kết thúc bằng sự kiện `error` kèm mã lỗi, lượt được hoàn, không lưu nhận xét. Người học đóng trang giữa chừng thì dừng, hoàn lượt và không làm mở circuit breaker.<br><br>**AC-SHADOW-32 — Gemini quá tải**<br>Given: Gemini trả 503 hoặc 429 trước khi có chữ nào.<br>When: Xin nhận xét (thường hoặc phát dần).<br>Then: Hệ thống thử lại đúng một lần sau khoảng 1 giây, bằng model dự phòng nếu có cấu hình (`GEMINI_FALLBACK_MODEL`). Vẫn quá tải thì trả 503 `AI_FEEDBACK_BUSY` (giao diện: "AI đang bận, thử lại sau ít phút") và hoàn lượt. Đã gửi chữ cho người học rồi thì không thử lại.<br><br>**AC-SHADOW-29 — Hai yêu cầu đồng thời**<br>Given: Hai yêu cầu cho cùng một lượt chưa có nhận xét.<br>When: Gửi cùng lúc.<br>Then: Cả hai trả 200, chỉ một dòng được lưu và chỉ tính một lượt. |
| Độ ưu tiên | Trung bình |

---

### Chưa thuộc phạm vi

- Lưu file ghi âm lên server, `is_baseline`, tự xoá khi hết hạn (cần `voice_storage`).
- Hàng đợi ôn câu làm kém (`user_sentence_review`), `completed_at` mức bài (cần thống nhất với nghe chép). Điểm cao nhất từng câu ở danh sách câu của trang bài đã có, tách theo chế độ (AC-LESSON-14).
- Hộp thoại xin đồng ý lần ghi âm đầu và API `/me/consents` (Kế).
- Phiên gia sư (lát C, xem `TUTOR.md`). Mẹo riêng cho cặp "đọc A thành B" (Azure không trả âm bị nhầm thành gì).
- Phần của mockup chưa làm ở trang luyện: thanh thời gian chia đoạn trên video, công tắc "Gia sư" (lát C).
- Phát câu mẫu: video YouTube hoặc tệp âm thanh của bài, cắt theo thời gian của câu; không có thì dùng giọng tổng hợp của trình duyệt.
