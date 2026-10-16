# Mockup v2 · P2 (Nghe chép, Shadowing, Từ vựng): tổng kết

> Ngày: 15/10/2026 · Thư mục: `design/mockups-student-v2/` · Trạng thái: **chờ chốt**, chưa bắt đầu P3.
> Tệp mới: `p2.css` (kiểu), `p2.js` (trạng thái dùng chung). Ảnh: `docs/ux/shots/p2-*.png`.

## 1. Phạm vi

| Trang | Tệp | Gồm |
|---|---|---|
| Nghe chép | `dictation.html`, `js/dictation.js` | Khung video theo câu, gõ, chấm từng từ, tổng kết bài |
| Shadowing | `shadowing.html`, `js/shadowing.js` | Nghe mẫu karaoke, ghi âm, chấm từ + âm vị, nhận xét AI (Pro) |
| Từ vựng | `vocab.html`, `js/vocab.js`, `js/decks.js` | 4 tab: Bộ từ, Tra từ, Ôn thẻ (SM-2), Trắc nghiệm |

Trang con của từ vựng (Bộ từ chi tiết, Học một nhóm, Từ đã lưu) thuộc P3 theo kế hoạch.

## 2. Đã thay đổi

| # | Thay đổi | Lý do |
|---|---|---|
| 1 | Mỗi trang dùng đúng **màu chức năng** (xanh dương / hồng / cam) cho dấu hiệu "đang ở đây": overline, tiến độ, nút phát/mic, ô nhập focus, thẻ đang chọn. Nút hành động chính vẫn là tím thương hiệu | DESIGN.v2 §3: màu chức năng nhận diện nơi đang học |
| 2 | Bỏ glow, gradient chữ, 3D, khuôn viền gradient; nút phát và mic là khối màu đặc có "cạnh dưới" như nút chính | DESIGN.v2: không glow/3D |
| 3 | Khung video thu còn cao 200px, nút nhập/mic lên gần màn hình đầu | Trước đây video chiếm ~450px, nút chính nằm dưới màn hình |
| 4 | **Nghe chép:** màn hoàn thành bài (mascot theo điểm, vòng điểm TB, câu cần làm lại, 3 việc kế tiếp); bỏ "+10 XP" | SRS không có XP; khoảnh khắc ăn mừng đúng chỗ |
| 5 | **Shadowing:** khi quyền micro bị chặn, hướng dẫn bật lại + lối "nghe mẫu trước"; khi hết 5 lượt, thẻ giải thích + gợi ý Pro, nút mic không ghi nữa | Trước đây chỉ toast rồi tự mô phỏng |
| 6 | **Từ vựng:** màn "đã ôn xong hôm nay", "chưa có thẻ", trắc nghiệm không đủ từ; kết quả trắc nghiệm có mascot và lời nhắn; bỏ "XP phiên này", thay bằng "chuỗi đúng dài nhất" | Như trên |
| 7 | Thẻ hướng dẫn 3 bước cho lần đầu (có nút "Đã hiểu", nhớ ở localStorage) ở Nghe chép và Shadowing | Người mới chưa biết phím tắt |
| 8 | Sửa icon bộ từ trống, thumbnail video lấp đầy khung, `push-pin` thiếu trong Lucide | Lỗi hiển thị |

## 3. Trạng thái (`?state=` hoặc bảng "Trạng thái xem thử")

| Trang | Giá trị |
|---|---|
| Nghe chép | `new`, `loading`, `error`, `network`, `audio` (không phát được tiếng), `notfound` (cũng khi `?lesson=` sai) |
| Shadowing | `new`, `mic` (chưa cấp quyền), `quota` (hết lượt), `loading`, `error`, `network`, `notfound` |
| Từ vựng | `new`, `done` (đã ôn xong), `loading`, `error`, `network` |

Quy tắc chung giữ như `docs/ux/STATES.md`: giữ khung trang, skeleton cùng hình với nội dung, lỗi nói rõ lỗi của ai và điều gì còn an toàn, "Thử lại" có phản hồi.

