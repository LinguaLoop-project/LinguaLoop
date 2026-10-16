# Đối chiếu tính năng: mockup-student v1 → v2 (P0 + P1)

> Lý do có tài liệu này: bản P1 đầu tiên của v2 được dựng từ bản đọc rút gọn, nên **thiếu nhiều tính năng của v1 mà không báo**. Danh sách dưới đây là kiểm kê đầy đủ từ `shell.js`, `js/lessons.js`, `js/today.js` và các file HTML của v1. Mỗi dòng phải được đánh dấu trước khi coi P1 là xong.

Ký hiệu: ☐ chưa làm · ◐ đã cài trong mã, chưa thử thao tác · ☑ đã thử thao tác bằng Playwright · ➖ cố ý khác v1 (kèm lý do).

Đã thử thao tác (14/10/2026): lọc trình độ, sắp xếp, chỉ bài miễn phí, tìm, trạng thái rỗng, Xoá bộ lọc, khoá Pro của YouTube, bật/tắt Pro, mở Ctrl K, menu tài khoản.

## P0 · Khung chung

| # | Tính năng v1 | Trạng thái |
|---|---|---|
| S1 | Thanh bên: nhóm "Học" (Bài học, Nghe chép, Shadowing, Từ vựng), nhóm "Của tôi" (Từ & câu đã lưu kèm số thẻ đến hạn, Điểm yếu, Kiểm tra trình độ); mục active đổi icon sang fill | ◐ đã cài, chưa thử thao tác |
| S2 | Nghe chép / Shadowing trên thanh bên mở thư viện lọc theo chế độ (`lessons?id=dictation|shadowing`) | ◐ đã cài, chưa thử thao tác |
| S3 | Thẻ Pro ở chân thanh bên (chỉ Free): "Từ 33k/tháng", nút Dùng thử Pro | ◐ đã cài, chưa thử thao tác |
| S4 | Thanh trên: nút tìm nhanh `Ctrl K`, chip chuỗi ngày, nút gói Free/PRO, đổi sáng/tối, menu tài khoản | ☑ đã thử thao tác |
| S5 | Menu tài khoản: thông tin, gói, Hồ sơ, Cài đặt học tập, Bảo mật, Quyền riêng tư, đổi giao diện, Đăng xuất | ☑ đã thử thao tác |
| S6 | Palette `Ctrl K` (và phím `/`): từ điển, bài học, đi tới màn, thao tác; ↑↓ Enter Esc | ☑ đã thử thao tác |
| S7 | Thanh phiên tập trung (steps, nhãn việc hiện tại, Thoát) | ◐ đã cài, chưa thử thao tác |
| S8 | Chân trang đầy đủ: thương hiệu, mạng xã hội, 4 cột liên kết, trạng thái hệ thống, đổi ngôn ngữ | ◐ đã cài, chưa thử thao tác |
| S9 | Chế độ Pro lưu bền, khoá bài Pro, mở khoá khi bật Pro | ☑ đã thử thao tác |
| S10 | Lưu từ bằng bookmark: nảy + hạt, tăng số thẻ đến hạn, toast kèm Hoàn tác | ◐ đã cài, chưa thử thao tác |
| S11 | Đọc to bằng TTS (nút loa) | ◐ đã cài, chưa thử thao tác |
| S12 | Toast có nút hành động; thông báo trượt từ trên (lên chuỗi); hộp thoại xác nhận; tấm "Ghi chú UX" | ◐ đã cài, chưa thử thao tác |
| S13 | Flash message giữa các trang; Enter kích hoạt thẻ đang focus; Esc đóng lớp phủ | ◐ đã cài, chưa thử thao tác |
| S16 | Nút thu gọn/mở rộng thanh bên, lưu lựa chọn (yêu cầu mới, không có ở v1) | ☑ đã thử thao tác |
| S17 | Chip chủ đề nhảy tới mục trong trang, dán dưới thanh trên, tô chip theo vị trí cuộn (ý tưởng từ LessonLibraryPage.tsx) | ☑ đã thử thao tác |
| S14 | Thanh điều hướng đáy trên mobile | ➖ bỏ theo Q13 (mobile chỉ cần không vỡ) |
| S15 | Vật thể 3D, parallax, spotlight, glow thở | ➖ bỏ theo Q4/Q16 |

