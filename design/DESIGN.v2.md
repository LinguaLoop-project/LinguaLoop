# LinguaLoop — Design System v2 (BẢN NHÁP CHỜ DUYỆT)

> **Trạng thái: nháp.** `design/DESIGN.md` (v1) vẫn là bản có hiệu lực cho tới khi file này được **Kế đồng ý** và đổi tên thay thế. Chưa có dòng code nào được sửa theo file này.
>
> Cơ sở: các quyết định Q1–Q20 trong `docs/ux/UX-REDESIGN-INTERVIEW.md`. Thuật ngữ nằm ở `CONTEXT.md`.
>
> Những chỗ gắn **[CẦN DUYỆT]** là đề xuất của người soạn, chưa được người dùng quyết định. Mục 14 liệt kê toàn bộ.

---

## 0. Khác gì so với v1

| Hạng mục | v1 | v2 | Lý do (quyết định) |
|---|---|---|---|
| Tinh thần | "Cosmic Violet": tối, sâu, phát sáng | **Vui, nhiều màu, có động lực**; tím vẫn là màu thương hiệu | Q6 |
| Sáng/tối | Dark mặc định, light "đẹp ngang hàng" | **Theo hệ thống, hai chế độ ngang hàng** | Q11 |
| Vật thể 3D thủy tinh | Bắt buộc, bản sắc thương hiệu | **Bỏ** | Q4 |
| Lottie | Mascot và streak | **Bỏ**; mascot dùng SVG có sẵn | Q16 |
| Parallax, glow "thở", spotlight | Có | **Bỏ** | Q4, Q16 |
| Ảnh minh họa mỗi thẻ từ | Bắt buộc | **Tuỳ chọn**; không có ảnh thì hiện biểu tượng từ loại | Q4 |
| Icon | Phosphor | **Lucide** | Q18 |
| Motion | Motion/Framer, Lottie, confetti | **Chỉ CSS** + confetti nhẹ (CSS/canvas) | Q16, Q18 |
| Màu | Một màu tím, màu trạng thái chỉ cho nghĩa học | Tím + **màu chức năng** | Q10 |
| Mobile | Thanh điều hướng dưới đáy, tối ưu riêng | **Máy tính là chính**; mobile chỉ cần không vỡ | Q13 |
| Giáo viên/admin | Cùng phong cách học viên | **Cùng token/component, gọn và đặc hơn** | Q7 |

Giữ nguyên từ v1: logo, mascot Loopi (6 trạng thái), màu tím, token tên gọi, thang spacing, bo góc, quy tắc a11y, quy trình mục 13.

---

## 1. Tinh thần thiết kế

**Vui, rõ ràng, có tiến bộ nhìn thấy được.** Người học 10–30 phút mỗi ngày cần biết ngay hôm nay làm gì và thấy mình đang tiến lên.

- **Nhân vật chính là nội dung học**, không phải hiệu ứng nền: từ vựng, câu nghe chép, điểm số.
- **Màu có nghĩa.** Mỗi chức năng có một màu riêng để nhận ra mình đang ở đâu. Tím dẫn mắt tới hành động chính.
- **Mascot là gương mặt cảm xúc**: chào, động viên, ăn mừng. Xuất hiện đúng lúc, không lấp đầy màn hình.
- **Chuyển động ngắn, có mục đích.** Chỉ để báo kết quả hoặc xác nhận thao tác. Không có chuyển động liên tục cạnh vùng đang đọc/nghe.
- **Công cụ làm việc thì gọn.** Giáo viên và admin dùng cùng token nhưng bảng dày hơn, ít trang trí.

---

## 2. Màu sắc (Design Tokens)

Dùng CSS variables, ánh xạ vào Tailwind qua `@theme`. **Không hardcode mã màu trong component.**

### 2.1 Màu nền, chữ, viền, thương hiệu

Giữ nguyên giá trị v1 (xem `design/DESIGN.md` §2) cho `--bg-*`, `--surface*`, `--border*`, `--text*`, `--primary*`, `--btn-primary*`, `--accent*`, `--gradient-*`, kèm hai chỉnh sửa vì lỗi tương phản:

