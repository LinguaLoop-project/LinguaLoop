# Kế hoạch kiểm thử LinguaLoop

> Mục tiêu tài liệu: đáp ứng tiêu chí TC2.5 của rubric (kế hoạch rõ ràng, nhiều tầng test, coverage, tự động hóa, quản lý lỗi, truy vết AC). Mục đánh dấu **[Cần bổ sung]** là việc chưa có trong dự án.

| Mục | Nội dung |
|---|---|
| Phiên bản | 0.1 (khung) |
| Người phụ trách | [Điền tên] |
| Cập nhật lần cuối | [Điền ngày] |

## 1. Mục tiêu kiểm thử

1. Xác nhận từng tiêu chí chấp nhận (AC) trong `docs/srs/*/usecase.md` được thỏa mãn, kể cả ca âm và ca biên.
2. Ngăn lỗi hồi quy khi thêm tính năng (mỗi lỗi đã sửa có một test hồi quy).
3. Đạt các chỉ tiêu định lượng ở mục 8.

## 2. Phạm vi

### 2.1. Trong phạm vi

| Nhóm | Module (theo `docs/srs/`) |
|---|---|
| Học viên | TK, HT, SH, DI, TC, TH, PR, AI, NT |
| Giáo viên / nội dung | BH, BT, CD, BC, TN, XL |
| Quản trị | QT, GA, NK |
| Không chức năng | Bảo mật (xác thực, phân quyền), hiệu năng API, khả năng chịu lỗi khi dịch vụ ngoài hỏng |

### 2.2. Ngoài phạm vi

- Dịch vụ bên thứ ba tự nó (Azure Speech, Gemini, VNPAY, Google OAuth): chỉ kiểm tra tích hợp qua giả lập (mock) hoặc test "External" chạy tay.
- [Điền thêm: thiết bị di động, trình duyệt cũ, ...]

## 3. Tầng kiểm thử

| Tầng | Mục đích | Công cụ | Vị trí | Hiện trạng |
|---|---|---|---|---|
| Unit | Logic thuần (chấm điểm chép, chuẩn hóa, quy tắc SM-2, ...) | JUnit 5, Mockito | `backend/src/test/**/*Test.java` | Có |
| Integration | Service + repository + PostgreSQL thật | Spring Boot Test, Testcontainers (PostgreSQL) | `*IntegrationTest.java` | Có |
| API | Hợp đồng endpoint, mã lỗi, phân quyền | MockMvc / Spring Boot Test, WireMock cho dịch vụ ngoài | `*/controller/*IntegrationTest.java` | Có một phần |
| Frontend unit | Hàm tiện ích, store, hook | Vitest | `frontend/src/**/*.test.ts` | Có, độ phủ thấp |
| E2E / UI | Luồng người dùng trên trình duyệt | Playwright | `e2e/` | **[Cần bổ sung]** |
| Phi chức năng | Bảo mật, hiệu năng | `SecurityIntegrationTest`, k6 hoặc JMeter | `backend/src/test/.../security`, `perf/` | Bảo mật: có. Hiệu năng: **[Cần bổ sung]** |
| Tích hợp dịch vụ ngoài | Gọi Azure, Gemini thật | JUnit (`*ExternalTest`) | `backend/src/test/**` | Có, chạy tay, không thuộc CI |

## 4. Môi trường và dữ liệu

| Hạng mục | Mô tả |
|---|---|
| Backend | Java 21, Maven Wrapper, Spring Boot |
| CSDL test | PostgreSQL trong container (Testcontainers), cần Docker |
| Dịch vụ ngoài | WireMock; khóa thật chỉ dùng cho test `External` |
| Đồng hồ | `TestClockConfiguration` để test theo thời gian |
| Frontend | Node, Vitest (môi trường `node`) |
| CI | GitHub Actions: `backend-ci.yml`, `frontend-ci.yml` |
| Dữ liệu mẫu | [Điền: seed, fixture, file `*TestData.java`] |

## 5. Quy trình và công cụ hỗ trợ

