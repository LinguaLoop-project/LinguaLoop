# Đặc tả Use Case — Module VOCAB (Từ đã lưu, Bộ từ, Học từ mới, Ôn thẻ)

Trạng thái: **Nháp**, chờ duyệt. Người phụ trách: Lâm (phần học viên). Màn giáo viên soạn bộ từ thuộc Kế, chưa đặc tả ở đây.

Phạm vi đợt này: học viên lưu và bỏ lưu từ, xem danh sách từ đã lưu, xem bộ từ hệ thống, học từ mới theo phần với năm cách học, ôn thẻ đến hạn theo SM-2. Chưa làm: "Bộ của tôi" (học viên tự tạo bộ), thêm từ tự gõ (nguồn `manual`), tab Trắc nghiệm tổng, ôn thẻ chưa đến hạn, chấm phát âm trong cách học "Lặp lại".

Thuật ngữ theo [GLOSSARY.md](../../../GLOSSARY.md): Thẻ, Bộ từ, Phần, Từ đã lưu, Trạng thái thẻ, Học từ mới, Ôn thẻ. Quyết định thiết kế: [ADR 0008](../../adr/0008-tu-da-luu-la-the-trong-bo-rieng.md), [ADR 0009](../../adr/0009-noi-dung-the-chep-tu-tu-dien-luc-tao.md).

---

### UC-VOCAB-01: Lưu và bỏ lưu từ

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Cho phép tác nhân lưu một nghĩa của một mục từ khi tra từ điển hoặc khi bấm vào một từ trong câu của bài học, để từ đó được ôn theo lịch. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập. Hộp tra từ đang hiện một mục từ. |
| Điều kiện sau | Nghĩa được lưu thành một thẻ Mới trong bộ "Từ đã lưu" của tác nhân, hoặc thẻ đó bị ẩn khi bỏ lưu. |
| Luồng chính | 1. Tác nhân mở hộp tra từ (từ ô tra từ điển, hoặc bấm vào một từ trong câu ở bài nghe chép hay shadowing).<br>2. Hệ thống hiện mục từ; nếu từ được bấm là dạng chia thì hiện mục từ gốc (BR-VOCAB-01). Mỗi nghĩa có nút "Lưu" hoặc "Đã lưu".<br>3. Tác nhân chọn "Lưu" ở một nghĩa.<br>4. Hệ thống tạo thẻ cho nghĩa đó theo BR-VOCAB-02, ghi nguồn (`dictionary` hoặc `lesson` kèm câu đang học) và đổi nút thành "Đã lưu". |
| Luồng thay thế | **3a. Bỏ lưu (Xuất phát từ Bước 3)**<br>1. Nghĩa đang ở trạng thái "Đã lưu"; tác nhân chọn "Đã lưu".<br>2. Hệ thống bỏ lưu theo BR-VOCAB-03 và đổi nút về "Lưu".<br>3. Kết thúc Use Case.<br><br>**4a. Lưu lại nghĩa đã từng bỏ lưu (Xuất phát từ Bước 4)**<br>1. Hệ thống phát hiện nghĩa này từng được lưu.<br>2. Hệ thống khôi phục thẻ cũ cùng trạng thái và lịch ôn cũ (BR-VOCAB-03).<br>3. Kết thúc Use Case. |
| Luồng ngoại lệ | **4b. Mất kết nối (Xuất phát từ Bước 4)**<br>1. Hệ thống không lưu được.<br>2. Hệ thống thông báo mất mạng, nút giữ nguyên trạng thái trước khi bấm.<br>3. Kết thúc Use Case. |
| Tiêu chí chấp nhận | **AC-VOCAB-01 — Lưu một nghĩa**<br>Given: Tác nhân chưa lưu "present".<br>When: Tác nhân tra "present" và chọn "Lưu" ở nghĩa "có mặt, hiện diện".<br>Then: Nút đổi thành "Đã lưu"; tab "Từ đã lưu" có đúng một dòng "present" với nghĩa đó, nguồn Từ điển, trạng thái Mới, đến hạn ngay.<br><br>**AC-VOCAB-02 — Lưu hai lần không tạo trùng**<br>Given: Nghĩa "có mặt" của "present" đã được lưu.<br>When: Hai yêu cầu lưu cùng nghĩa đó được gửi liên tiếp.<br>Then: Vẫn chỉ có một thẻ, không có lỗi nào hiện ra.<br><br>**AC-VOCAB-03 — Lưu nhiều nghĩa của một từ**<br>Given: Nghĩa "có mặt" của "present" đã được lưu.<br>When: Tác nhân lưu thêm nghĩa "quà biếu".<br>Then: Có hai thẻ "present", mỗi thẻ một nghĩa.<br><br>**AC-VOCAB-04 — Dạng chia lưu từ gốc**<br>Given: Câu trong bài có từ "went".<br>When: Tác nhân bấm vào "went" rồi lưu nghĩa đầu tiên.<br>Then: Thẻ được tạo cho "go", nguồn Bài học, mặt sau có câu gốc chứa "went" và liên kết về bài đó.<br><br>**AC-VOCAB-05 — Bỏ lưu rồi lưu lại giữ tiến độ**<br>Given: Thẻ "present" (có mặt) đang ở trạng thái Đang ôn, hẹn ôn sau 6 ngày.<br>When: Tác nhân bỏ lưu rồi lưu lại đúng nghĩa đó.<br>Then: Sau khi bỏ lưu, thẻ không còn trong tab Từ đã lưu và không vào hàng đợi ôn; sau khi lưu lại, thẻ trở lại với trạng thái Đang ôn và lịch hẹn cũ.<br><br>**AC-VOCAB-06 — Riêng tư**<br>Given: Học viên 1 đã lưu "present".<br>When: Học viên 2 tra "present".<br>Then: Học viên 2 thấy nút "Lưu" (chưa lưu); yêu cầu bỏ lưu thẻ của học viên 1 trả 404. |
| Độ ưu tiên | Cao |