| Token | Chế độ | v1 | v2 | Lý do |
|---|---|---|---|---|
| `--success` (chữ/icon trên nền sáng) | Light | `#059669` (3,8:1 ✗) | `#047857` (5,5:1 ✓) | v1 không đạt 4,5:1 |
| `--danger` (chữ trên nền sáng) | Light | `#E11D48` (4,7:1, sát ngưỡng) | `#BE123C` (6,3:1) | Dư lượng an toàn **[CẦN DUYỆT]** |

Lưu ý: `--primary` dark `#8B5CF6` trên `--surface` chỉ đạt 4,4:1. **Dùng làm nền/viền/icon, không dùng làm màu chữ**. Chữ tím trên nền tối dùng `--accent` (`#D8B4FE`) hoặc `#A78BFA` (6,9:1).

Bỏ khỏi v2: `--glow-primary`, `--glow-soft`, `--hero-radial` dạng nhấp nháy. Nền trang là màu phẳng, kèm một lớp tím mờ tĩnh ở đầu trang (không animation).

### 2.2 Màu chức năng (mới)

Mỗi chức năng học có **một** màu. Dùng cho: thanh bên (mục active), tiêu đề trang, huy hiệu chức năng trên thẻ bài, viền thanh tiến độ. Không dùng để tô mảng lớn.

| Chức năng | Token | Dark (trên `#140F24`) | Light (trên `#FFFFFF`) |
|---|---|---|---|
| Nghe chép | `--fn-dictation` | `#60A5FA` (7,4:1) | `#1D4ED8` (6,7:1) |
| Shadowing | `--fn-shadowing` | `#F472B6` (7,1:1) | `#BE185D` (6,0:1) |
| Từ vựng, ôn thẻ | `--fn-vocab` | `#FB923C` (8,3:1) | `#C2410C` (5,2:1) |
| Kiểm tra trình độ, điểm yếu | `--fn-assessment` | `#2DD4BF` (10,0:1) | `#0F766E` (5,5:1) |
| Thư viện bài học, chung | `--primary` | như thương hiệu | như thương hiệu |

Mỗi token có kèm `--fn-*-soft` (nền nhạt, opacity 0,14 dark / 0,10 light) cho huy hiệu và nền nhấn.

**[CẦN DUYỆT]** Việc gán màu cho "kiểm tra trình độ" và "điểm yếu" là đề xuất của người soạn; người dùng mới chỉ nêu ví dụ cho ba chức năng đầu.

### 2.3 Màu trạng thái và CEFR (phải tách khỏi màu chức năng)

| Nhóm | Token | Dùng cho | Quy tắc |
|---|---|---|---|
| Trạng thái | `--success`, `--danger`, `--warning` | Đúng, sai, cảnh báo, streak | **Luôn kèm icon hoặc chữ.** Không dùng trang trí. |
| Gợi ý | `--info` | Tooltip, gợi ý | Không dùng để phân biệt UK/US nữa (xem §7.4). |
| CEFR | `--cefr-a` (success), `--cefr-b` (info), `--cefr-c` (accent-2) | Huy hiệu cấp độ | Giữ v1. Luôn kèm chữ "A1…C2". |

**Va chạm cần tránh:** `--fn-dictation` (xanh dương) gần `--info` (xanh da trời), và `--fn-assessment` (xanh ngọc) gần `--success` (xanh lá). Quy tắc: không đặt hai màu cạnh nhau mà phân biệt chỉ bằng màu; luôn có nhãn chữ. **[CẦN DUYỆT]** nếu thấy chưa đủ rõ thì đổi `--fn-assessment` sang màu khác.

---

## 3. Typography

Giữ font v1. **[CẦN DUYỆT]** Người dùng chưa xác nhận việc giữ font; tạm giữ vì đã cài và hỗ trợ tiếng Việt.

| Vai trò | Font | Weight |
|---|---|---|
| Display: tiêu đề, từ vựng chính | Bricolage Grotesque | 600–800 |
| Body, UI | Be Vietnam Pro | 400, 500, 600 |

Thang cỡ chữ giữ v1 (`h1` 36, `h2` 24, `h3` 18, `body` 15, `small` 13, `overline` 11). Bỏ `display-xl` (72px, chỉ cho hero landing 3D).

