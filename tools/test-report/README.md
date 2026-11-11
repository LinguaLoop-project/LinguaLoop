# tools/test-report

Script `generate.py` (Python 3.9+, chỉ dùng thư viện chuẩn) làm hai việc:

| Lệnh | Việc |
|---|---|
| `python tools/test-report/generate.py sync` | Đọc mọi AC trong `docs/srs/*/usecase.md`, thêm AC mới vào `docs/test/traceability/<module>.md` (trạng thái `Thiếu`), bỏ AC đã bị xóa khỏi SRS nếu chưa có test, tính lại bảng ở `docs/test/TRACEABILITY-AC-TEST.md` |
| `python tools/test-report/generate.py report [--ci-status pass\|fail]` | Đọc `backend/target/surefire-reports`, `backend/target/site/jacoco/jacoco.xml`, `frontend/coverage/coverage-summary.json` (nếu có), bảng truy vết, `docs/test/BUG-REGISTER.md`, đếm file test theo tầng, rồi ghi `docs/test/reports/BAO-CAO-<ngày>.md` với bảng đối chiếu rubric |

Script chỉ đọc số liệu có sẵn và không chạy test. Mục nào chưa có dữ liệu được ghi là "Chưa đo được", không tự coi là đạt.

Để đo coverage frontend, thêm reporter `json-summary` cho `coverage` trong `frontend/vite.config.ts`.