---

### UC-VOCAB-02: Xem danh sách từ đã lưu

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Cho phép tác nhân xem, tìm, lọc và bỏ lưu các từ đã lưu ở tab "Từ đã lưu" của trang "Từ & câu đã lưu". |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập. |
| Điều kiện sau | Không đổi dữ liệu, trừ khi tác nhân bỏ lưu. |
| Luồng chính | 1. Tác nhân mở trang "Từ & câu đã lưu". Tab "Từ đã lưu" là tab mặc định; thứ tự tab: Từ đã lưu, Câu cần ôn, Ghi chú.<br>2. Hệ thống hiện bốn số tổng (Đã lưu, Đến hạn hôm nay, Đang học, Đã thuộc) và danh sách từ, mới lưu trước. Mỗi dòng gồm từ, mức CEFR, phiên âm, nghĩa, nguồn (Từ điển, hoặc tên bài học kèm liên kết), Trạng thái thẻ và lần ôn tới.<br>3. Tác nhân gõ vào ô tìm, chọn bộ lọc nguồn (Mọi nguồn, Từ điển, Bài học) và bộ lọc trạng thái (Tất cả, Đến hạn, Đang học, Đã thuộc).<br>4. Hệ thống lọc danh sách theo cả ba điều kiện.<br>5. Tác nhân chọn "Ôn ngay".<br>6. Hệ thống mở Ôn thẻ (UC-VOCAB-06). |
| Luồng thay thế | **3a. Bỏ lưu nhiều từ (Xuất phát từ Bước 3)**<br>1. Tác nhân chọn nhiều dòng rồi chọn "Bỏ lưu".<br>2. Hệ thống bỏ lưu từng từ theo BR-VOCAB-03 và cập nhật danh sách cùng các số tổng.<br>3. Kết thúc Use Case.<br><br>**2a. Chưa lưu từ nào (Xuất phát từ Bước 2)**<br>1. Hệ thống hiện trạng thái trống kèm hướng dẫn tra từ hoặc bấm vào từ trong bài để lưu.<br>2. Kết thúc Use Case. |
| Luồng ngoại lệ | **2b. Không tải được (Xuất phát từ Bước 2)**<br>1. Hệ thống thông báo lỗi kèm nút "Thử lại".<br>2. Kết thúc Use Case. |
| Tiêu chí chấp nhận | **AC-VOCAB-07 — Tab mặc định**<br>Given: Tác nhân có từ đã lưu và câu cần ôn.<br>When: Tác nhân mở `/student/mywords` không kèm `?tab=`.<br>Then: Tab "Từ đã lưu" đang mở; `?tab=review` mở Câu cần ôn, `?tab=notes` mở Ghi chú.<br><br>**AC-VOCAB-08 — Lọc kết hợp**<br>Given: Tác nhân lưu "latte" từ bài học (Mới) và "borrow" từ từ điển (Đã thuộc).<br>When: Tác nhân chọn nguồn "Bài học" và trạng thái "Đã thuộc".<br>Then: Danh sách trống và hiện thông báo không có từ nào khớp; bỏ lọc trạng thái thì thấy "latte".<br><br>**AC-VOCAB-09 — Số tổng**<br>Given: Tác nhân có 3 từ đã lưu: một Mới, một Đang ôn đến hạn hôm qua, một Đã thuộc chưa đến hạn.<br>When: Tác nhân mở tab.<br>Then: Đã lưu 3, Đến hạn hôm nay 2 (thẻ Mới tính là đến hạn), Đang học 2, Đã thuộc 1. |
| Độ ưu tiên | Cao |

