# Test hiệu năng (phi chức năng)

Thư mục cho kịch bản đo thời gian phản hồi và tải của API. Chưa có kịch bản nào.

## Cấu trúc đề xuất

```
perf/
  README.md
  k6/
    auth-login.js        # POST /api/auth/login
    lesson-library.js    # GET danh sách bài học
    dictation-attempt.js # POST nộp bài nghe chép
```

## Quy tắc

- Công cụ: [k6](https://k6.io). Mỗi kịch bản khai báo `thresholds` để pass hoặc fail rõ ràng, ví dụ `http_req_duration: ["p(95)<500"]`, `http_req_failed: ["rate<0.01"]`.
- Ghi con số mục tiêu (thời gian phản hồi, số người dùng đồng thời) trong `docs/test/TEST-PLAN.md` mục 6 trước khi viết kịch bản, để số đo có chuẩn so sánh. Ngưỡng nên khớp yêu cầu phi chức năng trong SRS.
- Chạy với dữ liệu mẫu trên môi trường staging hoặc local, không chạy vào production.
- Không có endpoint gọi dịch vụ ngoài tính phí (Azure Speech bậc F0 chỉ 1 yêu cầu đồng thời, Gemini) trong kịch bản tải.
- Kết quả chạy (file tóm tắt) lưu vào `docs/test/reports/` làm minh chứng.