**Chữ gradient** bỏ ở v2, trừ từ vựng chính trên thẻ tra từ. Tiêu đề trang dùng `--text` thuần để đọc nhanh.

**Máy tính là chính:** nội dung học (câu nghe chép, từ vựng) đặt cỡ `body` 16–18px, không nhỏ hơn 15px.

---

## 4. Không gian, bo góc, lưới

Giữ nguyên v1: spacing 4–128, bo `sm 8 / md 12 / lg 20 / xl 28 / full`, container 1200px, sidebar 248px.

- **Học viên:** khoảng cách thoáng (gutter 24, giữa section 32–48).
- **Giáo viên/admin:** gọn hơn. Hàng bảng cao 40px (thay vì 56), padding card 16px, khoảng giữa section 24.

---

## 5. Bề mặt

Chỉ còn hai loại, bỏ spotlight và viền gradient phát sáng:

```css
.card  { background: var(--surface); border: 1px solid var(--border);
         border-radius: var(--radius-lg); box-shadow: var(--shadow-card); }
.glass { background: var(--surface-glass); backdrop-filter: blur(20px) saturate(140%);
         border: 1px solid var(--border-strong); border-radius: var(--radius-xl); }
```

`.glass` chỉ dùng cho khung nổi (popover, modal, thanh tiến độ phiên học). Card nổi bật (từ của ngày, gói Pro) dùng viền `--primary` 2px, không phải viền gradient.

---

## 6. Hình ảnh

### 6.1 Mascot Loopi (hình ảnh chính)

Sáu trạng thái, đã có trong `frontend/public/mascot/*.svg`:

| Trạng thái | Dùng khi |
|---|---|
| `hello` | Trang Hôm nay, đăng nhập, onboarding |
| `listening` | Màn nghe chép, đang phát âm thanh |
| `speaking` | Màn shadowing, đang ghi âm |
| `correct` | Trả lời đúng |
| `encourage` | Trả lời sai, trạng thái trống, lỗi |
| `celebrate` | Hoàn thành bài, lên chuỗi ngày học |

Quy tắc: **tối đa một mascot lớn trên mỗi màn hình.** Trong màn đang học, mascot nhỏ ở góc, không động liên tục.

### 6.2 Ảnh minh họa từ vựng

Tuỳ chọn. Có ảnh thì tỉ lệ 4:3, bo `--radius-lg`. Không có ảnh thì dùng nền `--fn-vocab-soft` kèm biểu tượng theo từ loại (danh từ, động từ…).

### 6.3 Icon

**Lucide** (`lucide-react`), 20px trong UI, 24px ở thanh bên, `stroke-width` 2. Tuyệt đối không dùng emoji làm icon UI. Mọi nút chỉ có icon phải có `aria-label` theo ngôn ngữ đang chọn.

---

## 7. Component

### 7.1 Nút

| Loại | Style |
|---|---|
| **Primary** | Nền `--btn-primary`, chữ trắng, `--radius-md`, cao 44px. **[CẦN DUYỆT]** Thêm "đáy" dày 3–4px màu `--primary-hover` (kiểu nút nổi của app game hoá); nhấn thì đáy nén xuống. Không gradient, không glow. |
| **Chức năng** | Như primary nhưng nền theo `--fn-*` của chức năng (ví dụ nút "Bắt đầu nghe chép" nền `--fn-dictation`). Chữ dùng token `--on-fn`: **tối (`#07050D`) ở chế độ tối, trắng ở chế độ sáng** (chữ trắng trên `#60A5FA` chỉ đạt khoảng 2,5:1). Phát hiện từ mockup v2. |
| **Secondary** | Nền `--surface`, viền `--border-strong`, chữ `--text`. |
| **Ghost** | Nền trong suốt, hover `--surface-hover`. |
| **Icon button** | 40×40, `--radius-md`. |

Mọi nút có `:hover`, `:active`, `:focus-visible` và `:disabled`.

### 7.2 Thẻ bài học (thư viện bài)

Hiển thị đủ để chọn nhanh: tên, cấp CEFR, thời lượng, nguồn, huy hiệu PRO, hai nút chế độ (Nghe chép / Shadowing) kèm tiến độ riêng. **Mỗi nút chế độ dùng màu chức năng của nó** (xanh dương / hồng) để nhận ra không cần đọc chữ.

