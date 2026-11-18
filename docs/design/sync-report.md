# Báo cáo đối chiếu thiết kế — feature `report` (XL, BC, BT-04/05 liên quan) — 2026-11-16 — commit 839821f + thay đổi chưa commit trên `feat/report-two-track`

Phạm vi: đặc tả `docs/srs/XL-xu-ly-bao-cao`, `docs/srs/BC-bao-cao-noi-dung`, UC-BT-04 nhánh 1c, UC-BT-05 nhánh 2b–2d
so với `backend/.../report`, `frontend/src/features/report` và các điểm nối trong `vocab`, `lesson`.

Chưa có sơ đồ lớp, tuần tự, ERD cho `report` trong `docs/design/` nên Bước 1, 2, 3, 5 không có gì để đối chiếu;
báo cáo này gồm Bước 4 (kiến trúc) và Bước 6 (đặc tả ↔ code, test).

## Tóm tắt
| Loại | Số điểm kiểm | Khớp | Lệch | Tỉ lệ |
|---|---|---|---|---|
| Kiến trúc (import chéo, ghi bảng của feature khác) | 1 feature | 1 | 0 | 100% |
| Con số nghiệp vụ (7 ngày, 30 ngày, ngưỡng 5, 500 ký tự, 10 dòng/trang) | 5 | 5 | 0 | 100% |
| Luồng UC và màn hình | 18 | 15 | 3 | 83% |
| AC có test tự động (XL 61 + BC 8) | 69 | 45 (một phần) | 24 thiếu | 65% |

## Diễn tập 5 điểm ngẫu nhiên
| # | Đặc tả / vị trí | Code / vị trí | Kết quả |
|---|---|---|---|
| 1 | BR-XL-11: quá hạn sau 7 ngày | `ReportReviewServiceImpl.OVERDUE_AFTER = 7 ngày` | Khớp |
| 2 | BR-XL-14: từ 5 báo cáo bị từ chối trong 30 ngày | `REJECTED_THRESHOLD = 5`, `STATS_WINDOW = 30 ngày`, SQL `HAVING count(*) >= :rejectedThreshold` | Khớp |
| 3 | AC-XL-09: quản trị viên lọc theo giáo viên chủ | Bộ lọc "Giáo viên chủ" (`GET /admin/reports/owners` + `ownerId`) | Khớp (đã sửa) |
| 4 | UC-XL-05 Bước 4: lý do gỡ và so sánh từng câu, thẻ | `RepublishView.Detail` (`item.takedownReason`, `changes`) | Khớp (đã sửa đặc tả) |
| 5 | BR-XL-04: ghi chú, lý do 1–500 ký tự | `ReportTexts.required`, `REPORT_TEXT_MAX = 500`, CHECK trong migration | Khớp |

Tỉ lệ khớp: 5/5 sau khi xử lý lệch #1, #2, #3 (lần chạy đầu: 3/5). Còn 3 chỗ lệch đã biết bên dưới.

## Chỗ lệch
| # | Loại | Đặc tả nói | Code đang là | Đề xuất | Ghi chú |
|---|---|---|---|---|---|
| 1 | Màn hình — **đã sửa code** | UC-XL-01 Bước 5, AC-XL-09: quản trị viên lọc theo giáo viên chủ | API có `ownerId`, giao diện không có ô chọn giáo viên | Sửa code (thêm bộ lọc giáo viên ở danh sách của quản trị viên) | Cần nguồn danh sách giáo viên (feature `user`) |
| 2 | Màn hình — **đã sửa đặc tả** (bỏ cụm này) | UC-XL-05 Bước 4: hiển thị các báo cáo dẫn tới việc gỡ | Chi tiết yêu cầu chỉ có lý do gỡ và so sánh nội dung | Sửa code (trả và hiện các báo cáo Phản cảm đã đóng cùng lúc gỡ) hoặc sửa đặc tả (bỏ cụm này) | |
| 3 | Luồng — **đã sửa đặc tả** (giáo viên tự quay lại, AC-XL-22 viết lại) | UC-XL-02 Bước 5 và nhánh 4a: sau khi lưu hoặc đóng màn sửa, hệ thống quay về chi tiết báo cáo | "Sửa nội dung" chuyển sang trang bộ thẻ; không tự quay lại báo cáo | Sửa code (truyền đường quay lại, hiện nút "Về báo cáo") hoặc sửa đặc tả (giáo viên tự quay lại) | AC-XL-22 phụ thuộc điểm này |
| 4 | Luồng | AC-XL-15, BR-XL-12: "Giao nội dung cho giáo viên" từ chi tiết báo cáo (UC-QT-06) | Nút có nhưng bị tắt, chưa làm | Sửa code khi làm UC-QT-06 | Đã biết, ngoài phạm vi nhánh này |
| 5 | Luồng — **để sau** | AC-XL-53: không đủ điều kiện xuất bản thì nêu câu còn thiếu bản dịch | Backend trả `details.missingTranslation`; giao diện hiện câu chung, không nêu số câu | Sửa code (ghép số câu, tên nhóm trống vào thông báo) | Nhỏ |
| 6 | Phạm vi bài học | UC-BC-01 cho câu, UC-BH-06 (khung "Bị gỡ do báo cáo" của bài học), nút xem toàn bộ bài ở UC-XL-05 | Chưa có trang bài học của giáo viên, chưa gắn `ReportButton` vào câu; `adminContentPath` trả null cho bài học | Lâm làm khi có trang bài học | Phần của Lâm |

Lệch nhỏ về chữ (không ảnh hưởng nghĩa): đặc tả "Duyệt" ↔ nút "Duyệt và xuất bản"; hộp xác nhận từ chối dùng nút "Từ chối".

## AC chưa có test
Theo `docs/test/traceability/`:
- XL (22): AC-XL-02, 03, 04, 05, 06, 12, 13, 14, 16, 22, 28, 34, 35, 36, 37, 40, 44, 45, 47, 51, 52, 54.
  Phần lớn đã có code (lọc, tìm, sắp xếp, phân trang, trạng thái rỗng, hủy hộp thoại, mất kết nối, báo cáo đã được xử lý) nhưng chưa có test gắn mã AC; các AC chỉ có ở giao diện (hủy, mất kết nối, trạng thái rỗng) cần E2E (chưa có Playwright).
  AC-XL-09 đã có test API; AC-XL-22 viết lại theo đặc tả mới, cần E2E.
- BC (2): AC-BC-06 (hủy hộp thoại), AC-BC-07 (giữ dữ liệu khi mất kết nối): chỉ ở giao diện, cần E2E.
- Tất cả 38 AC "Một phần" của XL và 6 của BC thiếu E2E.

## Vi phạm kiến trúc (import chéo feature)
`report` không import repository hoặc entity của feature khác. Mọi thao tác ghi vào bảng của feature khác đi qua service
interface của feature sở hữu: `LessonModerationService`, `DeckModerationService`, `VocabDeckContentService`,
`NotificationService`, `AuditService`. `report` có đọc chéo `lessons`, `sentences`, `vocab_*`, `users` bằng SQL JOIN chỉ
để đọc (tiền lệ `VocabDeckManageRepository`); Lâm cần duyệt các câu đọc bảng bài học.

Ngoài phạm vi (có từ trước): `shadowing` và `tutor` import entity/repository của `practice`, `shadowing`; `devtools`
import `subscription`.