---

### UC-VOCAB-03: Xem danh sách bộ từ

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Cho phép tác nhân xem các bộ đang học và khám phá các bộ hệ thống ở tab "Bộ từ" của trang Từ vựng. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập. Đã nạp seed bộ từ vựng (BR-VOCAB-04). |
| Điều kiện sau | Không đổi dữ liệu. |
| Luồng chính | 1. Tác nhân mở trang Từ vựng.<br>2. Hệ thống hiện bốn số tổng trên mọi thẻ của tác nhân, kể cả từ đã lưu: Đến hạn hôm nay (kèm nút ôn), Đang học, Đang ôn, Đã thuộc.<br>3. Hệ thống hiện mục "Đang học" gồm các bộ tác nhân đã học ít nhất một thẻ, mỗi bộ có thanh tỉ lệ theo Trạng thái thẻ.<br>4. Hệ thống hiện mục "Khám phá bộ từ": mọi bộ hệ thống, gom theo danh mục (Oxford, TOEIC, IELTS ...), mỗi bộ có tên, mức CEFR, nhãn Pro nếu có, số thẻ và số phần.<br>5. Tác nhân chọn một bộ.<br>6. Hệ thống mở chi tiết bộ (UC-VOCAB-04). |
| Luồng thay thế | **3a. Chưa học bộ nào (Xuất phát từ Bước 3)**<br>1. Hệ thống thay mục "Đang học" bằng lời mời chọn bộ đầu tiên, gợi ý các bộ miễn phí.<br>2. Chuyển đến Bước 4. |
| Luồng ngoại lệ | **2a. Không tải được (Xuất phát từ Bước 2)**<br>1. Hệ thống thông báo lỗi kèm nút "Thử lại".<br>2. Kết thúc Use Case. |
| Tiêu chí chấp nhận | **AC-VOCAB-10 — Bộ "Từ đã lưu" không hiện trong danh sách**<br>Given: Tác nhân có từ đã lưu.<br>When: Tác nhân mở tab Bộ từ.<br>Then: Không có bộ "Từ đã lưu" ở mục nào; số Đến hạn hôm nay vẫn tính cả thẻ từ đã lưu.<br><br>**AC-VOCAB-11 — Mục Đang học**<br>Given: Tác nhân đã học 20 thẻ của bộ "3000 Oxford Vocabulary A1" và chưa học bộ nào khác.<br>When: Tác nhân mở tab Bộ từ.<br>Then: Mục "Đang học" chỉ có bộ Oxford A1, thanh tỉ lệ cho thấy 20 thẻ đã học trên tổng số thẻ của bộ. |
| Độ ưu tiên | Cao |