| Việc | Công cụ |
|---|---|
| Chạy test + coverage | `./mvnw verify` (Surefire, JaCoCo) |
| Phân tích tĩnh | SpotBugs, SonarCloud |
| Coverage frontend | `vitest run --coverage` |
| Truy vết AC → test | `docs/test/TRACEABILITY-AC-TEST.md`, `python tools/test-report/generate.py sync` |
| Báo cáo kiểm thử | `python tools/test-report/generate.py report` → `docs/test/reports/` |
| Đối chiếu rubric | `docs/test/RUBRIC-CHECKLIST.md` |
| Quy ước viết test | `docs/convention/TESTING-CONVENTION.md` |
| Quản lý lỗi | GitHub Issues (`.github/ISSUE_TEMPLATE/bug_report.yml`) và `docs/test/BUG-REGISTER.md`, xem mục 7 |

## 6. Tiêu chí vào và ra

### 6.1. Tiêu chí vào (bắt đầu kiểm thử một đợt)

- Mã nguồn biên dịch được (`mvn compile` xanh).
- AC của chức năng cần test đã chốt trong `usecase.md`.
- Môi trường test sẵn sàng (Docker chạy, CSDL test khởi tạo được).

### 6.2. Tiêu chí ra (được coi là đạt)

| Chỉ tiêu | Ngưỡng | Cách đo |
|---|---|---|
| Coverage dòng module cốt lõi (backend) | ≥ 70% | Báo cáo JaCoCo; cổng 0.70 trong `pom.xml` |
| Tỉ lệ test case tự động hóa | ≥ 70% | Bảng truy vết: số AC có test tự động / tổng AC |
| Kết quả CI lần cuối | 100% test pass | Log GitHub Actions |
| Defect Critical/Blocker còn mở lúc bảo vệ | 0 | Bug tracker |
| AC có test truy vết được | [Điền mục tiêu, ví dụ ≥ 80%] | Bảng truy vết |
| Ca âm / ca biên | Mỗi module cốt lõi có cả hai loại | Cột "Loại" trong bảng truy vết |

## 7. Quản lý lỗi

Sổ đăng ký: `docs/test/BUG-REGISTER.md`. Quy ước:

| Mức độ | Định nghĩa | Hạn xử lý |
|---|---|---|
| Blocker / Critical | Mất dữ liệu, không đăng nhập được, sập luồng chính | Trước khi bảo vệ |
| Major | Một chức năng chính sai | [Điền] |
| Minor | Sai giao diện, sai thông báo | [Điền] |

Vòng đời lỗi: `Mới → Đã xác nhận → Đang sửa → Đã sửa → Đã kiểm lại → Đóng`. Mỗi lỗi sửa xong phải kèm một test hồi quy và ghi tên test trong issue.

## 8. Phân công và lịch

| Việc | Người | Hạn |
|---|---|---|
| Hoàn thiện bảng truy vết AC → test | [Điền] | [Điền] |
| Thêm E2E Playwright (3–5 luồng chính) | [Điền] | [Điền] |
| Test hiệu năng API cơ bản | [Điền] | [Điền] |
| Dựng bug tracker | [Điền] | [Điền] |

## 9. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Test gọi dịch vụ ngoài không ổn định | CI đỏ giả | Tách `*ExternalTest`, chạy tay |
| Hạn mức Azure Speech bậc F0 thấp | Không chạy được test thật nhiều lần | Dùng giả lập trong CI |
| Docker không có ở máy chạy test | Test integration không chạy | Dùng CI làm nguồn kết quả chính |
| Chú thích AC trong test dùng mã cũ | Truy vết sai | Đổi sang mã AC mới khi điền bảng truy vết |

## 10. Số liệu hiện tại (đo ngày chạy `verify` gần nhất)

| Số liệu | Giá trị |
|---|---|
| Số test backend | 951 (1 lỗi do môi trường chạy cục bộ, 3 bỏ qua) |
| Coverage dòng backend | 92,6% (đã loại `config`, `dto`, `entity`) |
| Coverage nhánh backend | 84,4% |
| Số AC trong SRS | 704 (18 module) |
| Số AC đã truy vết tới test | 41 (module TK, 52 AC); các module khác chưa điền |
