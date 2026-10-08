# LinguaLoop — Design System

> File này là **nguồn chuẩn duy nhất** cho giao diện LinguaLoop. Mọi màn hình, component và animation phải tuân theo file này. Nếu một yêu cầu mâu thuẫn với file này, hãy hỏi lại trước khi làm.

---

## 1. Tinh thần thiết kế

**"Cosmic Violet"**: tối, sâu, phát sáng. Cảm giác như một sản phẩm công nghệ cao cấp, nhưng vẫn vui và có động lực như một app học ngôn ngữ.

- **Chiều sâu**: nền tối nhiều lớp, ánh sáng tím toả ra từ phía sau nội dung (glow), không phẳng.
- **Vật thể 3D thủy tinh**: orb, torus, ngôi sao 4 cánh, khối nón trôi nổi quanh nội dung chính. Đây là bản sắc thị giác của app.
- **Chữ lớn, đậm, có gradient**: tiêu đề và từ vựng là nhân vật chính.
- **Chuyển động có mục đích**: mọi thứ phản hồi khi hover/click, thành tích được ăn mừng, nhưng không gây rối khi đang học.
- **Hai chế độ**: Dark là mặc định và là "bộ mặt" thương hiệu. Light phải đẹp ngang hàng, không phải bản đảo màu qua loa.

---

## 2. Màu sắc (Design Tokens)

Dùng CSS variables. **Không hardcode mã màu trong component.**

```css
:root,
:root[data-theme="dark"] {
  /* Nền */
  --bg-base:        #07050D;   /* nền trang, gần đen ánh tím */
  --bg-elevated:    #0E0A1A;   /* sidebar, header */
  --surface:        #140F24;   /* card */
  --surface-hover:  #1B1530;
  --surface-glass:  rgba(28, 20, 50, 0.55);

  /* Viền */
  --border:         rgba(167, 139, 250, 0.12);
  --border-strong:  rgba(167, 139, 250, 0.28);

  /* Chữ */
  --text:           #F4F1FF;
  --text-muted:     #A59DC0;
  --text-subtle:    #857DA3;   /* ≥ 4.5:1 trên mọi bề mặt dark */

  /* Thương hiệu */
  --primary:        #8B5CF6;   /* violet 500 */
  --primary-hover:  #9D74FF;
  --btn-primary:       #7B4DE8;   /* nền nút primary, chữ trắng đạt 5.2:1 */
  --btn-primary-hover: #6D3DE0;
  --primary-soft:   rgba(139, 92, 246, 0.16);
  --accent:         #D8B4FE;   /* lavender sáng, dùng cho gradient chữ */
  --accent-2:       #F0ABFC;   /* hồng tím, điểm nhấn phụ */

  /* Trạng thái học tập */
  --success:        #34D399;   /* trả lời đúng, đã nhớ */
  --warning:        #FBBF24;   /* streak, XP */
  --danger:         #FB7185;   /* sai, điểm yếu */
  --info:           #38BDF8;   /* phát âm US, gợi ý */

  /* Hiệu ứng */
  --glow-primary:   0 0 40px rgba(139, 92, 246, 0.45);
  --glow-soft:      0 0 80px rgba(139, 92, 246, 0.25);
  --shadow-card:    0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px -20px rgba(0,0,0,0.6);
  --hero-radial:    radial-gradient(60% 50% at 50% 0%, rgba(139,92,246,0.45) 0%, rgba(7,5,13,0) 70%);
}

:root[data-theme="light"] {
  --bg-base:        #FAF8FF;   /* trắng ánh lavender, không dùng trắng tinh */
  --bg-elevated:    #FFFFFF;
  --surface:        #FFFFFF;
  --surface-hover:  #F4F0FF;
  --surface-glass:  rgba(255, 255, 255, 0.7);

  --border:         rgba(91, 33, 182, 0.10);
  --border-strong:  rgba(91, 33, 182, 0.22);

  --text:           #1A1030;
  --text-muted:     #5B5275;
  --text-subtle:    #6F6789;   /* ≥ 4.5:1 trên nền sáng */

  --primary:        #7C3AED;   /* đậm hơn một bậc để đủ tương phản trên nền sáng */
  --primary-hover:  #6D28D9;
  --btn-primary:       #7C3AED;
  --btn-primary-hover: #6D28D9;
  --primary-soft:   rgba(124, 58, 237, 0.10);
  --accent:         #A855F7;
  --accent-2:       #DB2777;

  --success:        #059669;
  --warning:        #D97706;
  --danger:         #E11D48;
  --info:           #0284C7;

  --glow-primary:   0 8px 30px rgba(124, 58, 237, 0.25);
  --glow-soft:      0 20px 60px rgba(124, 58, 237, 0.12);
  --shadow-card:    0 1px 2px rgba(26,16,48,0.04), 0 12px 32px -12px rgba(76,29,149,0.15);
  --hero-radial:    radial-gradient(60% 50% at 50% 0%, rgba(167,139,250,0.35) 0%, rgba(250,248,255,0) 70%);
}

/* Theo cài đặt hệ thống nếu người dùng chưa chọn */
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) { /* copy các token light ở trên */ }
}
```

