# LinguaLoop — Đặc tả chức năng & màn hình theo vai trò

> **Mục đích tài liệu:** mô tả đủ chi tiết từng màn hình, từng thành phần giao diện và từng trạng thái để (1) đưa cho AI thiết kế (Figma AI / Figma Make / v0…) sinh giao diện, (2) làm căn cứ code frontend React + Tailwind và API backend.
>
> **Căn cứ:** `V1__init_schema.sql`, `V2__seed_reference_data.sql`, khảo sát 34 người học (27–28/09/2026).
>
> **Nguyên tắc:** chỉ đặc tả chức năng mà schema hiện tại hỗ trợ. Những gì khảo sát muốn nhưng schema chưa có được gom riêng ở **Mục 12 – Khoảng trống schema**, gắn nhãn `[CẦN BỔ SUNG SCHEMA]`.

---

## Mục lục

1. Kết quả khảo sát → quyết định sản phẩm
2. Vai trò (actor) & ma trận quyền
3. Gói Free / Pro
4. Phạm vi & ưu tiên cho 12 tuần / 2 người
5. Hướng dẫn thiết kế chung (design system)
6. Sơ đồ trang & điều hướng theo vai trò
7. Đặc tả màn hình
   - 7.1 Khách (chưa đăng nhập)
   - 7.2 Onboarding & kiểm tra đầu vào
   - 7.3 Người dùng (Free)
   - 7.4 Khác biệt của Người dùng Pro
   - 7.5 Giáo viên
   - 7.6 Admin
   - 7.7 Thành phần dùng chung (modal, toast…)
8. Luồng nghiệp vụ chính
9. Quy tắc nghiệp vụ tổng hợp
10. Dữ liệu mẫu cho mockup
11. Cách dùng tài liệu này với AI Figma
12. Khoảng trống schema & đề xuất bổ sung

---

## 1. Kết quả khảo sát → quyết định sản phẩm

**Mẫu:** 34 người, phần lớn sinh viên 18–22 tuổi. Trình độ: B1–B2 (16), A1–A2 (7), không rõ (7), mất gốc (4). Mục đích: thi TOEIC/IELTS (16), giao tiếp (15), công việc (12), phim/nhạc (6).

| # | Phát hiện | Số liệu | Quyết định cho sản phẩm | Màn hình liên quan |
|---|-----------|---------|--------------------------|--------------------|
| 1 | Thời gian học ít | 24/34 học ≤ 30 phút/ngày (11 người < 10 phút) | Kế hoạch ngày ngắn (mặc định 15 phút), mỗi việc có ước lượng phút | S-01 Trang chủ |
| 2 | Học trên cả 2 thiết bị | 22 “cả hai”, 7 chỉ điện thoại | Web **responsive**, thiết kế desktop 1440 + mobile 375. Mọi màn luyện tập phải dùng được bằng một tay trên điện thoại | Tất cả |
| 3 | Điểm chưa hài lòng số 1 là thiếu lộ trình cá nhân | 14/34 | Kiểm tra đầu vào + hồ sơ điểm yếu + kế hoạch ngày là “xương sống” | O-03…O-06, S-01, S-20 |
| 4 | Muốn test xếp trình độ | 32/34 muốn/rất muốn | Onboarding bắt buộc gợi ý làm test (cho phép bỏ qua) | O-03 |
| 5 | Muốn đo lại định kỳ | 33/34 | Nhắc kiểm tra lại mỗi 4 tuần, hiển thị biểu đồ tiến bộ | S-22, S-23 |
| 6 | Tra từ cần nghĩa Việt + audio UK/US | 12 + 12 | Thẻ kết quả tra từ ưu tiên: nghĩa Việt, 2 nút phát âm UK/US ngay trên cùng | S-03 |
| 7 | Muốn lưu từ để ôn | 28 thường xuyên | Nút “Lưu” ở mọi nơi có từ: tra từ, câu trong bài học | S-03, S-04, S-12, S-13 |
| 8 | SRS: đa số chưa dùng thật | 22/34 chưa dùng hoặc chưa biết | Không dùng thuật ngữ “SRS/SM-2” trên UI; nói “Ôn đúng lúc sắp quên”. Có tooltip giải thích | S-05…S-09 |
| 9 | Ôn từ bằng trắc nghiệm hiệu quả nhất | Trắc nghiệm 15, lật thẻ 9, đoán nghĩa 9 | Chế độ mặc định khi ôn = Trắc nghiệm; có đủ 5 chế độ | S-08 |
| 10 | Muốn giới hạn số thẻ ôn/ngày | 27 có | Cài đặt “Số thẻ ôn tối đa mỗi ngày” (mặc định 100) | S-25 |
| 11 | Khó nhất khi nghe chép: bỏ sót từ chức năng | 11 (the, a, to), đồng âm 8, chính tả 8 | Kết quả dictation tô màu theo **loại lỗi × loại từ**, có nhãn “Từ chức năng”, “Đuôi -ed/-s/-ing” | S-13 |
| 12 | Muốn biết mình sai loại từ nào | 33/34 rất cần | Hồ sơ điểm yếu phần Dictation theo 5 nhóm loại từ | S-20 |
| 13 | Muốn chấm phát âm tự động | 34/34 cần/rất cần | Shadowing có 4 điểm: Chính xác, Trôi chảy, Đầy đủ, Ngữ điệu | S-14 |
| 14 | Chỉ ra sai âm vị + video khẩu hình | 29/34 chấm 4–5 | Kết quả shadowing bấm vào từ → xem từng âm vị, âm bị nhầm, mẹo sửa (Free), video khẩu hình (Pro) | S-15 |
| 15 | Lưu bản ghi âm | 23 có, **9 cần giải thích rõ**, 2 không | Màn đồng ý dữ liệu viết rõ mục đích, cho phép từ chối mà vẫn dùng được app | O-02, S-26 |
| 16 | Muốn app tổng hợp điểm yếu | 34/34 | Trang “Điểm yếu của tôi” | S-20 |
| 17 | Muốn kế hoạch luyện hằng ngày | 28/34 | Trang chủ = kế hoạch hôm nay | S-01 |
| 18 | Động lực: thấy tiến bộ rõ | 19 | Biểu đồ tiến bộ, so sánh ghi âm trước/sau | S-23, P-03 |
| 19 | Động lực: nhắc nhở (12), streak (11), bạn bè/BXH (8) | — | Streak tính được từ dữ liệu hiện có → làm. Nhắc nhở & BXH → Mục 12 | S-01, S-23 |
| 20 | Sẵn sàng trả phí | 14 có, 13 tuỳ giá, 7 không | Freemium: tính năng học cốt lõi miễn phí, Pro bán “chiều sâu phản hồi” | Mục 3 |
| 21 | Mức giá | < 50k: 14; 50–100k: 10; 100–200k: 4; không trả: 6 | Giá đề xuất **49.000đ/tháng** | G-02, S-27 |
| 22 | Tính năng đáng trả phí nhất | AI feedback 12, không giới hạn lượt chấm 12, hồ sơ điểm yếu đầy đủ 6, video khẩu hình 4 | Đúng 4 quyền lợi Pro trong `plan_limits` | Mục 3 |
| 23 | Không hài lòng vì “trả phí đắt” | 9 | Hiển thị rõ Free được gì; không khoá tính năng học cốt lõi | G-02 |
| 24 | “Nội dung không cập nhật” | 10 | Có vai trò Giáo viên tự đăng bài; hiển thị nhãn “Mới” cho bài < 14 ngày | S-10, T-* |

---

## 2. Vai trò (actor) & ma trận quyền

### 2.1 Định nghĩa

| Vai trò | Cách xác định trong DB | Mô tả |
|---------|------------------------|-------|
| **Khách** | Chưa đăng nhập | Xem landing, bảng giá, đăng ký/đăng nhập. |
| **Người dùng (Free)** | `users.role = 'student'` và `v_user_plan.plan = 'free'` | Người học. Dùng mọi tính năng học cốt lõi với hạn mức. |
| **Người dùng Pro** | `users.role = 'student'` và `v_user_plan.plan = 'pro'` (có `user_subscriptions` còn hạn) | Như Free + 4 quyền lợi Pro + nội dung `is_pro = true`. Pro **không phải role** mà là trạng thái gói; hết hạn tự về Free. |
| **Giáo viên** | `users.role = 'instructor'` | Tạo và đăng nội dung **trực tiếp, không cần admin duyệt** (mọi thao tác ghi `content_audit_log`). Quản lý nội dung ngôn ngữ (từ điển, âm vị, câu hỏi kiểm tra), duyệt mức CEFR do AI gợi ý. Giáo viên vẫn có thể học như người dùng. |
| **Admin** | `users.role = 'admin'` | Vận hành hệ thống: người dùng, gói, hạn mức, duyệt bộ từ công khai **do học viên** tạo, xử lý báo lỗi nội dung, xem nhật ký. **Không** chỉnh chuyên môn ngôn ngữ (theo ghi chú schema mục 11), trừ khi xử lý báo lỗi. |

### 2.2 Ma trận quyền

Ký hiệu: ✅ được dùng · 🔒 giới hạn/hạn mức · ❌ không · ⭐ chỉ Pro

| Nhóm chức năng | Khách | Free | Pro | Giáo viên | Admin |
|---|---|---|---|---|---|
| Đăng ký / đăng nhập / hồ sơ | ✅ đăng ký | ✅ | ✅ | ✅ | ✅ |
| Kiểm tra đầu vào & đo lại | ❌ | ✅ | ✅ | ✅ | ❌ |
| Tra từ điển, lưu từ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Bộ từ hệ thống/công khai miễn phí | ❌ | ✅ | ✅ | ✅ | ✅ xem |
| Bộ từ / bài học `is_pro` | ❌ | ❌ thấy khoá | ⭐ | ✅ | ✅ xem |
| Tạo bộ từ riêng (private) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Gửi bộ từ công khai | ❌ | ✅ chờ admin duyệt | ✅ chờ admin duyệt | ✅ đăng ngay | ❌ |
| Học/ôn thẻ (SRS) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Dictation (nghe chép) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Shadowing – chấm điểm | ❌ | 🔒 5 lượt/ngày | 🔒 200 lượt/ngày | ✅ | ❌ |
| Mẹo sửa âm tĩnh (`phoneme_confusions`) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Video khẩu hình âm vị | ❌ | ❌ | ⭐ | ✅ | ✅ xem |
| AI feedback cá nhân hoá | ❌ | ❌ | ⭐ 100/ngày | ✅ | ❌ |
| Hồ sơ điểm yếu | ❌ | 🔒 tóm tắt (top 3) | ⭐ đầy đủ | ✅ | ❌ |
| Kế hoạch ngày | ❌ | ✅ | ✅ | ✅ | ❌ |
| Báo lỗi nội dung | ❌ | ✅ | ✅ | ✅ | — |
| Quản lý topic / bài học / câu | ❌ | ❌ | ❌ | ✅ | ✅ xem, sửa khi xử lý báo lỗi |
| Duyệt CEFR do AI gợi ý | ❌ | ❌ | ❌ | ✅ | ❌ |
| Quản lý từ điển, âm vị, cặp tối thiểu, câu hỏi test | ❌ | ❌ | ❌ | ✅ | ❌ |
| Duyệt bộ từ công khai của học viên | ❌ | ❌ | ❌ | ❌ | ✅ |
| Xử lý báo lỗi nội dung | ❌ | ❌ | ❌ | 👁 xem báo lỗi nội dung của mình | ✅ |
| Quản lý người dùng, vai trò, khoá tài khoản | ❌ | ❌ | ❌ | ❌ | ✅ |
| Quản lý gói, hạn mức, đăng ký Pro | ❌ | ❌ | ❌ | ❌ | ✅ |
| Nhật ký nội dung (audit log) | ❌ | ❌ | ❌ | 👁 của mình | ✅ toàn bộ |

> Ghi chú: Giáo viên/Admin khi dùng tính năng chấm điểm vẫn đi qua `usage_counters`; đề xuất coi họ như Pro để test nội dung.

---

## 3. Gói Free / Pro

### 3.1 Hạn mức (bảng `plan_limits`, cấu hình được bởi Admin)

| Tính năng (`feature_code`) | Tên hiển thị | Free | Pro | Chu kỳ |
|---|---|---|---|---|
| `shadowing_assess` | Lượt chấm phát âm shadowing | 5 | 200 | ngày |
| `ai_feedback` | Gợi ý AI cá nhân hoá | 0 (khoá) | 100 | ngày |
| `mouth_video` | Video khẩu hình âm vị | 0 (khoá) | Không giới hạn | — |
| `weakness_full` | Hồ sơ điểm yếu đầy đủ | 0 (chỉ tóm tắt) | Không giới hạn | — |

Ngoài ra: nội dung có `is_pro = true` (bộ từ, bài học) chỉ Pro mở được.

> Trên UI gọi 200 lượt/ngày là **“Không giới hạn\*”** với chú thích “\*giới hạn sử dụng hợp lý 200 lượt/ngày” — khớp đúng mong muốn khảo sát (“Không giới hạn lượt chấm shadowing/ngày”).

