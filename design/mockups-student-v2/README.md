# Mockup v2 — Học viên

Dựa trên `design/DESIGN.v2.md`. Dữ liệu mẫu, không gọi backend. Kế hoạch và nhật ký: `docs/ux/MOCKUP-V2-STUDENT-PLAN.md`, `docs/ux/MOCKUP-V2-PARITY.md`, `docs/ux/STATES.md`.

## Xem

Phải chạy qua máy chủ tĩnh (đường dẫn `../loopi-mascot`, `../lingualoop-logo`):

```
cd design
python -m http.server 8765
# http://127.0.0.1:8765/mockups-student-v2/index.html
```

## Trang

| Nhóm | Trang | Ghi chú |
|---|---|---|
| **P1 (thiết kế lại)** | `index` Hôm nay, `lessons`, `topic`, `lesson` | Có chuyển động, mascot, trạng thái người mới / tải / lỗi (`?state=`) |
| **P2 (cổng từ v1)** | `dictation`, `shadowing`, `vocab` | Giữ logic của v1: chấm từng từ, karaoke, ghi âm thật, bộ từ, tra từ, ôn thẻ SM-2, trắc nghiệm |
| **P3 (cổng từ v1)** | `deck`, `group`, `mywords`, `weakness`, `test`, `settings` | Giữ logic v1 |
| **P4 (cổng từ v1)** | `login`, `register`, `forgot`, `verify`, `brand` | Giữ logic v1 |
| Bộ kit | `kit.html` | Component ở hai chế độ sáng/tối (bản cũ, chưa gồm component mới) |

## Cách P2–P4 được dựng (khác P1)

P1 được viết lại từ đầu. P2–P4 là **bản cổng của v1** để giữ nguyên hành vi, rồi mới phủ phong cách v2:

- `compat.js`: các hàm hỗ trợ của `mockups-student/shell.js` (chấm điểm, SM-2, kiểm tra form, âm "ting", vẽ sóng…).
- `ported.css`: luật CSS của v1 mà v2 chưa có, đã bỏ vật thể 3D / parallax / spotlight; sinh bằng script.
- `js/*.js`: script trang của v1, chỉ đổi khoá lưu `ll3-` → `ll2-`.
- Icon Phosphor do script v1 sinh ra được đổi sang Lucide lúc chạy (`phToLucide` trong `shell.js`), kèm bảng ánh xạ `PH2LU`.
- Biến CSS v1 (`--gradient-*`, `--glow-*`) được ánh xạ về giá trị phẳng ở cuối `tokens.css`.

## Giới hạn đã biết

- P2–P4 mới đổi **màu, bề mặt, icon**; bố cục vẫn là của v1 và **chưa được thêm chuyển động/mascot** theo bảng ngân sách như P1. Đã rà hiển thị từng trang ở chế độ tối và sáng (xem `docs/ux/MOCKUP-V2-PARITY.md`, mục V1–V8).
- "Ghi chú UX" (`ux-notes.js`) là bản của v1, còn nhắc vật thể 3D và Cosmic Violet.
- Chưa kiểm tra ở 390px. Chưa thử ghi âm thật ở shadowing (cần cấp quyền micro).
- Lucide và font nạp từ CDN, cần mạng.
- Trang `?id=plan` của Cài đặt chưa xác nhận hiển thị đúng.

## Lệch so với DESIGN.v2 (đã ghi vào §14 của DESIGN.v2)

- Chữ trên nút màu chức năng dùng `--on-fn` (tối ở chế độ tối).
- `--warning`, `--info` ở chế độ sáng đổi giá trị để đạt 4,5:1.
- `--primary-text` được thêm cho chữ tím.