## P1 · Hôm nay (`index`)

| # | Tính năng v1 | Trạng thái |
|---|---|---|
| T1 | Ngày + lời chào + nút Ghi chú UX | ◐ đã cài, chưa thử thao tác |
| T2 | Hero: mascot + bong bóng lời nhắn đổi theo tiến độ, tiêu đề "Kế hoạch N phút" | ◐ đã cài, chưa thử thao tác |
| T3 | Đổi thời lượng phiên 10/15/20/30 phút (lưu bền) | ◐ đã cài, chưa thử thao tác |
| T4 | Bắt đầu phiên: chuỗi việc tự chuyển, thanh phiên tập trung | ◐ đã cài, chưa thử thao tác |
| T5 | Vòng tiến độ phút đã làm / tổng | ◐ đã cài, chưa thử thao tác |
| T6 | Danh sách việc: icon, tiêu đề, lý do được giao, số phút, đang làm / đã xong, nút Bắt đầu/Làm lại | ◐ đã cài, chưa thử thao tác |
| T7 | Xong hết: hộp gợi ý học thêm + confetti | ◐ đã cài, chưa thử thao tác |
| T8 | Chuỗi ngày học: lửa, số, 7 ngày, kỷ lục, gợi ý; lên chuỗi thì lửa phóng to + số lật + thông báo | ◐ đã cài, chưa thử thao tác |
| T9 | Điểm yếu tuần này (3 mục, % lỗi, thanh) + liên kết Xem hết | ◐ đã cài, chưa thử thao tác |
| T10 | Trình độ (3 kỹ năng, CEFR) + liên kết Kiểm tra lại + ngày kiểm tra lại | ◐ đã cài, chưa thử thao tác |

## P1 · Thư viện bài (`lessons`)

| # | Tính năng v1 | Trạng thái |
|---|---|---|
| L1 | Tiêu đề theo chế độ (Bài học / Nghe chép / Shadowing) kèm tổng bài, chủ đề | ◐ đã cài, chưa thử thao tác |
| L2 | **Tạo bài từ YouTube** (Pro, AI): ô dán link, nút Tạo bài, khoá nếu Free. v2: nút ở đầu trang mở hộp thoại, không còn thẻ chiếm đầu trang ➖ | ☑ đã thử thao tác |
| L3 | Ô tìm theo tên | ☑ đã thử thao tác |
| L4 | Lọc trình độ: Tất cả / Cơ bản / Trung cấp / Nâng cao | ☑ đã thử thao tác |
| L5 | Sắp xếp: Phổ biến / Mới / Ngắn | ☑ đã thử thao tác |
| L6 | Chỉ bài miễn phí (nút bật/tắt) | ☑ đã thử thao tác |
| L7 | Hàng chip chủ đề kèm số bài | ◐ đã cài, chưa thử thao tác |
| L8 | Khi đang lọc: gộp thành lưới kết quả + số bài + Xoá bộ lọc + trạng thái rỗng | ☑ đã thử thao tác |
| L9 | "Tiếp tục học": thẻ có tiến độ "câu x/n", nút phát | ◐ đã cài, chưa thử thao tác |
| L10 | "Hợp trình độ B1 của bạn" (gợi ý từ kiểm tra trình độ) | ◐ đã cài, chưa thử thao tác |
| L11 | Hàng theo chủ đề: 4 bài + "Xem tất cả" | ◐ đã cài, chưa thử thao tác |
| L12 | Thẻ bài: ảnh bìa, PRO, CEFR, lượt học, nguồn, thời lượng, tên, nghĩa, hai nút chế độ có thanh tiến độ riêng + dấu đã xong | ◐ đã cài, chưa thử thao tác |
| L13 | Bấm nút chế độ: bài Pro khi Free thì báo + Dùng thử Pro; còn lại mở màn luyện | ☑ đã thử thao tác |
| L14 | Nút chế độ đơn khi đang ở chế độ lọc | ◐ đã cài, chưa thử thao tác |