### 7.3 Thanh bên

Nền `--bg-elevated`. Mục active: nền `--fn-*-soft` hoặc `--primary-soft` (theo chức năng của mục), thanh 3px bên trái cùng màu, icon đậm hơn. Không có hiệu ứng nhích icon.

### 7.4 Nút phát âm

Hai pill UK/US, phân biệt bằng **nhãn chữ** "UK" / "US", cùng một màu `--primary`. Bỏ phân biệt bằng `--info` (xem §2.3). Khi phát: biểu tượng chuyển thành sóng âm 3 vạch.

### 7.5 Phản hồi học tập

| Sự kiện | Hiệu ứng |
|---|---|
| Đúng | Viền `--success` + icon dấu tích + chữ "Chính xác"; mascot `correct` (nhỏ). |
| Sai | Viền `--danger` + icon + chữ chỉ lỗi; rung ngang 1 lần (200ms); mascot `encourage`. |
| Hoàn thành bài | Mascot `celebrate` lớn, confetti (≤ 1,2s), thanh tiến độ đầy. |
| Lên chuỗi ngày học | Biểu tượng ngọn lửa phóng to 1 lần + số đổi; pill thông báo. |

Tiến độ: thanh có nền `--border`, phần đầy dùng màu chức năng (hoặc `--primary`), tăng mượt 450ms. **Không** shimmer chạy liên tục.

### 7.6 Bảng (giáo viên/admin)

Hàng 40px, tiêu đề cột `overline`, đường kẻ `--border`, hover hàng `--surface-hover`, hàng chọn nền `--primary-soft`. Thao tác hàng loạt hiện ở thanh nổi phía trên khi có hàng được chọn.

---

## 8. Chuyển động (Motion)

**Chỉ CSS.** Không thêm Motion (Framer), không Lottie.

### Token

```css
--ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* chỉ cho nút và ăn mừng */
--dur-fast: 150ms;   /* hover màu, focus */
--dur-base: 200ms;   /* nâng card, mở dropdown */
--dur-slow: 400ms;   /* thanh tiến độ, lật thẻ */
```

Bỏ `--dur-hero`.

### Cho phép

- Hover card: `translateY(-2px)`, viền đổi `--border-strong`.
- Nhấn nút: `scale(0.98)` hoặc đáy nén.
- Đổi tab: chỉ báo trượt, nội dung crossfade.
- Lật flashcard: `rotateY(180deg)`, `--dur-slow`.
- Phản hồi học tập (§7.5), ăn mừng bằng confetti nhẹ.

### Không có

Vật thể trôi nổi, parallax, glow thở, spotlight theo chuột, chuyển động lặp vô hạn cạnh nội dung đang đọc.

### Giảm chuyển động

Giữ khối `prefers-reduced-motion: reduce` của v1; khi bật thì tắt confetti, giữ phản hồi đúng/sai bằng màu + icon.

---

## 9. Sáng / tối

Hai chế độ **ngang hàng**, theo `prefers-color-scheme` khi người dùng chưa chọn, lưu lựa chọn sau đó.

- Mọi component phải có ảnh chụp ở cả hai chế độ trước khi coi là xong.
- Không đảo màu máy móc: dùng bộ giá trị riêng cho từng chế độ (bảng §2).
- Mascot SVG kiểm tra ở cả hai nền.
- Chuyển chế độ mượt 200ms trên `background-color, color, border-color`.

---

## 10. Khả năng tiếp cận

Giữ toàn bộ v1 §10, cộng:

- Màu chức năng và màu trạng thái **không bao giờ là tín hiệu duy nhất**; luôn kèm chữ hoặc icon.
- Bảng §2.2 là bảng tương phản chuẩn; thêm màu mới phải ghi tỉ lệ vào đây.
- Phím tắt nghe chép (Ctrl phát lại, Enter kiểm tra) giữ nguyên, hiển thị gợi ý trên giao diện.

---

## 11. Responsive

Máy tính là chính. Mobile **dùng được, không vỡ**, không tối ưu riêng.

| Breakpoint | Hành vi |
|---|---|
| ≥ 1024px | Thanh bên đầy đủ (248px), lưới nhiều cột. |
| 768–1023px | Thanh bên thu thành icon. |
| < 768px | Thanh bên ẩn, mở bằng nút menu; nội dung 1 cột; bảng cuộn ngang. **Bỏ thanh điều hướng dưới đáy.** |

