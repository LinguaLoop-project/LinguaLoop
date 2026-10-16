# Phỏng vấn cải thiện UI/UX — Bản ghi quyết định

> Trạng thái: **đang phỏng vấn**. Giai đoạn này chỉ phân tích và ghi tài liệu, **chưa sửa code, chưa đổi giao diện** cho tới khi kế hoạch được xác nhận.

## Hiện trạng đã xác minh từ code (không cần hỏi lại)

- Có 3 vai trò: học viên, giáo viên, admin. Trang thật mới gồm auth (7 trang), thư viện bài học, chủ đề, chi tiết bài, Settings và 3 layout. Phần còn lại là `PlaceholderPage`; trang `/` chỉ là `<div>Home</div>`.
- `design/DESIGN.md` ("Cosmic Violet") và mockup HTML trong `design/mockups-*` là nguồn thiết kế hiện hành.
- Lệch giữa code và DESIGN.md:
  - Icon: DESIGN.md quy định Phosphor, code dùng thêm `lucide-react` (5 file) song song với sprite.
  - Motion/Lottie/confetti: DESIGN.md yêu cầu, chưa cài thư viện nào.
  - Sidebar: DESIGN.md quy định thu thành icon ở 768–1279px, `StudentLayout` giữ 248px từ `md`.
  - Hai hệ style song song: ~1.200 dòng CSS tự viết (`.btn`/`.ll-btn`, `.card`/`.ll-card` nhân đôi) cùng Tailwind; ~181 giá trị `[NNpx]` và 10 mã hex hardcode trong `.tsx`.
- Tài sản hình ảnh: logo và mascot Loopi (6 trạng thái, SVG/PNG) đã có. **Chưa có** bộ vật thể 3D thủy tinh, ảnh minh họa từ vựng, Lottie.

## Quyết định đã chốt

| # | Câu hỏi | Quyết định |
|---|---|---|
| Q1 | Động cơ cải thiện | Chính **DESIGN.md và mockup có vấn đề** (không chỉ là code lệch chuẩn). |
| Q2 | Phạm vi | **Toàn bộ frontend**, kể cả các placeholder sẽ làm sau: chuẩn hoá hệ thống trước cho cả nhóm. |
| Q3 | Vị thế của DESIGN.md | **Xem lại phong cách tổng thể.** DESIGN.md phải được sửa trước khi sửa code. |
| Q4 | Phong cách hiện tại sai ở đâu | (a) Quá nhiều hiệu ứng (3D trôi nổi, parallax, glow thở, spotlight) gây phân tâm; (d) đòi quá nhiều tài sản nhóm không có (3D, Lottie, ảnh từng thẻ từ). |
| Q5 | Giữ làm bản sắc | **Logo, mascot Loopi (6 trạng thái) và màu tím violet làm màu chủ đạo.** Font và dark-mặc-định chưa được xác nhận. |
| Q6 | Hướng thẩm mỹ | **Vui, nhiều màu, game hoá** (mascot lớn, màu tươi, thành tích nổi bật; kiểu Duolingo). |
| Q7 | 3 vai trò | **Chung token và component**; giáo viên/admin gọn và đặc hơn (ít hiệu ứng, bảng dày). |
| Q8 | Thiết bị ưu tiên | **Máy tính.** Mức hỗ trợ mobile chưa chốt. |
| Q9 | Mốc thời gian | Người dùng yêu cầu đề xuất thời điểm hợp lý (xem Q14). |
| Q10 | Bảng màu | **Tím chủ đạo + bảng màu phụ gắn với chức năng** (ví dụ nghe chép = xanh dương, shadowing = hồng, từ vựng = cam). Giá trị cụ thể chưa chốt. |
| Q11 | Sáng/tối | **Theo cài đặt hệ thống**, hai chế độ thiết kế ngang hàng. Hệ quả: mọi component phải kiểm tra cả hai chế độ. |
| Q12 | Phạm vi game hoá | **Chỉ trình bày lại cái SRS đã có** (streak, tiến độ, đúng/sai, hoàn thành bài). XP, huy hiệu, mục tiêu ngày ghi vào danh sách "làm sau", không làm trong đợt này. |
| Q13 | Mobile | **Máy tính là chính; mobile dùng được, không vỡ layout**, không tối ưu riêng. |
| Q14 | Mốc thời gian | **Tuần 5: chỉ tài liệu** (DESIGN.md mới, danh mục component). **Đầu tuần 6: đợt 3–4 ngày** đổi token/component và áp cho trang đã có. **Từ giữa tuần 6: trang mới bắt buộc dùng bộ mới.** Kế phải được báo trước để không làm chồng. |
| Q15 | Luồng làm mẫu trước | **Khung chung (3 layout) + Thư viện bài → chủ đề → chi tiết bài + trang Hôm nay.** Nghe chép thiết kế theo bộ mới khi làm, không làm lại. |
| Q16 | Hiệu ứng | **Bỏ:** vật thể 3D trôi nổi, parallax, glow nền thở, spotlight, Lottie. **Giữ:** hover/nhấn nhẹ, đổi tab, phản hồi đúng/sai, tiến độ, mascot SVG (6 trạng thái), streak. **Confetti** bằng CSS/canvas nhẹ cho khoảnh khắc hoàn thành bài. |
| Q17 | Ràng buộc bảo toàn | Cả 6: (1) i18n vi/en; (2) tương phản ≥ 4.5:1 cả hai chế độ, giữ focus ring; (3) hành vi auth (không lộ tài khoản, giới hạn 5 lần thử); (4) hợp đồng API/store hiện có, không đòi sửa backend; (5) phím tắt nghe chép; (6) phân quyền theo vai trò và route hiện có. |
| Q18 | Nền tảng kỹ thuật | **Hợp nhất về Tailwind + token**, xoá dần CSS tự viết trùng nghĩa. **Icon: Lucide** (thay Phosphor sprite). **Motion: chỉ CSS**, không thêm Motion/Lottie. |
| Q19 | Tiêu chí thành công | (1) Không còn hex hardcode trong `.tsx`, không còn class trùng nghĩa (`.btn`/`.ll-btn`); (2) các trang ở Q15 có ảnh chụp Playwright cả sáng/tối ở 1440px; (3) Lighthouse Accessibility ≥ 90 trên các trang đó; (5) trang mới của Kế dùng component chung, không tự viết lại nút/thẻ/input. *Tiêu chí điểm hài lòng người dùng (tuần 12) được bỏ khỏi cam kết.* |
| Q20 | Người duyệt | **Kế phải đồng ý** DESIGN.md mới trước khi code. GVHD chỉ cần biết qua báo cáo tiến độ. |