## P1 · Chủ đề (`topic`)

| # | Tính năng v1 | Trạng thái |
|---|---|---|
| C1 | Đường dẫn, hero chủ đề (icon, tên EN, mô tả) | ◐ đã cài, chưa thử thao tác |
| C2 | Thẻ tiến độ chủ đề "đã hoàn thành x/tổng bài" | ◐ đã cài, chưa thử thao tác |
| C3 | Lọc trình độ + lọc trạng thái (Chưa học/Đang học/Đã xong) | ◐ đã cài, chưa thử thao tác |
| C4 | Đếm "Đang hiện x / tổng bài", Xem thêm | ◐ đã cài, chưa thử thao tác |
| C5 | Trạng thái rỗng | ◐ đã cài, chưa thử thao tác |

## P1 · Chi tiết bài (`lesson`)

| # | Tính năng v1 | Trạng thái |
|---|---|---|
| D1 | Đường dẫn 3 cấp | ◐ đã cài, chưa thử thao tác |
| D2 | Khung media + nút nghe thử câu đầu | ◐ đã cài, chưa thử thao tác |
| D3 | Tiêu đề, nghĩa, hàng meta: CEFR, PRO, nguồn, thời lượng, số câu, lượt học, ngày thêm | ◐ đã cài, chưa thử thao tác |
| D4 | Thẻ hai chế độ: trạng thái (Đang học/Đã xong), n/tổng câu, điểm TB, thanh, nút Bắt đầu/Tiếp tục/Luyện lại/Mở với Pro | ◐ đã cài, chưa thử thao tác |
| D5 | Danh sách câu: ẩn/hiện transcript (mặc định ẩn), điểm từng câu, "Đang ở câu này", mốc thời gian, nghe từng câu, "… và N câu nữa" | ◐ đã cài, chưa thử thao tác |
| D6 | Cột phải: vòng tiến độ + Nghe chép/Shadowing/Thời gian học | ◐ đã cài, chưa thử thao tác |
| D7 | Từ vựng trong bài: nghe, CEFR, nghĩa, lưu, Lưu tất cả | ◐ đã cài, chưa thử thao tác |
| D8 | Ghi chú của tôi (danh sách, Thêm, gợi ý phím N) | ◐ đã cài, chưa thử thao tác |
| D9 | Bài cùng chủ đề (3 bài + Xem cả chủ đề) | ◐ đã cài, chưa thử thao tác |

## Quy tắc thêm cho v2 (không có trong v1)

| # | Yêu cầu | Trạng thái |
|---|---|---|
| M1 | Chuyển động có mục đích theo bảng ngân sách (Q22): vào trang, chỉ báo tab trượt, thanh tiến độ chạy, đếm số, phản hồi sự kiện | ◐ đã cài, chưa thử thao tác |
| M2 | Mascot xuất hiện nhiều hơn (lớn/vừa/nhỏ) và chỉ đổi trạng thái khi có sự kiện (Q23) | ◐ đã cài, chưa thử thao tác |
| M3 | Không có chuyển động lặp vô hạn trừ mascot "thở" ở hero Hôm nay | ◐ đã cài, chưa thử thao tác |

## Cải thiện UX đã áp dụng sau đợt rà soát

| # | Thay đổi | Trạng thái |
|---|---|---|
| U1 | Thư viện bài: "Tiếp tục học" lên đầu; YouTube thu thành nút + hộp thoại | ☑ đã thử thao tác |
| U2 | Chi tiết bài: hai chế độ lên ngay dưới tiêu đề, bỏ đoạn mô tả lặp, thu nhỏ khung media | ☑ đã thử thao tác |
| U3 | Chi tiết bài: chế độ gợi ý nổi bật (đang học dở > chưa học > không gợi ý nếu cả hai xong) | ☑ đã thử thao tác |
| U4 | Nhãn trình độ thống nhất "Cơ bản (A1–A2)" ở thư viện và chủ đề | ☑ đã thử thao tác |
| U5 | Khoá Pro hiện sẵn trên nút chế độ khi Free (icon khoá, viền nét đứt), cập nhật khi bật/tắt Pro | ☑ đã thử thao tác |
| U6 | Trạng thái người mới (Hôm nay), đang tải, lỗi, mất mạng, rỗng, không tìm thấy: xem `docs/ux/STATES.md` | ☑ đã thử thao tác |