### Gradient chuẩn

```css
--gradient-text:    linear-gradient(180deg, var(--text) 30%, var(--accent) 100%);
--gradient-primary: linear-gradient(135deg, #8B5CF6 0%, #C084FC 50%, #F0ABFC 100%);
--gradient-border:  linear-gradient(135deg, rgba(216,180,254,0.5), rgba(139,92,246,0) 60%);
```

**Quy tắc dùng màu**
- Tím chỉ để **dẫn mắt**: nút chính, trạng thái active, glow. Không tô tím cả mảng lớn.
- Màu trạng thái (xanh/vàng/đỏ) chỉ dùng cho ý nghĩa học tập, không dùng trang trí.
- Không dùng màu làm tín hiệu duy nhất; luôn kèm icon hoặc chữ.

---

## 3. Typography

Cả hai font đều **hỗ trợ đầy đủ dấu tiếng Việt**. Nhớ tải subset `vietnamese`.

| Vai trò | Font | Weight |
|---|---|---|
| Display: tiêu đề hero, từ vựng chính | **Bricolage Grotesque** | 600–800 |
| Body, UI, nghĩa tiếng Việt | **Be Vietnam Pro** | 400, 500, 600 |
| Phiên âm IPA | **Be Vietnam Pro** (hoặc Noto Sans nếu thiếu ký tự) | 500 |

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Be+Vietnam+Pro:wght@400;500;600&display=swap&subset=vietnamese" rel="stylesheet">
```

### Thang cỡ chữ

| Token | Size / Line-height | Dùng cho |
|---|---|---|
| `display-xl` | 72 / 1.0, tracking -0.03em | Hero landing |
| `display-lg` | 56 / 1.05, tracking -0.025em | Từ vựng trên thẻ tra từ |
| `h1` | 36 / 1.15 | Tiêu đề trang |
| `h2` | 24 / 1.3 | Tiêu đề section |
| `h3` | 18 / 1.4 | Tiêu đề card |
| `body` | 15 / 1.6 | Nội dung |
| `small` | 13 / 1.5 | Meta, nhãn |
| `overline` | 11 / 1.4, uppercase, tracking 0.12em | Nhãn section ("BIẾN THỂ") |

Trên mobile, `display-xl` → 44px, `display-lg` → 40px.

**Chữ gradient** (chỉ dùng cho tiêu đề hero và từ vựng chính):

```css
.text-gradient {
  background: var(--gradient-text);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

---

## 4. Không gian, bo góc, lưới

- **Spacing scale (px)**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- **Bo góc**: `--radius-sm: 8px` (badge, input nhỏ) · `--radius-md: 12px` (nút, input) · `--radius-lg: 20px` (card) · `--radius-xl: 28px` (khung lớn, modal) · `--radius-full` (pill, avatar).
- **Container**: tối đa 1200px, gutter 24px (desktop) / 16px (mobile).
- **Lưới app**: sidebar 248px + nội dung. Nội dung dùng lưới 12 cột, **tận dụng hết chiều ngang**; không để một card hẹp trơ trọi giữa màn hình.
- Khoảng cách giữa các section trên landing: 96–128px.

---

## 5. Bề mặt (Surfaces)

### Card tiêu chuẩn
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
```

### Card kính (glass) — cho khung nổi, popover, thẻ trên nền glow
```css
.glass {
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-xl);
}
```

### Viền gradient phát sáng — cho card nổi bật (từ của ngày, gói Pro)
```css
.card-highlight { position: relative; }
.card-highlight::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
  background: var(--gradient-border);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  pointer-events: none;
}
```

### Nền trang
- Luôn có **một nguồn sáng** `--hero-radial` ở phía trên nội dung chính.
- Có thể thêm lưới chấm mờ (dot grid, opacity 0.04–0.06) hoặc noise texture rất nhẹ để nền không bị "chết".
- Light mode: giữ radial nhưng nhạt, bỏ noise.

---

## 6. Hình ảnh & vật thể 3D

**Đây là thứ giúp app không còn trông "AI generic". Không được bỏ qua.**

### 6.1 Vật thể 3D thủy tinh (bản sắc thương hiệu)
Bộ vật thể cố định: **orb (quả cầu), torus (vòng xuyến), ngôi sao 4 cánh, khối nón**. Chất liệu thủy tinh/obsidian đen ánh tím, viền phản chiếu tím.

- **Nguồn**: tạo bằng Spline (xuất PNG/WebP nền trong suốt), hoặc AI tạo ảnh với prompt cố định:
  > `glossy black glass [torus|sphere|four-pointed star|cone], iridescent violet rim light, studio render, transparent background, isometric, high detail, octane render`
- **Xuất 2 phiên bản**: dark (đen ánh tím) và light (trắng sữa/tím pastel), đổi theo theme.
- **Vị trí**: 2–4 vật thể quanh hero hoặc quanh khối nội dung chính, **chồng lên mép card** để tạo chiều sâu. Trong màn học (Nghe chép, Ôn thẻ) tối đa 1 vật thể, nhỏ, ở góc.
- **Định dạng**: WebP/AVIF, ≤ 150KB mỗi ảnh, `loading="lazy"` trừ ảnh hero.

### 6.2 Ảnh minh họa từ vựng
- **Mỗi thẻ từ vựng phải có ảnh.** Nguồn theo thứ tự ưu tiên: ảnh tự tạo theo bộ style → Unsplash/Pexels API theo từ khóa → minh họa placeholder có gradient + icon.
- Style đồng bộ: ảnh được phủ lớp tint tím nhẹ (`mix-blend-mode: luminosity` + overlay `--primary-soft`) để hòa vào giao diện; hover thì bỏ tint, hiện màu gốc.
- Tỉ lệ 4:3, bo `--radius-lg`.

### 6.3 Mascot
- Một nhân vật riêng (gợi ý: một "vòng lặp" nhỏ phát sáng có mắt, hình dạng lấy từ torus của bộ 3D).
- Xuất hiện ở: màn Hôm nay (chào), khi đạt streak, trạng thái trống, khi trả lời sai (động viên), màn chúc mừng.
- Dùng **Lottie** cho các trạng thái: idle, vui, buồn, ăn mừng.

### 6.4 Icon
- **Tuyệt đối không dùng emoji làm icon UI.**
- Dùng **Phosphor Icons** (weight `regular` mặc định, `fill` hoặc `duotone` khi active). Size 20px trong UI, 24px ở sidebar.
- Icon tính năng lớn (landing, empty state): icon 3D cùng chất liệu thủy tinh với bộ vật thể.

---

## 7. Component

### Nút
| Loại | Style |
|---|---|
| **Primary** | Nền đặc `--btn-primary`, chữ trắng, `--radius-md`, cao 44px. Không gradient, không glow. Hover: `--btn-primary-hover` + bóng đổ nhẹ. |
| **Secondary (dark)** | Nền trắng, chữ đen (giống "Start for free" trong ảnh tham khảo). Light mode: nền `--text`, chữ trắng. |
| **Ghost** | Nền trong suốt, viền `--border-strong`, hover nền `--surface-hover`. |
| **Icon button** | 40×40, `--radius-md`, viền `--border`. |

### Pill thông báo (giống "NEW · Latest integration")
Pill `--radius-full`, viền `--border-strong`, nền `--surface-glass`, bên trong có badge nhỏ gradient + chữ `small`. Dùng cho: "Mới: Bài học Business English", "Streak 7 ngày 🔥" (chỉ emoji ở nội dung, không ở icon).

### Navigation
- **Top nav landing**: dạng pill glass nổi ở giữa, logo bên trái, CTA bên phải.
- **Sidebar app**: nền `--bg-elevated`, item active có nền `--primary-soft`, thanh sáng 2px bên trái màu `--primary` và icon chuyển sang `fill`.

### Thẻ Tra từ (màn quan trọng nhất)
Bố cục 2 cột trên desktop:
- **Cột trái (7/12)**: ảnh minh họa lớn → từ (`display-lg`, gradient) + badge CEFR → tab loại từ (segmented control) → 2 nút phát âm UK/US → danh sách nghĩa.
- **Cột phải (5/12)**: họ từ (word family), collocation, từ đồng nghĩa/trái nghĩa, **vòng tiến độ ghi nhớ** của từ này, danh sách "Xuất hiện trong bài học" dạng thẻ có thumbnail.
- Vật thể 3D nhỏ chồng lên góc trên phải của card.

### Nút phát âm
Pill chứa: vòng tròn màu (UK = `--primary`, US = `--info`) + nhãn + IPA. Khi phát: vòng tròn biến thành **sóng âm 3 vạch** nhảy theo nhịp.

### Flashcard (Ôn thẻ)
Mặt trước: ảnh + từ. Mặt sau: nghĩa + ví dụ. Lật 3D. Bên dưới: 4 nút đánh giá (Quên / Khó / Được / Dễ) với màu trạng thái.

### Badge CEFR
A1–A2: `--success` · B1–B2: `--info` · C1–C2: `--accent-2`. Nền là màu đó ở opacity 0.15, chữ là màu đó.

### Tiến độ
- Thanh tiến độ: nền `--border`, phần đầy dùng `--gradient-primary` có ánh sáng chạy (shimmer) khi đang tăng.
- Vòng tiến độ: SVG, stroke gradient, số ở giữa đếm lên khi xuất hiện.

### Streak & XP
Ngọn lửa streak là Lottie (lửa cháy nhẹ lặp lại). Khi tăng streak: phóng to + đổi số dạng "lật" (flip counter).

---

## 8. Chuyển động (Motion)

Thư viện: **Motion (Framer Motion)** cho React, **Lottie** cho mascot/streak, **canvas-confetti** cho ăn mừng. CSS thuần cho hover đơn giản.

### Token
```css
--ease-out:    cubic-bezier(0.22, 1, 0.36, 1);   /* mặc định, vào mượt */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* nảy nhẹ, cho nút và thành tích */
--dur-fast:    150ms;  /* hover màu, focus */
--dur-base:    250ms;  /* hover nâng card, mở dropdown */
--dur-slow:    450ms;  /* xuất hiện section, lật thẻ */
--dur-hero:    800ms;  /* intro landing */
```

### Hover (bắt buộc cho mọi phần tử bấm được)
| Phần tử | Hiệu ứng |
|---|---|
| Card | `translateY(-4px)`, viền đổi sang `--border-strong`, glow tăng. |
| Card có ảnh | Như trên + ảnh `scale(1.05)` trong khung, bỏ tint tím. |
| Nút primary | Glow mạnh hơn, gradient dịch chuyển (background-position), `scale(1.02)`. Nhấn: `scale(0.97)`. |
| Nút secondary/ghost | Đổi nền, mũi tên (nếu có) trượt sang phải 4px. |
| Card nổi bật | **Spotlight**: vầng sáng tròn đi theo con trỏ bên trong card (dùng CSS var `--mx`, `--my`). |
| Item sidebar | Nền đổi mượt, icon nhích nhẹ sang phải 2px. |
| Chip biến thể từ | Nâng nhẹ + viền tím. |

```css
/* Spotlight đi theo chuột */
.spotlight {
  background:
    radial-gradient(400px circle at var(--mx) var(--my), rgba(139,92,246,0.15), transparent 40%),
    var(--surface);
}
```

### Xuất hiện
- **Khi cuộn tới**: fade + `translateY(24px → 0)`, `--dur-slow`, các phần tử con xuất hiện so le (stagger 60ms).
- **Hero landing**: tiêu đề hiện theo từng từ (stagger 80ms, blur 8px → 0); dashboard preview trượt lên từ dưới với perspective nghiêng nhẹ rồi thẳng lại.
- **Số liệu**: đếm từ 0 lên giá trị thật.

### Chuyển động liên tục (ambient)
- **Vật thể 3D trôi nổi**: `translateY` ±12px + xoay ±6°, chu kỳ 6–9 giây, mỗi vật thể lệch pha nhau.
- **Parallax**: vật thể 3D di chuyển nhẹ ngược hướng chuột (tối đa 20px) trên landing.
- **Glow nền "thở"**: opacity radial dao động 0.8 ↔ 1, chu kỳ 8 giây.
- Trong màn học: **tắt parallax**, giữ trôi nổi rất chậm để không gây mất tập trung.

### Phản hồi học tập (giống các app học tiếng Anh)
| Sự kiện | Hiệu ứng |
|---|---|
| Trả lời đúng | Card viền xanh + nảy nhẹ (spring), dấu tích vẽ nét (stroke draw), âm thanh "ting", +XP bay lên và mờ dần. |
| Trả lời sai | Card rung ngang (shake 3 lần, 300ms), viền đỏ, mascot biểu cảm động viên. |
| Lưu từ | Icon bookmark nảy + các hạt nhỏ toả ra; số trên badge "Ôn thẻ" tăng với hiệu ứng lật. |
| Hoàn thành bài | Confetti tím–hồng–vàng, mascot ăn mừng, vòng tiến độ chạy tới 100%. |
| Lên streak | Lửa phóng to, số lật, pill thông báo trượt xuống từ trên. |
| Lật flashcard | `rotateY(180deg)`, `--dur-slow`, `--ease-out`, có `perspective: 1000px`. |

### Chuyển trang / chuyển tab
- Đổi tab (Tra từ / Ôn thẻ / Trắc nghiệm): chỉ báo active **trượt** giữa các tab (layout animation), nội dung crossfade.
- Đổi trang: fade + dịch 8px, `--dur-base`.

### Giảm chuyển động
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
Khi bật: tắt trôi nổi, parallax, confetti; giữ đổi màu khi hover và phản hồi đúng/sai bằng màu + icon.

---

## 9. Quy tắc cho Light mode

- Không đảo màu máy móc. Nền dùng `#FAF8FF` (ánh lavender), card trắng có bóng tím rất nhẹ.
- Glow chuyển thành **bóng đổ màu tím mờ** (`--glow-primary` phiên bản light).
- Vật thể 3D dùng bộ ảnh phiên bản sáng.
- Chữ gradient dùng từ `--text` xuống `--accent` (tím đậm), vẫn phải đọc rõ.
- Nút chuyển theme: icon mặt trời/mặt trăng xoay 180° khi đổi; toàn trang chuyển màu mượt 300ms (`transition: background-color, color, border-color`).
- Lưu lựa chọn của người dùng; lần đầu theo `prefers-color-scheme`.

