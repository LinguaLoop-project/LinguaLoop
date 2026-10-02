# Coding Convention — LinguaLoop

Áp dụng cho toàn bộ code merge vào `main`/`develop`. Convention bám theo tool đã cấu hình sẵn trong repo (SpotBugs, SonarCloud, JaCoCo, ESLint, CI), không đặt thêm quy tắc mà pipeline không kiểm được.

## 1. Git & commit

- Commit message theo **Conventional Commits**: `type(scope): mô tả ngắn`.
  Type dùng trong repo: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `ci`.
  Ví dụ thật trong log: `fix(ci): pin third-party actions to SHA, use vars for staging url`.
- Nhánh đặt tên `type/mo-ta-ngan` (vd `chore/ci-pipeline`, `feat/shadowing-scoring`).
- Không commit thẳng vào `main`; qua PR để CI (6 job trong `.github/workflows/backend-ci.yml`) chạy trước khi merge.
- Không bao giờ commit secret (API key, mật khẩu DB, token). Gitleaks quét toàn bộ lịch sử ở job "4 · Quét bảo mật" — lỡ commit thì phải revoke key, không chỉ xoá dòng ở commit sau.

## 2. Backend (Java 21 / Spring Boot 4.1.1)

### 2.1 Cấu trúc package

Chia theo **feature**, trong mỗi feature chia theo **tầng**: `com.lingualoop.backend.<feature>.{controller,service,repository,entity,dto}`. Danh sách feature và người phụ trách xem [planning/cau-truc-du-an.md](../../planning/cau-truc-du-an.md).

Phần dùng chung ở cấp gốc `backend/src/main/java/com/lingualoop/backend/`:

```
common/exception/  mã lỗi, định dạng lỗi API, GlobalExceptionHandler (@RestControllerAdvice)
common/response/   ApiResponse, PageResponse
common/util/       tiện ích dùng chung, không phụ thuộc feature nào
config/            @Configuration, khai báo bean — không chứa business logic
security/          JWT, filter, phân quyền theo vai trò
```

Bên trong mỗi feature (ví dụ `dictation/`):

```
controller/  @RestController — chỉ nhận request, validate, gọi service, trả response
service/     business logic — nơi duy nhất được orchestrate nhiều repository; interface public cho feature khác nằm ở đây
repository/  interface Spring Data JPA cho bảng feature này sở hữu — không viết business logic
entity/      @Entity JPA — chỉ mapping bảng, chỉ feature này được dùng
dto/         request, response, view trả cho feature khác — không mang logic
mapper/      (nếu cần) chuyển đổi entity <-> DTO — không đặt logic nghiệp vụ ở đây
```

Tầng nào chưa cần thì chưa tạo thư mục. Phần gọi dịch vụ ngoài đặt thư mục riêng trong feature (ví dụ `shadowing/azure/`).

Quy tắc phụ thuộc:
- `controller -> service -> repository`. Controller không được gọi thẳng repository; service không được biết `HttpServletRequest`/DTO của tầng web.
- Feature gọi feature khác **chỉ qua service interface** (danh sách ở mục 4 [planning/README.md](../../planning/README.md)), không import repository hay entity của feature khác.
- Chỉ chủ sở hữu bảng (mục 3 planning/README.md) được ghi vào bảng đó.

### 2.2 Naming

- Class: `PascalCase`, hậu tố theo vai trò rõ ràng — `UserController`, `UserService`, `UserRepository`, `UserMapper`, `UserResponse`/`UserRequest` (DTO), `UserNotFoundException`.
- Method: `camelCase`, động từ đầu câu (`findById`, `registerUser`, `calculateScore`).
- Field/biến local: `camelCase`; hằng số: `UPPER_SNAKE_CASE` + `static final`.
- Test class: `<ClassDuocTest>Test.java` (vd `UserServiceTest.java`), đặt cùng package tương ứng dưới `src/test/java`.

### 2.3 Lombok

- Dùng Lombok để giảm boilerplate (`@Getter`, `@Setter`, `@Builder`, `@RequiredArgsConstructor`) — đã khai báo trong `pom.xml`.
- Inject dependency bằng **constructor injection** qua `@RequiredArgsConstructor` + field `private final`, không dùng `@Autowired` trên field.
- Không dùng `@Data` trên `@Entity` (sinh `equals`/`hashCode`/`toString` dựa toàn bộ field dễ gây lỗi lazy-loading và vòng lặp quan hệ JPA); dùng `@Getter`/`@Setter` riêng lẻ cho entity.

