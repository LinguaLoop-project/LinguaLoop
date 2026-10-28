# AI Usage Log — [Tên thành viên]

- **Dự án:** LinguaLoop
- **Thành viên:** [Tên thành viên]
- **Mã thành viên (dùng trong ID):** [KE hoặc LAM]

> Đọc `README.md` trong thư mục này trước khi ghi. Dùng enum và quy tắc ID thống nhất toàn dự án.

## 1. Nhật ký sử dụng AI

Mỗi bản ghi là một hoạt động hỗ trợ AI có ý nghĩa. Thêm bản ghi mới **vào cuối mục này**. Nếu cùng một yêu cầu có nhiều đầu ra khác nhau hoặc cần theo dõi riêng, tạo bản ghi riêng và nêu mối liên hệ.

### AI-[MÃ]-[SỐ]

- **Ngày:** YYYY-MM-DD
- **Công cụ AI / model:** [chọn theo README §4.1, kèm model nếu biết, ví dụ `Claude Code (Sonnet 5.5)`]
- **Phạm vi (`Scope`):** [enum, README §4.2]
- **Loại công việc (`Task Type`):** [enum, README §4.3]
- **Prompt chính / yêu cầu:** [Tóm tắt trung thực mục tiêu và ngữ cảnh quan trọng]
- **Vị trí code do AI sinh (`file:hàm`):** [mỗi dòng một vị trí, ví dụ `dictation/service/grading/WordAligner.java:align`; để trống nếu không có thay đổi trong repo]
- **Phần sinh viên tự viết/chỉnh sửa/loại bỏ:** [Bạn sửa, tự viết hoặc bỏ phần code nào? Bỏ dòng này nếu không sửa code]
- **Commit:** [hash commit, xem README §5.1]
- **Lỗi liên quan:** [ID lỗi hoặc NONE]

### Gợi ý khi điền

- **Prompt chính:** tóm tắt mục tiêu và ngữ cảnh quan trọng; không cần chép toàn bộ hội thoại nếu quá dài.
- **Vị trí:** ghi đủ chi tiết để từ một dòng code trong repo tra ngược được về bản ghi này. Đây là phần hội đồng dùng để chọn ngẫu nhiên và hỏi.
- **Phần sinh viên:** ghi cụ thể quyết định kỹ thuật và thay đổi code của bạn. Không sửa gì, hoặc chỉ bỏ/rút gọn ghi chú, thì bỏ dòng này.
- **Kiểm chứng:** không ghi trong log; ghi ở mục "Cách kiểm tra" của PR chứa commit (xem README §5).
- **Commit:** có thể cùng commit với phần sinh viên chỉnh sửa; không bắt buộc commit riêng.
- **Lỗi liên quan:** dùng `NONE` nếu chưa ghi nhận lỗi; không suy diễn lỗi chỉ để điền đủ.

## 2. Lỗi, đề xuất sai hoặc thiếu sót của AI đã được xác minh

Chỉ ghi vấn đề có căn cứ. Phân biệt lỗi thực tế với ý kiến về phong cách. Dùng `README.md` để chọn `Error Type` và `Error Status`.

### AI-ERR-[MÃ]-[SỐ]

- **Liên kết bản ghi AI:** AI-[MÃ]-[SỐ]
- **Loại lỗi (`Error Type`):** [enum, README §4.4]
- **Ngày phát hiện:** YYYY-MM-DD
- **Đầu ra sai/thiếu sót và bối cảnh:** [Nêu cụ thể điều AI đề xuất và vì sao không đúng]
- **Vị trí (`file:hàm`):** [vị trí code bị ảnh hưởng]
- **Nguyên nhân phân tích:** [Có căn cứ; nếu chưa rõ, ghi chưa xác định]
- **Cách phát hiện / bằng chứng:** [Test, tài liệu, code path hoặc quan sát tái hiện]
- **Cách sửa:** [Đã sửa gì, ở đâu]
- **Commit gây ra lỗi (đưa đầu ra AI vào code):** [hash commit, xem README §5.1]
- **Commit sửa (bắt buộc, khác commit trên):** [hash commit, xem README §5.1]
- **Kiểm chứng sau sửa:** [test/lệnh/quan sát cho thấy lỗi đã hết]
- **Trạng thái (`Error Status`):** [enum, README §4.5; chỉ `FIXED` hoặc `VERIFIED` mới tính vào mốc ≥ 5 lỗi]

## 3. Bằng chứng bổ sung (nếu cần)

- **Hội thoại / nguồn tham khảo:** [đường dẫn hoặc thông tin đủ để truy xuất, nếu có]
- **Test / lệnh kiểm tra:** [tên test hoặc lệnh đã chạy]
- **Tài liệu chính thức đã đối chiếu:** [tên tài liệu, phiên bản hoặc liên kết]
- **Ghi chú khác:** [thông tin cần thiết để người review hiểu quyết định]

Không lưu API key, mật khẩu, token, secret hoặc dữ liệu nhạy cảm trong file log.
