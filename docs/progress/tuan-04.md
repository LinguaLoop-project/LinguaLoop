# Báo cáo tiến độ — Tuần 04 (05/10 – 11/10/2026)

- **Đề tài:** Xây dựng nền tảng phát triển năng lực ngôn ngữ thực hành tiếng Anh với sự hỗ trợ của AI - LinguaLoop
- **Nhóm:** Nguyễn Văn Kế, Nguyễn Trí Lâm
- **GVHD:** cô Mai Anh Thơ
- **Repo:** https://github.com/LinguaLoop-project/LinguaLoop

## 1. Công việc đã làm trong tuần

### Nguyễn Văn Kế
| Công việc | Kết quả | Minh chứng |
|---|---|---|
| Chức năng đăng ký, xác thực email, đăng nhập, đăng xuất, có kiểm thử | Xong, đã merge | PR #14 |
| Đặc tả use case cho nhóm chức năng tài khoản | Xong, đã merge | PR #14 |
| Giao diện đăng ký, đăng nhập, xác thực email nối với máy chủ; đăng nhập xong tự vào đúng trang theo vai trò (học viên, giáo viên, admin) | Xong, đã merge | PR #15 |
| Trang onboarding tạm cho học viên mới (sẽ thay bằng trang thiết lập hồ sơ) | Xong, đã merge | PR #15 |
| Đăng nhập bằng tài khoản Google; trang Cài đặt để tạo hoặc đổi mật khẩu | Xong, đã merge | PR #18 |
| Quên mật khẩu và đặt lại mật khẩu qua email | Xong, đã merge | PR #20 |
| Giao diện hai ngôn ngữ Việt/Anh, chuyển đổi giao diện sáng/tối | Xong, đã merge | PR #17, #20 |
| Sửa lỗi trên bản chạy thử trực tuyến (Vercel) | Xong, đã merge | PR #16, #19 |

Việc dự kiến chưa xong: chức năng ghi nhật ký thay đổi nội dung và chức năng nghe chép. Tuần này ưu tiên hoàn thiện trọn luồng tài khoản, dời sang tuần 05.

### Nguyễn Trí Lâm
| Công việc | Kết quả | Minh chứng |
|---|---|---|
| Bộ giao diện chung (nút, thẻ, bảng) và khung trang cho học viên, giáo viên, admin | Xong, đã merge | PR #13 |
| Hạn mức sử dụng tạm thời: hết lượt thì hiện thông báo nâng cấp | Xong, đã merge | PR #13 |
| Dữ liệu mẫu: chủ đề, bài học, câu | Xong, chưa gửi duyệt | nhánh `feat/lesson-library` |
| Thư viện bài học: xem danh sách chủ đề, bài học, chi tiết bài; có kiểm thử | Xong, chưa gửi duyệt | nhánh `feat/lesson-library` |
| Thử chấm phát âm bằng Azure Speech: ghi âm một câu, nhận điểm tổng, điểm từng từ và từng âm | Chạy được bản thử, chưa đưa lên repo | |

## 2. Vướng mắc

- Bản chạy thử trực tuyến không giữ được phiên đăng nhập · Đã sửa (PR #19).
- Đổi tên vai trò "teacher" thành "instructor" cho thống nhất với đặc tả · Đã cập nhật code và tài liệu.
- Nghe chép (lộ trình tuần 04) chưa làm nên tuần 05 phải làm gối đầu với việc giáo viên soạn bài.

## 3. Kế hoạch tuần 05 (12/10 – 18/10/2026)

### Nguyễn Văn Kế
| Công việc | Kết quả mong đợi |
|---|---|
| Ghi nhật ký khi giáo viên thêm, sửa, xoá, đăng bài | Bản đầu tiên để các chức năng khác dùng được |
| Kiểm tra học viên đã đồng ý cho AI xử lý giọng nói chưa | Bản đầu tiên để Lâm dùng cho shadowing |
| Nghe chép: học viên nghe một câu, gõ lại, hệ thống chấm từng từ và lưu kết quả | Demo: chọn bài → nghe chép một câu → từ đúng tô xanh, từ sai tô đỏ |
| Duyệt các PR của Lâm | PR thư viện bài học được merge |
| Giáo viên: quản lý chủ đề và danh sách bài học | Giáo viên thêm, sửa, xoá chủ đề; xem, gỡ đăng, xoá bài của mình |
| Giáo viên: soạn bài và cắt câu (nếu kịp) | Bước nhập thông tin bài; chưa kịp thì dời sang tuần 06 |

### Nguyễn Trí Lâm
| Công việc | Kết quả mong đợi |
|---|---|
| Phần lưu kết quả luyện tập dùng chung cho nghe chép và shadowing | Bản đầu tiên để Kế lưu kết quả nghe chép |
| Phần thêm, sửa, đăng bài học dùng chung | Bản đầu tiên để Kế làm màn soạn bài của giáo viên |
| Gửi duyệt thư viện bài học | PR được merge |
| Chốt cách lưu điểm phát âm (điểm tổng, từng từ, từng âm) | Thống nhất với Kế |
| Nghe chép hoàn thiện: câu cần ôn, ghi chú, lịch sử luyện | Học viên xem được lịch sử luyện, câu cần ôn và ghi chú của mình |