## Danh sách "làm sau" (không thuộc đợt này)

- XP, huy hiệu, mục tiêu ngày, bảng xếp hạng: cần sửa SRS, backend và database.
- Lottie và vật thể 3D thủy tinh: bỏ khỏi đợt này, có thể xét lại sau.
- Đo mức hài lòng người dùng ở tuần 12: không cam kết.

## Cần cập nhật khi chuyển sang tài liệu thiết kế mới

- `design/DESIGN.md`: sửa §1 (tinh thần), §2 (thêm màu chức năng), §6 (bỏ 3D/Lottie, đổi Phosphor → Lucide), §8 (motion), §9 (sáng/tối ngang hàng), §11 (responsive, mobile chỉ cần không vỡ). Mục §13 vẫn dùng làm quy trình.
- Mockup trong `design/mockups-*` dùng sprite Phosphor và hiệu ứng cũ: cần quyết định cập nhật hay đánh dấu "lỗi thời".
- Code: `SvgSprites` và các tên icon trong `PlaceholderPage` đang theo Phosphor, sẽ phải chuyển sang Lucide.

## Căng thẳng giữa các quyết định (cần giải quyết)

- Q4(a)(d) muốn bớt hiệu ứng và bớt tài sản, nhưng Q6 muốn game hoá kiểu Duolingo, vốn sống nhờ ăn mừng, mascot động, màu tươi.
- ~~Tím chủ đạo và "nhiều màu"~~: đã giải quyết ở Q10 bằng màu phụ gắn chức năng. Còn phải chốt quan hệ với màu trạng thái (đúng/sai) và badge CEFR để không trùng nghĩa.
- ~~Sáng/tối mặc định~~: đã giải quyết ở Q11.
- ~~Game hoá thành luật nghiệp vụ mới~~: đã giải quyết ở Q12 (chỉ trình bày lại).
- Còn lại: Q4 muốn bớt hiệu ứng, Q6 muốn ăn mừng/mascot nổi bật. Cần danh sách rõ hiệu ứng nào bỏ, hiệu ứng nào giữ.

## Hệ quả