## P2–P4 (cổng từ v1, đã chạy được)

| Trang | Kiểm chứng | Ghi chú |
|---|---|---|
| Nghe chép | ☑ gõ đúng câu đầu + Enter ra "100 điểm · Chính xác tuyệt đối" | Việc "Bắt đầu" ở Hôm nay đã chuyển tới đúng màn |
| Shadowing | ◐ tải được, hiện luồng 3 bước, lượt chấm, âm đang luyện | Chưa thử ghi âm thật |
| Từ vựng (Bộ từ, Tra từ, Ôn thẻ, Trắc nghiệm) | ☑ mở được tab Ôn thẻ và Tra từ | Chưa thử lật thẻ và chấm SM-2 |
| Bộ từ, Học một nhóm | ◐ tải được | |
| Từ & câu đã lưu | ◐ tải được | |
| Điểm yếu | ☑ bản đồ 44 âm vị, panel chi tiết, cặp âm | |
| Kiểm tra trình độ | ◐ tải được | |
| Cài đặt | ☑ các mục Hồ sơ, Bảo mật, Quyền riêng tư; ◐ Gói | |
| Đăng nhập | ☑ điền form + gửi → về Hôm nay | |
| Đăng ký | ☑ gửi form rỗng báo 4 ô lỗi | |
| Quên mật khẩu, Xác minh, Logo & mascot | ◐ tải được | |

## Đợt rà soát hiển thị P2–P4 (15/10/2026)

Đã chụp ảnh từng trang ở chế độ tối và sáng, đối chiếu và sửa:

| # | Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|---|
| V1 | Khoảng trống ~150px ở đầu trang đăng nhập/đăng ký | Sprite SVG không có luật ẩn | Luật `.sprite` |
| V2 | Nút dạng liên kết có nền xám (Quên mật khẩu, Đăng ký, chân trang) | v1 có reset `button` theo thẻ, v2 chỉ nạp luật có class | Reset `button`, `.link` |
| V3 | Hai nút phát chồng nhau ở Nghe chép | Luật `.play-big` của khung media P1 rò sang | Giới hạn phạm vi vào `.ld-media`, `.l-head-media` |
| V4 | Icon "đặc" thành khối trắng (Kiểm tra trình độ, Cài đặt) | `ph-fill` đổi thành `fill` cho mọi icon | Chỉ tô đặc với danh sách icon hợp (play, flame, star…) |
| V5 | Icon bộ từ và ảnh minh hoạ từ rất nhỏ | Luật v1 theo thẻ `i` không khớp sau khi Lucide đổi thành `svg` | Nhân luật `i` sang `svg`; giữ class `ph-*` |
| V6 | Ô tìm kiếm viền đôi (Từ & câu đã lưu) | Class `search-sm` trùng giữa P1 và trang cổng | Đổi tên ở P1 thành `search-v2` |
| V7 | Quả cầu 3D còn lộ ở vài khối | `<svg><use href="#o-orb">` không có class `obj` | Ẩn mọi `svg` chứa `use[href^="#o-"]` |
| V8 | Trang chi tiết bài báo lỗi `scoreTone is not defined` | Hàm chuyển sang `compat.js` | Nạp `compat.js` ở các trang P1 |

Ghi chú quy trình: nhiều lần "sửa không có tác dụng" thực ra do **hai máy chủ cùng nghe cổng 8765** (Windows cho phép), nên trình duyệt nhận lúc bản cũ lúc bản mới. Đã dùng máy chủ riêng đặt `Cache-Control: no-store` và dọn tiến trình cũ.

## P2 làm lại kỹ (15/10/2026)

Nghe chép, Shadowing, Từ vựng đã được làm lại màu chức năng, trạng thái, chuyển động, kiểm thử luồng. Xem `docs/ux/MOCKUP-V2-P2.md`. P3, P4 chưa động tới.
