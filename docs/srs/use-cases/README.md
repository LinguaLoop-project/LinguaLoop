# Danh mục Use Case

Trạng thái: `Nháp` → `Đã duyệt` (người dùng xác nhận) → `Đã cài đặt` → `Đã kiểm thử`.

| Mã UC | Tên | Tác nhân | Độ ưu tiên | Người phụ trách | Số AC | Trạng thái |
|---|---|---|---|---|---|---|
| UC-AUTH-01 | Đăng ký tài khoản | Học viên (người dùng mới) | Cao | Kế | 8 | Nháp |
| UC-AUTH-02 | Đăng nhập bằng email và mật khẩu | Học viên, Giảng viên, Quản trị viên | Cao | Kế | 9 | Nháp |
| UC-AUTH-03 | Đăng nhập bằng Google | Học viên, Giảng viên, Quản trị viên | Cao | Kế | 9 | Nháp |
| UC-AUTH-04 | Đăng xuất | Học viên, Giảng viên, Quản trị viên | Cao | Kế | 3 | Nháp |
| UC-AUTH-05 | Xác thực email | Học viên, Giảng viên, Quản trị viên | Cao | Kế | 5 | Nháp |
| UC-AUTH-06 | Quên và đặt lại mật khẩu | Học viên, Giảng viên, Quản trị viên | Cao | Kế | 8 | Nháp |
| UC-AUTH-07 | Tạo hoặc đổi mật khẩu | Học viên, Giảng viên, Quản trị viên | Cao | Kế | 5 | Nháp |
| UC-AUTH-08 | Thiết lập hồ sơ học tập (onboarding) | Học viên | Cao | Kế | 8 | Nháp |
| UC-DICT-01 | Nghe câu trong bài | Học viên | Cao | Kế | 12 | Nháp |
| UC-DICT-02 | Chép câu và xem kết quả (Normal, Hard) | Học viên | Cao | Kế | 9 | Nháp |
| UC-DICT-03 | Điền ô trống (Easy) | Học viên | Cao | Kế | 7 | Nháp |
| UC-DICT-04 | Xin gợi ý (lộ từ) | Học viên | Cao | Kế | 6 | Nháp |
| UC-DICT-05 | Xem đáp án cả câu | Học viên | Trung bình | Kế | 3 | Nháp |
| UC-DICT-06 | Làm lại câu | Học viên | Trung bình | Kế | 2 | Nháp |
| UC-DICT-07 | Hoàn thành bài | Học viên | Trung bình | Kế | 6 | Nháp |
| UC-DICT-08 | Xem lịch sử lượt làm của câu | Học viên | Trung bình | Lâm | 3 | Nháp |
| UC-DICT-09 | Ghi chú cho câu | Học viên | Trung bình | Lâm | 5 | Nháp |
| UC-DICT-10 | Câu cần ôn | Học viên | Trung bình | Lâm | 8 | Nháp |
| UC-LESSON-01 | Xem và lọc thư viện bài | Học viên | Cao | Lâm | 4 | Nháp |
| UC-LESSON-02 | Xem chủ đề | Học viên | Cao | Lâm | 1 | Nháp |
| UC-LESSON-03 | Xem chi tiết bài và transcript | Học viên | Cao | Lâm | 2 | Nháp |
| UC-LESSON-04 | Bài dành cho gói Pro | Học viên | Cao | Lâm | 1 | Nháp |
| UC-LESSON-05 | Truy cập và trang tổng quan | Học viên | Trung bình | Lâm | 2 | Nháp |
| UC-LESSON-06 | Hợp đồng đọc bài và câu cho luyện tập (nội bộ) | Feature dictation / shadowing (gọi nội bộ qua `SentenceQueryService`) | Cao | Lâm | 2 | Nháp |
| UC-LESSON-07 | Xem tiến độ nghe chép và điểm từng câu | Học viên | Trung bình | Lâm | 2 | Nháp |
