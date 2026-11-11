# Cấu trúc thư mục dự án

Tài liệu mô tả cách tổ chức thư mục của backend và frontend: mỗi thư mục chứa gì, chia theo nguyên tắc nào, và đặt code mới vào đâu. Quy tắc viết code trong từng tầng xem [CODING-CONVENTION.md](CODING-CONVENTION.md).

## 1. Nguyên tắc chung

- **Chia theo feature, trong feature chia theo tầng.** Mỗi feature là một thư mục chứa đủ các tầng của nó, nên khi làm một chức năng gần như chỉ cần làm việc trong một thư mục.
- **Feature là domain nghiệp vụ.** Mỗi feature quản lý một nhóm bảng có cùng nghiệp vụ, ví dụ bài học, bộ thẻ, báo cáo. Không đặt tên feature theo trang giao diện (`mywords`, `today`) hay theo vai trò người dùng (`instructor`, `admin`).
- **Mỗi bảng thuộc đúng một feature.** Chỉ feature đó được ghi vào bảng. Feature khác cần dữ liệu thì gọi service interface của feature sở hữu, không import repository hay entity.
- **Vai trò tách bên trong feature, không tách thành feature riêng.** Một domain có thể phục vụ cả học viên, giáo viên và quản trị viên. Phần của mỗi vai trò nằm ở controller, service và trang riêng trong cùng feature.
- **Backend và frontend dùng cùng tên feature**, để tìm từ API sang giao diện và ngược lại.

## 2. Backend

### 2.1 Cấp gốc: `backend/src/main/java/com/lingualoop/backend/`

```
backend/
├── BackendApplication.java
├── common/          # dùng chung cho mọi feature, không phụ thuộc feature nào
│   ├── exception/   #   mã lỗi, BusinessException, GlobalExceptionHandler
│   ├── response/    #   ApiResponse, PageResponse
│   └── util/
├── config/          # @Configuration, @ConfigurationProperties, khai báo bean
├── security/        # JWT, SecurityConfig, filter, Role, phân quyền theo URL
│
└── <feature>/       # các feature nghiệp vụ, xem 2.2
```

### 2.2 Danh sách feature

| Feature | Phạm vi | Bảng sở hữu |
|---|---|---|
| `auth` | Đăng ký, đăng nhập, xác thực email, token | `auth_*` |
| `user` | Tài khoản, hồ sơ học tập, quản trị tài khoản, thông báo | `users`, `notifications` |
| `lesson` | Chủ đề, bài học, câu; tra cứu và soạn bài | `topics`, `lessons`, `sentences`, `lesson_likes` |
| `vocab` | Danh mục, bộ thẻ, nhóm thẻ, thẻ; học và ôn thẻ | `deck_categories`, `vocab_*`, `user_card_progress` |
| `dictionary` | Từ điển | `dictionary_words` |
| `practice` | Lượt luyện tập, câu đã lưu, ghi chú, thống kê luyện tập | `sentence_attempt*`, `user_sentence_review`, `sentence_notes` |
| `dictation` | Nghe chép và chấm từng từ | không có, ghi lượt làm qua `practice` |
| `shadowing` | Ghi âm, chấm phát âm, âm vị, nhận xét AI cho lượt đọc | `phonemes`, `ai_feedback` |
| `tutor` | Phiên luyện nói và trò chuyện với AI | `tutor_*`, `ai_conversation*` |
| `subscription` | Gói Pro, đơn mua | `pro_plans`, `pro_orders` |
| `credit` | Cấu hình, ví và nhật ký trừ credit AI | `ai_settings`, `ai_feature_prices`, `ai_wallets`, `ai_usage_logs` |
| `report` | Báo cáo nội dung và xử lý báo cáo | `content_reports` |
| `audit` | Nhật ký thao tác | `audit_logs` |
| `stats` | Thống kê tổng hợp nhiều domain | không có |
| `ai` | Client gọi LLM | không có |
| `devtools` | Công cụ chỉ bật ở môi trường dev | không có |

Bảng mới thêm bằng migration phải được gán cho một feature trong danh sách này. Thêm feature mới khi có nhóm bảng mới không thuộc domain nào ở trên.

Feature không có bảng (`stats`, `ai`, `devtools`) không có `entity/` hay `repository/`. Chúng chỉ gọi service interface của feature khác hoặc gọi dịch vụ ngoài.

### 2.3 Bên trong một feature

