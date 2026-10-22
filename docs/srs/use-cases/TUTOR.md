# Đặc tả Use Case — Module TUTOR (Phiên gia sư)

Trạng thái: **Nháp**, chờ duyệt. Người phụ trách: Lâm.

Phạm vi lát C: sau khi đọc một câu (Lượt shadowing), học viên được mời, hoặc tự bấm, vào một **Phiên gia sư** về câu đó: nói chuyện bằng giọng với gia sư AI (Gemini Live), luyện lần lượt các từ lỗi, đọc lại để Azure chấm, rồi quay về bài. Phiên làm việc với **cả câu**, tối đa 10 phút. Thiết kế gốc: demo `azure-pronunciation-demo` và ADR 0001 đến 0003; âm đích và quy tắc "cần sửa" theo ADR 0005.

Thuật ngữ theo `CONTEXT.md`: Phiên gia sư, Lời mời, Từ luyện, Danh sách từ lỗi, Lượt chấm, Lượt lạc đề, Kết quả từng từ. Quy ước chung như `SHADOWING.md`: mọi endpoint yêu cầu đăng nhập và nằm dưới `/api/v1/tutor`. Mã `AC-TUTOR-xx` được tham chiếu trong tên test tích hợp (`TutorSessionIntegrationTest`), mã `BR-TUTOR-xx` ở `business-rules.md`.

**Việc do trình duyệt thực hiện** (ADR 0002, ghi rõ để báo cáo): âm thanh hai chiều với Gemini Live, đồng hồ trần 10 phút, nhắc im lặng 60 và 90 giây, giữ nút để ghi âm. Backend chỉ cấp token, giữ trạng thái phiên và chấm; Kết quả từng từ và lý do kết thúc do backend quyết định.

---

### UC-TUTOR-01: Xét lời mời gia sư sau một lượt

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên (trang luyện shadowing, khi Chế độ gia sư đang bật) |
| Mô tả | Sau khi chấm một câu, trình duyệt gửi `attemptId`; server đọc kết quả của lượt đó và hai lượt gần nhất của bài, rồi quyết định có tự mở gia sư không. Nếu có, trả kèm Danh sách từ lỗi để giao diện nói rõ vì sao gia sư mở. |
| Điều kiện tiên quyết | Lượt là của chính tác nhân và là lượt shadowing. |
| Điều kiện sau | Khi mời: có một dòng `tutor_offers` (gắn với lượt, thời điểm, chưa trả lời). |
| Tiêu chí chấp nhận | **AC-TUTOR-01 — Có từ đáng sửa thì mời**<br>Given: Chế độ gia sư bật, câu có từ dưới 60 điểm, chưa mời lần nào trong bài.<br>When: Gọi `POST /offers {attemptId}`.<br>Then: Trả `offer = true`, lý do `LOW_WORD_SCORE`, `offerId` và Danh sách từ lỗi không rỗng.<br><br>**AC-TUTOR-02 — Lỗi lặp lại cũng mời**<br>Given: Không từ nào dưới 60 điểm nhưng cùng một âm đích cần sửa ở câu này và ở ít nhất một trong hai lượt gần nhất của bài.<br>When: Gọi.<br>Then: `offer = true`, lý do `REPEATED_PHONEME_ERROR`.<br><br>**AC-TUTOR-03 — Câu tốt không mời**<br>Given: Không từ dưới 60 điểm và không âm lặp lại.<br>When: Gọi.<br>Then: `offer = false`, lý do `NO_SIGNIFICANT_ERROR`, không tạo dòng `tutor_offers`.<br><br>**AC-TUTOR-04 — Giãn cách ba câu**<br>Given: Lần mời gần nhất của bài cách đây ít hơn 3 lượt (tính cả lượt vừa đọc).<br>When: Gọi.<br>Then: `offer = false`, lý do `COOLDOWN`, kể cả khi câu có từ lỗi.<br><br>**AC-TUTOR-05 — Chủ sở hữu**<br>Given: `attemptId` của người khác hoặc của chế độ nghe chép.<br>When: Gọi.<br>Then: Trả 404. |
| Độ ưu tiên | Cao |

---

### UC-TUTOR-02: Từ chối lời mời

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Học viên bấm "Bỏ qua câu này" lúc đếm ngược 3 giây; server ghi lại để tính số liệu và giãn cách. |
| Tiêu chí chấp nhận | **AC-TUTOR-06 — Từ chối**<br>Given: Lời mời của chính tác nhân, chưa trả lời.<br>When: `POST /offers/{id}/decline`.<br>Then: Lời mời được đánh dấu bỏ qua; gọi lại không đổi gì; lời mời của người khác trả 404. |
| Độ ưu tiên | Trung bình |