---

## 10. Khả năng tiếp cận

- Tương phản chữ tối thiểu **4.5:1** ở cả hai chế độ (kiểm tra `--text-muted` trên `--surface`).
- Focus ring: `outline: 2px solid var(--primary); outline-offset: 2px;` — không được xoá.
- Mọi nút icon có `aria-label` tiếng Việt.
- Nút phát âm dùng được bằng bàn phím (Space/Enter).
- Hover không phải là cách duy nhất để thấy thông tin quan trọng (mobile không có hover).
- Vùng chạm tối thiểu 44×44px trên mobile.

---

## 11. Responsive

| Breakpoint | Hành vi |
|---|---|
| ≥ 1280px | Sidebar đầy đủ, thẻ tra từ 2 cột, vật thể 3D đầy đủ. |
| 768–1279px | Sidebar thu thành icon, thẻ tra từ 2 cột hẹp. |
| < 768px | Sidebar thành thanh điều hướng dưới đáy (5 mục), nội dung 1 cột, vật thể 3D giảm còn 1–2 và nhỏ lại, tắt parallax. |

---

## 12. Nên / Không nên

**Nên**
- Mỗi màn hình có ít nhất **một điểm nhấn hình ảnh** (ảnh từ vựng, vật thể 3D, mascot hoặc minh họa).
- Dùng khoảng trống có chủ đích, nhưng tận dụng hết chiều ngang ở màn app.
- Để từ vựng và phát âm là thứ to và nổi bật nhất trên màn học.
- Mọi phần tử bấm được đều có hover, active và focus.

**Không nên**
- Dùng emoji làm icon UI.
- Để một card nhỏ trơ trọi giữa nền trống.
- Tô tím toàn bộ mảng lớn, hoặc dùng quá 2 gradient trên một màn hình.
- Animation dài hơn 800ms cho thao tác thường ngày.
- Đặt chuyển động liên tục ngay cạnh vùng người dùng đang đọc/nghe.
- Hardcode màu, cỡ chữ, thời lượng animation thay vì dùng token.

---

## 13. Hướng dẫn cho Claude Code

Khi làm bất kỳ giao diện nào trong dự án:
1. Đọc lại file này trước khi bắt đầu.
2. Dùng token ở mục 2, 4, 8 — không tự đặt giá trị mới. Nếu cần token mới, thêm vào file này trước.
3. Kiểm tra cả **dark và light** cho mỗi màn hình.
4. Sau khi sửa, chụp màn hình (Playwright) ở 1440px và 390px, cả hai theme, và tự đối chiếu với mục 12 "Nên / Không nên".
5. Liệt kê những chỗ chưa có ảnh/vật thể 3D thật và đang dùng placeholder.