### 2.4 Exception & validation

- Validate input ở DTO bằng annotation của `spring-boot-starter-validation` (`@NotNull`, `@Size`, `@Email`, ...), không tự viết if-check trùng lặp trong controller.
- Lỗi nghiệp vụ ném exception riêng (dùng chung trong `common/exception/`), xử lý tập trung bằng `@RestControllerAdvice`, trả response lỗi có cấu trúc thống nhất (status, message, timestamp) — không để exception mặc định của Spring lộ ra ngoài.

### 2.5 Database & migration

- Mọi thay đổi schema đi qua Flyway migration trong `src/main/resources/db/migration`, **không sửa lại migration đã merge** (kể cả `V1__init_schema.sql`, `V2__seed_reference_data.sql`) — muốn sửa thì tạo migration mới.
- Migration mới đặt tên theo thời gian `V<yyyyMMdd_HHmm>__mo_ta.sql` (vd `V20261001_1530__them_cot_streak.sql`) để hai người tạo song song không trùng version. Bật `spring.flyway.out-of-order=true` cho dev và test.
- Ưu tiên thêm cột nullable hoặc có giá trị mặc định. Migration sửa bảng của người kia phải qua PR và được người đó duyệt.
- Không dùng `ddl-auto: update/create` ở môi trường không phải local dev.

### 2.6 Test & coverage

- Test bắt buộc chạy qua `mvn verify` (Surefire + JaCoCo), khớp job "3 · Kiểm thử & coverage" trong CI.
- Ngưỡng coverage dòng hiện tại: **≥ 30%** toàn bundle (cấu hình trong `pom.xml`, sẽ tăng dần lên 50% rồi 70%) — không hạ ngưỡng này để né lỗi CI, thay vào đó viết thêm test.
- `config/`, `dto/`, `entity/`, `BackendApplication` được loại khỏi phép đo coverage (ít logic) — service/mapper/exception-handler là nơi bắt buộc phải có test.
- Test tích hợp dùng Testcontainers (Postgres) đã cấu hình sẵn (`TestcontainersConfiguration.java`), không mock DB bằng H2 để né setup — tránh sai khác hành vi so với Postgres prod.
- Gọi API ngoài (dịch, TTS...) trong test dùng WireMock (`wiremock-standalone` đã có trong `pom.xml`), không gọi API thật trong test.

### 2.7 Static analysis

- SpotBugs chạy ở job lint, hiện `failOnError=false` (chỉ cảnh báo, chưa chặn build) — vẫn phải đọc report và dọn dần, không để tích tồn warning.
- SonarCloud chạy khi có `SONAR_TOKEN` — code mới không được hạ Quality Gate (thêm code smell/duplication mới coi như lỗi cần sửa trước khi merge).

## 3. Frontend (React 19 + TypeScript + Vite + Tailwind 4)

### 3.1 Naming & cấu trúc

- Component: `PascalCase`, file trùng tên component (`LoginForm.tsx`).
- Hook tự viết: tiền tố `use` (`useAuth.ts`).
- Biến/hàm: `camelCase`; type/interface: `PascalCase`.
- Ưu tiên function component + hooks, không dùng class component.

### 3.2 TypeScript

- Không dùng `any` — nếu chưa rõ kiểu, khai báo `unknown` rồi narrow, hoặc định nghĩa type/interface cụ thể.
- Bật strict mode theo `tsconfig.app.json`/`tsconfig.json` hiện có — không tắt strict để code cho nhanh.

### 3.3 Lint

- Code phải pass `npm run lint` (ESLint flat config ở `eslint.config.js`: `@eslint/js` recommended + `typescript-eslint` recommended + `react-hooks` recommended + `react-refresh`) trước khi commit.
- Tuân thủ rule của `eslint-plugin-react-hooks` (không gọi hook có điều kiện, khai đủ dependency array) — đây là lỗi hay bị AI-generated code mắc phải, phải tự kiểm tra lại chứ không tin annotation AI đưa ra.

### 3.4 Styling

- Dùng Tailwind utility class trực tiếp trong JSX, không tự viết CSS module song song trừ khi Tailwind không đáp ứng được (animation phức tạp, v.v).