## 4. Chuyển động đã dùng (đều gắn với sự kiện)

| Chuyển động | Khi nào | Tắt khi giảm chuyển động |
|---|---|---|
| Vòng sóng quanh nút phát / mic | Đang phát, đang ghi âm | Có |
| Từ hiện lần lượt khi chấm | Sau khi kiểm tra câu | Có |
| Thẻ nảy nhẹ / lắc nhẹ | Đúng ≥ 80 / dưới 60 | Có |
| Mascot "react" | Khi hiện kết quả, hoàn thành | Có |
| Confetti | Hoàn thành bài ≥ 80 điểm, ôn xong thẻ, trắc nghiệm ≥ 4/5, shadowing ≥ 80 | Có |
| Lật thẻ | Bấm thẻ ôn | Có |

Không có chuyển động nền, không parallax, không glow.

## 5. Đã thử

| Luồng | Kết quả |
|---|---|
| Nghe chép: đúng câu 1, sai câu 2, đúng câu 3 → màn hoàn thành | ☑ điểm 100 / 17 / 100, TB 72, mascot "Correct" |
| Shadowing: nghe mẫu → mic (mô phỏng) → dừng → kết quả (ring, 3 từ lỗi, quota 3→2) | ☑ |
| Shadowing `mic`, `quota` | ☑ hiện thẻ đúng, không bắt đầu ghi |
| Từ vựng: ôn hết 8 thẻ (Dễ) → màn xong; làm hết 5 câu trắc nghiệm → kết quả; tra từ không có | ☑ |
| Từ vựng `new`, `loading`, `error` | ☑ chụp ảnh |
| Dictation `loading`, `error`, `notfound`, `audio`, `new` | ☑ không lỗi script |
| Sáng/tối, desktop 1360 | ☑ |
| 390px (Nghe chép): không tràn ngang | ☑; các trang còn lại chưa chụp ở 390 |

## 6. Chưa kiểm chứng / còn mở

- Ghi âm bằng micro thật: môi trường thử không có micro, mới thử đường mô phỏng và đường "bị từ chối".
- Shadowing `loading/error` và Từ vựng `network`, `done` chưa chụp ảnh (cùng mã với phần đã chụp).
- 390px mới kiểm Nghe chép; Shadowing và Từ vựng chưa.
- Màn hình tra từ (chi tiết từ) chưa rà lại kỹ hình ảnh sau khi bỏ gradient.
- Sao chép thẻ hướng dẫn: nội dung do tôi viết, cần người viết nội dung duyệt.
- `DESIGN.v2.md` §6 (mascot) và §8 (ngân sách chuyển động) chưa cập nhật theo bảng trên; chờ chốt P2 rồi ghi một lần.
- Trong React: `?state=` chỉ là công cụ mockup; xem `STATES.md` mục R-.

## 7. Cần bạn quyết

1. Thẻ hướng dẫn lần đầu: giữ (hiện đến khi bấm "Đã hiểu") hay bỏ?
2. Nút "Ghi chú UX" (kế thừa v1) có giữ trong v2 không? Nó chỉ phục vụ mockup, ghi chú hiện là bản v1 cũ.
3. Nút chính giữ tím, màu chức năng chỉ ở dấu hiệu: đồng ý như vậy?
4. Bỏ XP ở Nghe chép/Trắc nghiệm vì SRS không có: đồng ý?

---

## 8. Nghe chép: thiết kế lại theo tham chiếu Parroto (16/10/2026)

Quyết định D1–D21 trong `docs/ux/UX-REDESIGN-INTERVIEW.md`. Chỉ mockup, không đụng `frontend/`.