---

### UC-TUTOR-03: Tạo Phiên gia sư

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Từ một lượt (do lời mời hoặc do học viên tự bấm "Hỏi gia sư"), server tạo phiên về câu của lượt đó, dựng Danh sách từ lỗi từ kết quả chấm đã lưu, rồi cấp ephemeral token Gemini Live đã khoá model, lời nhắc hệ thống và các tool. Trình duyệt chỉ gửi `attemptId` (và `offerId` nếu có); toàn bộ điểm đọc từ DB. |
| Điều kiện tiên quyết | Lượt là của chính tác nhân; đã đồng ý xử lý bằng AI (`AI_PROCESSING`); gói còn lượt `tutor_session` hôm nay (chỉ kiểm tra, chưa trừ). |
| Điều kiện sau | Có một dòng `tutor_sessions` (chưa `started`) và các dòng `tutor_session_words` ứng với Danh sách từ lỗi; lời mời (nếu có) được đánh dấu đã nhận. |
| Tiêu chí chấp nhận | **AC-TUTOR-07 — Tạo phiên**<br>Given: Lượt hợp lệ có từ lỗi, đã đồng ý, còn lượt.<br>When: `POST /sessions {attemptId, offerId?}`.<br>Then: Trả 200 với `sessionId`, `token`, `model`, Danh sách từ lỗi (từ, âm đích trọng tâm, điểm lúc đầu, mẹo sửa), Từ đang luyện đầu tiên và các giới hạn (số lượt mỗi từ, thời gian chờ bắt đầu 15 giây, trần phiên).<br><br>**AC-TUTOR-08 — Câu tốt vẫn mở được**<br>Given: Lượt không có từ lỗi.<br>When: Tạo phiên (học viên tự bấm).<br>Then: Trả 200 với Danh sách từ lỗi rỗng; học viên tự chọn từ muốn luyện (UC-TUTOR-05).<br><br>**AC-TUTOR-09 — Chủ sở hữu**<br>Given: `attemptId` của người khác.<br>When: Tạo phiên.<br>Then: Trả 404, không cấp token.<br><br>**AC-TUTOR-10 — Chưa đồng ý hoặc hết lượt**<br>Given: Chưa đồng ý `AI_PROCESSING`; hoặc Free đã dùng hết lượt hôm nay.<br>When: Tạo phiên.<br>Then: Lần lượt trả lỗi `AI_CONSENT_REQUIRED`, và lỗi hết hạn mức (cùng mã lỗi và dạng với `shadowing_assess`); không tạo phiên, không cấp token.<br><br>**AC-TUTOR-11 — Không cấp được token**<br>Given: Gemini lỗi, quá tải hoặc chưa cấu hình, hoặc circuit breaker đang mở.<br>When: Tạo phiên.<br>Then: Trả 503 kèm Danh sách từ lỗi (để giao diện hiện mẹo dạng chữ), không tạo phiên, không trừ lượt.<br><br>**AC-TUTOR-30 — Lời mời phải thuộc lượt**<br>Given: `offerId` là lời mời của chính tác nhân nhưng thuộc một lượt khác với `attemptId`.<br>When: Tạo phiên.<br>Then: Trả 404, lời mời giữ nguyên chưa trả lời, không cấp token.<br><br>**AC-TUTOR-31 — Quá nhiều phiên không bắt đầu**<br>Given: Trong ngày (theo múi giờ hạn mức, BR-SHADOW-01) tác nhân đã tạo 5 phiên chưa `started` (đang chờ hoặc `connect_failed`).<br>When: Tạo phiên thứ sáu (cả Free và Pro).<br>Then: Trả 429 `TUTOR_TOO_MANY_FAILED_STARTS`, không tạo phiên, không cấp token; phiên đã `started` không bị tính vào trần. |
| Độ ưu tiên | Cao |

---