### 3.2 Giá đề xuất (theo khảo sát, `user_subscriptions.total_months`)

| Gói | Giá | Ghi chú |
|---|---|---|
| Free | 0đ | — |
| Pro 1 tháng | 49.000đ | 14/34 chấp nhận < 50k; 24/34 chấp nhận ≤ 100k |
| Pro 3 tháng | 129.000đ | ~43k/tháng, nhãn “Tiết kiệm 12%” |
| Pro 12 tháng | 399.000đ | ~33k/tháng, nhãn “Phổ biến nhất” |

Trạng thái đăng ký: `active` (đang dùng), `cancelled` (đã huỷ gia hạn nhưng **vẫn Pro đến `expires_at`**), `refunded` (đã hoàn tiền, mất Pro).

---

## 4. Phạm vi & ưu tiên cho 12 tuần / 2 người

Ước lượng thực tế: 2 người × 12 tuần không kịp làm hết mọi màn hình ở mức hoàn thiện. Đề xuất chia MoSCoW và 4 giai đoạn.

| Mức | Nội dung | Mã màn hình |
|---|---|---|
| **Must** | Đăng ký/đăng nhập, hồ sơ, đồng ý dữ liệu; Thư viện bài học; Dictation; Shadowing + chấm Azure + kết quả từ/âm vị; Tra từ + lưu từ; Bộ từ + học/ôn thẻ SRS; Kiểm tra đầu vào; Hồ sơ điểm yếu (tóm tắt); Kế hoạch ngày; Gói Pro + paywall + hạn mức; Giáo viên: CRUD topic/bài học/câu; Admin: người dùng, báo lỗi | G-01…G-05, O-01…O-06, S-01…S-17, S-20, S-25…S-28, T-01…T-06, A-01…A-05 |
| **Should** | AI feedback; video khẩu hình; hồ sơ điểm yếu đầy đủ; so sánh ghi âm trước/sau; đo lại định kỳ; hàng đợi ôn câu; tạo bộ từ riêng; streak; duyệt CEFR AI; duyệt bộ từ học viên; audit log | P-01…P-04, S-18, S-19, S-21…S-23, T-07, T-08, A-06, A-07 |
| **Could** | Luyện cặp tối thiểu; bảng IPA; quản lý từ điển/âm vị/câu hỏi test trên UI (giai đoạn đầu nhập bằng seed SQL); quản lý hạn mức trên UI | S-29, S-30, T-09…T-12, A-08, A-09 |
| **Won't (đợt này)** | Nhắc nhở push/email, bảng xếp hạng/bạn bè, ứng dụng mobile native, cổng thanh toán thật (dùng sandbox) | Mục 12 |

| Giai đoạn | Tuần | Mục tiêu |
|---|---|---|
| 1 | 1–3 | Thiết kế Figma, auth, hồ sơ, khung layout, thư viện bài học, dictation |
| 2 | 4–6 | Shadowing + Azure, kết quả âm vị, tra từ, lưu từ, bộ từ & SRS. **Chốt cam kết sản phẩm trước tuần 6** |
| 3 | 7–9 | Kiểm tra đầu vào, hồ sơ điểm yếu, kế hoạch ngày, Pro & hạn mức, trang giáo viên |
| 4 | 10–12 | Admin, AI feedback, hoàn thiện, test người dùng thật (quay lại nhóm 34 người khảo sát), sửa lỗi |

---

## 5. Hướng dẫn thiết kế chung (design system)

### 5.1 Tinh thần

- Đối tượng chính: sinh viên 18–22, học ngắn 10–30 phút → giao diện **gọn, tập trung, ít chữ**, mỗi màn hình luyện tập chỉ có **một hành động chính**.
- Phong cách: sạch, thân thiện, hiện đại, không trẻ con. Nhiều khoảng trắng, bo góc mềm, minh hoạ phẳng.
- Ngôn ngữ giao diện mặc định **tiếng Việt** (`users.ui_language = 'vi'`), hỗ trợ đổi sang tiếng Anh. Nội dung học (câu, từ) bằng tiếng Anh.

### 5.2 Màu sắc (token)

| Token | Light | Dark | Dùng cho |
|---|---|---|---|
| `primary` | #4F46E5 (indigo) | #818CF8 | Nút chính, liên kết, tab đang chọn |
| `primary-soft` | #EEF2FF | #1E1B4B | Nền thẻ được chọn |
| `accent` | #14B8A6 (teal) | #2DD4BF | Nút ghi âm, sóng âm, tiến độ |
| `pro` | #F59E0B (vàng hổ phách) | #FBBF24 | Huy hiệu PRO, ổ khoá, paywall |
| `success` | #16A34A | #4ADE80 | Đúng, điểm ≥ 80 |
| `warning` | #D97706 | #FBBF24 | Điểm 60–79, sai chính tả |
| `danger` | #DC2626 | #F87171 | Sai, điểm < 60, xoá |
| `neutral-*` | thang xám slate 50–900 | — | Chữ, viền, nền |
| `bg` | #F8FAFC | #0F172A | Nền trang |
| `surface` | #FFFFFF | #1E293B | Thẻ, modal |

**Thang màu điểm (dùng thống nhất ở mọi nơi):** ≥ 80 xanh lá · 60–79 vàng cam · < 60 đỏ. Ngưỡng 60 khớp với định nghĩa “lỗi âm vị” trong view `v_user_phoneme_stats` (`accuracy_score < 60`).

**Màu kết quả từng từ (`sentence_attempt_words.outcome`):**

| outcome | Hiển thị |
|---|---|
| `correct` | chữ xanh lá |
| `omitted` (bỏ sót) | ô trống viền đứt đỏ, hiện từ đúng màu xám bên trong, gạch dưới chấm |
| `substituted` (nhầm từ) | chữ bạn gõ gạch ngang đỏ + từ đúng màu xanh phía trên |
| `misspelled` (sai chính tả) | nền vàng nhạt, chữ sai được tô đậm ký tự sai |
| `inserted` (thừa từ) | chữ tím gạch ngang |
| `mispronounced` (phát âm sai – shadowing) | chữ đỏ, gạch chân sóng, bấm được để xem âm vị |

### 5.3 Chữ

- Font chính: **Be Vietnam Pro** (hỗ trợ tiếng Việt tốt). Font IPA: **Noto Sans** (hiển thị đúng ký hiệu /θ/ /ð/ /ʒ/ /ə/…).
- Thang: Display 36/44 bold · H1 28/36 · H2 22/30 · H3 18/26 semibold · Body 16/24 · Small 14/20 · Caption 12/16.
- Câu luyện tập (dictation/shadowing) hiển thị cỡ **22–24px** để dễ đọc.

### 5.4 Lưới & kích thước

- Lưới 4px (khớp Tailwind). Bo góc: nút 10px, thẻ 16px, modal 20px.
- Breakpoint: Desktop **1440** (nội dung max 1200), Tablet **768**, Mobile **375**.
- Nút chạm tối thiểu 44×44px. Nút ghi âm trên mobile ≥ 72px, đặt ở vùng dễ chạm bằng ngón cái (giữa dưới).

### 5.5 Thành phần cơ bản cần có trong thư viện Figma

Button (primary / secondary / ghost / danger / pro), Input, Textarea, Select, Checkbox, Radio, Toggle, Tabs, Badge (CEFR A1–C2 mỗi mức một màu, PRO, Mới, Trạng thái), Chip lọc, Card (bài học, bộ từ, thẻ từ), Progress bar, Progress ring (điểm), Stat tile, Avatar, Table (có sắp xếp, phân trang, hàng chọn nhiều), Empty state, Skeleton loading, Toast, Modal, Drawer, Tooltip, Audio button (UK/US), Audio player có tốc độ 0.5×/0.75×/1×, Video player YouTube có vòng lặp câu, Nút ghi âm (idle / recording có sóng âm / processing / done), Stepper, Quota meter (“Còn 3/5 lượt hôm nay”), Paywall banner.

**Badge CEFR:** A1 #22C55E · A2 #84CC16 · B1 #06B6D4 · B2 #3B82F6 · C1 #8B5CF6 · C2 #EC4899.

### 5.6 Trạng thái bắt buộc cho mọi màn danh sách/dữ liệu

`loading` (skeleton), `empty` (minh hoạ + câu hướng dẫn + nút hành động), `error` (thông báo + nút Thử lại), `no-permission` (khoá + lý do), và với tính năng Pro: `locked` (mờ + icon khoá vàng + nút “Nâng cấp Pro”).

---

## 6. Sơ đồ trang & điều hướng theo vai trò

### 6.1 Khung layout

- **Desktop – Người dùng:** thanh trên cùng (logo, ô tra từ nhanh, streak 🔥, huy hiệu gói, avatar) + sidebar trái (menu).
- **Mobile – Người dùng:** thanh trên (logo, tra từ, avatar) + **thanh điều hướng dưới 5 mục**: Hôm nay · Bài học · Từ vựng · Điểm yếu · Tôi.
- **Giáo viên / Admin:** layout quản trị: sidebar trái cố định, header có breadcrumb, nội dung dạng bảng. Có công tắc “Chuyển sang giao diện học viên” (chỉ Giáo viên).

### 6.2 Menu Người dùng (Free / Pro)

```
Hôm nay (S-01)
Bài học
 ├─ Thư viện chủ đề & bài (S-10)
 ├─ Chi tiết bài (S-11) → Dictation (S-12/S-13) | Shadowing (S-14/S-15)
 └─ Câu cần ôn lại (S-18)
Từ vựng
 ├─ Tra từ (S-03)
 ├─ Từ của tôi (S-04)
 ├─ Thư viện bộ từ (S-05) → Chi tiết bộ (S-06) → Học/Ôn (S-08) → Tổng kết (S-09)
 └─ Bộ từ của tôi (S-07)
Điểm yếu (S-20) → Luyện sửa lỗi (S-21), Cặp âm tối thiểu (S-29)
Tiến độ (S-23) → Kiểm tra lại trình độ (S-22)
Bảng âm IPA (S-30)
Tôi
 ├─ Hồ sơ & cài đặt (S-25)
 ├─ Quyền riêng tư & dữ liệu (S-26)
 ├─ Gói Pro & thanh toán (S-27)
 └─ Báo lỗi đã gửi (S-28)
```

### 6.3 Menu Giáo viên

```
Tổng quan (T-01)
Chủ đề (T-02)
Bài học (T-03) → Soạn bài & cắt câu (T-04/T-05)
Duyệt CEFR do AI gợi ý (T-07)
Bộ từ vựng (T-06) → Soạn thẻ
Từ điển (T-09)
Ngữ âm: Âm vị · Nhầm âm · Cặp tối thiểu (T-10)
Ngân hàng câu hỏi kiểm tra (T-11)
Báo lỗi về nội dung của tôi (T-08)
Lịch sử thay đổi của tôi (T-12)
```

### 6.4 Menu Admin

```
Tổng quan (A-01)
Người dùng (A-02) → Chi tiết (A-03)
Báo lỗi nội dung (A-04) → Chi tiết xử lý (A-05)
Duyệt bộ từ công khai (A-06)
Nhật ký nội dung (A-07)
Gói & hạn mức (A-08)
Đăng ký Pro (A-09)
Danh mục lỗi (A-10)
```

---

## 7. Đặc tả màn hình

Mỗi màn hình theo cấu trúc: **Mục đích · Vai trò · Đường dẫn · Bố cục · Thành phần & dữ liệu · Hành động · Trạng thái · Quy tắc · Khác biệt Free/Pro**.

---

### 7.1 Khách (chưa đăng nhập)

#### G-01. Trang giới thiệu (Landing)

- **Đường dẫn:** `/`
- **Mục đích:** thuyết phục sinh viên đăng ký; nói đúng 3 “nỗi đau” khảo sát: không có lộ trình, không biết sai ở đâu, app phí đắt.
- **Bố cục (desktop, từ trên xuống):**
  1. **Header:** logo LinguaLoop, liên kết “Tính năng”, “Bảng giá”, nút “Đăng nhập” (ghost), “Bắt đầu miễn phí” (primary).
  2. **Hero:** tiêu đề “Biết chính xác bạn sai ở đâu — sửa trong 15 phút mỗi ngày”; mô tả ngắn; nút “Làm bài kiểm tra trình độ miễn phí”; minh hoạ bên phải = mockup màn kết quả shadowing với từ “think” bị tô đỏ, bong bóng “Bạn đọc /θ/ thành /t/”.
  3. **3 cột lợi ích:** (a) Nghe chép – chỉ rõ bạn hay bỏ sót từ nào; (b) Shadowing – chấm phát âm tới từng âm; (c) Kế hoạch 15 phút/ngày theo điểm yếu của bạn.
  4. **Cách hoạt động (4 bước):** Kiểm tra trình độ → Luyện nghe chép & nói nhại → Xem điểm yếu → Kế hoạch mỗi ngày.
  5. **Bảng so sánh Free / Pro** (rút gọn G-02) + nút “Xem bảng giá”.
  6. **Số liệu tin cậy:** “Xây dựng từ khảo sát 34 người học”, “44 âm vị có hướng dẫn tiếng Việt”.
  7. **FAQ** (dạng accordion): Dữ liệu giọng nói của tôi được dùng thế nào? Có cần trả phí không? Học trên điện thoại được không?
  8. **Footer:** chính sách bảo mật, điều khoản, liên hệ, chọn ngôn ngữ VI/EN.