| Hạng mục | Thực hiện |
|---|---|
| Bố cục | Cột trái: video thu nhỏ + khung làm bài; cột phải: danh sách câu (cuộn, dính). Dưới 700px khung chính xếp dọc |
| Ba mức | Easy (điền ≤3 từ nội dung), Normal (ô theo độ dài từng từ), Hard (một ô gõ). Alt+1/2/3 |
| Gợi ý | Mắt trên từng ô mở từ đó, tính từ đó sai. "Hiện cả câu" = 0 điểm |
| Phản hồi | Gõ → ô từ hiện chữ đã gõ (chưa phán đúng sai); Enter mới chấm, phân loại lỗi |
| Danh sách câu | Che chữ bằng `*`, làm xong lộ câu + điểm + mức; bấm nhảy tự do; câu đã làm xem lại được, có dịch nghĩa, nghe lại, làm lại |
| Video | YouTube thật cho bài `kiki-trailer` (mốc theo bản chép lời công khai); các bài khác dùng giọng mô phỏng. Nút Ẩn video nhớ lựa chọn |
| Phím | Ctrl (nhả, không kèm phím khác) phát lại; Alt+←/→ đổi câu; Easy: Space/Backspace giữa các ô |
| Tiến độ | Lưu localStorage theo bài; mở lại tiếp tục đúng câu |
| Hoàn thành | Màn tổng kết (Loopi theo điểm) + "Thử mức khó hơn" khi TB ≥ 90 |
| Cài đặt ⚙ | Tự phát câu tiếp (mặc định tắt), hiện bản dịch |

Tệp: `dictation.html`, `dictation.css`, `js/dictation.js`, thêm `YT_LESSONS` và `sentsOf()` trong `data.js`. Trang này không còn dùng `js/video.js` (Shadowing vẫn dùng).

### Đã thử thao tác

| Luồng | Kết quả |
|---|---|
| Normal: gõ có lỗi, mở 1 từ, Enter | ☑ 80 điểm, 2 loại lỗi, từ mở tô riêng, câu nhập lại focus ô gõ |
| Alt+1, Enter sang câu 2 ở Easy; điền, Space đổi ô, Enter | ☑ |
| Alt+3, câu 3 ở Hard (không có ô từ); Hiện cả câu | ☑ 0 điểm |
| Bấm câu #1 trong danh sách để xem lại; tải lại trang | ☑ giữ 3 câu đã làm |
| Phát YouTube thật: thời gian chạy 2.0 → 9.0 rồi tự dừng đúng cuối câu | ☑ |
| Ctrl+C không kích hoạt phát lại | ☑ |
| `?state=` new, loading, error, network, audio, notfound, slug sai | ☑ không lỗi script |
| 1366×768 sáng/tối; 390px không tràn ngang | ☑ |

### Chưa kiểm chứng / lưu ý

- Mốc thời gian câu của bài Kiki lấy từ bản chép lời tự động, đã chỉnh chấm câu; sai lệch có thể ~0.5 giây. Chỉ dùng nội bộ mockup.
- Bài khác chưa có video thật nên Easy/Normal/Hard dùng giọng đọc mô phỏng của trình duyệt (chất lượng tuỳ máy).
- **Ba mức độ chưa có trong SRS**: cần báo Kế trước khi làm ở React.
- `YT.Player` cần mạng; không có mạng thì rơi về giọng mô phỏng và hiện thẻ "Không tải được video".
- Chưa kiểm tra bằng trình đọc màn hình; ô mở từ có `aria-label` và `aria-pressed`.
- Shadowing chưa áp dụng bố cục mới (D18).

---

## 9. Shadowing: thiết kế lại theo tham chiếu Parroto (16/10/2026)

Quyết định S1–S17 trong `docs/ux/UX-REDESIGN-INTERVIEW.md`. Chỉ mockup, không đụng `frontend/`.