- DESIGN.md hết là "nguồn chuẩn duy nhất" cho tới khi bản sửa được xác nhận.
- Vì phạm vi chạm vào phần của Kế (auth, Settings, màn giáo viên), cần Kế đồng ý trước khi triển khai.
- Mockup trong `design/mockups-*` cũng nằm trong diện bị xem lại.

## Còn mở

- Giá trị cụ thể của bảng màu chức năng và quan hệ với màu trạng thái (đúng/sai) và badge CEFR. Đây là sản phẩm của bước viết DESIGN.md mới, không phải câu hỏi cho người dùng.
- Chờ người dùng xác nhận đã đạt hiểu biết chung, trước khi viết DESIGN.md mới.

## Phản hồi sau bước E (xem mockup v2 P0–P1)

Người dùng nhận xét: bộ kit thiết kế tốt. Ba yêu cầu mới:

1. **Nhiều chuyển động hơn**, nhưng không rối mắt và không làm mất tập trung vào bài học.
2. **Mascot xuất hiện nhiều hơn** để tăng độ nhận diện thương hiệu.
3. **Đầy đủ tính năng như mockup-student v1.**

Hệ quả cần giải quyết (đang chờ trả lời):

- Yêu cầu 1 điều chỉnh Q4(a) và Q16 ("bớt hiệu ứng"). Cần phân biệt chuyển động *trang trí liên tục* (vẫn bỏ) với chuyển động *có mục đích* (tăng).
- Yêu cầu 3 mở rộng phạm vi so với kế hoạch "P0+P1+P2": v1 có 19 trang và nhiều tính năng xuyên suốt.
- Mascot nhiều hơn phải khớp quy tắc "tối đa một mascot lớn trên mỗi màn hình" ở DESIGN.v2 §6.1.

## Vòng thiết kế lại trang Nghe chép (mockup v2, tham chiếu Parroto)

Nguồn tham chiếu: trang nghe chép của Parroto (ảnh `docs/ux/shots/ref-parroto-*.png`). Phạm vi: **chỉ mockup v2**, không đụng `frontend/`.

| # | Quyết định | Ghi chú |
|---|---|---|
| D1 | Gõ → hiện các ô từ theo độ dài câu; **Enter mới chấm** và phân loại lỗi | Giữ dữ liệu phân loại lỗi cho trang Điểm yếu |
| D2 | Hai cột: trái = video thu nhỏ + thanh điều khiển + ô gõ; phải = danh sách câu (thay thẻ "Tiến độ bài") | Màn máy tính 1280–1366px |
| D3 | Danh sách câu che chữ, làm xong câu nào lộ câu đó kèm điểm; **cho nhảy tự do** tới câu bất kỳ | Bỏ khoá câu chưa làm |
| D4 | **Ba mức**: Easy / Normal / Hard | **Chưa có trong SRS**: yêu cầu mới, cần báo Kế (như R8 trong STATES.md) |
| D5 | Gợi ý theo từng từ (bấm ô mở từ đó, từ đã mở tính lỗi) + "Hiện cả câu" | |
| D6 | Thanh điều khiển gọn: ← câu trước · ↻ phát lại · ▶ phát · → câu sau · tốc độ · ⚙ · ⌨ | Nút ▶ lớn hơn |
| D7 | Nhúng YouTube thật cho 1–2 bài mẫu | Cần mạng để xem |
| D8 | **Không lấy**: thanh chia sẻ MXH, bình luận, banner khuyến mãi, hộp chọn ngôn ngữ dịch khi vào bài | Ngôn ngữ dịch đặt trong ⚙ |
| D9 | **Easy**: hiện sẵn ~60% từ (ưu tiên từ chức năng), điền tối đa 3 từ nội dung/câu · **Normal**: ô theo độ dài từng từ, gõ cả câu · **Hard**: một ô gõ trống, không biết số từ | |
| D10 | Một điểm duy nhất 0–100, ghi kèm nhãn mức; không nhân hệ số. Mở 1 từ = từ đó sai; "Hiện cả câu" = câu 0 điểm | |
| D11 | Đổi mức chỉ áp dụng từ câu tiếp theo | |
| D12 | Bấm câu đã làm ở danh sách: xem lại kết quả từng từ + dịch nghĩa + nghe lại, có nút "Làm lại" | |
| D13 | Nút "Ẩn video" (chỉ nghe), mặc định hiện, nhớ lựa chọn cho lần sau | Laptop 768px cao |
| D14 | Bỏ thẻ Loopi cố định; Loopi chỉ: chào lần đầu (tự ẩn), cạnh điểm sau mỗi câu, ăn mừng khi xong bài | Theo Q23 |
| D15 | Mốc thời gian thật cho 1–2 bài mẫu (Kiki + 1 bài) trong `data.js` | Chỉ dùng nội bộ trong mockup |
| D16 | Phím: `Ctrl` (nhả, không kèm phím khác) phát lại · `Alt+←/→` câu trước/sau · `Alt+1/2/3` đổi mức · Easy: `Space` sang ô kế, `Backspace` ở ô rỗng lùi ô trước. Nút ⌨ mở popover | Sửa lỗi Ctrl+C/Ctrl+A phát lại |
| D17 | Màn hoàn thành: thêm nút "Thử mức khó hơn" khi điểm TB ≥ 90 | |
| D18 | Chỉ làm Nghe chép; Shadowing hỏi riêng. Phần chung (danh sách câu, thanh điều khiển, Ẩn video) viết để dùng lại | |
| D19 | Dữ liệu bài mẫu: seed thật nếu có; **đã kiểm tra: migration chưa có bài/câu nào** → dùng phụ đề công khai do kênh tự đăng | Chờ xác nhận phương án dự phòng |
| D20 | Lưu tiến độ từng bài trên máy (localStorage), quay lại tiếp đúng câu | |
| D21 | Công tắc "Tự phát câu tiếp" trong ⚙, **mặc định tắt** | Để đọc lại kết quả câu trước |