**[CẦN DUYỆT]** Mốc 1024px thay cho 1280px của v1, và việc bỏ `StudentMobileNav`.

---

## 12. Nên / Không nên

**Nên**
- Mỗi màn hình có một điểm nhấn: mascot, màu chức năng, hoặc nội dung học lớn.
- Dùng token cho màu, cỡ chữ, thời lượng, bo góc.
- Kiểm tra cả sáng và tối.
- Từ vựng và câu đang học là thứ to và rõ nhất.

**Không nên**
- Dùng emoji làm icon UI.
- Hardcode mã màu hoặc giá trị `[NNpx]` khi đã có token.
- Dùng hai class CSS cho cùng một việc (`.btn` và `.ll-btn`).
- Tô màu chức năng lên mảng lớn hoặc dùng hơn một màu chức năng trên một khối.
- Đặt chuyển động liên tục cạnh nội dung đang đọc/nghe.
- Thêm XP, huy hiệu, bảng xếp hạng: **ngoài phạm vi**, cần đổi đặc tả (xem `docs/ux/UX-REDESIGN-INTERVIEW.md`).

---

## 13. Hướng dẫn cho Claude Code

1. Đọc file này trước khi làm giao diện.
2. Dùng token ở §2, §4, §8; cần token mới thì thêm vào file này trước.
3. Kiểm tra cả sáng và tối.
4. Chụp Playwright ở 1440px, cả hai chế độ, và đối chiếu §12.
5. Dùng Tailwind + token; **không thêm class CSS tự viết** nếu Tailwind làm được.
6. Giữ nguyên: i18n vi/en, phân quyền route, hợp đồng API, hành vi auth, phím tắt nghe chép.

---

## 14. Danh sách chờ duyệt

| # | Hạng mục | Người quyết |
|---|---|---|
| 1 | Giữ font Bricolage Grotesque + Be Vietnam Pro | Người dùng, Kế |
| 2 | Gán màu chức năng cho "kiểm tra trình độ/điểm yếu" (xanh ngọc) và giá trị hex §2.2 | Người dùng |
| 3 | Đổi `--danger` light sang `#BE123C`; mockup v2 cũng đổi `--warning` light `#D97706`→`#B45309` (5,0:1) và `--info` light `#0284C7`→`#0369A1` (5,9:1) | Người dùng |
| 4 | Nút primary có "đáy dày" kiểu app game hoá | Người dùng |
| 5 | Mốc responsive 1024px và bỏ `StudentMobileNav` | Người dùng, Kế |
| 6 | Nút UK/US phân biệt bằng chữ, cùng màu | Người dùng |
| 7 | Mockup `design/mockups-*` đang dùng sprite Phosphor và hiệu ứng cũ: cập nhật hay đánh dấu lỗi thời | Người dùng, Kế |
| 8 | Kế đồng ý tổng thể trước đợt chuẩn hoá đầu tuần 6 | Kế |

## 15. Kế hoạch di chuyển (chỉ để duyệt, chưa thực hiện)

| Bước | Việc | Thời điểm |
|---|---|---|
| 1 | Duyệt file này, đổi tên thành `DESIGN.md` | Tuần 5 |
| 2 | Cập nhật `@theme` và token trong `frontend/src/styles/index.css`; thêm `--fn-*` | Đầu tuần 6 |
| 3 | Chuyển icon sang Lucide; thay `SvgSprites` và tên icon trong `PlaceholderPage` | Đầu tuần 6 |
| 4 | Xây lại component chung (nút, thẻ, input, bảng, huy hiệu) bằng Tailwind + token; xoá class `.ll-*` trùng nghĩa | Đầu tuần 6 |
| 5 | Áp cho khung chung (3 layout), thư viện bài, chi tiết bài, trang Hôm nay | Đầu tuần 6 |
| 6 | Áp cho auth và Settings (phần của Kế) | Cùng tuần 6, sau khi Kế duyệt |
| 7 | Chụp Playwright cả hai chế độ ở 1440px; chạy Lighthouse Accessibility | Cuối đợt |
