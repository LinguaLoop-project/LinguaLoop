# Báo cáo tiến độ — Tuần 03 (28/09 – 04/10/2026)

- **Đề tài:** Xây dựng nền tảng phát triển năng lực ngôn ngữ thực hành tiếng Anh với sự hỗ trợ của AI - LinguaLoop
- **Nhóm:** Nguyễn Văn Kế, Nguyễn Trí Lâm
- **GVHD:** cô Mai Anh Thơ
- **Repo:** https://github.com/LinguaLoop-project/LinguaLoop

## 1. Công việc đã làm trong tuần

### Nguyễn Văn Kế
| Công việc | Kết quả | Minh chứng |
|---|---|---|
| Lập lộ trình 12 tuần code, phân chia sở hữu bảng dữ liệu và contract giữa hai người, chốt cấu trúc thư mục dự án | Xong, đã merge | `6193849`, `2ecd78f`, `2d2b302`, `db44272`, PR #7, #8 |
| Mockup giao diện học viên | Xong, đã merge | `design/mockups-student/`, `26a32d4`, PR #7 |
| Nền tảng backend: định dạng response chung, xử lý lỗi tập trung, đăng nhập bằng JWT, phân quyền theo vai trò, CORS, Swagger; 31 test | Xong, đã merge | `993515e`, PR #10 |
| Quy ước API: định dạng response/lỗi, bảng mã lỗi, đa ngôn ngữ vi/en | Xong, đã merge | `bf5daf0`, PR #10 |
| Sửa CI để PR chỉ đổi một phần (backend hoặc frontend) vẫn qua được kiểm tra bắt buộc | Xong, đã merge | `06bbafb`, PR #6 |

Việc dự kiến chưa xong (lộ trình tuần 3): API đăng ký, đăng nhập, xác thực email, giao diện auth và ghi nhật ký (`AuditService`). Tuần này ưu tiên làm phần nền dùng chung cho mọi chức năng, dời sang tuần 04.

### Nguyễn Trí Lâm
| Công việc | Kết quả | Minh chứng |
|---|---|---|
| Hoàn thiện CI/CD frontend: deploy Vercel chỉ qua GitHub Actions, preview chỉ chạy trên `develop` và PR | Xong | `00f5a59`, `7e1025f`, `f3e1c96`, `5b386b1`, `9618a56` |
| Mockup giao diện giáo viên và admin | Xong, đã merge | `design/mockups-teacher/`, `design/mockups-admin/`, `26a32d4`, PR #7 (Kế gộp commit chung) |
| Trang đăng nhập, đăng ký, quên mật khẩu (giao diện, kiểm tra dữ liệu nhập) | Bản nháp, Kế tiếp nhận sửa và nối API ở tuần 04 | `e0d9e97`, `bc777f3`, PR #11 |

Việc dự kiến chưa xong (lộ trình tuần 3): bộ giao diện chung (màu, nút, bảng, 3 layout học viên, giáo viên, admin), quota tạm, thử gọi Azure Speech. Dời sang tuần 04.

## 2. Vướng mắc

- Chưa demo được luồng đăng ký → đăng nhập → trang Hôm nay vì API auth backend chưa có. Kế làm API auth đầu tuần 04.
- Lâm làm nhầm phần giao diện auth (thuộc phần của Kế theo `planning/cau-truc-du-an.md`). Kế tiếp nhận, sửa lại và nối API thật trong tuần 04; Lâm quay về việc của mình theo lộ trình.

## 3. Kế hoạch tuần 04 (05/10 – 11/10/2026)

Gồm việc còn dang dở của tuần này và việc tuần 2 trong lộ trình (`planning/README.md` §2).

### Nguyễn Văn Kế
| Công việc | Kết quả mong đợi |
|---|---|
| API đăng ký, đăng nhập, xác thực email | Endpoint `/api/v1/auth/*` có test, PR merged |
| Sửa lại trang đăng nhập, đăng ký, quên mật khẩu và nối vào API thật | Demo: đăng ký → đăng nhập → vào trang Hôm nay |
| `AuditService` (interface + stub) | Merged, các chức năng khác gọi được |
| Nghe chép: phát câu, gõ lại, chấm từng từ, lưu lượt làm (`dictation`) | Học viên chọn bài, nghe chép một câu, thấy kết quả tô màu từng từ |

### Nguyễn Trí Lâm
| Công việc | Kết quả mong đợi |
|---|---|
| Bộ giao diện chung theo `design/DESIGN.md`: màu, nút, bảng; 3 layout học viên, giáo viên, admin | 3 layout có sidebar, trang Hôm nay hiển thị trong layout học viên, PR merged |
| Quota tạm | Có hạn mức tạm để các chức năng chấm điểm gọi được |
| Thử gọi Azure Speech | Ghi chú cách gọi và mẫu kết quả trả về trong repo |
| `SentenceQueryService` (interface + stub), đầu tuần | Kế dùng được để làm nghe chép |
| Seed bài mẫu, thư viện bài học (`lessons`, `topic`, `lesson`) | Học viên xem danh sách chủ đề, bài học và chọn được bài |
