# Kế hoạch: Refactor frontend theo DESIGN.v2

> Trạng thái: **kế hoạch, chờ xác nhận.** Chưa sửa dòng code nào trong `frontend/`.
> Căn cứ: `design/DESIGN.v2.md` (§15 kế hoạch di chuyển), `docs/ux/UX-REDESIGN-INTERVIEW.md` (Q14–Q19), `docs/ux/STATES.md` (R1–R8), mockup `design/mockups-student-v2/`.

## 1. Mục tiêu

Đưa React app trong `frontend/` về đúng DESIGN.v2 và mockup v2: một bộ token, một bộ icon (Lucide), một bộ component chung, một khung chung cho 3 vai trò, và các trạng thái tải/lỗi/rỗng theo STATES.md.

Không phải mục tiêu: thêm tính năng mới (nghe chép, shadowing, từ vựng…), sửa backend, đổi hợp đồng API, đổi hành vi auth.

## 2. Hiện trạng (đo ngày 16/10/2026, nhánh `refactor/ui-ux`)

| Hạng mục | Số liệu | Ghi chú |
|---|---|---|
| Quy mô | 111 file trong `src/`, ~9.500 dòng `.ts/.tsx` | `npm run lint` và `tsc -b` đều sạch |
| CSS tự viết | `styles/index.css` 1.220 dòng, ~120 class: `.btn` + `.ll-btn`, `.card` + `.ll-card`, `.glass` + `.ll-glass`, `.ll-obj`, `.ll-spotlight`, `.bg-fx`, `.bg-glow`… | Vi phạm Q18/Q19 (class trùng nghĩa) |
| Token | Giá trị v1: có `--glow-*`, `--hero-radial`, `--gradient-*`; thiếu `--fn-*`, `--on-fn`, `--primary-text`; `--success/--danger/--warning/--info` light chưa đạt 4,5:1 | DESIGN.v2 §2 |
| Icon | **Phosphor qua CDN** (3 stylesheet trong `index.html`), 119 chỗ `ph ph-*` ở 25 file; `lucide-react` đã cài nhưng chỉ 5 file dùng | Q18 |
| Hiệu ứng v1 | `SvgSprites` (gradient vật thể 3D, `o-orb`), `useSpotlight`, `animate-float`, glow ở 6 file | Q4, Q16 bỏ |
| Hex trong `.tsx` | 19 chỗ ở `Logo`, `LanguageSwitcher`, `SvgSprites`, `Footer` | Q19 tiêu chí 1 |
| Giá trị `[NNpx]` | 182 chỗ | DESIGN.v2 §12 |
| Khung chung | 3 bộ `*Layout` + `*Sidebar` + `*TopBar` gần như sao chép (Admin/Instructor TopBar chỉ khác ~80 dòng); `StudentMobileNav` vẫn còn | DESIGN.v2 §7.3, §11 |
| Theme | `useTheme` mặc định `dark`, không theo `prefers-color-scheme` | DESIGN.v2 §9 |
| Trang lớn | `LessonDetailPage` 799 dòng, `LessonLibraryPage` 701 dòng; hàm định dạng (`fmtNum`, `formatDuration`, `getYouTubeVideoId`) nằm trong trang | Khó review, khó tái dùng |
| Trạng thái | Spinner giữa trang; `TopicDetailPage` không có nhánh lỗi; 404 vẫn có nút Thử lại; `retry: false` toàn cục; chưa có ErrorBoundary | STATES.md R1–R7 |
| Mascot | DESIGN.v2 §6.1 ghi `frontend/public/mascot/*.svg` nhưng `public/` chỉ có `loopi-hello.svg` | Cần copy 6 trạng thái từ `design/loopi-mascot/svg` |
| Trang công khai | `MainLayout` + `Header` 453 dòng + `Footer` 300 dòng, nhưng trang chủ chỉ là `<div>Home</div>` | Ưu tiên thấp |

## 3. Nguyên tắc

1. **Đi từ dưới lên:** token → icon → component → khung → trang. Sửa token sau khi đã áp cho trang thì tốn gấp nhiều lần.
2. **Mỗi giai đoạn là một PR nhỏ**, app chạy được sau mỗi PR. Không có PR "big bang".
3. **Giữ nguyên (Q17):** i18n vi/en, phân quyền route, hợp đồng API và store, hành vi auth, phím tắt nghe chép, focus ring.
4. **Mockup v2 là bản tham chiếu hình dạng**, không phải code để copy: port token và tên component, viết lại bằng Tailwind.
5. **Phần của Kế** (auth, Settings, khung giáo viên/admin) chỉ sửa sau khi Kế duyệt, hoặc để Kế tự làm với component mới.

## 4. Các giai đoạn