- **Mobile:** hero xếp dọc, mockup nằm dưới nút.

#### G-02. Bảng giá

- **Đường dẫn:** `/pricing`
- **Bố cục:** công tắc chu kỳ `1 tháng | 3 tháng | 12 tháng`; 2 thẻ giá cạnh nhau: **Free** và **Pro** (Pro có viền vàng, nhãn “Phổ biến nhất” khi chọn 12 tháng).
- **Nội dung thẻ Free:** 0đ · Tra từ & lưu từ không giới hạn · Học thẻ ôn đúng lúc · Nghe chép không giới hạn · 5 lượt chấm shadowing/ngày · Mẹo sửa âm tiếng Việt · Tóm tắt 3 điểm yếu hàng đầu · Kế hoạch ngày.
- **Nội dung thẻ Pro:** giá theo chu kỳ (49k/129k/399k) · Mọi thứ trong Free · Chấm shadowing không giới hạn\* · Gợi ý AI cá nhân hoá cho từng lần đọc · Video khẩu hình 44 âm vị · Hồ sơ điểm yếu đầy đủ + biểu đồ xu hướng · So sánh ghi âm trước/sau · Bài học & bộ từ PRO.
- **Hành động:** Khách bấm “Nâng cấp” → chuyển Đăng ký, sau đó quay lại thanh toán. Người dùng đã đăng nhập → S-27.
- **Bảng so sánh chi tiết** dạng bảng tick bên dưới + FAQ thanh toán, huỷ gia hạn, hoàn tiền.

#### G-03. Đăng ký

- **Đường dẫn:** `/register`
- **Trường:** Email (bắt buộc, duy nhất, không phân biệt hoa thường) · Tên người dùng (tuỳ chọn, duy nhất, 3–30 ký tự, chữ/số/gạch dưới) · Mật khẩu (≥ 8 ký tự, có chữ và số; hiện thanh độ mạnh) · Xác nhận mật khẩu · Checkbox “Tôi đồng ý Điều khoản & Chính sách bảo mật” (bắt buộc).
- **Nút phụ:** “Đăng ký bằng Google” (`users.auth_uid` lưu mã nhà cung cấp).
- **Lỗi:** email đã tồn tại → “Email này đã được dùng. Đăng nhập?”; tên người dùng đã tồn tại; mật khẩu yếu.
- **Sau khi gửi:** chuyển G-04.

#### G-04. Xác thực email

- **Đường dẫn:** `/verify-email`
- **Nội dung:** minh hoạ phong bì, “Chúng tôi đã gửi mã 6 số tới **abc@gmail.com**”, 6 ô nhập mã, nút “Xác nhận”, liên kết “Gửi lại mã (sau 60s)” có đếm ngược, liên kết “Đổi email”.
- **Quy tắc:** chưa xác thực (`email_verified = false`) vẫn đăng nhập được nhưng bị chuyển về màn này; mã hết hạn → báo lỗi và cho gửi lại.
- **Thành công:** chuyển O-01.

#### G-05. Đăng nhập & Quên mật khẩu

- **Đăng nhập (`/login`):** Email hoặc tên người dùng, Mật khẩu (có nút hiện/ẩn), “Ghi nhớ đăng nhập”, liên kết “Quên mật khẩu?”, nút Google, liên kết “Chưa có tài khoản? Đăng ký”.
- **Lỗi:** sai thông tin → “Email hoặc mật khẩu không đúng” (không nói rõ cái nào sai); tài khoản bị khoá (`disabled = true`) → “Tài khoản đã bị tạm khoá. Liên hệ hỗ trợ.”
- **Điều hướng sau đăng nhập theo vai trò:** student → S-01 (hoặc O-01 nếu chưa onboarding) · instructor → T-01 · admin → A-01.
- **Quên mật khẩu (`/forgot-password`):** nhập email → màn “Kiểm tra hộp thư” → liên kết đặt lại → màn nhập mật khẩu mới + xác nhận → thành công → Đăng nhập.

---

### 7.2 Onboarding & kiểm tra đầu vào (Người dùng mới)

Dạng **stepper 4 bước** ở đầu màn: `Mục tiêu → Quyền dữ liệu → Kiểm tra trình độ → Kết quả`. Có nút “Bỏ qua” ở bước 1 và 3.

#### O-01. Mục tiêu & thời gian rảnh

- **Câu hỏi 1 – Mục đích học** (chọn nhiều, dạng thẻ có icon): Thi TOEIC/IELTS · Giao tiếp hằng ngày · Công việc · Xem phim, nghe nhạc.
- **Câu hỏi 2 – Mỗi ngày bạn có bao nhiêu phút?** (chọn 1, dạng chip lớn): 5 · 10 · **15 (mặc định)** · 30 · 45 · 60 phút. Giá trị này dùng làm `daily_plans.time_budget_min`.
- **Câu hỏi 3 – Giọng ưu tiên:** Anh-Anh (UK) · Anh-Mỹ (US).
- **Câu hỏi 4 – Ngôn ngữ giao diện:** Tiếng Việt · English (`ui_language`).
- Nút “Tiếp tục”.
- `[CẦN BỔ SUNG SCHEMA]` mục đích học, thời gian mặc định, giọng ưu tiên chưa có cột trong `users` — xem Mục 12.

#### O-02. Quyền dữ liệu giọng nói

- **Mục đích:** 9/34 người muốn “giải thích rõ mục đích trước” → màn riêng, viết dễ hiểu.
- **Bố cục:** 2 thẻ, mỗi thẻ có icon, tiêu đề, 2–3 gạch đầu dòng giải thích, toggle bật/tắt:
  1. **Xử lý giọng nói bằng AI** (`consent_type = 'ai_processing'`): “Để chấm phát âm, bản ghi của bạn được gửi tới dịch vụ nhận dạng giọng nói (Microsoft Azure) và mô hình AI tạo gợi ý. Không dùng để quảng cáo.” — **Bắt buộc để dùng chấm shadowing.** Nếu tắt: shadowing chỉ nghe & tự đọc, không chấm.
  2. **Lưu bản ghi âm để so sánh tiến bộ** (`consent_type = 'voice_storage'`): “Chúng tôi giữ bản ghi trong 90 ngày để bạn nghe lại và so sánh trước/sau. Bạn có thể xoá bất cứ lúc nào.” — Tuỳ chọn. Nếu tắt: bản ghi bị xoá ngay sau khi chấm.
- Liên kết “Đọc chính sách đầy đủ (phiên bản v1.0)” → `policy_version`.
- **Quy tắc:** mỗi lần bật/tắt ghi 1 dòng `user_consents` (bật = `granted_at`, tắt = `revoked_at`). Thay đổi sau này ở S-26.

#### O-03. Giới thiệu bài kiểm tra trình độ

- Nội dung: “Khoảng 10 phút · 3 phần · Kết quả theo thang A1–C2 cho từng kỹ năng”. 3 thẻ nhỏ: **Từ vựng** (~3 phút), **Nghe chép** (~4 phút), **Nói nhại** (~3 phút, cần micro).
- Kiểm tra micro: nút “Thử micro” + thanh mức âm lượng; nếu từ chối quyền micro → hướng dẫn bật và cho phép bỏ qua phần Nói.
- Nút “Bắt đầu” (tạo `assessment_sessions` với `kind = 'initial'`), liên kết “Để sau, tôi tự chọn trình độ” (2/34 muốn tự chọn) → mở hộp chọn A1–C2.

#### O-04. Làm bài kiểm tra

Header cố định: tên phần, thanh tiến độ tổng, nút “Thoát” (xác nhận: “Tiến độ sẽ được lưu, bạn có thể làm tiếp sau”).

- **Phần 1 – Từ vựng (`vocab_yes_no`):** hiển thị 1 từ lớn giữa màn (vd **“resilient”**), câu hỏi “Bạn có biết nghĩa từ này không?”, 2 nút to **Biết** / **Không biết** (phím tắt ← →). Trong ngân hàng có **từ giả** (`pseudo_word`, vd “flomber”) để phát hiện đoán mò — UI không được phân biệt từ giả. Ghi `response_time_ms`.
- **Phần 2 – Nghe chép (`dictation_sentence`):** nút phát audio (tối đa **2 lần nghe**), ô nhập câu, nút “Tiếp”. Không hiện đáp án trong lúc kiểm tra.
- **Phần 3 – Nói nhại (`shadowing_sentence`):** hiện câu + nút nghe mẫu, nút ghi âm lớn (1 lần ghi, cho ghi lại 1 lần). Không hiện điểm trong lúc kiểm tra.
- **Không tính** vào hạn mức shadowing hằng ngày.

#### O-05. Đang tính kết quả

Màn chờ có animation, dòng chữ luân phiên “Đang phân tích từ vựng… phát âm…”. Tối đa ~10 giây.

#### O-06. Kết quả trình độ

- **Khối chính:** mức CEFR tổng hợp lớn (vd **B1**), kèm câu diễn giải “Bạn hiểu được ý chính của các đoạn hội thoại quen thuộc…”.
- **3 thẻ kỹ năng** (`assessment_results`, mỗi kỹ năng 1 dòng): Từ vựng · Nghe chép · Nói nhại. Mỗi thẻ: điểm 0–100, huy hiệu CEFR, **khoảng tin cậy** hiển thị dạng thanh ngang (vd 58–66, `ci_low`–`ci_high`) với chú thích “Kết quả ước tính, sẽ chính xác hơn khi bạn học thêm”.
- **Điểm yếu phát hiện được** (nếu có): 1–3 chip, vd “Hay bỏ sót từ chức năng”, “Âm /θ/”.
- **Gợi ý bắt đầu:** 3 thẻ bài học/bộ từ phù hợp mức.
- Nút chính “Xem kế hoạch hôm nay” → S-01. Ghi chú “Bạn có thể kiểm tra lại sau 4 tuần”.

---

### 7.3 Người dùng (Free)

#### S-01. Hôm nay (Trang chủ / Dashboard)

