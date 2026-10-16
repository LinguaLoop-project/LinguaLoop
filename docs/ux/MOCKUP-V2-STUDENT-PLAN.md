# Kế hoạch: Mockup v2 cho học viên

> Trạng thái: **kế hoạch, chờ xác nhận.** Chưa tạo thư mục hay file mockup nào.
> Căn cứ: `design/DESIGN.v2.md` (bản nháp), `docs/ux/UX-REDESIGN-INTERVIEW.md`.

## 1. Mục tiêu

Một bản mockup HTML tĩnh cho **riêng học viên**, theo DESIGN.v2, để bạn và Kế nhìn thấy phong cách mới trước khi viết lại code React. Mockup cũng là nơi kiểm chứng các mục **[CẦN DUYỆT]** trong DESIGN.v2 §14 (màu chức năng, nút đáy dày, mốc responsive…).

Không phải mục tiêu: backend, dữ liệu thật, giáo viên/admin.

## 2. Hiện trạng mockup v1 (đã khảo sát)

- `design/mockups-student/`: 19 trang HTML, `shell.js` (680 dòng, khung chung), `student.css` (1.217 dòng), `data.js` (dữ liệu mẫu), 10 file trong `js/`, `ux-notes.js`.
- HTML + CSS + JS thuần, không có bước build; mở thẳng bằng trình duyệt.
- Icon là **Phosphor** nạp qua CDN (`<i class="ph ph-xxx">`), khoảng 33 chỗ trong `shell.js` và rải rác ở các trang.
- `shell.js` chèn lớp nền hiệu ứng (`BG_FX`, vật thể 3D) và có hàm `confetti()`, `ting()`, mascot theo trạng thái.
- Mascot dùng từ `design/loopi-mascot/svg`.

## 3. Quyết định về cách làm

| # | Quyết định | Đề xuất | Lý do |
|---|---|---|---|
| 1 | Vị trí | Thư mục mới `design/mockups-student-v2/`, **không sửa v1** | v1 vẫn là bản đối chiếu và chưa bị huỷ |
| 2 | Công nghệ | HTML + CSS + JS thuần như v1 | Mở là xem được, không cần cài; khớp cách Kế đã quen |
| 3 | Token | Một file `tokens.css` lấy đúng giá trị DESIGN.v2 | Khi port sang React, copy thẳng vào `@theme` |
| 4 | Icon | Lucide qua CDN, ghim phiên bản | Khớp quyết định Q18 |
| 5 | Dữ liệu mẫu | Copy `data.js` từ v1 | Tránh làm lại nội dung; chỉ so sánh giao diện |
| 6 | Khung chung | Viết lại `shell.js` gọn hơn, bỏ `BG_FX`, parallax, spotlight | Khớp Q4, Q16 |
| 7 | Ghi chú UX | Giữ nút "Ghi chú UX" (`ux-notes.js`), cập nhật nội dung cho v2 | Giải thích vì sao đổi; cần cho buổi duyệt |
| 8 | Kiểm tra | Chụp Playwright 1440px, sáng + tối, từng trang | Khớp §13 DESIGN.v2 |

## 4. Phạm vi trang (cần bạn chọn, xem §8)

19 trang v1 chia theo mức ưu tiên. Mức P1 khớp 3 luồng đã chốt ở Q15.

| Mức | Trang | Lý do |
|---|---|---|
| **P0** | Khung chung: thanh bên, thanh trên, footer, theme, toast, mascot | Mọi trang dùng; quyết định cảm giác tổng thể |
| **P1** | `index` (Hôm nay), `lessons`, `topic`, `lesson` | Luồng đã chốt ở Q15; nơi thử game hoá và màu chức năng |
| **P2** | `dictation`, `shadowing`, `vocab` | Ba chức năng cốt lõi, mỗi cái một màu chức năng |
| **P3** | `deck`, `group`, `mywords`, `weakness`, `test`, `settings` | Dùng lại component đã có từ P0–P2 |
| **P4** | `login`, `register`, `forgot`, `verify`, `brand` | Auth thuộc phần của Kế; làm cuối hoặc bỏ |

## 5. Các bước thực hiện

