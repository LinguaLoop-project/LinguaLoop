# Quy ước kiểm thử

Quy ước này nói test đặt ở đâu, đặt tên thế nào và cần viết test gì. Chiến lược chung nằm ở `docs/test/TEST-PLAN.md`; bảng truy vết AC → test nằm ở `docs/test/TRACEABILITY-AC-TEST.md`.

## 1. Quy tắc chung

1. **Một nơi duy nhất cho mỗi loại test.** Không tạo thêm thư mục test ngoài các nơi nêu dưới đây.
2. **Gắn test với AC.** Test kiểm tra một tiêu chí chấp nhận phải ghi mã AC **mới** (`AC-TK-07`) trong tên hoặc mô tả test, để bảng truy vết tìm được. Không dùng mã cũ (`AC-AUTH-*`, `_AC08`).
3. **Mỗi AC cần ít nhất một ca dương. Nếu AC có điều kiện lỗi hoặc giới hạn, thêm ca âm và ca biên** (rỗng, quá dài, đúng ngưỡng, ngay trước và sau hạn).
4. **Test phải độc lập và lặp lại được.** Không phụ thuộc thứ tự chạy, giờ hệ thống thật hay mạng ngoài.
5. **Sửa lỗi thì thêm test hồi quy** tái hiện lỗi đó, ghi mã issue trong mô tả.
6. **Không gọi dịch vụ thật trong CI** (Azure, Gemini, VNPAY, Google). Dùng giả lập.

## 2. Bố trí thư mục

```
backend/src/test/java/com/lingualoop/backend/<package giống src/main>/
frontend/src/<đường dẫn giống file nguồn>/<tên>.test.ts(x)   # cạnh file nguồn
frontend/src/test/                                           # tiện ích dùng chung (setup, factory, mock)
e2e/                                                         # Playwright, luồng người dùng
perf/                                                        # test hiệu năng (k6)
```

### 2.1. Backend

| Loại | Tên file | Ghi chú |
|---|---|---|
| Unit | `<Lớp>Test.java` | Không khởi động Spring, không CSDL |
| Integration, API | `<Chức năng>IntegrationTest.java` | Testcontainers PostgreSQL; controller test dùng MockMvc |
| Gọi dịch vụ thật | `<Tên>ExternalTest.java` | Chạy tay, không nằm trong CI |
| Dữ liệu dùng chung | `<Module>TestData.java` | Đặt trong package test của module |

Package của lớp test **trùng package** của lớp được test.

Tên phương thức theo dạng `hànhĐộng_điềuKiện_kếtQuả_AC_<MODULE>_<số>`. Java không cho dấu `-` trong tên phương thức, nên mã AC viết bằng dấu gạch dưới: `AC-TK-13` thành `AC_TK_13`.

Ví dụ: `login_fifthWrongPassword_locksAccountFor15Minutes_AC_TK_13`

| Phần | Ví dụ | Nghĩa |
|---|---|---|
| Hành động | `login` | Chức năng hoặc phương thức đang kiểm tra |
| Điều kiện | `fifthWrongPassword` | Tình huống đầu vào (lần sai thứ 5) |
| Kết quả | `locksAccountFor15Minutes` | Kết quả mong đợi (khóa 15 phút) |
| Mã AC | `AC_TK_13` | Tiêu chí chấp nhận được kiểm tra |

Một test kiểm tra nhiều AC thì nối thêm: `..._AC_TK_11_AC_TK_12`. Nếu tên quá dài, dùng `@DisplayName("AC-TK-13: Sai mật khẩu 5 lần thì khóa 15 phút")` để ghi mã AC dạng gốc.

### 2.2. Frontend

- Test **đặt cạnh file nguồn**, cùng thư mục, tên `<tênFile>.test.ts` hoặc `.test.tsx`. Không dùng thư mục `__tests__`.
  - `features/auth/passwordStrength.ts` → `features/auth/passwordStrength.test.ts`
  - `features/tutor/hooks/useTutorMode.ts` → `features/tutor/hooks/useTutorMode.test.ts`
- Một file test cho một file nguồn. Không gom test của nhiều file vào một file.
- Mỗi feature có file `i18n.test.ts` kiểm tra khóa dịch `vi` và `en` khớp nhau (đã có ở dictation, practice, shadowing, tutor; làm tương tự cho feature mới).
- Tiện ích dùng chung (mock axios, tạo dữ liệu mẫu, cấu hình môi trường test) đặt trong `frontend/src/test/`, không đặt rải trong từng feature.
- Test E2E đặt ở `e2e/`, mỗi luồng một file `<luồng>.spec.ts`, đặt tên theo use case (`e2e/tk-dang-nhap.spec.ts`).