---

### UC-VOCAB-04: Xem chi tiết bộ từ

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Cho phép tác nhân xem các phần của một bộ, tiến độ của mình ở từng phần, và bắt đầu học hoặc ôn bộ đó. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập. |
| Điều kiện sau | Không đổi dữ liệu. |
| Luồng chính | 1. Tác nhân mở một bộ.<br>2. Hệ thống hiện tên bộ, mức CEFR, nhãn Pro nếu có, số thẻ, số phần, thanh tỉ lệ và số thẻ theo từng Trạng thái thẻ.<br>3. Hệ thống hiện danh sách phần theo thứ tự; mỗi phần có tên, số thẻ, thanh tiến độ (số thẻ không còn Mới trên số thẻ của phần) và nút: "Học" (phần đầu tiên còn thẻ Mới), "Ôn lại" (phần không còn thẻ Mới), "Xem" (các phần khác), hoặc khoá (BR-VOCAB-05).<br>4. Tác nhân chọn "Học từ mới" (mở phần đầu tiên còn thẻ Mới) hoặc nút ở một phần.<br>5. Hệ thống mở phần đó (UC-VOCAB-05). |
| Luồng thay thế | **4a. Ôn bộ này (Xuất phát từ Bước 4)**<br>1. Tác nhân chọn "Ôn bộ này" (chỉ hiện khi bộ có thẻ đến hạn).<br>2. Hệ thống mở Ôn thẻ chỉ với thẻ đến hạn của bộ (UC-VOCAB-06). |
| Luồng ngoại lệ | **1a. Bộ không tồn tại (Xuất phát từ Bước 1)**<br>1. Hệ thống báo không tìm thấy bộ, kèm nút về danh sách bộ.<br>2. Kết thúc Use Case. Bộ "Từ đã lưu" và bộ riêng của học viên khác cũng được coi là không tồn tại.<br><br>**4b. Phần bị khoá (Xuất phát từ Bước 4)**<br>1. Tác nhân dùng gói Free và chọn một phần bị khoá của bộ Pro.<br>2. Hệ thống mời nâng cấp lên Pro và không mở phần.<br>3. Kết thúc Use Case. |
| Tiêu chí chấp nhận | **AC-VOCAB-12 — Khoá phần của bộ Pro**<br>Given: Tác nhân dùng gói Free, bộ "IELTS Band 4-5" được đánh dấu Pro.<br>When: Tác nhân mở bộ đó.<br>Then: Phần 1 và Phần 2 mở được; từ Phần 3 trở đi hiện khoá kèm nút Pro; yêu cầu lấy thẻ của Phần 3 bị server từ chối với mã cần Pro.<br><br>**AC-VOCAB-13 — Gói Pro**<br>Given: Tác nhân dùng gói Pro, bộ "IELTS Band 4-5" được đánh dấu Pro.<br>When: Tác nhân mở bộ đó.<br>Then: Mọi phần đều mở được.<br><br>**AC-VOCAB-14 — Học từ mới đi đến phần đầu còn thẻ Mới**<br>Given: Phần 1 không còn thẻ Mới, Phần 2 còn 5 thẻ Mới.<br>When: Tác nhân chọn "Học từ mới".<br>Then: Hệ thống mở Phần 2. |
| Độ ưu tiên | Cao |

---