### UC-TUTOR-04: Bắt đầu và hết hạn chờ

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên (trình duyệt báo khi gia sư đã nói câu đầu) |
| Mô tả | Khi gia sư thật sự nói, trình duyệt gọi `started`; lúc đó mới trừ lượt. Phiên không `started` trong 15 giây kể từ lúc tạo được coi là không kết nối được. |
| Tiêu chí chấp nhận | **AC-TUTOR-12 — Trừ lượt khi started**<br>Given: Phiên vừa tạo, còn lượt.<br>When: `POST /sessions/{id}/started`.<br>Then: Ghi `started_at`, bộ đếm `tutor_session` của ngày tăng 1 (một lần duy nhất dù gọi lại).<br><br>**AC-TUTOR-13 — Không started thì không trừ**<br>Given: Phiên tạo xong nhưng không gọi `started` trong 15 giây.<br>When: Đọc phiên hoặc job dọn chạy.<br>Then: Kết quả `connect_failed`, bộ đếm không tăng.<br><br>**AC-TUTOR-14 — Hết lượt giữa chừng**<br>Given: Giữa lúc tạo và `started` lượt trong ngày đã bị dùng hết (hai tab).<br>When: `started`.<br>Then: Trả lỗi hết hạn mức và phiên kết thúc `connect_failed`.<br><br>**AC-TUTOR-32 — Hết giờ phía backend**<br>Given: Phiên đã `started` quá 10 phút cộng dung sai 30 giây (trình duyệt đã đóng hoặc bị bỏ qua giới hạn).<br>When: Bất kỳ thao tác nào trên phiên, hoặc job dọn chạy.<br>Then: Phiên kết thúc `timeout` (lượt đã trừ giữ nguyên); đổi từ, Lượt chấm và báo lạc đề trả 409 `TUTOR_SESSION_CONFLICT` và không gọi Azure; gọi lại giữ nguyên kết quả cũ. |
| Độ ưu tiên | Cao |

---

### UC-TUTOR-05: Đổi Từ đang luyện

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên (bấm chip) hoặc gia sư (tool `switch_word`) |
| Mô tả | Chuyển sang bất kỳ từ nào trong câu, kể cả từ đã đọc tốt. Backend chỉ nhận từ có trong câu và trả `instruction` cho gia sư làm theo. |
| Tiêu chí chấp nhận | **AC-TUTOR-15 — Đổi từ**<br>Given: Phiên đang mở.<br>When: `POST /sessions/{id}/word {word}` với từ có trong câu (không phân biệt hoa thường và dấu câu).<br>Then: Trả từ đang luyện mới kèm tiến độ các từ và `instruction`; từ chưa có trong Danh sách từ lỗi được thêm (âm trọng tâm là âm đích điểm thấp nhất của từ ở lượt gốc).<br><br>**AC-TUTOR-16 — Từ ngoài câu**<br>Given: Từ không có trong câu.<br>When: Đổi từ.<br>Then: Trả 400 với mã lỗi riêng, trạng thái phiên không đổi.<br><br>**AC-TUTOR-17 — Phiên đã đóng**<br>Given: Phiên đã kết thúc.<br>When: Đổi từ.<br>Then: Trả lỗi phiên đã kết thúc. |
| Độ ưu tiên | Trung bình |

---

### UC-TUTOR-06: Chấm một Lượt chấm

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên (giữ nút để đọc) |
| Mô tả | Học viên đọc lại Từ đang luyện hoặc cả câu; trình duyệt gửi ghi âm WAV, server chấm bằng Azure (cùng bộ chấm và quy tắc ghi âm với UC-SHADOW-01) và áp luật của phiên. **Không trừ** lượt `shadowing_assess` và không tạo Lượt shadowing mới. |
| Điều kiện tiên quyết | Phiên của chính tác nhân, đã `started`, chưa kết thúc; đã đồng ý `AI_PROCESSING`. |
| Điều kiện sau | Kết quả từng từ được cập nhật: số lượt, điểm lần gần nhất, trạng thái. Ghi âm không được lưu. |
| Tiêu chí chấp nhận | **AC-TUTOR-18 — Đạt thì sang từ kế**<br>Given: Từ đang luyện có âm đích trọng tâm.<br>When: `POST /sessions/{id}/attempts` (target = word) và điểm âm trọng tâm từ 80 trở lên.<br>Then: Từ chuyển `passed`, trả `nextStep = NEXT_WORD` cùng từ kế tiếp; `score_after` của từ được ghi.<br><br>**AC-TUTOR-19 — Hết ba lượt**<br>Given: Đã đọc từ đó hai lần chưa đạt.<br>When: Lượt thứ ba vẫn dưới 80.<br>Then: Từ chuyển `needs_practice`, trả sang từ kế; bấm lại từ đó được ba lượt mới.<br><br>**AC-TUTOR-20 — Hết danh sách thì đọc cả câu**<br>Given: Không còn từ chờ.<br>When: Chấm cả câu (target = sentence), tối đa ba lần.<br>Then: Phiên kết thúc `completed` kèm điểm câu; điểm của Lượt shadowing gốc không đổi.<br><br>**AC-TUTOR-21 — Không trừ lượt shadowing**<br>Given: Bộ đếm `shadowing_assess` của ngày là N.<br>When: Chấm một Lượt chấm.<br>Then: Bộ đếm vẫn N.<br><br>**AC-TUTOR-22 — Azure lỗi**<br>Given: Azure lỗi, hết giờ hoặc không nghe thấy tiếng.<br>When: Chấm.<br>Then: Trả lỗi như UC-SHADOW-01 và **không tính** lượt nào cho từ; học viên đọc lại được.<br><br>**AC-TUTOR-23 — Đổi từ trong lúc chờ Azure**<br>Given: Trong lúc Azure chấm từ A, học viên đổi sang từ B.<br>When: Kết quả của A về.<br>Then: Lượt của A không được tính, trả lỗi để làm theo từ đang luyện. |
| Độ ưu tiên | Cao |