```
<feature>/
├── controller/      # @RestController
├── service/         # nghiệp vụ; interface cho feature khác gọi nằm ở đây
├── repository/      # Spring Data JPA cho bảng feature sở hữu
├── entity/          # @Entity, AttributeConverter
├── dto/             # View trả cho feature khác
│   ├── request/
│   └── response/
├── mapper/          # (nếu cần) MapStruct
├── exception/       # (nếu cần)
├── util/            # (nếu cần)
├── web/             # (nếu cần) cookie, Converter cho @PathVariable
└── <ten-dich-vu>/   # (nếu cần) client gọi dịch vụ ngoài, ví dụ shadowing/azure/
```

Tầng nào chưa cần thì chưa tạo thư mục.

### 2.4 Tách theo vai trò trong một feature

| Vai trò | Tiền tố URL | Controller | Service |
|---|---|---|---|
| Học viên | `/api/v1/` | `XxxController` | `XxxQueryService`, service nghiệp vụ của học viên |
| Giáo viên | `/api/v1/teacher/` | `TeacherXxxController` | `XxxAuthoringService` |
| Quản trị viên | `/api/v1/admin/` | `AdminXxxController` | `XxxAdminService` |

`SecurityConfig` phân quyền theo tiền tố URL, nên endpoint của giáo viên và quản trị viên phải nằm dưới đúng tiền tố.

Ví dụ:

```
lesson/
├── controller/
│   ├── LessonController.java           # /api/v1/lessons
│   └── TeacherLessonController.java    # /api/v1/teacher/lessons
├── service/
│   ├── LessonQueryService.java         # đọc, dùng cho học viên và feature khác
│   ├── LessonQueryServiceImpl.java
│   ├── LessonAuthoringService.java     # ghi, dùng cho giáo viên
│   └── LessonAuthoringServiceImpl.java
├── repository/
├── entity/
└── dto/
```

`entity/` và `repository/` dùng chung giữa các vai trò. Thay đổi ở hai tầng này cần người phụ trách vai trò còn lại duyệt PR.

### 2.5 Tài nguyên và test

```
backend/src/main/resources/
├── application*.yml
└── db/migration/        # Flyway: V1, V2 là baseline; migration mới đặt tên V<yyyyMMdd_HHmm>__mo_ta.sql

backend/src/test/java/com/lingualoop/backend/<feature>/   # cùng package với code được test
backend/seed/            # script nạp dữ liệu mẫu
```

## 3. Frontend

### 3.1 Cấp gốc: `frontend/src/`

```
src/
├── main.tsx
├── App.tsx
├── app/             # router, provider, guard theo đăng nhập và vai trò
├── api/             # HTTP client, query client, gắn token, xử lý lỗi
├── components/
│   ├── common/      # component giao diện dùng chung: Button, Card, Dialog...
│   └── layouts/     # khung trang theo vai trò: học viên, giáo viên, quản trị viên, xác thực
├── hooks/           # hook dùng ở nhiều feature
├── lib/             # tiện ích không phụ thuộc React
├── stores/          # state toàn cục
├── i18n/
├── styles/
│
└── features/        # cùng tên feature backend (trừ ai, devtools)
```

Code chỉ một feature dùng thì đặt trong feature đó. Chỉ chuyển lên `components/`, `hooks/`, `lib/` khi có từ hai feature trở lên cùng dùng.

### 3.2 Bên trong một feature

```
features/<feature>/
├── pages/           # trang học viên, gắn với route
│   ├── teacher/     # trang giáo viên
│   └── admin/       # trang quản trị viên
├── components/      # component chỉ dùng trong feature
├── api.ts           # gọi API backend của feature
├── hooks.ts
├── types.ts
└── index.ts         # chỉ export những gì feature khác và router được dùng
```

- `app/routes.tsx` gom route theo layout (`/teacher/*`, `/admin/*`) và import trang qua `index.ts` của feature.
- Feature khác chỉ import qua `index.ts`, không import sâu vào `components/` hay `api.ts`.
- Trang cần dữ liệu từ nhiều feature đặt ở feature chính của trang, phần còn lại lấy qua `index.ts` của feature kia.
- Test: file `*.test.ts(x)` đặt cạnh file được test.

## 4. Đặt code mới vào đâu

1. Xác định chức năng ghi vào bảng nào. Feature sở hữu bảng đó là nơi đặt code (mục 2.2).
2. Chức năng chỉ đọc và tổng hợp từ nhiều feature thì đặt ở `stats`, hoặc ở feature chiếm phần lớn dữ liệu nếu chỉ đọc từ một feature.
3. Xác định vai trò sử dụng để chọn tiền tố URL, tên controller và service (mục 2.4), cùng thư mục trang ở frontend (mục 3.2).
4. Cần dữ liệu của feature khác thì gọi service interface của feature đó. Nếu chưa có interface, feature sở hữu tạo interface kèm stub trước, rồi bổ sung phần thực thi sau.