### Giai đoạn 0 · Điều kiện tiên quyết (không code)

| Việc | Kết quả |
|---|---|
| Chốt các mục §14 của DESIGN.v2 (đặc biệt #3 màu trạng thái, #4 nút đáy dày, #5 mốc 1024px + bỏ `StudentMobileNav`) | DESIGN.v2 đổi tên thành `DESIGN.md` |
| Báo Kế khung thời gian đợt chuẩn hoá; thống nhất không mở PR giao diện song song trong đợt | Tránh xung đột ở `index.css` và layout |

### Giai đoạn 1 · Token (PR 1)

- Thay khối biến trong `styles/index.css` bằng giá trị `design/mockups-student-v2/tokens.css`: thêm `--fn-dictation/shadowing/vocab/assessment` + `-soft`, `--on-fn`, `--primary-text`; sửa màu trạng thái light; `--dur-base` 200ms, `--dur-slow` 400ms; bỏ `--glow-*`, `--hero-radial`, `--dur-hero`.
- Ánh xạ token mới vào `@theme` để dùng được `bg-fn-dictation`, `text-on-fn`…
- `useTheme`: chưa chọn thì theo `prefers-color-scheme`; giữ khoá localStorage hiện có.
- Chuyển hex trong `Logo`, `LanguageSwitcher`, `Footer` sang token.

**Kiểm được:** `grep -rE "#[0-9a-fA-F]{6}" src --include=*.tsx` rỗng; đổi sáng/tối đúng; app vẫn build.

### Giai đoạn 2 · Icon (PR 2)

- Thay 119 chỗ `<i className="ph ...">` bằng component `lucide-react` (bảng ánh xạ `PH2LU` trong `mockups-student-v2/shell.js` dùng lại được).
- `PlaceholderPage` đang nhận tên icon dạng chuỗi `ph-*`: đổi sang nhận component Lucide.
- Xoá 3 stylesheet Phosphor trong `index.html`.
- `SvgSprites`: bỏ gradient vật thể 3D và `o-orb`; gradient logo chuyển vào `Logo.tsx`; xoá file nếu không còn gì.

**Kiểm được:** `grep -rn "ph-" src` rỗng; tab Network không còn tải `@phosphor-icons`.

### Giai đoạn 3 · Component chung (PR 3, có thể tách 3a/3b)

| Component | Việc |
|---|---|
| `Button` | Biến thể `primary`, `fn` (nhận `fn="dictation"…`, chữ `--on-fn`), `secondary`, `ghost`, `icon`; đủ hover/active/focus-visible/disabled |
| `Card` | Bỏ spotlight; chỉ còn `card` và `glass` (DESIGN.v2 §5) |
| `Badge` | CEFR, chức năng, PRO; luôn kèm chữ |
| Mới: `ProgressBar`, `Skeleton`, `ErrorState`, `Mascot` | `ErrorState` phân biệt lỗi máy chủ / mất mạng / 404 (STATES.md §2); `Mascot` nhận 1 trong 6 trạng thái |
| `Table` | Bản dày cho giáo viên/admin: hàng 40px |
| `EmptyState`, `FormAlert`, `Checkbox`, `SearchInput`, `Chip`, `SegmentedControl` | Chuyển sang token mới, bỏ class `.ll-*` |
| Xoá | `GlassTag` (nếu chỉ phục vụ hiệu ứng cũ), `useSpotlight`, `animate-float`, các class `.ll-*`/`.btn`/`.card` trùng nghĩa trong `index.css` |

- Copy 6 SVG mascot vào `public/mascot/`.

**Kiểm được:** `index.css` chỉ còn token, base, keyframes và phần Tailwind không làm được; không còn hai class cho cùng một việc.

### Giai đoạn 4 · Khung chung (PR 4)

- Gộp 3 bộ Sidebar/TopBar thành một `AppShell` + `Sidebar` + `TopBar` nhận cấu hình điều hướng theo vai trò (mảng mục: nhãn i18n, icon, đường dẫn, màu chức năng). Ba `*Layout` còn lại chỉ truyền cấu hình.
- Mục active: nền `--fn-*-soft`/`--primary-soft`, vạch 3px bên trái (DESIGN.v2 §7.3).
- Responsive: ≥1024 đầy đủ, 768–1023 thu thành icon, <768 ẩn và mở bằng nút menu. Xoá `StudentMobileNav` (nếu §14.5 được duyệt).
- Nút thu gọn thanh bên, lưu lựa chọn (S16 trong `MOCKUP-V2-PARITY.md`).
- Giáo viên/admin: cùng component, mật độ gọn hơn (DESIGN.v2 §4).

**Kiểm được:** chuyển trang ở cả 3 vai trò, mục active đúng màu; 390px không vỡ.

### Giai đoạn 5 · Luồng bài học (PR 5, phần của Lâm)

- Tách `LessonLibraryPage` và `LessonDetailPage` thành component con trong `features/lesson/components/` (thanh lọc, hàng chủ đề, lưới kết quả, khung media, danh sách câu…); trang chỉ còn ghép và giữ state URL.
- Chuyển `fmtNum`, `formatDuration`, `formatTimeMs`, `getYouTubeVideoId` sang `src/lib/`.
- `LessonCard`: hai nút chế độ dùng màu chức năng, tiến độ riêng (DESIGN.v2 §7.2).
- Áp STATES.md: R1 skeleton thay spinner, R2 thẻ lỗi có mã lỗi + phân biệt mất mạng, R3 nhánh lỗi cho `TopicDetailPage`, R4 404 không có Thử lại.
- `queryClient`: `retry: 1` cho truy vấn đọc (R6); thêm `errorElement`/ErrorBoundary cấp route (R7).
- Đối chiếu các mục L1–L14, C1–C5, D1–… trong `MOCKUP-V2-PARITY.md`.

**Kiểm được:** mỗi trang < ~300 dòng; mọi nhánh `?state=` của mockup đều có tương đương trong React.

### Giai đoạn 6 · Auth và Settings (PR 6, Kế duyệt)

- Chỉ đổi giao diện sang component mới; không chạm `authStore`, `authService`, `errors.ts`, luồng Google, giới hạn thử.
- Làm trong cùng đợt; Kế duyệt ở PR.

### Giai đoạn 7 · Kiểm chứng cuối đợt

- Playwright 1440px, sáng + tối: khung 3 vai trò, thư viện, chủ đề, chi tiết bài, auth.
- Lighthouse Accessibility ≥ 90 trên các trang đó (Q19).
- Kiểm tra tự động trong CI hoặc script: không hex trong `.tsx`, không `ph-`, không `.ll-`.
- `npm run lint`, `npm run build` sạch.

## 5. Ngoài phạm vi đợt này (ghi lại để không quên)

- Trang **Hôm nay** (R5, R8): là tính năng mới, cần API kế hoạch ngày và cờ "người mới" từ backend. Làm sau khi khung + component xong, dùng bộ mới ngay từ đầu.
- Nghe chép, shadowing, từ vựng và các placeholder khác: dựng mới bằng bộ component, không thuộc refactor.
- Palette `Ctrl K`, footer đầy đủ, landing page (`Header` 453 dòng): xem lại sau.
- Viết test frontend (repo chưa có Vitest): đề xuất riêng.

## 6. Rủi ro

| Rủi ro | Cách giảm |
|---|---|
| Xung đột với nhánh của Kế khi cùng sửa `index.css`/layout | Giai đoạn 0: thống nhất khung thời gian; PR 1–4 nhỏ, merge nhanh |
| Đổi token làm vỡ màu ở trang chưa refactor | Giữ alias tạm cho biến v1 (giống cuối `mockups-student-v2/tokens.css`) tới khi xoá xong `.ll-*` |
| Xoá class `.ll-*` bỏ sót chỗ dùng | Grep trước khi xoá; build + chụp ảnh từng trang |
| Thay icon sai nghĩa | Dùng bảng `PH2LU` đã kiểm chứng ở mockup; rà mắt từng màn |
| DESIGN.v2 chưa được duyệt mà đã code | Giai đoạn 0 là điểm dừng bắt buộc |

## 7. Tiến độ

| Giai đoạn | Trạng thái |
|---|---|
| 0 Duyệt DESIGN.v2 | Xong (16/10/2026) |
| 1 Token | Xong |
| 2 Icon Lucide | Xong |
| 3 Component chung | Xong: Button (primary/fn/secondary/ghost/text/danger, `buttonClasses` cho Link), Card, Badge, Mascot, Skeleton, ProgressBar, ErrorState, TextField/PasswordField; `index.css` 1.220 → ~190 dòng; ResetPassword chuyển vào `AuthLayout`. Chưa làm: `Table` dày, `EmptyState`/`Chip`/`SegmentedControl` sang token |
| 4–7 | Chưa làm |

## 8. Quyết định đã chốt (16/10/2026)

1. Khung chung làm **cả 3 vai trò** ở giai đoạn 4.
2. DESIGN.v2 §14 **đã chốt**: giai đoạn 0 xong, DESIGN.v2 thành bản có hiệu lực.
3. Giai đoạn 6 (auth, Settings) **làm luôn**, Kế duyệt sau trong PR.
4. **Không** thêm trang `/dev/kit` vào app; `kit.html` của mockup vẫn là tham chiếu.
