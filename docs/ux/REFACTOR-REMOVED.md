# Danh sách đã xoá sau refactor UI

Kiểm tra bằng cách dò import từ `main.tsx` (file nào không ai import thì xoá), tìm khoá i18n không còn được gọi, và token CSS không còn dùng. Build, `tsc`, ESLint sạch sau khi xoá.

## Đợt dọn này

### File mã nguồn (không còn nơi nào import)
| File | Lý do |
|---|---|
| `frontend/src/components/common/Table.tsx` | Bảng kiểu cũ, không trang nào dùng |
| `frontend/src/components/common/GlassTag.tsx` | Thẻ kính của UI cũ, thay bằng `Badge` và `Chip` |
| `frontend/src/components/common/index.ts` | Barrel xuất lại toàn bộ component, mọi nơi import trực tiếp từng file |
| `frontend/src/features/lesson/index.ts` | Barrel không ai dùng |

### File tĩnh
| File | Lý do |
|---|---|
| `frontend/public/icons.svg` | Sprite của template Vite, không được tham chiếu |
| `frontend/public/loopi-hello.svg` | Trùng hệt `public/mascot/loopi-hello.svg`; `CheckEmail` và `VerifyEmail` đã trỏ sang bản trong `mascot/` |

### CSS
- `--color-txt`, `--color-txt-muted`, `--color-txt-subtle` trong `styles/index.css` (bí danh v1, không class nào dùng).

### Khoá i18n (vi và en)
- `pages`: `student.lessons.uxNotesBtn`, `uxNotesTitle`, `uxNotes.*` (10 khoá, nút "Ghi chú UX" chỉ dành cho mockup); `student.lessons.continue.dictationProgress`, `shadowingProgress`; `student.lessonDetail.recentAdded`, `descriptionFallback`, `transcript.dictate`, `notFoundTitle`, `notFoundDesc`, `errorTitle`, `errorDesc`; `student.topicDetail.loadMore`, `notFoundTitle`, `notFoundDesc` (nút "Xem thêm" đã thay bằng phân trang).
- `common`: `language.switchTo`, `actions.clearFilters`.
- `auth`: `topBar.toggleTheme`.

## Đã xoá ở các giai đoạn trước (theo lịch sử commit)
- Thư viện icon Phosphor và các class `ph-*`, thay bằng Lucide qua `Icon`.
- Sprite 3D, hiệu ứng glow/gradient trang trí, CSS cũ `.ll-*`.
- Bố cục riêng của student, instructor, admin, gộp vào `AppShell`.
- Khối "Nhập từ YouTube" dạng thẻ (`YouTubeImportCard`), thay bằng nút mở hộp thoại.

## Cố ý giữ lại
- `public/png/*`, `public/svg/*`, `favicon.ico`: bộ logo thương hiệu, một phần dùng cho favicon và để sẵn cho PWA hoặc trang thương hiệu.
- Token `--ease-spring`, `--dur-fast`: thuộc DESIGN.v2.
- Khoá `auth: settings.password.*`: được gọi động theo `prefix`.
- Khoá số nhiều `_other`: i18next chọn theo `count`.
