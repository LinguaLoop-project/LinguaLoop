# Kế hoạch kiểm thử LinguaLoop (bản ví dụ đã điền)

> **Đây là bản ví dụ** của `TEST-PLAN.md` với các mục `[Điền]` đã được điền giá trị đề xuất để làm mẫu. Người phụ trách, hạn và ngưỡng là đề xuất dựa trên `planning/README.md`; hai thành viên cần xác nhận trước khi chép sang `TEST-PLAN.md`. Mốc thời gian ghi theo **tuần** của lộ trình 12 tuần, không dùng ngày cụ thể.

| Mục | Nội dung |
|---|---|
| Phiên bản | 1.0 |
| Người phụ trách tài liệu | Nguyễn Trí Lâm (23110250) và Nguyễn Văn Kế (23110234) |
| Cập nhật lần cuối | Tuần 6 (mốc chốt cam kết sản phẩm và metric) |

## 1. Mục tiêu kiểm thử

1. Xác nhận từng tiêu chí chấp nhận (AC) trong `docs/srs/*/usecase.md` được thỏa mãn, kể cả ca âm và ca biên.
2. Ngăn lỗi hồi quy khi thêm tính năng (mỗi lỗi đã sửa có một test hồi quy).
3. Đạt các chỉ tiêu định lượng ở mục 6.2.

## 2. Phạm vi

### 2.1. Trong phạm vi

| Nhóm | Module (theo `docs/srs/`) |
|---|---|
| Học viên | TK, HT, SH, DI, TC, TH, PR, AI, NT |
| Giáo viên / nội dung | BH, BT, CD, BC, TN, XL |
| Quản trị | QT, GA, NK |
| Không chức năng | Bảo mật (xác thực, phân quyền), hiệu năng API, khả năng chịu lỗi khi dịch vụ ngoài hỏng |

### 2.2. Ngoài phạm vi

- Dịch vụ bên thứ ba tự nó (Azure Speech, Gemini, VNPAY, Google OAuth): chỉ kiểm tra tích hợp qua giả lập hoặc test "External" chạy tay.
- Ứng dụng di động riêng: mobile chỉ cần không vỡ layout, không kiểm thử riêng (theo quyết định giao diện).
- Trình duyệt cũ (Internet Explorer, Safari dưới 16): chỉ kiểm thử trên Chrome và Edge bản mới.
- Kiểm thử tải lớn (trên 100 người dùng đồng thời): chỉ đo hiệu năng cơ bản với tải nhỏ.
- XP, huy hiệu, bảng xếp hạng: chưa cài đặt, thuộc danh sách "làm sau".

## 3. Tầng kiểm thử

| Tầng | Mục đích | Công cụ | Vị trí | Hiện trạng |
|---|---|---|---|---|
| Unit | Logic thuần (chấm điểm chép, chuẩn hóa, quy tắc SM-2, ...) | JUnit 5, Mockito | `backend/src/test/**/*Test.java` | Có |
| Integration | Service + repository + PostgreSQL thật | Spring Boot Test, Testcontainers (PostgreSQL) | `*IntegrationTest.java` | Có |
| API | Hợp đồng endpoint, mã lỗi, phân quyền | MockMvc / Spring Boot Test, WireMock cho dịch vụ ngoài | `*/controller/*IntegrationTest.java` | Có một phần |
| Frontend unit | Hàm tiện ích, store, hook | Vitest | `frontend/src/**/*.test.ts` | Có, độ phủ thấp; mở rộng ở tuần 11 |
| E2E / UI | Luồng người dùng trên trình duyệt | Playwright | `e2e/` | Kế hoạch: 5 luồng (xem mục 8), hoàn thành tuần 11 |
| Phi chức năng | Bảo mật, hiệu năng | `SecurityIntegrationTest`, k6 | `backend/src/test/.../security`, `perf/` | Bảo mật: có. Hiệu năng: 3 kịch bản k6, hoàn thành tuần 11 |
| Tích hợp dịch vụ ngoài | Gọi Azure, Gemini thật | JUnit (`*ExternalTest`) | `backend/src/test/**` | Có, chạy tay, không thuộc CI |

## 4. Môi trường và dữ liệu