- **Đường dẫn:** `/app`
- **Mục đích:** mở app là biết ngay hôm nay cần làm gì, trong bao nhiêu phút (khảo sát #1, #3, #17).
- **Bố cục desktop (2 cột 8/4):**
  - **Cột trái:**
    1. Lời chào “Chào Minh Anh 👋” + dòng phụ “Kế hoạch 15 phút hôm nay” + nút nhỏ “Đổi thời lượng” (mở chọn 5/10/15/30/45/60 phút → tạo lại kế hoạch hôm nay).
    2. **Thẻ Kế hoạch hôm nay** (`daily_plans` + `daily_plan_items`): danh sách 3–5 việc theo `position`; mỗi dòng gồm icon theo loại, tiêu đề, **lý do** (`reason_text`, vd “Vì bạn đọc sai /θ/ 7 lần tuần này”), thời lượng ước tính (`est_minutes`), nút “Bắt đầu”, checkbox tự tick khi `completed_at` có giá trị. Thanh tiến độ tổng “2/4 việc · 8/15 phút”.
       - `srs_review`: “Ôn 20 thẻ từ vựng” (`card_count`) → S-08.
       - `weakness_drill`: “Luyện âm /θ/ với cặp think–sink” → S-21/S-29.
       - `lesson_task`: “Nghe chép bài *Ordering coffee*” (kèm `mode`) → S-12 hoặc S-14.
       - `retest`: “Đã 4 tuần — kiểm tra lại trình độ” → S-22.
    3. **Tiếp tục học:** thẻ bài học/phiên thẻ đang dở (`user_lesson_progress.completed_at IS NULL` mới nhất, `vocab_study_sessions` còn mở) với thanh tiến độ và nút “Tiếp tục”.
  - **Cột phải:**
    1. **Streak** 🔥 “5 ngày liên tiếp” + dải 7 ô ngày trong tuần (tô màu ngày có học). Streak tính từ ngày có hoạt động học (có `vocab_review_logs` hoặc `sentence_attempts` theo `users.timezone`).
    2. **Thẻ trình độ:** 3 huy hiệu CEFR theo kỹ năng (`v_user_current_level`).
    3. **Thẻ điểm yếu nổi bật:** top 3 (Free) + liên kết “Xem tất cả” (→ S-20).
    4. **Quota meter:** “Chấm shadowing: còn 3/5 lượt hôm nay” + liên kết “Nâng cấp Pro để không giới hạn” (chỉ Free).
    5. **Thẻ từ đến hạn ôn:** “12 thẻ đến hạn” (`v_user_vocab_stats.due_cards`).
- **Mobile:** 1 cột: Lời chào → Streak (thu nhỏ 1 dòng) → Kế hoạch → Tiếp tục → Điểm yếu → Quota.
- **Trạng thái:**
  - Chưa làm kiểm tra đầu vào: banner trên cùng “Làm bài kiểm tra 10 phút để có kế hoạch chính xác hơn”.
  - Hoàn thành hết kế hoạch: thẻ chúc mừng có confetti “Xong kế hoạch hôm nay!” + gợi ý “Học thêm” (tuỳ chọn).
  - Chưa có dữ liệu điểm yếu: “Hãy làm vài bài nghe chép hoặc shadowing để chúng tôi tìm điểm yếu của bạn”.
- **Quy tắc:** mỗi người tối đa 1 kế hoạch/ngày (`uq_daily_plans`); kế hoạch cố định trong ngày, không đổi mỗi lần mở app, chỉ tạo lại khi người dùng đổi thời lượng.

#### S-02. Ô tra từ nhanh (thành phần header)

- Ô tìm kiếm luôn ở header, placeholder “Tra từ tiếng Anh…”, phím tắt `/`.
- Gõ ≥ 2 ký tự → dropdown gợi ý (tìm gần đúng, nhờ index trigram) tối đa 8 dòng: headword, huy hiệu CEFR, nghĩa Việt đầu tiên. Hỗ trợ tìm theo biến thể (gõ “went” gợi ý “go”, dùng `dictionary_word_forms`).
- Enter / chọn → S-03.

#### S-03. Kết quả tra từ

- **Đường dẫn:** `/dictionary/:headword`
- **Bố cục:**
  1. **Đầu trang:** headword cỡ lớn (vd **present**), huy hiệu CEFR, nút “Lưu cả từ” (icon bookmark), nút “Báo lỗi” (icon cờ, mở M-03).
  2. **Tab theo loại từ** (`pos`): *Danh từ · Tính từ · Động từ*… vì phát âm và nghĩa khác nhau theo loại từ.
  3. Trong mỗi tab:
     - **Phát âm** (`dictionary_pronunciations` theo `word_id + pos`): 2 hàng **UK /ˈpreznt/ 🔊** và **US /ˈpreznt/ 🔊** — nút loa to, dễ bấm (khảo sát #6).
     - **Danh sách nghĩa** (`dictionary_meanings`, sắp theo `meaning_no`), mỗi nghĩa là một thẻ:
       - Số thứ tự + **nghĩa tiếng Việt** (`translation_vi`) in đậm, đặt trước (khảo sát #6).
       - Định nghĩa tiếng Anh (`definition_en`), định nghĩa tiếng Việt (`definition_vi`, thu gọn).
       - Ví dụ Anh (`example_en`) in nghiêng + dịch (`example_vi`), nút 🔊 đọc ví dụ.
       - Nút **“Lưu nghĩa này”** (toggle, đã lưu thì đổi icon đặc).
     - **Biến thể** (`dictionary_word_forms`): chip “goes · going · went · gone”.
  4. **Xuất hiện trong bài học:** tối đa 3 câu có chứa từ, bấm để mở bài.
- **Quy tắc lưu:** lưu cả từ (`meaning_id = NULL`, hiện mọi nghĩa) hoặc lưu 1 nghĩa; không lưu trùng. Toast “Đã lưu vào Từ của tôi” + nút “Hoàn tác”.
- **Không tìm thấy:** “Chưa có từ **xyz** trong từ điển” + gợi ý từ gần đúng + nút “Báo thiếu từ”.

#### S-04. Từ của tôi

- **Đường dẫn:** `/vocabulary/saved`
- **Bố cục:** thanh công cụ: ô tìm, lọc theo nguồn (Từ điển · Bài học · Thủ công — `source`), lọc CEFR, sắp xếp (mới nhất / A–Z). Nút chính **“Ôn các từ này”** (tạo phiên ôn từ các từ đã lưu).
- **Danh sách** (`v_user_saved_word_meanings`): mỗi dòng: headword + 🔊, loại từ, nghĩa Việt, CEFR, nguồn (nếu từ bài học: hiện câu gốc thu gọn, bấm mở bài — `sentence_id`), ngày lưu, menu ⋯ (Xem trong từ điển, Bỏ lưu).
- **Chọn nhiều:** xoá hàng loạt, “Thêm vào bộ từ của tôi…” (chọn bộ ở S-07).
- **Empty:** minh hoạ cuốn sổ + “Tra từ hoặc bấm vào từ trong bài học để lưu”.

#### S-05. Thư viện bộ từ vựng

- **Đường dẫn:** `/vocabulary/decks`
- **Bố cục:**
  - Tab danh mục (`vocab_deck_categories`): Tất cả · Oxford · TOEIC · IELTS · …
  - Bộ lọc: CEFR (`difficulty`), thẻ tag (`vocab_deck_tags`), “Chỉ bộ miễn phí”, nguồn (Chính thức = `system`, Cộng đồng = `public`).
  - Lưới thẻ bộ từ (desktop 3–4 cột, mobile 1 cột): ảnh (`thumbnail_url`), tên + tên Việt, huy hiệu CEFR, số bài & số thẻ (`v_vocab_deck_counts`), tag, huy hiệu **PRO** nếu `is_pro`, tác giả (Chính thức / tên giáo viên / tên học viên), thanh tiến độ của tôi (đã thuộc/tổng) nếu đã học.
- **Free bấm bộ PRO:** mở Paywall M-01.
- Chỉ hiển thị bộ `status = 'APPROVED'` và chưa xoá.

#### S-06. Chi tiết bộ từ

- **Đường dẫn:** `/vocabulary/decks/:slug`
- **Đầu trang:** ảnh, tên, mô tả, CEFR, tag, số bài/số thẻ, tác giả, nút **“Học tiếp”** (primary) và **“Ôn thẻ đến hạn (12)”**, nút “Báo lỗi”.
- **Tổng quan tiến độ:** 4 số: Mới · Đang học · Đang ôn · Đã thuộc (`user_card_progress.status`).
- **Danh sách bài (`vocab_groups`)** dạng accordion theo `sort_order`: “Bài 1 – Family (22 thẻ)”, tiến độ bài (`v_user_group_progress`: đã bắt đầu, đã thuộc, đến hạn), nút “Học bài này”. Mở ra: danh sách thẻ (từ, loại từ, nghĩa, 🔊, trạng thái).
- Bộ PRO với Free: thấy mục lục, 3 thẻ đầu bài 1 xem được, còn lại mờ + khoá.

#### S-07. Bộ từ của tôi & Soạn bộ từ

- **Danh sách (`/vocabulary/my-decks`):** thẻ bộ do tôi tạo, huy hiệu trạng thái: **Riêng tư** · **Nháp** · **Chờ duyệt** · **Đã duyệt (công khai)** · **Bị từ chối**. Nút “Tạo bộ từ mới”.
- **Trình soạn (`/vocabulary/my-decks/:id/edit`):**
  - Thông tin bộ: tên, tên Việt, danh mục, CEFR, ảnh bìa (tải lên), tag (nhập chip), chế độ hiển thị: Riêng tư / Công khai.
  - Danh sách bài (group): thêm, đổi tên, kéo thả sắp xếp, xoá (xoá mềm).
  - Trong mỗi bài: bảng thẻ, thêm thẻ bằng form (xem mô tả trường ở T-06) hoặc **“Thêm từ từ điển”** (tìm từ → tự điền nghĩa, ví dụ, phát âm) hoặc **“Thêm từ Từ của tôi”**.
  - Nút “Lưu nháp”; nếu chọn Công khai: nút **“Gửi duyệt”** → trạng thái `PENDING`, khoá chỉnh sửa đến khi admin xử lý; hiện banner “Đang chờ admin duyệt”.
  - Bị từ chối: banner đỏ + lý do (`[CẦN BỔ SUNG SCHEMA]` cột lý do từ chối) + nút “Sửa và gửi lại”.

#### S-08. Học / Ôn thẻ (phiên học)

- **Đường dẫn:** `/study/:sessionId`
- **Mục đích:** học thẻ mới (`session_type = 'learn'`) hoặc ôn thẻ đến hạn (`review`). Chỉ 1 phiên mở một lúc; nếu có phiên dở → hỏi “Tiếp tục phiên trước hay bắt đầu phiên mới?”.
- **Header:** nút ✕ thoát (lưu tiến độ), thanh tiến độ “8/20”, bộ chọn chế độ, nút ⚙.
- **5 chế độ** (`vocab_review_logs.mode`), **mặc định = Trắc nghiệm** (khảo sát #9):
  1. **Trắc nghiệm (`quiz`):** hiện từ tiếng Anh + 🔊 (+ ảnh nếu có), 4 đáp án nghĩa Việt; chọn → tô xanh/đỏ, hiện đáp án đúng + ví dụ, nút “Tiếp”.
  2. **Trắc nghiệm ngược (`reverse_quiz`):** hiện nghĩa Việt, chọn 1 trong 4 từ tiếng Anh.
  3. **Lật thẻ (`flashcard`):** mặt trước từ + phiên âm + 🔊; chạm để lật → mặt sau: nghĩa, giải thích, ví dụ, ảnh. Sau khi lật có 4 nút tự đánh giá: **Quên** · **Khó** · **Được** · **Dễ** (tương ứng quality 1/3/4/5), dưới mỗi nút ghi khoảng ôn lại dự kiến (“<1 phút”, “1 ngày”, “3 ngày”, “7 ngày”).
  4. **Đoán nghĩa (`guess`):** hiện câu ví dụ có từ được tô đậm, người học gõ nghĩa hoặc chọn; hiện đáp án.
  5. **Nghe & gõ lại (`repeat`):** nghe audio từ, gõ lại chính tả.
- **Thẻ trả lời sai** được đưa lại cuối phiên.
- **Mobile:** đáp án xếp dọc chiếm nửa dưới màn, vuốt trái/phải cho lật thẻ.
- **Ghi dữ liệu mỗi câu trả lời:** `is_correct`, `quality` 0–5, `response_ms`; cập nhật SM-2 trong `user_card_progress`.
- **Giới hạn:** số thẻ ôn/ngày không vượt `users.max_daily_reviews`; khi chạm giới hạn → màn “Bạn đã ôn đủ 100 thẻ hôm nay 🎉. Nghỉ ngơi để nhớ lâu hơn!” + nút “Ôn thêm 20 thẻ” (vượt giới hạn có chủ ý).

#### S-09. Tổng kết phiên học

- Vòng tròn % đúng, số thẻ mới học / đã ôn, thời gian, số thẻ chuyển sang “Đã thuộc”.
- Danh sách thẻ sai (từ + nghĩa + 🔊) + nút “Ôn lại các thẻ sai”.
- “Lần ôn tiếp theo: 15 thẻ vào ngày mai”.
- Nút “Về trang Hôm nay” / “Học bài tiếp theo”.

#### S-10. Thư viện bài học (Chủ đề & bài)

- **Đường dẫn:** `/lessons`
- **Bố cục:**
  - Thanh tìm kiếm theo tiêu đề bài (tìm gần đúng).
  - Bộ lọc: CEFR A1–C2 (chip chọn nhiều), Chủ đề, Loại nguồn (YouTube / Audio / Video), “Chỉ bài miễn phí”, trạng thái của tôi (Chưa học / Đang học / Đã xong), sắp xếp (Mới nhất · Phổ biến `view_count` · Ngắn nhất `duration_sec`).
  - **Theo chủ đề** (`topics`, `sort_order`): mỗi chủ đề là một hàng cuộn ngang: tên chủ đề, số bài (`v_topic_lesson_counts`), nút “Xem tất cả”.
  - **Thẻ bài học:** ảnh thumbnail 16:9 có thời lượng góc phải (vd 3:45), tiêu đề + tiêu đề Việt, huy hiệu CEFR, huy hiệu **PRO**, nhãn **Mới** (< 14 ngày), lượt xem, thanh tiến độ của tôi, 2 icon nhỏ cho biết đã làm Dictation ✓ / Shadowing ✓.
- **Gợi ý cho bạn** (trên cùng): 1 hàng bài đúng mức CEFR hiện tại.

#### S-11. Chi tiết bài học

- **Đường dẫn:** `/lessons/:slug`
- **Bố cục:** video/audio preview, tiêu đề, mô tả, CEFR, thời lượng, số câu, chủ đề, nút “Báo lỗi”.
- **2 thẻ chế độ lớn:**
  - **Nghe chép (Dictation)** — “Nghe từng câu rồi gõ lại” — điểm trung bình của tôi (`v_user_lesson_mode_scores`), số câu đã làm / tổng, thời gian đã học (`total_time_sec`), nút “Bắt đầu”/“Tiếp tục”.
  - **Nói nhại (Shadowing)** — “Nghe rồi đọc theo, được chấm phát âm” — tương tự + quota meter “Còn 3/5 lượt chấm hôm nay” (Free).
- **Danh sách câu (tab “Nội dung”):** mỗi câu: số thứ tự, text (có thể ẩn để không lộ đáp án — toggle “Hiện lời thoại”), điểm tốt nhất của tôi theo từng chế độ (`v_user_sentence_stats.best_score`), icon ghi chú nếu có.
- **Tab “Ghi chú của tôi”:** các `sentence_notes` của bài.
- **Bài PRO + Free:** hiện 2 câu đầu, còn lại khoá + Paywall.

#### S-12. Dictation – làm bài

- **Đường dẫn:** `/lessons/:slug/dictation?s=5`
- **Bố cục desktop:**
  - Trên: player video YouTube (hoặc audio) **chỉ phát đoạn của câu hiện tại** (`start_ms`–`end_ms`); ẩn phụ đề.
  - Thanh điều khiển: ▶ Phát câu (phím tắt `Ctrl`/`Tab`), ↻ Phát lại, tốc độ 0.5×/0.75×/1×, bộ đếm “Đã nghe 3 lần” (`replay_count`).
  - Giữa: ô nhập lớn (1–3 dòng, cỡ chữ 20px), placeholder “Gõ những gì bạn nghe được…”. Nút **“Kiểm tra”** (Enter). Nút phụ “Gợi ý” (hiện chữ cái đầu mỗi từ) và “Bỏ qua / Xem đáp án”.
  - Trái hoặc dưới (desktop sidebar thu gọn): danh sách số câu 1…N, tô màu theo điểm tốt nhất.
  - Header: tên bài, tiến độ “Câu 5/24”, ✕ thoát.
- **Mobile:** player trên cùng (sticky, nhỏ), ô nhập, bàn phím; nút Phát nổi to ở góc phải dưới.
- **Sau khi bấm Kiểm tra** → hiển thị S-13 ngay trong màn (không chuyển trang).

#### S-13. Dictation – kết quả câu

- **Khối so sánh:** câu đúng hiển thị theo từng từ với màu theo `outcome` (xem 5.2). Di chuột/chạm vào từ sai → tooltip: “**Bỏ sót từ chức năng** · Từ đúng: *the*” (lấy `error_categories.name_vi` theo `expected_word_class × outcome`).
- **Điểm câu** (vòng tròn 0–100) + đếm: 12 đúng · 2 bỏ sót · 1 nhầm · 1 sai chính tả.
- **Chip loại lỗi của câu** (khảo sát #11, #12): “Bỏ sót từ chức năng ×2”, “Sai đuôi từ -ed ×1”.
- **Dịch nghĩa** (`text_vi`, thu gọn) và **IPA câu** (`ipa`, thu gọn).
- **Hành động trên từng từ:** chạm vào từ → popover mini-từ điển (nghĩa Việt, 🔊, nút **Lưu từ**, `source = 'lesson'`, lưu kèm `sentence_id`).
- **Nút:** “Làm lại câu này” · “Câu tiếp theo →” (primary) · “📝 Ghi chú” (mở ô ghi chú câu) · “Luyện nói câu này” (chuyển sang shadowing cùng câu) · “Báo lỗi”.
- **Quy tắc:** điểm < 60 hoặc nghe lại > 5 lần → tự thêm câu vào hàng đợi ôn (`user_sentence_review`, reason `low_score`/`replayed_often`); hiện toast nhỏ “Đã thêm vào Câu cần ôn lại”.
- **Hoàn thành bài:** màn tổng kết: điểm trung bình, thời gian, biểu đồ cột lỗi theo loại từ của bài này, 3 câu tệ nhất + “Ôn lại”, nút “Chuyển sang Shadowing bài này”.

#### S-14. Shadowing – luyện nói

- **Đường dẫn:** `/lessons/:slug/shadowing?s=5`
- **Điều kiện:** cần consent `ai_processing` (nếu chưa: modal xin quyền M-04) và quyền micro.
- **Bố cục:**
  - Header: tên bài, “Câu 5/24”, **quota meter** “Còn 3/5 lượt chấm hôm nay” (Free), ✕.
  - Player video phát đoạn câu hiện tại.
  - **Câu hiển thị lớn** (22–24px) + IPA (toggle) + dịch Việt (toggle). Mỗi từ chạm được để tra nhanh/lưu.
  - Điều khiển nghe mẫu: ▶ Nghe mẫu, tốc độ 0.5×/0.75×/1×.
  - **Nút ghi âm tròn lớn** (màu accent) ở giữa dưới, 4 trạng thái:
    1. *Chờ*: icon micro, chữ “Nhấn để đọc”.
    2. *Đang ghi*: viền đỏ nhấp nháy, sóng âm trực tiếp, đếm giờ, chữ “Nhấn để dừng”; tự dừng khi quá thời lượng câu × 2.
    3. *Đang chấm*: spinner + “Đang chấm điểm…” (≤ 5 giây).
    4. *Xong*: hiện S-15 bên dưới.
  - Nút phụ: “Nghe lại giọng tôi” (sau khi ghi).
- **Khi hết lượt (Free):** nút ghi âm vẫn dùng để tự luyện nhưng không chấm; banner vàng “Bạn đã dùng hết 5 lượt chấm hôm nay. Lượt mới lúc 00:00 · Nâng cấp Pro để chấm không giới hạn” + nút Nâng cấp.
- **Không có consent AI:** chế độ “Tự luyện” — chỉ ghi, nghe lại, so với mẫu, không chấm.

#### S-15. Shadowing – kết quả chấm

- **4 vòng điểm nhỏ** + **1 điểm tổng lớn** (`score`): Chính xác (`accuracy_score`) · Trôi chảy (`fluency_score`) · Đầy đủ (`completeness_score`) · Ngữ điệu (`prosody_score`). Mỗi vòng có tooltip giải thích ngắn bằng tiếng Việt.
- **Câu có tô màu từng từ** (`sentence_attempt_words`): xanh/vàng/đỏ theo `accuracy_score` từng từ; từ bị bỏ (`omitted`) hiện xám gạch; từ phát âm sai (`mispronounced`) gạch sóng đỏ.
- **Bấm vào 1 từ → panel “Phân tích âm”** (drawer bên phải desktop / bottom sheet mobile):
  - Từ + IPA chuẩn + 🔊 nghe mẫu từ + ▶ nghe lại đoạn giọng của tôi.
  - **Dãy âm vị** (`sentence_attempt_phonemes`) dạng ô liên tiếp: /θ/ /ɪ/ /ŋ/ /k/, mỗi ô tô màu theo điểm, ô sai có ghi “bạn đọc thành /t/” (`produced_phoneme_id`).
  - **Mẹo sửa (miễn phí):** lấy từ `phoneme_confusions.tip_vi` theo cặp (âm đúng, âm đọc thành) — vd “Đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi, đừng chạm lưỡi vào lợi như /t/.”
  - **Hướng dẫn âm** (`phonemes.description_vi`), nút “Xem bảng âm /θ/” → S-30.
  - **Video khẩu hình** (`mouth_video_url`): Free thấy thumbnail mờ + khoá + “Pro”; Pro phát được.
  - Nút “Luyện cặp âm think/sink” → S-29 (nếu có `minimal_pairs`).
- **Khối “Nhận xét AI”** (`ai_feedback`): Free thấy thẻ mờ với câu mẫu + khoá + nút “Mở bằng Pro”; Pro xem P-01.
- **Chip nhóm lỗi phát âm của câu:** “Rụng phụ âm cuối”, “Thay phụ âm”, “Nhầm nguyên âm dài/ngắn” (`error_categories` skill `shadowing`).
- **Nút:** “Đọc lại” (tốn 1 lượt, ghi rõ trên nút “Đọc lại · còn 2 lượt”) · “Câu tiếp theo →” · “Đặt làm bản ghi mốc” (chỉ khi có consent `voice_storage`, đánh dấu `is_baseline`) · Ghi chú · Báo lỗi.
- **Quy tắc:** điểm < 60 → thêm vào hàng đợi ôn. Mỗi lần chấm thành công mới trừ 1 lượt; lỗi dịch vụ → không trừ lượt, báo “Chấm điểm thất bại, lượt của bạn không bị trừ. Thử lại”.

#### S-16. Ghi chú câu (thành phần)

- Popover/ô nhập dưới câu: textarea, nút Lưu/Xoá; hiển thị ngày cập nhật. Một câu có thể có nhiều ghi chú (`sentence_notes`), hiển thị dạng danh sách.

#### S-17. Lịch sử luyện một câu (thành phần, mở từ danh sách câu)

- Bảng các lượt (`sentence_attempts`) của câu: thời gian, chế độ, điểm, số lần nghe lại, nút nghe lại ghi âm (nếu còn hạn `audio_expires_at`). Hiển thị điểm tốt nhất / gần nhất.

#### S-18. Câu cần ôn lại

- **Đường dẫn:** `/review/sentences`
- **Bố cục:** tab **Dictation | Shadowing**; danh sách câu `status = 'pending'` sắp theo `priority`: câu (thu gọn), bài học gốc, lý do (chip: *Điểm thấp* · *Sai nhiều* · *Nghe lại nhiều* · *Tự thêm*), điểm gần nhất, nút “Luyện”.
- Nút chính “Luyện tất cả (8 câu)” → chạy liên tiếp như S-12/S-14.
- Đạt ≥ 80 khi ôn → tự chuyển `resolved`, câu biến mất với animation, toast “Đã khắc phục 1 câu 👏”.
- Menu ⋯: “Bỏ khỏi danh sách” (resolve thủ công).
- Nút “Thêm vào ôn lại” cũng có ở S-13/S-15 (reason `manual`).

#### S-19. Streak & hoạt động (thành phần)

- Biểu tượng 🔥 + số ngày trên header. Bấm → popover: lịch tháng dạng heatmap (ô đậm = nhiều hoạt động), streak dài nhất.
- Tính từ dữ liệu có sẵn, không cần bảng mới.

#### S-20. Điểm yếu của tôi

- **Đường dẫn:** `/weakness`
- **Mục đích:** trang “điểm yếu” mà 34/34 người khảo sát muốn.
- **Bộ chọn thời gian:** 7 ngày · 30 ngày · Toàn bộ.
- **Tab 1 – Phát âm** (từ `v_user_phoneme_stats`):
  - Danh sách âm vị xếp theo **tỉ lệ lỗi** (errors/opportunities), mỗi dòng: ký hiệu /θ/ lớn, từ ví dụ “think”, thanh tỉ lệ lỗi (vd 42%, 19/45 lần), âm hay bị đọc thành (“thường đọc thành /t/”), nút “Luyện ngay”.
  - Chỉ hiện âm vị có ≥ 5 cơ hội (tránh kết luận từ dữ liệu quá ít); âm ít dữ liệu ghi “Chưa đủ dữ liệu”.
- **Tab 2 – Nghe chép** (từ `v_user_dictation_stats`):
  - 5 thẻ theo loại từ: **Từ chức năng** · **Từ nội dung** · **Từ biến đổi hình thái (-s/-ed/-ing)** · **Số** · **Tên riêng**; mỗi thẻ: tỉ lệ lỗi, chia 3 phần *bỏ sót / nhầm / sai chính tả* (thanh xếp chồng), ví dụ lỗi gần nhất.
- **Tab 3 – Từ vựng** (từ `v_user_vocab_stats`): số thẻ theo trạng thái, độ chính xác, danh sách thẻ hay sai nhất.
- **Khối “Đề xuất luyện tập”** (`practice_recommendations` trạng thái `pending`): thẻ bài luyện: loại (Cặp âm tối thiểu / Câu / Thẻ từ), mục tiêu (“Sửa /θ/ → /t/”), nút Bắt đầu / Bỏ qua.
- **Free:** chỉ hiện **top 3 điểm yếu** mỗi tab, phần còn lại mờ + banner “Xem toàn bộ hồ sơ điểm yếu và xu hướng theo thời gian với Pro”. Pro → P-02.
- **Empty:** “Chưa đủ dữ liệu. Làm thêm 3 bài nghe chép hoặc 10 câu shadowing.”

#### S-21. Luyện sửa lỗi (thực hiện một đề xuất)

- Mở từ S-01 (`weakness_drill`) hoặc S-20.
- Tuỳ `kind`: `sentence` → mở câu ở chế độ dictation/shadowing; `vocab_card` → phiên thẻ 1 thẻ; `minimal_pair` → S-29.
- Kết thúc: hiện điểm, so sánh với trước (“/θ/: 42% lỗi → 20% lỗi trong lần này”), ghi `outcome_score`, chuyển `done`.

#### S-22. Kiểm tra lại trình độ

- Như O-03…O-06 nhưng `kind = 'retest'`. Mở khi đã ≥ 28 ngày từ lần gần nhất (trước đó nút bị vô hiệu + “Có thể kiểm tra lại sau 6 ngày”).
- Màn kết quả có thêm **so sánh với lần trước**: mỗi kỹ năng “B1 → B1 (+6 điểm)”, mũi tên xanh/đỏ.

#### S-23. Tiến độ

- **Đường dẫn:** `/progress`
- Biểu đồ đường **điểm từng kỹ năng theo các lần kiểm tra** (initial + retest), có dải khoảng tin cậy.
- Thẻ số: tổng thời gian học, số câu đã luyện, số từ đã thuộc, streak hiện tại/dài nhất.
- Heatmap hoạt động 12 tuần.
- Biểu đồ cột: điểm trung bình dictation & shadowing theo tuần.
- Danh sách bài đã hoàn thành (`user_lesson_progress.completed_at`).

#### S-25. Hồ sơ & Cài đặt

- **Đường dẫn:** `/settings`
- **Tab Hồ sơ:** avatar (tải lên, cắt vuông), tên người dùng, email (chỉ đọc + trạng thái xác thực), giới thiệu (`description`), ngày sinh, giới tính (Nam/Nữ/Khác).
- **Tab Học tập:** số thẻ ôn tối đa/ngày (`max_daily_reviews`, slider 10–300, mặc định 100, gợi ý “Khuyên dùng 50–100”), thời lượng học mỗi ngày, giọng ưu tiên UK/US.
- **Tab Hệ thống:** ngôn ngữ giao diện (VI/EN), múi giờ (mặc định Asia/Ho_Chi_Minh), giao diện Sáng/Tối/Theo hệ thống.
- **Tab Bảo mật:** đổi mật khẩu (mật khẩu cũ, mới, xác nhận), liên kết Google, đăng xuất mọi thiết bị.

#### S-26. Quyền riêng tư & dữ liệu

- 2 toggle consent như O-02, mỗi toggle có lịch sử (“Đã đồng ý ngày 28/09/2026 · chính sách v1.0”).
- Tắt `voice_storage` → modal xác nhận “Các bản ghi hiện có sẽ bị xoá. Tiếp tục?”.
- Danh sách **bản ghi âm đã lưu** (lượt shadowing có `audio_url`): câu, ngày, điểm, ▶, hạn xoá, nút xoá; bản ghi mốc có nhãn “Mốc”.
- Nút “Xoá tất cả bản ghi âm”.

#### S-27. Gói Pro & thanh toán

- **Free:** thẻ “Bạn đang dùng gói Free”, bảng hạn mức hôm nay (Shadowing 2/5 đã dùng), 3 lựa chọn gói Pro (1/3/12 tháng) → nút “Thanh toán” → màn chọn phương thức (MoMo/VNPay/thẻ – sandbox) → màn kết quả thành công/thất bại.
- **Pro:** thẻ “Pro · hết hạn 28/10/2026”, trạng thái (Đang hoạt động / Đã huỷ gia hạn – vẫn dùng đến ngày…), hạn mức sử dụng hôm nay (`usage_counters`), nút “Gia hạn”, “Huỷ gia hạn” (modal xác nhận: “Bạn vẫn dùng Pro đến 28/10/2026”).
- **Lịch sử giao dịch** (`user_subscriptions`): ngày, gói, số tháng, trạng thái (Đang hoạt động / Đã huỷ / Đã hoàn tiền), ngày hết hạn.

#### S-28. Báo lỗi đã gửi

- Danh sách `content_error_reports` của tôi: nội dung bị báo (loại + tên), lý do, ngày gửi, trạng thái (*Chờ xử lý · Đang xem · Đã sửa · Từ chối*), ghi chú xử lý của admin (`resolution_note`).

#### S-29. Luyện cặp âm tối thiểu

- **Mục đích:** luyện phân biệt 2 âm dễ nhầm (ship/sheep, think/sink).
- **Phần Nghe:** phát ngẫu nhiên 1 trong 2 từ, người dùng chọn đúng từ đã nghe; 10 lượt; hiện tỉ lệ đúng.
- **Phần Nói:** hiện 1 từ, người dùng đọc, chấm (tính 1 lượt `shadowing_assess`), hiện âm vị đúng/sai.
- Thông tin cặp: 2 âm (/θ/ – /s/), vị trí khác biệt (đầu/giữa/cuối từ — `position`), mẹo sửa.
- Kết thúc: điểm, nút “Luyện cặp khác”.

#### S-30. Bảng âm IPA

- **Đường dẫn:** `/phonemes`
- Lưới 44 âm chia 3 nhóm: **Nguyên âm đơn (12) · Nguyên âm đôi (8) · Phụ âm (24)**, phụ âm chia nhóm con (tắc, xát, tắc xát, mũi, tiếp cận). Mỗi ô: ký hiệu lớn, từ ví dụ, 🔊, chấm màu theo tỉ lệ lỗi **của tôi** (nếu có dữ liệu).
- **Chi tiết âm** (`/phonemes/:symbol`): ký hiệu, loại, từ ví dụ + 🔊, **hướng dẫn tiếng Việt** (`description_vi`), **video khẩu hình** (Pro; Free thấy khoá), các lỗi người Việt hay gặp với âm này (`phoneme_confusions` có `target_phoneme_id` = âm này), danh sách cặp tối thiểu, thống kê của tôi, nút “Luyện âm này”.

---

### 7.4 Khác biệt của Người dùng Pro

Pro dùng **đúng các màn hình của Free**; khác biệt nằm ở trạng thái mở khoá và một số khối bổ sung.

| Chỗ | Free | Pro |
|---|---|---|
| Header | Huy hiệu “Free” + nút nhỏ “Nâng cấp” | Huy hiệu vàng **PRO** |
| S-01 Hôm nay | Quota meter shadowing | Không hiện quota (chỉ hiện khi dùng > 150/200) |
| S-05/S-10 | Nội dung PRO có khoá | Mở khoá, huy hiệu PRO giữ nguyên để nhận biết |
| S-14/S-15 | 5 lượt/ngày | 200 lượt/ngày, nhãn “Không giới hạn\*” |
| S-15 | Khối AI & video khẩu hình bị khoá | Mở — xem P-01 |
| S-20 | Top 3 | Đầy đủ + xu hướng — xem P-02 |
| S-23 | — | Thêm so sánh ghi âm trước/sau — xem P-03 |

#### P-01. Nhận xét AI cá nhân hoá (khối trong S-15)

- **Nút “Nhận xét bằng AI ✨”** (không tự động gọi để tiết kiệm lượt; hoặc tự động nếu người dùng bật trong cài đặt). Quota meter nhỏ “còn 97/100 hôm nay”.
- **Đang tạo:** skeleton 3 dòng + chữ “AI đang phân tích…”.
- **Nội dung** (`ai_feedback.content`, markdown ngắn):
  - **Điểm tốt:** 1 câu.
  - **Cần sửa (tối đa 3 ý, xếp theo mức ảnh hưởng):** mỗi ý có từ bị lỗi (bấm để nghe), mô tả lỗi, cách sửa cụ thể bằng tiếng Việt.
  - **Bài tập gợi ý:** 1 liên kết tới cặp âm/câu luyện.
- Nút 👍/👎 đánh giá hữu ích (`[CẦN BỔ SUNG SCHEMA]` nếu muốn lưu).
- Lịch sử: các nhận xét trước đây của cùng câu, xem trong S-17.

#### P-02. Hồ sơ điểm yếu đầy đủ (mở rộng S-20)

- Hiện **toàn bộ** âm vị/loại lỗi thay vì top 3.
- **Biểu đồ xu hướng** tỉ lệ lỗi theo ngày/tuần cho từng âm vị hoặc loại từ (chọn nhiều để so sánh).
- **Ma trận nhầm âm:** bảng âm đúng (hàng) × âm đọc thành (cột), ô đậm = hay nhầm.
- **Xuất báo cáo** PDF 1 trang “Hồ sơ điểm yếu tháng 9”.

#### P-03. So sánh ghi âm trước/sau (khối trong S-23 và S-17)

- Chọn 1 câu có bản ghi mốc (`is_baseline`) → 2 cột: **Trước** (ngày, điểm, ▶, 4 điểm con) · **Bây giờ** (lần gần nhất). Chênh lệch từng điểm (+12 Chính xác…), từ nào đã hết lỗi (xanh), từ vẫn lỗi (đỏ).
- Cần consent `voice_storage`; nếu thiếu → banner hướng dẫn bật ở S-26.

#### P-04. Video khẩu hình (trong S-15, S-30)

- Player nhúng YouTube, lặp đoạn, tốc độ 0.5×/0.75×. Bên cạnh là mô tả `description_vi`.

---

### 7.5 Giáo viên

**Nguyên tắc chung:** giáo viên đăng nội dung **trực tiếp** (trạng thái `APPROVED` ngay, hoặc lưu `DRAFT` nếu chưa muốn đăng). Mọi thao tác tạo/sửa/xoá/đăng/gỡ được ghi `content_audit_log` tự động — UI hiển thị dòng nhỏ “Mọi thay đổi được ghi lại” ở chân form.

#### T-01. Tổng quan giáo viên

- Thẻ số: số bài học của tôi (đã đăng / nháp), số lượt học các bài của tôi (tổng `view_count`), số câu CEFR do AI gợi ý **chờ tôi duyệt**, số **báo lỗi đang mở** về nội dung của tôi.
- Bảng “Bài học được luyện nhiều nhất” (tiêu đề, lượt xem, điểm trung bình dictation/shadowing của người học).
- Bảng “Câu người học hay sai nhất” trong bài của tôi (câu, số lượt, điểm trung bình) → gợi ý chỉnh độ khó.
- Lối tắt: “Tạo bài học mới”, “Duyệt CEFR (12)”, “Xem báo lỗi (3)”.

#### T-02. Quản lý chủ đề

- Bảng `topics`: tên, tên Việt, slug, tag, loại nội dung (`content_type`), số bài, trạng thái, thứ tự, người tạo, ngày cập nhật.
- Kéo thả sắp xếp `sort_order`. Nút “Tạo chủ đề” → drawer form: tên (bắt buộc), tên Việt, slug (tự sinh từ tên, sửa được, duy nhất), tag, loại nội dung, trạng thái Nháp/Đăng.
- Không cho xoá chủ đề còn bài học (ràng buộc `ON DELETE RESTRICT`) → thông báo “Chủ đề còn 8 bài học, hãy chuyển hoặc xoá bài trước”.

#### T-03. Danh sách bài học

- Bảng: thumbnail, tiêu đề, chủ đề, CEFR, nguồn, thời lượng, số câu, **PRO**, trạng thái (Nháp/Đã đăng), lượt xem, ngày cập nhật, menu ⋯ (Sửa, Xem như học viên, Gỡ đăng, Xoá).
- Lọc: chủ đề, CEFR, trạng thái, PRO, “Chỉ bài của tôi”. Tìm theo tiêu đề.
- Xoá = xoá mềm (`deleted_at`), có modal xác nhận.

#### T-04. Soạn bài học – Thông tin chung

- **Bước 1/2** của trình soạn (stepper: *Thông tin → Cắt câu*).
- Trường: Chủ đề (select), Tiêu đề (bắt buộc), Tiêu đề Việt, Slug, Mô tả (textarea), Loại nguồn (YouTube/Audio/Video), URL nguồn (dán link YouTube → tự lấy thumbnail + thời lượng; hoặc tải file audio/video), Ảnh thumbnail (tự động/tải lên), CEFR, Bài PRO (toggle), Thứ tự.
- Nút “Lưu nháp”, “Tiếp: Cắt câu →”.

#### T-05. Soạn bài học – Cắt câu (màn quan trọng nhất của Giáo viên)

- **Bố cục desktop 2 cột:**
  - **Trái (sticky):** player video lớn + **thanh timeline dạng sóng âm** có các đoạn câu hiển thị là khối màu có thể kéo mép để chỉnh `start_ms`/`end_ms`. Điều khiển: phát/dừng, phát đoạn đang chọn, tốc độ, phím tắt `[` đặt điểm đầu, `]` đặt điểm cuối.
  - **Phải:** danh sách câu (`sentences`, theo `sort_order`), mỗi câu là một thẻ có:
    - Số thứ tự, thời gian bắt đầu–kết thúc (định dạng mm:ss.mmm, sửa được), nút ▶ nghe đoạn.
    - Text tiếng Anh (bắt buộc), dịch Việt (`text_vi`), IPA (`ipa`, nút “Tự sinh IPA”).
    - **CEFR câu:** select A1–C2 + nhãn nguồn (`cefr_source`): *Giáo viên đoán* · *AI gợi ý (B1, độ tin cậy 0.82)* · *Giáo viên đã duyệt ✓*. Nút “Nhờ AI gợi ý CEFR”.
    - Nút: tách câu, gộp với câu sau, xoá, kéo thả đổi thứ tự.
- **Công cụ nhanh trên đầu:** “Nhập phụ đề (.srt/.vtt)” → tự tạo câu + mốc thời gian; “Nhập văn bản” (mỗi dòng 1 câu, sau đó căn thời gian thủ công).
- **Kiểm tra trước khi đăng:** cảnh báo nếu `end_ms <= start_ms`, các đoạn chồng lấn, câu trống, bài < 3 câu.
- Nút “Lưu nháp”, “Xem trước như học viên”, **“Đăng bài”**.

#### T-06. Quản lý bộ từ vựng (giáo viên)

- Danh sách bộ từ **Chính thức** (`visibility = 'system'`) và **bộ công khai của tôi**, cùng cột như S-07 + CEFR, PRO, trạng thái, số bài/thẻ.
- Trình soạn như S-07 nhưng: bộ của giáo viên đăng ngay (không qua `PENDING`); được đặt `is_pro`; được chọn danh mục.
- **Form thẻ từ** (`vocab_cards`): Từ (bắt buộc), Loại từ, Nghĩa Việt, Giải thích EN, Giải thích VI, Ví dụ EN, Ví dụ VI, Ảnh, CEFR, **Phát âm UK** (IPA + audio, tải lên hoặc thu âm) và **Phát âm US** (`vocab_card_phonetics`, mỗi giọng cần ít nhất IPA hoặc audio). Nút “Điền từ từ điển” tự điền.
- **Nhập hàng loạt:** tải CSV (cột mẫu: word, pos, translation_vi, example_en, example_vi, ipa_uk, ipa_us) → màn xem trước các dòng lỗi/hợp lệ → xác nhận.

#### T-07. Duyệt CEFR do AI gợi ý

- **Đường dẫn:** `/teacher/cefr-review`
- Hàng đợi các câu `cefr_source = 'ai_suggested'`: câu, bài học, **CEFR AI gợi ý** (`cefr_suggested_by_ai`), **độ tin cậy** (`ai_confidence`, thanh 0–1, < 0.6 tô vàng), mô hình (`ai_model`), CEFR hiện tại.
- Hành động mỗi dòng: **Đồng ý** (một chạm) · **Sửa** (chọn mức khác) → cả hai chuyển `instructor_reviewed`, ghi `reviewed_by`, `reviewed_at`.
- Chọn nhiều → “Đồng ý tất cả đã chọn”. Lọc theo bài, theo độ tin cậy. Phím tắt: `A` đồng ý, `1–6` chọn A1–C2, `J/K` lên xuống.

#### T-08. Báo lỗi về nội dung của tôi

- Danh sách chỉ đọc các `content_error_reports` trỏ tới nội dung tôi tạo: loại nội dung, tên, lý do (*Sai nội dung · Sai bản dịch · Sai CEFR · Lỗi âm thanh · Phản cảm · Spam · Khác*), mô tả của người báo, trạng thái, nút “Mở nội dung để sửa”.
- Giáo viên tự sửa nội dung; admin là người đổi trạng thái báo cáo.

#### T-09. Quản lý từ điển

- Bảng `dictionary_words`: headword, CEFR, số nghĩa, số phát âm, ngày cập nhật; tìm kiếm gần đúng.
- **Chi tiết/soạn từ:** headword, CEFR; **danh sách nghĩa** (thêm/sửa/xoá/sắp xếp `meaning_no`): loại từ, định nghĩa EN (bắt buộc), nghĩa Việt, định nghĩa VI, ví dụ EN/VI; **biến thể** mỗi nghĩa (loại + giá trị); **phát âm** theo loại từ × giọng (UK/US/KK/IPA) với IPA + audio.
- Nhập hàng loạt CSV/JSON.

#### T-10. Quản lý ngữ âm

- **Tab Âm vị** (`phonemes`, 44 dòng cố định): ký hiệu, loại, từ ví dụ, mô tả tiếng Việt (editor), URL video khẩu hình (xem trước), “Nội dung PRO”. Không cho thêm/xoá âm, chỉ sửa nội dung.
- **Tab Nhầm âm** (`phoneme_confusions`): âm đúng → âm hay đọc thành (hoặc “rụng âm” khi để trống), nhóm lỗi (select `error_categories` skill shadowing), **mẹo sửa tiếng Việt** (bắt buộc). Cặp (L1, âm đúng, âm đọc thành) là duy nhất.
- **Tab Cặp tối thiểu** (`minimal_pairs`): âm A, âm B, từ A, từ B (chọn từ từ điển), vị trí khác biệt (đầu/giữa/cuối), nút nghe cả hai.

#### T-11. Ngân hàng câu hỏi kiểm tra

- Bảng `assessment_items`: loại (*Từ vựng Có/Không · Câu nghe chép · Câu nói nhại*), CEFR, độ khó, nội dung (từ thật / **từ giả** / câu), đang dùng (toggle), số lượt đã trả lời.
- **Tạo câu hỏi:** chọn loại → nếu Từ vựng: chọn từ từ điển **hoặc** nhập từ giả (chỉ một trong hai); nếu câu: chọn câu có sẵn trong bài học.
- Thống kê mỗi câu: tỉ lệ trả lời “Biết”, thời gian trung bình (phục vụ hiệu chỉnh độ khó).
- Cảnh báo phân bố: số câu mỗi mức CEFR × loại, tô đỏ nếu mức nào < 10 câu.

#### T-12. Lịch sử thay đổi của tôi

- Dòng thời gian `content_audit_log` với `actor_id` = tôi: thời gian, hành động (tạo/sửa/xoá/đăng/gỡ), loại + tên nội dung, nút “Xem thay đổi” → modal diff 2 cột (trước/sau) từ `diff`.

---

### 7.6 Admin

#### A-01. Tổng quan

- Thẻ số: tổng người dùng, người dùng mới 7 ngày, **người dùng hoạt động hôm nay (DAU)**, số Pro đang hoạt động, tỉ lệ chuyển đổi Free → Pro, doanh thu tháng (ước tính từ `user_subscriptions`), báo lỗi đang chờ, bộ từ chờ duyệt.
- Biểu đồ: người dùng mới theo ngày (30 ngày); lượt chấm shadowing theo ngày (theo dõi chi phí Azure); lượt AI feedback theo ngày (chi phí LLM); phân bố trình độ CEFR người dùng.
- Danh sách “Cần xử lý”: 5 báo lỗi cũ nhất, 5 bộ từ chờ duyệt cũ nhất.

#### A-02. Quản lý người dùng

- Bảng: avatar, tên, email, vai trò (Học viên/Giáo viên/Admin), gói (Free/Pro — từ `v_user_plan`), đã xác thực email, trạng thái (Hoạt động/Đã khoá), ngày tạo, hoạt động gần nhất.
- Lọc theo vai trò, gói, trạng thái, xác thực; tìm theo email/tên. Phân trang 20/50/100.
- Menu ⋯: Xem chi tiết, Đổi vai trò, Khoá/Mở khoá, Gửi lại email xác thực.
- **Đổi vai trò:** modal chọn role + lý do; không cho admin tự hạ quyền chính mình nếu là admin cuối cùng.
- **Khoá:** modal nhập lý do; người bị khoá bị đăng xuất.

#### A-03. Chi tiết người dùng

- Thông tin hồ sơ (chỉ đọc), vai trò, trạng thái.
- **Gói:** lịch sử `user_subscriptions`; hành động: **Tặng Pro** (chọn số tháng), **Huỷ**, **Hoàn tiền** (modal xác nhận, ghi trạng thái `refunded`).
- **Sử dụng:** bảng `usage_counters` 30 ngày theo tính năng.
- **Đồng ý dữ liệu:** lịch sử `user_consents`.
- **Hoạt động học:** trình độ hiện tại, số phiên, số câu đã luyện.
- **Nội dung đã tạo** (nếu là giáo viên/học viên có bộ từ công khai), **báo lỗi đã gửi**.

#### A-04. Hàng đợi báo lỗi nội dung

- Tab trạng thái: **Chờ xử lý · Đang xem · Đã xử lý · Từ chối**.
- Bảng: ID, loại nội dung (`entity_type`: chủ đề / bài học / câu / bộ từ / thẻ / từ điển), tên nội dung, lý do, người báo, ngày, số báo cáo trùng cùng nội dung (gộp), trạng thái.
- Lọc theo lý do, loại nội dung; sắp theo cũ nhất trước.

#### A-05. Chi tiết xử lý báo lỗi

- **Trái:** thông tin báo cáo (lý do, mô tả, người báo, thời gian) + **xem trước nội dung bị báo** (vd câu kèm player đoạn video, hoặc thẻ từ).
- **Phải:** các báo cáo khác cùng nội dung; lịch sử chỉnh sửa nội dung (`content_audit_log`), người tạo nội dung (giáo viên nào).
- **Hành động:**
  - “Nhận xử lý” → `reviewing`.
  - “Sửa nội dung” → mở form sửa tương ứng (lưu sinh bản ghi audit, tự nối `audit_log_id`).
  - “Chuyển cho giáo viên” (thông báo nội bộ `[CẦN BỔ SUNG SCHEMA]`, tạm thời bằng ghi chú).
  - “Gỡ nội dung” (ẩn/unpublish) với nội dung phản cảm/spam.
  - **“Đánh dấu đã xử lý”** / **“Từ chối báo cáo”** → bắt buộc nhập `resolution_note` (người báo sẽ thấy ở S-28).

#### A-06. Duyệt bộ từ công khai của học viên

- Hàng đợi bộ từ `status = 'PENDING'`: tên, tác giả, số bài/thẻ, tag, ngày gửi.
- **Màn duyệt:** xem toàn bộ bộ từ dạng chỉ đọc (lướt nhanh các thẻ), cờ tự động: từ ngữ phản cảm, thẻ trống, trùng lặp nhiều.
- Nút **Duyệt** (→ `APPROVED`, xuất hiện ở thư viện cộng đồng) · **Từ chối** (→ `REJECTED`, bắt buộc lý do).
- Tiêu chí duyệt ghi ngay trên màn: không spam, không phản cảm, không quảng cáo — **không** đánh giá chuyên môn ngôn ngữ.

#### A-07. Nhật ký nội dung (Audit log)

- Bảng toàn bộ `content_audit_log`: thời gian, người thực hiện + vai trò, hành động, loại nội dung, tên/ID, nút xem diff.
- Lọc theo người, vai trò, hành động, loại nội dung, khoảng thời gian. Xuất CSV.
- Chỉ đọc (bảng chỉ thêm, không sửa/xoá).

#### A-08. Gói & hạn mức

- Bảng `plan_limits` dạng ma trận: hàng = tính năng (4), cột = Free / Pro; mỗi ô: chu kỳ (ngày/tháng/không) + giá trị (số, để trống = không giới hạn, 0 = tắt).
- Chỉnh sửa inline, nút “Lưu thay đổi” → modal xác nhận có tóm tắt thay đổi (“Free · Shadowing: 5 → 10 lượt/ngày”).
- Ghi chú hiển thị: “Giá trị ảnh hưởng chi phí Azure/LLM”, kèm số liệu sử dụng trung bình 7 ngày cho từng tính năng.

#### A-09. Đăng ký Pro

- Bảng `user_subscriptions` toàn hệ thống: người dùng, gói (`price_id`), số tháng, ngày kích hoạt, ngày hết hạn, trạng thái. Lọc theo trạng thái, sắp hết hạn trong 7 ngày.
- Hành động trên dòng: Hoàn tiền, Huỷ, Gia hạn thủ công.

#### A-10. Danh mục lỗi

- Bảng `error_categories`: mã, kỹ năng, tên hiển thị tiếng Việt, mô tả, loại từ, kiểu lỗi, đang bật.
- Chỉ sửa tên/mô tả và bật/tắt (vd nhóm “từ khác” đang tắt sẵn). Không cho sửa mã và cặp (loại từ, kiểu lỗi) vì hệ thống chấm dựa vào đó.

---

### 7.7 Thành phần dùng chung

#### M-01. Paywall (modal nâng cấp Pro)

- Mở khi Free chạm nội dung/tính năng Pro. Tiêu đề **theo ngữ cảnh**: “Mở video khẩu hình âm /θ/”, “Nhận nhận xét AI cho câu này”, “Hết lượt chấm hôm nay”.
- Nội dung: minh hoạ, 4 quyền lợi Pro (icon + 1 dòng), giá nổi bật “chỉ từ 33.000đ/tháng”, nút **“Nâng cấp Pro”**, liên kết “Để sau”.

#### M-02. Quota meter (thành phần)

- Dạng thanh nhỏ + chữ: “Chấm shadowing · còn 3/5 hôm nay”. Màu: > 40% xanh, 1–40% vàng, 0 đỏ. Tooltip “Làm mới lúc 00:00 (giờ Việt Nam)”.

#### M-03. Báo lỗi nội dung (modal)

- Mở từ nút 🚩 ở từ điển, thẻ từ, câu, bài học, bộ từ.
- Trường: lý do (radio: Sai nội dung · Sai bản dịch · Sai mức CEFR · Lỗi âm thanh/video · Phản cảm · Spam · Khác), mô tả (tuỳ chọn, bắt buộc nếu “Khác”, tối đa 500 ký tự). Hiện tên nội dung đang báo ở đầu modal.
- Gửi → toast “Cảm ơn bạn! Chúng tôi sẽ kiểm tra.” → theo dõi ở S-28.

#### M-04. Xin quyền dữ liệu giọng nói (modal)

- Hiện khi mở shadowing mà chưa có consent `ai_processing`. Nội dung rút gọn của O-02 + nút “Đồng ý và tiếp tục” / “Chỉ tự luyện, không chấm”.

#### M-05. Popover tra từ nhanh

- Mở khi chạm 1 từ trong câu (dictation/shadowing/ví dụ): headword, IPA UK/US + 🔊, nghĩa Việt đầu tiên, nút **Lưu từ**, liên kết “Xem đầy đủ” → S-03.

#### M-06. Toast & xác nhận

- Toast góc dưới phải (desktop) / trên (mobile), tự ẩn 4s, có “Hoàn tác” khi phù hợp.
- Modal xác nhận hành động nguy hiểm: tiêu đề, mô tả hậu quả, nút danger.

---

## 8. Luồng nghiệp vụ chính

### 8.1 Người dùng mới → buổi học đầu tiên

```
Landing → Đăng ký → Xác thực email → O-01 Mục tiêu (15 phút)
→ O-02 Quyền dữ liệu → O-03/O-04 Kiểm tra (~10 phút) → O-06 Kết quả B1
→ S-01 Hôm nay (kế hoạch 15 phút được sinh)
→ Việc 1: Nghe chép bài gợi ý (S-12 → S-13)
→ Việc 2: Shadowing 3 câu (S-14 → S-15, dùng 3/5 lượt)
→ Việc 3: Học 10 thẻ từ (S-08 → S-09)
→ Hoàn thành kế hoạch, streak = 1
```

### 8.2 Vòng lặp hằng ngày (lõi sản phẩm)

```
Mở app → S-01 kế hoạch hôm nay (cố định trong ngày)
→ Làm từng việc → dữ liệu lỗi ghi vào sentence_attempt_words / phonemes / review_logs
→ View tính lại điểm yếu → practice_recommendations mới
→ Ngày mai kế hoạch ưu tiên: thẻ đến hạn + điểm yếu + bài mới
→ Mỗi 4 tuần: việc "retest" xuất hiện → S-22 → S-23 thấy tiến bộ
```

### 8.3 Free chạm giới hạn → nâng cấp

```
S-14 lượt thứ 6 → banner hết lượt → M-01 Paywall "Hết lượt chấm hôm nay"
→ S-27 chọn gói 12 tháng → thanh toán → thành công
→ quay lại đúng câu đang làm, chấm được ngay
```

### 8.4 Giáo viên đăng bài mới

```
T-03 → Tạo bài → T-04 dán link YouTube → T-05 nhập file .srt → tự cắt 24 câu
→ chỉnh mốc thời gian → "Nhờ AI gợi ý CEFR" → Đăng bài (APPROVED, ghi audit)
→ T-07 duyệt CEFR các câu AI gợi ý
```

### 8.5 Báo lỗi & hậu kiểm

```
Học viên thấy bản dịch sai → M-03 → content_error_reports (pending)
→ A-04 admin nhận xử lý (reviewing) → A-05 sửa hoặc chuyển giáo viên
→ Đã xử lý + ghi chú → học viên thấy ở S-28
Song song: giáo viên thấy báo lỗi ở T-08
```

### 8.6 Học viên chia sẻ bộ từ

```
S-07 tạo bộ → chọn Công khai → Gửi duyệt (PENDING)
→ A-06 admin duyệt → APPROVED → xuất hiện ở S-05 mục Cộng đồng
                   → REJECTED + lý do → học viên sửa, gửi lại
```

---

## 9. Quy tắc nghiệp vụ tổng hợp

| Mã | Quy tắc | Nguồn |
|---|---|---|
| BR-01 | Email, tên người dùng là duy nhất, không phân biệt hoa thường | `citext UNIQUE` |
| BR-02 | Tài khoản `disabled` không đăng nhập được | `users.disabled` |
| BR-03 | Pro = có đăng ký `active`/`cancelled` chưa hết hạn; hết hạn tự về Free | `v_user_plan` |
| BR-04 | Hạn mức theo `plan_limits`; NULL = không giới hạn; 0 = khoá. Đếm theo ngày theo múi giờ người dùng | `plan_limits`, `usage_counters` |
| BR-05 | Chỉ trừ lượt khi chấm **thành công** | S-15 |
| BR-06 | Chấm shadowing cần consent `ai_processing`; lưu audio cần `voice_storage`; mỗi loại chỉ có 1 consent đang hiệu lực | `user_consents` |
| BR-07 | Bản ghi âm có hạn xoá (`audio_expires_at`, đề xuất 90 ngày); bản ghi mốc phải có audio | `sentence_attempts` |
| BR-08 | Mỗi người chỉ 1 phiên học thẻ đang mở | `uq_vss_open_session` |
| BR-09 | Số thẻ ôn/ngày ≤ `max_daily_reviews` (mặc định 100) trừ khi người dùng chủ động ôn thêm | `users` |
| BR-10 | Mỗi người 1 kế hoạch/ngày, cố định trong ngày | `uq_daily_plans` |
| BR-11 | Kiểm tra lại cách lần trước ≥ 28 ngày | khảo sát #5 |
| BR-12 | Câu điểm < 60 hoặc nghe lại > 5 lần tự vào hàng đợi ôn; đạt ≥ 80 khi ôn thì tự xong | `user_sentence_review` |
| BR-13 | Nội dung giáo viên đăng ngay, không qua PENDING; nội dung công khai của học viên phải qua admin duyệt | ghi chú schema mục 11 |
| BR-14 | Mọi thao tác nội dung của giáo viên/học viên ghi audit log bất biến | `content_audit_log` |
| BR-15 | Báo lỗi chuyển `resolved`/`rejected` bắt buộc có người xử lý + thời điểm; UI bắt buộc thêm ghi chú | `chk_report_reviewed` |
| BR-16 | Không xoá chủ đề còn bài học | `ON DELETE RESTRICT` |
| BR-17 | Câu có `end_ms > start_ms`, thứ tự câu trong bài là duy nhất | `sentences` |
| BR-18 | Câu “Giáo viên đã duyệt” CEFR phải có người duyệt + thời điểm | `chk_sentence_cefr_review` |
| BR-19 | Nội dung/tính năng PRO: Free thấy nhưng khoá (không ẩn) để tạo động lực nâng cấp | Mục 3 |
| BR-20 | Âm vị chỉ kết luận “yếu” khi có ≥ 5 cơ hội; ngưỡng lỗi âm vị là điểm < 60 | `v_user_phoneme_stats` |

---

## 10. Dữ liệu mẫu cho mockup

Dùng dữ liệu thật, tiếng Việt có dấu, để thiết kế không bị “lorem ipsum”.

- **Người dùng:** Nguyễn Minh Anh, `minhanh`, 20 tuổi, sinh viên Kinh tế, mục tiêu TOEIC, 15 phút/ngày, trình độ B1 (Từ vựng B1 · Nghe chép A2 · Nói B1), streak 5 ngày, gói Free, còn 3/5 lượt.
- **Giáo viên:** Cô Trần Thu Hà. **Admin:** Lê Quốc Huy.
- **Chủ đề:** Daily English Conversation (24 bài) · Movie Short Clips (15 bài) · TOEIC Listening Part 2 (30 bài) · Travel English (12 bài).
- **Bài học:** “Ordering Coffee at Starbucks” · A2 · 2:48 · 18 câu · YouTube · 1.2k lượt xem. “Job Interview: Tell Me About Yourself” · B1 · 4:12 · 26 câu · **PRO**.
- **Câu dictation:** “I'd like a large iced latte with oat milk, please.” — người dùng gõ “I like large ice latte with oat milk please” → *'d* bỏ sót (từ chức năng), *a* bỏ sót (từ chức năng), *iced* → *ice* sai đuôi -ed (từ biến đổi).
- **Câu shadowing:** “I think this is the third time I've been here.” — điểm tổng 72 · Chính xác 68 · Trôi chảy 81 · Đầy đủ 100 · Ngữ điệu 64; *think* đỏ: /θ/ đọc thành /t/; *third* vàng: /θ/ 55 điểm; *here* xanh.
- **Mẹo sửa:** “Đặt nhẹ đầu lưỡi giữa hai hàm răng và thổi hơi ra. Nếu lưỡi chạm lợi trên, bạn đang đọc thành /t/.”
- **Nhận xét AI mẫu:** “👍 Bạn giữ nhịp câu khá tự nhiên. Cần sửa: (1) *think, third* — âm /θ/ bị đọc thành /t/, hãy thò đầu lưỡi ra giữa răng; (2) *I've* — bạn bỏ âm /v/ cuối, nối ‘I’ve been’ thành /aɪv bɪn/. Luyện thêm: cặp think – tink.”
- **Kế hoạch hôm nay (15 phút):** Ôn 20 thẻ từ (5’) — “12 thẻ đến hạn hôm nay” · Luyện âm /θ/ (4’) — “Bạn đọc sai /θ/ 7 lần tuần này” · Nghe chép “Ordering Coffee” câu 6–10 (6’) — “Tiếp tục bài đang học”.
- **Điểm yếu:** /θ/ 42% lỗi (19/45) · /ð/ 35% · /v/ cuối từ 28%; Nghe chép: từ chức năng 31% lỗi (chủ yếu bỏ sót), đuôi -ed 24%.
- **Bộ từ:** “3000 Từ Vựng Oxford A2” · Chính thức · 40 bài · 880 thẻ. “600 Từ TOEIC” · B1 · **PRO** · 50 bài. “Từ vựng phim Friends” · Cộng đồng · tác giả @hoanghai.
- **Tra từ:** *present* — Tính từ: /ˈpreznt/ “có mặt, hiện tại”; Danh từ: /ˈpreznt/ “món quà”; Động từ: /prɪˈzent/ “trình bày, tặng”.

---

## 11. Cách dùng tài liệu này với AI Figma

1. **Tạo design system trước:** dán nguyên Mục 5 vào AI, yêu cầu sinh trang “Foundations” (màu, chữ, lưới) và “Components” (danh sách 5.5).
2. **Sinh từng màn hình một**, không dán cả tài liệu. Với mỗi màn, dán: phần đặc tả màn hình đó + dữ liệu mẫu liên quan ở Mục 10 + dòng khung layout ở 6.1.
3. **Luôn yêu cầu 2 kích thước:** Desktop 1440 và Mobile 375; và **các trạng thái** liệt kê trong màn (empty, loading, locked Pro, lỗi).
4. Thứ tự đề xuất: S-01 → S-12/S-13 → S-14/S-15 → S-03 → S-08 → S-20 → O-01…O-06 → G-01/G-02 → T-05 → A-04/A-05 → phần còn lại.

**Mẫu prompt:**

```
Bạn là UI/UX designer. Thiết kế màn hình web cho ứng dụng học tiếng Anh LinguaLoop
dành cho sinh viên Việt Nam 18–22 tuổi, giao diện tiếng Việt.

Design system: [dán Mục 5]
Khung layout: [dán dòng Người dùng / Giáo viên / Admin ở 6.1]
Màn hình cần thiết kế: [dán đặc tả, ví dụ "S-15. Shadowing – kết quả chấm"]
Dữ liệu mẫu: [dán dòng liên quan ở Mục 10]

Yêu cầu:
- 2 frame: Desktop 1440×1024 và Mobile 375×812.
- Thêm frame cho các trạng thái: [liệt kê, ví dụ "Free – khối AI bị khoá", "Pro – có nhận xét AI", "Đang chấm"].
- Dùng Auto Layout, đặt tên layer rõ ràng theo tên thành phần trong đặc tả.
- Chữ tiếng Việt có dấu đầy đủ, ký hiệu IPA hiển thị đúng.
```

---

## 12. Khoảng trống schema & đề xuất bổ sung

Các mục dưới đây được khảo sát hoặc đặc tả UI cần, nhưng **schema V1 chưa có**. Nhóm quyết định làm hay bỏ; nếu làm cần thêm migration V3+.

| # | Nhu cầu | Căn cứ | Đề xuất schema | Ưu tiên |
|---|---|---|---|---|
| 1 | Lưu mục đích học, thời lượng mặc định/ngày, giọng ưu tiên | O-01, khảo sát #2, #24 | Thêm cột `users.learning_goals text[]`, `users.daily_time_budget_min smallint DEFAULT 15`, `users.preferred_accent text CHECK (uk/us)` | Must (thời lượng dùng sinh kế hoạch) |
| 2 | Cờ đã hoàn tất onboarding | Điều hướng sau đăng nhập | `users.onboarded_at timestamptz` | Must |
| 3 | Lý do từ chối bộ từ công khai | S-07, A-06 | `vocab_decks.review_note text`, `reviewed_by`, `reviewed_at` | Should |
| 4 | Nhắc nhở học hằng ngày | khảo sát #25 (12 người) | Bảng `notification_settings` (giờ nhắc, kênh) + `notifications` | Won't đợt này |
| 5 | Bảng xếp hạng / bạn bè | khảo sát #25 (8 người) | Bảng `friendships`, điểm XP/tuần | Won't |
| 6 | Giao dịch thanh toán | S-27 | Bảng `payments` (provider, amount, currency, status, provider_txn_id, subscription_id) — hiện chỉ có `price_id` | Should |
| 7 | Mã xác thực email / đặt lại mật khẩu | G-04, G-05 | Bảng `auth_tokens` (user_id, type, token_hash, expires_at, used_at) — hoặc dùng dịch vụ auth ngoài (`auth_uid`) | Must (chọn 1 trong 2) |
| 8 | Đánh giá 👍/👎 nhận xét AI | P-01, đo chất lượng AI | `ai_feedback.user_rating smallint` | Could |
| 9 | Tuỳ chọn giao diện Sáng/Tối | S-25 | Lưu localStorage là đủ, không cần DB | — |
| 10 | Thông báo nội bộ admin → giáo viên | A-05 | Dùng `resolution_note` tạm thời; sau này bảng `notifications` | Could |
| 11 | Streak | khảo sát #25 (11 người) | **Không cần bảng**: tính từ `vocab_review_logs` + `sentence_attempts` theo `users.timezone`; có thể cache sau | Should |
| 12 | Lý do khoá tài khoản | A-02 | `users.disabled_reason text`, `disabled_at` | Could |