## 3. Frontend cần viết test gì

### 3.1. Theo loại file

| Loại file | Có cần test | Test gì |
|---|---|---|
| `utils.ts`, `rules.ts`, hàm tính toán (`passwordStrength`, `aiEnergyMath`) | **Bắt buộc** | Đầu vào hợp lệ, rỗng, sai kiểu, giá trị biên; mọi nhánh |
| `validations/*Schemas.ts` (yup) | **Bắt buộc** | Từng quy tắc: hợp lệ, thiếu, sai định dạng, vượt độ dài (khớp BR trong SRS) |
| `stores/*Store.ts` (zustand) | **Bắt buộc** | Trạng thái ban đầu, từng hành động, đặt lại, hành động liên tiếp |
| `api.ts`, `services/*Service.ts` | **Bắt buộc** | Đường dẫn và tham số gửi đi, ánh xạ dữ liệu trả về, ánh xạ lỗi (401, 403, 409, 5xx, mất mạng). Giả lập axios |
| `hooks/*.ts` có logic | Nên | Trạng thái qua các bước, hủy khi gỡ, lỗi. Dùng `renderHook` nếu đã cài thư viện test |
| `errors.ts`, `navigation.ts` | Nên | Bảng ánh xạ mã lỗi → thông báo, quy tắc điều hướng sau đăng nhập |
| `i18n.ts` / file dịch | **Bắt buộc** (1 test mỗi feature) | `vi` và `en` có cùng tập khóa |
| `types.ts`, `index.ts` chỉ xuất lại | Không | Không có logic |
| Component và page (`*.tsx`) | Theo tầng E2E | Hiện chưa có jsdom. Kiểm thử luồng bằng E2E; chỉ viết test component khi đã cài thư viện test cho React |

### 3.2. Luồng E2E tối thiểu (Playwright)

Mỗi luồng gắn với AC trong SRS:

| Luồng | AC chính |
|---|---|
| Đăng ký → xác thực email → đăng nhập | AC-TK-01, AC-TK-07, AC-TK-28 |
| Đăng nhập sai và bị khóa tạm | AC-TK-11, AC-TK-13 |
| Quên mật khẩu → đặt lại | AC-TK-33, AC-TK-35 |
| Học một bài shadowing | [Điền AC-SH-*] |
| Ôn thẻ từ vựng | [Điền AC-HT-*] |
| Nâng cấp gói Pro | [Điền AC-PR-*] |

### 3.3. Không cần test

- Màu sắc, bố cục, thứ tự thành phần (xem bằng mắt hoặc ảnh chụp E2E).
- Mã của thư viện bên thứ ba.
- Getter/setter, kiểu dữ liệu, tệp cấu hình.

## 4. Mẫu test frontend

```ts
// features/auth/passwordStrength.test.ts
import { describe, expect, it } from "vitest";
import { getPwScore, isPwValid } from "./passwordStrength";

describe("passwordStrength", () => {
  it("chuỗi rỗng là mức yếu nhất", () => {
    expect(getPwScore("")).toBe(0);
  });

  it("đúng ngưỡng 8 ký tự được tính hợp lệ (AC-TK-02, biên)", () => {
    expect(isPwValid("Abcdef1!")).toBe(true);
  });

  it("ngắn hơn 8 ký tự không hợp lệ (AC-TK-02, âm)", () => {
    expect(isPwValid("Abc1!")).toBe(false);
  });
});
```

Quy tắc đặt tên: `describe` là tên hàm hoặc module; `it` nêu hành vi bằng tiếng Việt, kèm mã AC và loại ca (dương, âm, biên) khi có.

## 5. Coverage

| Phần | Phép đo | Ngưỡng |
|---|---|---|
| Backend | JaCoCo, loại `config`, `dto`, `entity`, `BackendApplication` | Dòng ≥ 70% (cổng trong `pom.xml`) |
| Frontend | Vitest v8 trên `features/**`, `stores/**`, `hooks/**`, loại `*.tsx` giao diện và `types.ts` | [Điền sau khi đo lần đầu] |

Không hạ ngưỡng để qua CI; thiếu thì viết thêm test.

## 6. Trước khi tạo pull request

- Chạy `./mvnw verify` (backend) và `npm test` (frontend) cục bộ.
- Mỗi chức năng mới có test và mã AC được ghi trong test.
- Cập nhật cột Test trong `docs/test/traceability/<module>.md`.