---

### UC-TUTOR-07: Đếm lạc đề

| Mục | Nội dung |
|---|---|
| Tác nhân | Gia sư (tool `log_turn`) |
| Mô tả | Mỗi lượt học viên nói trong chế độ trò chuyện, gia sư báo lượt đó đúng chủ đề (`on_topic`) hay lạc đề (`off_topic`). Backend đếm, không để mô hình quyết định kết thúc. |
| Tiêu chí chấp nhận | **AC-TUTOR-24 — Lạc đề liên tiếp**<br>Given: Phiên đang mở.<br>When: Ba lượt `off_topic` liên tiếp.<br>Then: Lượt 1 và 2 trả `instruction` nhắc quay lại (lượt 2 cảnh báo sẽ kết thúc); lượt 3 kết thúc phiên `off_topic`.<br><br>**AC-TUTOR-25 — Một lượt đúng chủ đề thì đếm lại**<br>Given: Đã có hai lượt lạc đề liên tiếp.<br>When: Một lượt `on_topic`, rồi một lượt `off_topic`.<br>Then: Số đếm liên tiếp về 0 rồi là 1; phiên chưa kết thúc. |
| Độ ưu tiên | Trung bình |

---

### UC-TUTOR-08: Kết thúc phiên và xem lại

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên, trình duyệt, gia sư (tool `end_session`) |
| Mô tả | Phiên kết thúc với một lý do: `completed`, `learner_exit`, `off_topic`, `timeout`, `idle`, `connect_failed`. Backend chỉ tin `completed` và `off_topic` do chính nó quyết định; `learner_exit`, `idle`, `timeout` do trình duyệt quan sát nên được nhận nguyên. |
| Tiêu chí chấp nhận | **AC-TUTOR-26 — Kết thúc**<br>Given: Phiên đang mở.<br>When: `POST /sessions/{id}/events {type: "end", outcome}`.<br>Then: Ghi `ended_at` và lý do; gọi lại giữ nguyên kết quả cũ.<br><br>**AC-TUTOR-27 — Không tự khai hoàn thành**<br>Given: Trình duyệt gửi `completed` hoặc `off_topic` khi backend chưa quyết định như vậy.<br>When: Kết thúc.<br>Then: Ghi `learner_exit`.<br><br>**AC-TUTOR-28 — Xem phiên**<br>Given: Phiên của chính tác nhân.<br>When: `GET /sessions/{id}`.<br>Then: Trả lý do kết thúc, tiến độ và điểm trước/sau từng từ; phiên của người khác trả 404. |
| Độ ưu tiên | Trung bình |

---

### UC-TUTOR-09: Ghi sự kiện Chế độ gia sư

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên (trình duyệt) |
| Mô tả | Ghi việc học viên bật hoặc tắt Chế độ gia sư ở đầu bài và giữa bài (`start_on`, `start_off`, `toggle_on`, `toggle_off`) để làm số liệu hiệu quả sau này. Chế độ gia sư chỉ nhớ trong trình duyệt theo lần vào bài. |
| Tiêu chí chấp nhận | **AC-TUTOR-29 — Ghi sự kiện**<br>Given: Tác nhân đã đăng nhập.<br>When: `POST /lesson-events {lessonId, event}` với `event` hợp lệ.<br>Then: Có một dòng `tutor_lesson_events`; giá trị lạ trả 400; `lessonId` không tồn tại trả 404. |
| Độ ưu tiên | Thấp |

---

### Chưa thuộc phạm vi

- Trang số liệu hiệu quả gia sư cho admin (lát C vẫn lưu đủ dữ liệu).
- Lưu nội dung hội thoại (transcript) và ghi âm Lượt chấm.
- Ôn tập chéo nhiều câu trong một phiên; hội thoại không giới hạn thời gian (cần session resumption, ADR 0003).
- Hộp thoại xin đồng ý lần ghi âm đầu (Kế).