## Vòng thiết kế lại trang Shadowing (mockup v2, tham chiếu Parroto)

Hiện trạng ghi nhận: mọi bài đều hiện cùng một câu mẫu cố định; video giả; không có danh sách câu; kết quả là khối dài ở dưới.

| # | Quyết định | Ghi chú |
|---|---|---|
| S1 | Dùng lại khung Nghe chép: video trên, khung luyện dưới, danh sách câu bên phải, Ẩn video, ⚙, ⌨ | Theo D18 |
| S2 | Câu lấy theo bài (`sentsOf`); điểm phát âm **mô phỏng theo từng câu**, có nhãn "điểm mô phỏng" | Bản thật: Azure Pronunciation Assessment |
| S3 | Bỏ thanh 3 bước; một hàng nút ▶ Nghe mẫu · ● Ghi âm · ▷ Giọng tôi; trạng thái nằm trên nút mic | |
| S4 | IPA dưới từng từ, karaoke khi phát; công tắc ẩn IPA trong ⚙ (mặc định bật) | |
| S5 | **Hai tab Xem / Luyện** như Parroto | Chưa có trong SRS |
| S6 | Kết quả gọn ngay dưới câu (điểm, từ tô màu, chip lỗi); bấm từ → popover âm vị; "Xem chi tiết" mở ngăn bên (4 chỉ số, lỗi âm vị, nhận xét AI Pro) | |
| S7 | Danh sách câu: điểm cao nhất + số lần đọc; ✓ khi ≥ 80 | |
| S8 | Lượt chấm Free thành chip cạnh mic; hết lượt vẫn ghi âm để tự nghe, không chấm | |
| S9 | Chỉ "nghe xong rồi đọc lại"; đọc đè để danh sách làm sau | |
| S10 | Thêm nút "So sánh": phát mẫu rồi phát giọng mình | |
| S11 | Tab Xem: video liền mạch, danh sách câu tự cuộn và làm sáng câu đang nói, ẩn khung luyện; bấm câu → video nhảy tới. Phụ đề bật trong ⚙ | |
| S12 | Chuyển Xem → Luyện bắt đầu ở câu đang phát | |
| S13 | Mic tròn lớn (màu Shadowing): chờ / đang ghi (đỏ, sóng, tự dừng sau 2× độ dài câu) / đang chấm / xong; thẻ "chưa cấp quyền" dưới hàng nút | |
| S14 | Popover từ: điểm, âm vị đúng/sai, mẹo, nghe mẫu từ, giọng tôi ở từ, Lưu từ, video khẩu hình (Pro) | |
| S15 | Thanh điều khiển như Nghe chép, tốc độ 0.5× / 0.75× / 1× | |
| S16 | Phím: Space ghi âm · Ctrl (nhả) nghe mẫu · Alt+←/→ đổi câu · R giọng tôi · C so sánh · Alt+W / Alt+P đổi tab | |
| S17 | Màn hoàn thành: như Nghe chép + âm cần luyện nhiều nhất (→ Điểm yếu) + "Luyện Nghe chép bài này" | |
