# Trạng thái giao diện: người mới, đang tải, lỗi, rỗng

> Nguồn: mockup v2 (`design/mockups-student-v2/`), xem từng trạng thái bằng tham số `?state=` hoặc bảng "Trạng thái xem thử" ở góc dưới phải.
> Mục đích: là danh sách việc cần làm khi chuyển sang React. Mockup chỉ chứng minh hình dạng, không chứa logic gọi API.

## 1. Bảng trạng thái

| Trang | Trạng thái | Hiển thị | Hành động của người dùng | `?state=` |
|---|---|---|---|---|
| **Hôm nay** | Người mới (chưa kiểm tra trình độ) | Hero "Bắt đầu bằng bài kiểm tra 5 phút"; 3 bước làm quen thay cho kế hoạch; streak 0; điểm yếu và trình độ có lời giải thích thay vì ẩn | Làm bài kiểm tra / thử bài ngắn / lưu từ đầu tiên | `new` |
| | Đang tải | Skeleton hero + danh sách + hai thẻ phụ | Chờ | `loading` |
| | Lỗi máy chủ | Thẻ lỗi có mascot, mã lỗi, nút Thử lại | Thử lại | `error` |
| | Mất mạng | Thẻ lỗi nhắc kiểm tra Wi-Fi, nói rõ tiến độ vẫn an toàn | Thử lại | `network` |
| **Thư viện bài** | Đang tải | Giữ tiêu đề + thanh lọc; vùng danh sách là 8 skeleton thẻ bài | Chờ | `loading` |
| | Lỗi / mất mạng | Thẻ lỗi thay vùng danh sách; thanh lọc vẫn còn | Thử lại | `error`, `network` |
| | Thư viện rỗng | "Thư viện đang được cập nhật" + nút Tạo bài từ YouTube | Tạo bài | `empty` |
| | Không có kết quả lọc | Thẻ rỗng + Xoá bộ lọc (đã có từ trước) | Xoá lọc | (tự có) |
| **Chủ đề** | Đang tải / lỗi / mất mạng | Giữ hero chủ đề; vùng bài là skeleton hoặc thẻ lỗi | Thử lại | `loading`, `error`, `network` |
| | Chủ đề chưa có bài | "Chủ đề này chưa có bài" + Xem chủ đề khác | Quay lại thư viện | `empty` |
| | Không tìm thấy chủ đề (slug sai) | Thẻ "Không tìm thấy chủ đề" + Về thư viện | Về thư viện | `?t=slug-sai` |
| **Chi tiết bài** | Đang tải / lỗi / mất mạng | Skeleton đầu trang + hai thẻ chế độ + danh sách câu; hoặc thẻ lỗi | Thử lại | `loading`, `error`, `network` |
| | Không tìm thấy bài (slug sai) | Thẻ "Không tìm thấy bài học", không có nút Thử lại (vô ích) | Về thư viện | `?l=slug-sai` hoặc `notfound` |

## 2. Nguyên tắc đã áp dụng

1. **Giữ phần khung đã có.** Khi tải/lỗi chỉ thay vùng dữ liệu; tiêu đề, bộ lọc, thanh bên vẫn nguyên để người dùng không mất ngữ cảnh.
2. **Skeleton có cùng hình dạng với nội dung thật**, để trang không nhảy bố cục khi dữ liệu về.
3. **Lỗi nói rõ lỗi của ai và điều gì còn an toàn.** "Đây không phải lỗi của bạn", "tiến độ học vẫn an toàn". Có mã lỗi để báo cáo.
4. **Chỉ hiện nút Thử lại khi thử lại có ý nghĩa.** Không tìm thấy (404) thì chỉ có "Về thư viện".
5. **Thử lại có phản hồi**: bấm → skeleton ~1s → nội dung + toast "Đã tải xong".
6. **Trạng thái người mới không bỏ trống thẻ.** Mỗi thẻ vẫn hiện, kèm một câu giải thích vì sao đang trống và việc cần làm để có dữ liệu.
7. **Skeleton có chuyển động (shimmer) vì là trạng thái chờ ngắn**; tắt khi người dùng bật giảm chuyển động.
8. Vùng đang tải có `aria-busy="true"` và nhãn "Đang tải…"; thẻ lỗi có `role="alert"`.

## 3. Việc cần làm trong React (đối chiếu code hiện tại)

| # | Hiện trạng trong `frontend/` | Cần làm |
|---|---|---|
| R1 | `LessonLibraryPage.tsx`: đang tải là một spinner giữa trang (dòng 448–451) | Thay bằng skeleton thẻ bài cùng lưới; giữ thanh lọc hiển thị |
| R2 | `LessonLibraryPage.tsx` đã có `isError` + `EmptyState` + nút Thử lại | Giữ; bổ sung mã lỗi nhỏ và câu "tiến độ học vẫn an toàn"; phân biệt mất mạng với lỗi máy chủ |
| R3 | `TopicDetailPage.tsx` chỉ xử lý `isTopicLoading`, không có nhánh `isError` của danh sách bài | Thêm nhánh lỗi cho `useLessonSearch` (thẻ lỗi + refetch) và phân biệt "chủ đề không có bài" với "lỗi tải" |
| R4 | `LessonDetailPage.tsx` đã có lỗi + Thử lại | Phân biệt 404 với lỗi mạng: 404 thì bỏ nút Thử lại, chỉ còn "Về thư viện" |
| R5 | `Hôm nay` còn là `PlaceholderPage` | Khi làm trang thật, dựng cả ba nhánh: người mới, tải, lỗi |
| R6 | `queryClient.ts`: `retry: false` cho mọi truy vấn | Một lần rớt mạng thoáng qua đã hiện lỗi ngay. Cân nhắc `retry: 1` cho các truy vấn đọc (không áp cho thao tác ghi) |
| R7 | Chưa có ranh giới lỗi toàn trang | Thêm `ErrorBoundary` ở cấp route để lỗi render không cho màn hình trắng |
| R8 | Chưa phân biệt trạng thái người mới ở API | Cần một cờ/giá trị từ backend: đã có kết quả kiểm tra trình độ chưa, đã có lượt luyện nào chưa. Đây là yêu cầu mới với Kế (không có trong SRS hiện tại) |

## 4. Giới hạn của mockup

- Thời gian "thử lại ~1s" là giả lập. Ở React dùng `refetch()` và trạng thái `isFetching`.
- Mã lỗi `SRV-500` là ví dụ; mã thật phải khớp bảng mã lỗi trong `docs/convention/API-CONVENTION.md`.
- Chưa thiết kế: lỗi một phần (ví dụ danh sách tải được nhưng tiến độ không), lỗi khi lưu từ/ghi chú, trạng thái hết hạn phiên đăng nhập giữa chừng.
- Chưa kiểm tra ở 390px.