| Hạng mục | Mô tả |
|---|---|
| Backend | Java 21, Maven Wrapper, Spring Boot |
| CSDL test | PostgreSQL trong container (Testcontainers), cần Docker |
| Dịch vụ ngoài | WireMock; khóa thật chỉ dùng cho test `External` |
| Đồng hồ | `TestClockConfiguration` để test theo thời gian |
| Frontend | Node, Vitest (môi trường `node`) |
| E2E | Playwright (Chromium), backend dựng bằng Docker, tài khoản tạo trong `e2e/fixtures/` |
| CI | GitHub Actions: `backend-ci.yml`, `frontend-ci.yml` (chỉ chạy cho PR vào `main`) |
| Dữ liệu mẫu | Các lớp `*TestData.java` (ví dụ `DictationTestData`, `AttemptTestData`), seed bài học trong `db/`, stub WireMock cho Google, Azure, Gemini |

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
| Coverage dòng frontend (`features/**`, `stores/**`, `hooks/**`, loại giao diện) | ≥ 50% | Báo cáo Vitest (đặt sau lần đo đầu) |
| Tỉ lệ test case tự động hóa | ≥ 70% | Bảng truy vết: số AC có test tự động / (tự động + thủ công) |
| Kết quả CI lần cuối | 100% test pass | Log GitHub Actions |
| Defect Critical/Blocker còn mở lúc bảo vệ | 0 | Bug tracker |
| AC có test truy vết được | ≥ 80% | Bảng truy vết |
| Ca âm / ca biên | Mỗi module cốt lõi (TK, DI, SH, HT, PR) có cả hai loại | Cột "Loại" trong bảng truy vết |
| Thời gian phản hồi API cơ bản (đăng nhập, danh sách bài học) | p95 < 500 ms với 20 người dùng đồng thời | Kịch bản k6 |

## 7. Quản lý lỗi

Sổ đăng ký: `docs/test/BUG-REGISTER.md`. Quy ước:

| Mức độ | Định nghĩa | Hạn xử lý |
|---|---|---|
| Blocker / Critical | Mất dữ liệu, không đăng nhập được, sập luồng chính | Sửa trong 2 ngày; luôn xong trước khi bảo vệ |
| Major | Một chức năng chính sai | Sửa trong tuần phát hiện |
| Minor | Sai giao diện, sai thông báo | Sửa trước tuần 12 |

Vòng đời lỗi: `Mới → Đã xác nhận → Đang sửa → Đã sửa → Đã kiểm lại → Đóng`. Mỗi lỗi sửa xong phải kèm một test hồi quy và ghi tên test trong issue.

## 8. Phân công và lịch

Phân công theo bảng phụ trách trong `planning/README.md`: mỗi người viết và bảo trì test cho module mình làm từ database đến giao diện.

### 8.1. Theo module

| Người | Module | Việc kiểm thử |
|---|---|---|
| Kế | TK, DI, NT, BT, HT, CD, QT, XL, NK | Test backend và frontend, điền bảng truy vết của các module này |
| Lâm | BH, SH, PR, GA, AI, TC, TH, TN, BC | Test backend và frontend, điền bảng truy vết của các module này |

### 8.2. Việc chung

| Việc | Người | Hạn |
|---|---|---|
| Hoàn thiện bảng truy vết AC → test | Mỗi người, phần của mình | Tuần 11 |
| Thêm E2E Playwright (5 luồng: đăng ký và đăng nhập, quên mật khẩu, nghe chép, ôn thẻ, nâng cấp Pro) | Kế: 3 luồng đầu và ôn thẻ; Lâm: shadowing và nâng cấp Pro | Tuần 11 |
| Test hiệu năng API cơ bản (3 kịch bản k6) | Lâm | Tuần 11 |
| Dựng bug tracker (mẫu issue, sổ lỗi) | Kế | Tuần 6 |
| Mở rộng coverage frontend và đặt ngưỡng | Kế | Tuần 10 |
| Đổi mã AC cũ trong test sang mã mới | Mỗi người, phần của mình | Tuần 11 |
| Sinh báo cáo kiểm thử cuối kỳ và nộp minh chứng | Cả hai | Tuần 12 |

## 9. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Test gọi dịch vụ ngoài không ổn định | CI đỏ giả | Tách `*ExternalTest`, chạy tay |
| Hạn mức Azure Speech bậc F0 thấp | Không chạy được test thật nhiều lần | Dùng giả lập trong CI |
| Docker không có ở máy chạy test | Test integration không chạy | Dùng CI làm nguồn kết quả chính |
| Chú thích AC trong test dùng mã cũ | Truy vết sai | Đổi sang mã AC mới khi điền bảng truy vết |
| Chỉ có hai thành viên, dồn việc test cuối kỳ | Thiếu test, thiếu bảng truy vết | Viết test cùng lúc với code, chạy `sync` mỗi PR |

## 10. Số liệu hiện tại (đo ngày chạy `verify` gần nhất)

| Số liệu | Giá trị |
|---|---|
| Số test backend | 951 (1 lỗi do môi trường chạy cục bộ, 3 bỏ qua) |
| Coverage dòng backend | 92,6% (đã loại `config`, `dto`, `entity`) |
| Coverage nhánh backend | 84,4% |
| Số AC trong SRS | 704 (18 module) |
| Số AC đã truy vết tới test | 41 (module TK, 52 AC); các module khác chưa điền |