| Bước | Việc | Kết quả kiểm được |
|---|---|---|
| **A. Nền** | Tạo `tokens.css` (màu, màu chức năng, spacing, bo góc, motion) và `base.css` (reset, typography, sáng/tối theo hệ thống) | Trang trống đổi sáng/tối đúng; tỉ lệ tương phản khớp DESIGN.v2 §2 |
| **B. Component** | Viết `components.css`: nút (primary, chức năng, secondary, ghost, icon), card, glass, huy hiệu (CEFR, chức năng, PRO), thanh tiến độ, bảng, input | Một trang mẫu `kit.html` liệt kê mọi component ở cả hai chế độ |
| **C. Khung chung** | `shell.js` mới: thanh bên (mục active theo màu chức năng), thanh trên, toast, mascot, confetti nhẹ | Chuyển được giữa các trang, mục active đúng màu |
| **D. P1** | Dựng 4 trang theo mockup v1 nhưng áp phong cách mới | Chụp ảnh sáng + tối, so với v1 |
| **E. Duyệt vòng 1** | Bạn xem P0–P1, ghi nhận xét | Quyết định các mục §14 DESIGN.v2 liên quan; điều chỉnh token nếu cần |
| **F. P2** | Nghe chép, shadowing, từ vựng | Phản hồi đúng/sai, ăn mừng hoạt động đúng |
| **G. P3 (tuỳ chọn)** | Các trang còn lại | Hoàn thiện bộ |
| **H. Chốt** | Cập nhật `ux-notes.js`, README của thư mục, đối chiếu DESIGN.v2 §12 | Danh sách lệch giữa mockup và DESIGN.v2 (nếu có) |

**Điểm dừng bắt buộc:** sau bước E, dừng để bạn xem. Nếu hướng sai, sửa token ở bước A–B rẻ hơn nhiều so với sửa mười trang.

## 6. Tiêu chí hoàn thành

1. Không có mã màu hex ngoài `tokens.css`; không có emoji làm icon.
2. Mỗi trang xem được ở sáng và tối, 1440px, không lỗi console.
3. Ở 390px layout **không vỡ** (không yêu cầu tối ưu), theo DESIGN.v2 §11.
4. Không có chuyển động lặp vô hạn (floating, parallax, glow thở).
5. Mỗi chức năng đúng màu chức năng của nó (§2.2); đúng/sai luôn kèm icon và chữ.
6. `kit.html` liệt kê đủ component và là nguồn tham chiếu khi port sang React.
7. Phản hồi tuân thủ ràng buộc Q17: văn bản tiếng Việt, phím tắt nghe chép giữ nguyên (Ctrl phát lại, Enter kiểm tra).

## 7. Rủi ro

| Rủi ro | Cách giảm |
|---|---|
| Mockup phình ra thành việc viết lại cả app | Chốt phạm vi ở §8 trước; dừng ở bước E |
| `shell.js` v1 gắn chặt với Phosphor và `BG_FX` (680 dòng) | Viết lại khung mới, chỉ lấy lại phần tiện ích (toast, confetti, theme) |
| Màu chức năng trông chói trên nền sáng hoặc lệch nhau khi đặt cạnh | Kiểm chứng sớm ở `kit.html` (bước B), trước khi dựng trang |
| Mockup đẹp nhưng React làm lại không giống | Dùng đúng token và tên component; ghi bảng ánh xạ ở bước H |
| Kế chưa biết đang có v2 | Gửi Kế liên kết `DESIGN.v2.md` và thư mục mockup ngay sau bước E |

## 8. Cần bạn quyết định trước khi bắt đầu

1. **Phạm vi:** dừng ở P1, hay P1 + P2, hay đủ P0–P3? Có làm P4 (auth) không?
2. **Vị trí thư mục:** `design/mockups-student-v2/` được không?
3. **Bước E có là điểm dừng bắt buộc không**, hay muốn làm liền tới P2 rồi xem một lần?
4. **Giữ các mục [CẦN DUYỆT] làm mặc định** trong mockup (font giữ nguyên, nút đáy dày, UK/US cùng màu), hay bạn muốn thử hai biến thể?

## 9. Ước lượng (thô)

| Bước | Quy mô |
|---|---|
| A + B | Nhỏ: nền tảng cho cả bộ |
| C | Trung bình: viết lại khung chung |
| D | Trung bình: 4 trang |
| F | Lớn: ba trang tương tác (có phản hồi đúng/sai, ghi âm giả lập) |
| G | Trung bình, lặp lại các mẫu đã có |

Tôi chưa quy đổi ra giờ vì tốc độ phụ thuộc số lần bạn điều chỉnh ở bước E.