### UC-VOCAB-05: Học từ mới một phần

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Cho phép tác nhân học các thẻ của một phần theo một trong năm cách học: Đoán, Flashcard, Trắc nghiệm, Trắc nghiệm đảo, Lặp lại. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập. Phần không bị khoá với tác nhân (BR-VOCAB-05). |
| Điều kiện sau | Mỗi câu trả lời được ghi nhật ký; thẻ Mới được trả lời chuyển sang Đang học (BR-VOCAB-08). |
| Luồng chính | 1. Tác nhân mở một phần.<br>2. Hệ thống mở phiên học mới (BR-VOCAB-11) và hiện các thẻ của phần theo cách học tác nhân dùng lần trước (mặc định Đoán), kèm danh sách các phần bên cạnh.<br>3. Tác nhân trả lời từng thẻ theo cách học đang chọn:<br>— Đoán: xem loại từ, nghĩa tiếng Việt, câu ví dụ có từ cần đoán bị che, bản dịch ví dụ và số chữ cái của từ; gõ từ tiếng Anh rồi chọn "Kiểm tra" (Enter), hoặc chọn "Không biết"; có thể xin "Gợi ý" (BR-VOCAB-14).<br>— Trắc nghiệm: xem từ, chọn nghĩa đúng trong 4 nghĩa.<br>— Trắc nghiệm đảo: xem nghĩa, chọn từ đúng trong 4 từ.<br>— Flashcard: lật thẻ, tự chấm Quên, Khó, Được hoặc Dễ.<br>— Lặp lại: nghe âm thanh, tự nói theo, bấm sang thẻ tiếp (BR-VOCAB-10).<br>4. Sau mỗi câu trả lời, hệ thống hiện đúng hoặc sai kèm ví dụ, ghi nhật ký và cập nhật thẻ theo BR-VOCAB-08.<br>5. Hết thẻ, hệ thống hiện màn hoàn thành với kết quả, nút "Học lại từ đầu", "Xem từ vựng" và "Phần tiếp theo" (hoặc "Về bộ từ" nếu là phần cuối). |
| Luồng thay thế | **3a. Đổi cách học (Xuất phát từ Bước 3)**<br>1. Tác nhân chọn cách học khác.<br>2. Hệ thống bắt đầu lại phần với cách học mới; câu trả lời đã gửi vẫn giữ.<br>3. Chuyển đến Bước 3.<br><br>**3b. Flashcard chọn Quên (Xuất phát từ Bước 3)**<br>1. Hệ thống đưa thẻ xuống cuối và hiện lại trong lượt này.<br>2. Chuyển đến Bước 3. |
| Luồng ngoại lệ | **4a. Mất kết nối khi gửi câu trả lời (Xuất phát từ Bước 4)**<br>1. Hệ thống vẫn hiện đúng hoặc sai, giữ câu trả lời chưa gửi được và gửi lại khi có mạng; mỗi câu trả lời chỉ được ghi một lần.<br>2. Chuyển đến Bước 5. |
| Tiêu chí chấp nhận | **AC-VOCAB-15 — Thẻ Mới sang Đang học sau câu trả lời đầu**<br>Given: Phần 1 có 20 thẻ Mới.<br>When: Tác nhân trả lời 3 thẻ đầu ở cách học Trắc nghiệm (2 đúng, 1 sai) rồi thoát.<br>Then: Ba thẻ đó ở trạng thái Đang học, hẹn ôn sau 1 ngày (kể cả thẻ trả lời sai); 17 thẻ còn lại vẫn Mới; có 3 dòng nhật ký với `mode = quiz`.<br><br>**AC-VOCAB-16 — Trắc nghiệm không đổi lịch của thẻ đã học**<br>Given: Thẻ A đang Đang ôn, hẹn ôn sau 6 ngày.<br>When: Tác nhân trả lời sai thẻ A ở cách học Trắc nghiệm.<br>Then: Lịch ôn của thẻ A giữ nguyên; nhật ký có thêm một dòng sai.<br><br>**AC-VOCAB-17 — Flashcard cập nhật SM-2**<br>Given: Thẻ A đang Mới.<br>When: Tác nhân lật thẻ A ở cách học Flashcard và chọn "Được".<br>Then: Thẻ A được cập nhật theo BR-VOCAB-07 (repetitions 1, khoảng ôn 1 ngày, trạng thái Đang học).<br><br>**AC-VOCAB-25 — Đoán từ**<br>Given: Thẻ "present" (danh từ, "quà biếu, đồ tặng"), ví dụ "I bought him a present." / "Tôi mua cho anh ấy một món quà.".<br>When: Tác nhân mở thẻ ở cách học Đoán.<br>Then: Hệ thống hiện "danh từ", nghĩa tiếng Việt, ví dụ "I bought him a \*\*\*\*\*\*\*." kèm bản dịch, và ô báo 7 chữ cái; chữ "present" không xuất hiện ở đâu trên màn hình.<br><br>**AC-VOCAB-26 — Kiểm tra, Gợi ý, Không biết**<br>Given: Tác nhân đang đoán thẻ "present".<br>When: (a) Tác nhân gõ " Present " rồi nhấn Enter; (b) tác nhân gõ "presant" rồi kiểm tra; (c) tác nhân chọn "Gợi ý" hai lần rồi gõ đúng; (d) tác nhân chọn "Không biết"; (e) tác nhân nhấn Enter khi ô trống.<br>Then: (a) đúng; (b) sai, hiện đáp án; (c) ô báo hiện "pr\*\*\*\*\*" và câu trả lời được tính đúng; (d) sai, hiện đáp án; (e) hệ thống nhắc gõ từ trước và không ghi nhật ký. Sau (a) đến (d), từ được phát âm, ví dụ hiện đầy đủ và có nút "Tiếp".<br><br>**AC-VOCAB-18 — Lặp lại không gửi giọng nói**<br>Given: Tác nhân chọn cách học Lặp lại.<br>When: Tác nhân đi hết các thẻ.<br>Then: Không có yêu cầu nào tới dịch vụ chấm phát âm; thẻ Mới đã qua chuyển sang Đang học. |
| Độ ưu tiên | Cao |