| Hạng mục | Thực hiện |
|---|---|
| Bố cục | Dùng lại khung của Nghe chép (`.dc-*`): video (320px, nhỏ hơn Nghe chép) + khung luyện bên dưới, danh sách câu bên phải, Ẩn video, ⚙, ⌨ |
| Tab | **Xem** (video liền mạch, danh sách sáng theo lời nói, phụ đề bật trong ⚙) và **Luyện**. Chuyển Xem → Luyện bắt đầu ở câu đang phát. Alt+W / Alt+P |
| Câu cần đọc | Từ + IPA dưới từng từ (tắt trong ⚙); karaoke khi phát mẫu |
| Một hàng điều khiển | ← ↻ ▶ → · 0.5×/0.75×/1× · Giọng tôi · So sánh · mic. Mic 4 trạng thái: chờ / đang ghi (sóng, tự dừng sau 2× độ dài câu) / đang chấm / xong |
| Kết quả | Gọn ngay dưới câu: điểm, từ tô màu, chip lỗi, Loopi. Bấm từ → popover (âm vị, mẹo, nghe mẫu từ, giọng tôi, Lưu từ, video khẩu hình Pro). "Xem chi tiết" mở ngăn bên (4 chỉ số, từ cần sửa, nhận xét AI Pro) |
| Danh sách câu | Che chữ bằng `*`, đọc xong lộ câu + bản dịch + điểm cao nhất + số lần; ✓ khi ≥ 80; bấm nhảy tự do |
| Lượt chấm | Chip cạnh thanh điều khiển ("Còn 3/5"). Hết lượt: thẻ giải thích, vẫn ghi âm được, có "Câu tiếp" và "Mở với Pro" |
| So sánh | Phát mẫu rồi phát giọng bạn (cần bản ghi thật) |
| Hoàn thành | Tổng kết: điểm TB, âm cần luyện nhiều nhất → trang Điểm yếu, "Luyện Nghe chép bài này" |
| Lưu | Tiến độ từng bài lưu localStorage (`ll2-sh-<slug>`) |

Tệp: `shadowing.html`, `shadowing.css`, `js/shadowing.js` (viết lại). Bản cũ không còn dùng `js/video.js`.

### Điểm mô phỏng

Hàm `simulate()` sinh điểm cố định theo nội dung câu (băm văn bản), tăng nhẹ theo số lần đọc. Từ có "th" và từ kết thúc bằng "v" bị trừ điểm để luôn có lỗi mẫu cho /θ/, /ð/, /v/. Giao diện ghi rõ "Điểm mô phỏng". Bản thật: Azure Pronunciation Assessment ở backend.

### Đã thử thao tác

| Luồng | Kết quả |
|---|---|
| Ghi âm (mô phỏng) → dừng → chấm; lượt 3 → 2 | ☑ |
| Bấm từ tô màu → popover với mẹo /θ/ đúng | ☑ |
| Xem chi tiết (ngăn bên 5 vòng điểm) | ☑ |
| Đọc lại → "Cao nhất", "Đã đọc 2 lần" cập nhật | ☑ |
| Tab Xem phát video thật, danh sách tự nhảy câu; "Luyện câu này" | ☑ |
| Đọc đủ 5 câu (Pro) → màn hoàn thành | ☑ điểm TB, âm cần luyện |
| Free: hết lượt ở câu thứ 4 → thẻ hết lượt + "Câu tiếp" | ☑ |
| `?state=` mic, quota, new, loading, error, notfound, audio | ☑ |
| 1366×768 nút mic ở y≈570 (trên màn hình đầu); 390px không tràn ngang | ☑ |

### Chưa kiểm chứng / lưu ý

- **Ghi âm bằng micro thật** chưa thử (môi trường không có micro). "Giọng tôi" và "So sánh" cần bản ghi thật nên bị khoá khi mô phỏng.
- Dark mode chưa chụp riêng cho trang này (dùng cùng token với Nghe chép).
- IPA chỉ có cho từ trong bài mẫu; từ ngoài từ điển để trống.
- **Hai tab Xem/Luyện chưa có trong SRS**: báo Kế cùng ba mức của Nghe chép.
- Shadowing và Nghe chép đang trùng nhiều mã (danh sách câu, phát video); nên tách thành thành phần dùng chung khi chuyển sang React.
