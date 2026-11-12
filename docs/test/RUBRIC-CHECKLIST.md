# Đối chiếu rubric kiểm thử (TC2.5, mức 5)

> Mỗi yêu cầu của rubric gắn với **minh chứng** nộp cho hội đồng và **lệnh** tạo ra minh chứng đó. Rubric chấm theo minh chứng: thiếu minh chứng thì tiêu chí không được xếp từ mức 4 trở lên.
> Số liệu thật nằm ở báo cáo sinh tự động: `python tools/test-report/generate.py report` (kết quả trong `docs/test/reports/`).

| # | Yêu cầu của rubric (mức 5) | Minh chứng | Cách tạo / kiểm tra | Chủ sở hữu |
|---|---|---|---|---|
| 1 | Có kế hoạch kiểm thử rõ ràng | `docs/test/TEST-PLAN.md` | Giữ cập nhật khi đổi phạm vi hoặc công cụ | [Điền] |
| 2 | ≥ 4 tầng test: unit, integration, API, E2E/UI, phi chức năng | Backend: `*Test`, `*IntegrationTest`. Frontend: `*.test.ts`. E2E: `e2e/*.spec.ts`. Hiệu năng: `perf/*`. Bảo mật: `SecurityIntegrationTest` | Báo cáo mục 2.3 đếm file theo tầng | [Điền] |
| 3 | Coverage dòng của module cốt lõi ≥ 70%, có báo cáo | `backend/target/site/jacoco/index.html`, artifact `coverage-report` trên CI | `./mvnw verify` (cổng 0.70 trong `pom.xml`) | [Điền] |
| 4 | Tỉ lệ test case tự động hóa ≥ 70% | Cột trạng thái trong `docs/test/traceability/*.md` | Báo cáo mục 1 | [Điền] |
| 5 | 100% test pass ở lần chạy CI cuối | Ảnh chụp hoặc link lần chạy GitHub Actions cuối | `python tools/test-report/generate.py report --ci-status pass` sau khi xem CI | [Điền] |
| 6 | 0 defect Critical/Blocker còn tồn tại lúc bảo vệ | `docs/test/BUG-REGISTER.md` | Báo cáo mục 1 đếm lỗi mở Critical/Blocker | [Điền] |
| 7 | Có bug tracker, vòng đời lỗi, regression test | GitHub Issues (mẫu `.github/ISSUE_TEMPLATE/bug_report.yml`), `BUG-REGISTER.md` | Mỗi lỗi sửa xong ghi tên test hồi quy trong sổ đăng ký | [Điền] |
| 8 | Test truy vết tới AC, bao phủ ca âm và ca biên | `docs/test/TRACEABILITY-AC-TEST.md` và `traceability/*.md` | `python tools/test-report/generate.py sync` rồi điền cột Loại, Test | [Điền] |

## Quy trình làm cùng lúc với viết code

1. **Trước khi code:** chạy `python tools/test-report/generate.py sync` để bảng truy vết có đủ AC của chức năng sắp làm.
2. **Trong lúc code:** viết test theo `docs/convention/TESTING-CONVENTION.md`, ghi mã AC mới trong tên test, đặt test đúng chỗ.
3. **Khi mở PR:** điền cột Test trong `traceability/<module>.md`, chạy `sync`, tick các mục kiểm thử trong mẫu PR.
4. **Khi sửa lỗi:** ghi lỗi vào GitHub Issues và `BUG-REGISTER.md`, thêm test hồi quy, ghi tên test vào sổ.
5. **Cuối mỗi tuần và trước bảo vệ:** chạy `./mvnw verify`, `sync`, `report`, lưu báo cáo vào `docs/test/reports/`.

## Việc còn mở (cập nhật theo báo cáo)

- [ ] Hoàn thiện bảng truy vết các module còn lại (hiện chỉ TK có dữ liệu).
- [ ] Thêm E2E Playwright (`e2e/`) cho các luồng trong `TESTING-CONVENTION.md` mục 3.2.
- [ ] Thêm test hiệu năng (`perf/`).
- [ ] Mở rộng coverage frontend (`features/**`, `stores/**`, `hooks/**`) và điền ngưỡng.
- [ ] Đổi chú thích mã AC cũ (`_AC08`...) trong test sang mã mới.