---

### UC-VOCAB-06: Ôn thẻ đến hạn

| Mục | Nội dung |
|---|---|
| Tác nhân | Học viên |
| Mô tả | Cho phép tác nhân ôn các thẻ đến hạn bằng flashcard, tự chấm mức nhớ để hệ thống lên lịch lần ôn sau theo SM-2. |
| Điều kiện tiên quyết | Tác nhân đã đăng nhập. |
| Điều kiện sau | Lịch ôn và Trạng thái thẻ của các thẻ đã chấm được cập nhật; mỗi lần chấm được ghi nhật ký. |
| Luồng chính | 1. Tác nhân mở tab Ôn thẻ (hoặc "Ôn ngay", "Ôn bộ này").<br>2. Hệ thống mở phiên ôn mới và lấy tối đa 50 thẻ đến hạn theo BR-VOCAB-09.<br>3. Hệ thống hiện mặt trước thẻ: từ, phiên âm, nút nghe.<br>4. Tác nhân lật thẻ (bấm hoặc phím Space).<br>5. Hệ thống hiện mặt sau: loại từ, nghĩa, ví dụ (và câu gốc nếu thẻ lưu từ bài học), cùng bốn nút Quên, Khó, Được, Dễ, mỗi nút ghi khoảng ôn sẽ đặt.<br>6. Tác nhân chọn một nút (hoặc phím 1–4).<br>7. Hệ thống cập nhật thẻ theo BR-VOCAB-07, ghi nhật ký và chuyển sang thẻ tiếp.<br>8. Hết lượt, hệ thống hiện số thẻ nhớ ngay lần đầu, số thẻ phải ôn lại trong lượt, và nút "Ôn tiếp" nếu còn thẻ đến hạn. |
| Luồng thay thế | **6a. Chọn Quên (Xuất phát từ Bước 6)**<br>1. Hệ thống cập nhật thẻ, đưa thẻ xuống cuối lượt và hiện lại trong lượt này.<br>2. Chuyển đến Bước 3 với thẻ tiếp theo.<br><br>**2a. Không có thẻ đến hạn (Xuất phát từ Bước 2)**<br>1. Hệ thống báo đã ôn xong, cho biết lần đến hạn kế tiếp, gợi ý học từ mới hoặc làm một bài nghe chép.<br>2. Kết thúc Use Case. |
| Luồng ngoại lệ | **7a. Mất kết nối khi chấm (Xuất phát từ Bước 7)**<br>1. Hệ thống giữ lần chấm chưa gửi được và gửi lại khi có mạng; mỗi lần chấm chỉ được ghi một lần.<br>2. Chuyển đến Bước 3. |
| Tiêu chí chấp nhận | **AC-VOCAB-19 — Hàng đợi chung**<br>Given: Tác nhân có 2 thẻ đến hạn ở Oxford A1, 1 từ đã lưu đến hạn, và 1 thẻ hẹn ngày mai.<br>When: Tác nhân mở Ôn thẻ.<br>Then: Lượt ôn có đúng 3 thẻ, thẻ đến hạn sớm nhất đứng trước.<br><br>**AC-VOCAB-20 — Ôn theo bộ**<br>Given: Như AC-VOCAB-19.<br>When: Tác nhân chọn "Ôn bộ này" ở Oxford A1.<br>Then: Lượt ôn chỉ có 2 thẻ của Oxford A1.<br><br>**AC-VOCAB-21 — Tối đa 50 thẻ một lượt**<br>Given: Tác nhân có 70 thẻ đến hạn.<br>When: Tác nhân ôn hết lượt đầu.<br>Then: Lượt đầu có 50 thẻ; màn kết thúc có nút "Ôn tiếp", chọn thì lượt sau có 20 thẻ.<br><br>**AC-VOCAB-22 — Quên hiện lại trong lượt**<br>Given: Lượt ôn có thẻ A và B.<br>When: Tác nhân chọn Quên ở A, Được ở B.<br>Then: Thẻ A hiện lại sau B; A ở trạng thái Đang học, hẹn ôn sau 10 phút.<br><br>**AC-VOCAB-23 — Thẻ Đã thuộc vẫn được ôn khi đến hạn**<br>Given: Thẻ A Đã thuộc, khoảng ôn 25 ngày, đến hạn hôm nay.<br>When: Tác nhân mở Ôn thẻ.<br>Then: Thẻ A có trong lượt ôn. |
| Độ ưu tiên | Cao |

---

### UC-VOCAB-07: Số thẻ đến hạn cho trang Hôm nay (nội bộ)

| Mục | Nội dung |
|---|---|
| Tác nhân | Module plan/weakness (gọi nội bộ qua `SrsQueryService`) |
| Mô tả | Cung cấp số thẻ đến hạn của một học viên để trang Hôm nay hiện việc ôn thẻ. |
| Điều kiện tiên quyết | Có mã người dùng. |
| Điều kiện sau | Không đổi dữ liệu. |
| Luồng chính | 1. Module gọi `SrsQueryService.countDue(userId)`.<br>2. Hệ thống trả số thẻ đến hạn theo đúng điều kiện của BR-VOCAB-09, không giới hạn 50. |
| Tiêu chí chấp nhận | **AC-VOCAB-24 — Khớp với hàng đợi ôn**<br>Given: Tác nhân có 70 thẻ đến hạn, gồm cả thẻ của từ đã lưu.<br>When: Module gọi `countDue`.<br>Then: Kết quả là 70; thẻ của từ đã bỏ lưu không được tính. |
| Độ ưu tiên | Trung bình |
