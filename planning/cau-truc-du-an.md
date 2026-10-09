# LinguaLoop — Cấu trúc dự án theo feature (gợi ý)

Mỗi feature là một thư mục chứa đủ mọi tầng của nó. Người nào phụ trách feature thì làm việc gần như chỉ trong thư mục đó, nên ít đụng file của người kia.

Quy tắc chung:
- Feature gọi feature khác **chỉ qua service interface** (mục 4 trong [README.md](README.md)), không import repository hay entity của feature khác.
- Code dùng chung cho mọi feature nằm ở `common/`, `config/`, `security/`. Chỉ Kế sửa trực tiếp, người kia gửi PR nhỏ.
- Tên feature theo trang giao diện trong `design/`.

## Backend: `backend/src/main/java/com/lingualoop/backend/`

```
backend/
├── BackendApplication.java
│
├── common/                      # dùng chung (Kế giữ)
│   ├── exception/               #   mã lỗi, định dạng lỗi API, GlobalExceptionHandler
│   ├── response/                #   ApiResponse, PageResponse
│   └── util/
├── config/                      # cấu hình Spring (Kế giữ)
├── security/                    # JWT, filter, phân quyền theo vai trò (Kế giữ)
│
├── auth/                        # Kế: đăng ký, đăng nhập, xác thực email
├── user/                        # Kế: users, user_consents, cài đặt, quyền riêng tư
├── audit/                       # Kế: AuditService, content_audit_log
├── dictation/                   # Kế: nghe chép, chấm từng từ, lượt làm (tuần 2)
├── instructor/                  # Kế: màn giáo viên: chủ đề, soạn bài, cắt câu, duyệt CEFR (ghi bài qua LessonAuthoringService)
├── dictionary/                  # Kế: từ điển, từ đã lưu (DictionaryQueryService)
├── vocab/                       # Kế: bộ từ, học và ôn thẻ (SrsQueryService)
├── assessment/                  # Kế: kiểm tra trình độ, ngân hàng câu hỏi
├── report/                      # Kế: báo lỗi nội dung
├── admin/                       # Kế: người dùng, tổng quan, duyệt bộ từ
│
├── subscription/                # Lâm: gói, hạn mức, thanh toán (QuotaService), admin hạn mức, đăng ký Pro
├── lesson/                      # Lâm: topics, lessons, sentences, seed bài, thư viện bài (SentenceQueryService, LessonAuthoringService)
├── shadowing/                   # Lâm: ghi âm, điểm, âm vị
│   └── azure/                   #   client gọi Azure, tách khỏi logic nghiệp vụ
├── phoneme/                     # Lâm: ngữ âm, cặp nhầm, cặp tối thiểu
├── weakness/                    # Lâm: thống kê điểm yếu, bộ sinh đề xuất
├── practice/                    # Lâm: luyện sửa lỗi, đo cải thiện
├── plan/                        # Lâm: kế hoạch ngày, trang Hôm nay
└── ai/                          # Lâm: nhận xét AI, CefrSuggestService (kết nối LLM)
```

Bên trong mỗi feature, **luôn chia tầng**, kể cả feature nhỏ (thống nhất một kiểu cho cả dự án):

```
dictation/
├── controller/    # REST endpoint, chỉ nhận request và trả response
├── service/       # nghiệp vụ; interface public cho feature khác nằm ở đây
├── repository/    # Spring Data JPA
├── entity/        # JPA entity, chỉ feature này được dùng
├── dto/           # request, response, view trả cho feature khác (record, không có logic)
└── mapper/        # MapStruct: chuyển entity -> dto/view (chỉ tạo khi feature cần)
```

Tầng chưa cần thì chưa tạo thư mục (ví dụ `audit` chưa có entity phức tạp).

**Mapper dùng MapStruct** (đã cấu hình trong `pom.xml`, chạy cùng Lombok):
- Mỗi mapper là một `interface` gắn `@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)`; MapStruct sinh class `...Impl` lúc biên dịch và Spring inject như bean thường (`private final UserMapper userMapper;`).
- `unmappedTargetPolicy = ERROR`: thêm field vào DTO mà quên map thì build đỏ, không để field mang giá trị mặc định sai âm thầm.
- Field DTO không có tên tương ứng trên entity thì khai báo rõ bằng `@Mapping(target = ..., expression = ...)` (vd `googleLinked` suy từ `authUid != null`).
- Mapper chỉ chuyển đổi dữ liệu, không gọi repository/service và không chứa quy tắc nghiệp vụ. Mỗi mapper có test trong `src/test/.../mapper/`.
- Mapper dùng nội bộ trong feature; feature khác chỉ nhận DTO qua service interface, không import mapper hay entity.
- Thêm dependency hay processor MapStruct mới thì giữ thứ tự trong `annotationProcessorPaths`: `lombok`, `lombok-mapstruct-binding`, `mapstruct-processor`. Feature có phần ngoài đặc biệt thì thêm thư mục riêng, ví dụ `shadowing/azure/`.

## Database: `backend/src/main/resources/db/migration/`

```
V1__init_schema.sql                  # không sửa
V2__seed_reference_data.sql          # không sửa
V20261001_1530__ten_viec.sql         # migration mới, đặt tên theo thời gian
```

Bảng nào thuộc feature nào xem mục 3 trong [README.md](README.md).

## Frontend: `frontend/src/`

```
src/
├── main.tsx
├── App.tsx
├── app/                         # router, provider, bảo vệ route (Kế giữ)
├── api/                         # API client, gắn token, xử lý lỗi (Kế giữ)
├── components/                  # bộ giao diện chung: nút, bảng, form (Lâm giữ)
│   └── layouts/                 #   layout học viên, giáo viên, admin
├── hooks/
├── lib/
├── styles/
│
└── features/                # tên trùng với feature backend
    ├── auth/                # Kế: login, register, verify, forgot
    ├── user/                # Kế: Cài đặt, quyền riêng tư
    ├── audit/               # Kế: lịch sử thay đổi (dùng trong instructor, admin)
    ├── dictation/           # Kế: nghe chép; tab Câu cần ôn, Ghi chú của trang mywords
    ├── dictionary/          # Kế: tra từ, từ đã lưu, khung trang mywords
    ├── vocab/               # Kế: bộ từ, học và ôn thẻ
    ├── assessment/          # Kế: onboarding, kiểm tra trình độ; trang giáo viên qbank
    ├── report/              # Kế: modal báo lỗi, danh sách báo lỗi đã gửi
    ├── instructor/          # Kế: các trang giáo viên (topics, lessons, compose, cefr, ...)
    ├── admin/               # Kế: users, reports, overview, decks, audit
    │
    ├── lesson/              # Lâm: thư viện bài, chủ đề, chi tiết bài
    ├── subscription/        # Lâm: bảng giá, paywall, tab Gói; trang admin limits, subs
    ├── shadowing/           # Lâm
    ├── phoneme/             # Lâm: bảng âm IPA; trang giáo viên phoneme
    ├── weakness/            # Lâm
    ├── practice/            # Lâm: luyện sửa lỗi
    └── plan/                # Lâm: trang Hôm nay
```

Backend có `ai/` nhưng frontend không có thư mục tương ứng vì chưa có trang riêng (nhận xét AI hiện trong `shadowing/`). Trang giáo viên và admin gom trong `instructor/` và `admin/`; riêng `limits`, `subs` của Lâm đặt trong `subscription/` rồi gắn vào route admin.

Bên trong mỗi feature:
```
features/dictation/
├── pages/            # trang gắn với route
├── components/       # chỉ dùng trong feature này
├── api.ts            # gọi backend của feature
├── hooks.ts
├── types.ts
└── index.ts          # chỉ export những thứ feature khác được dùng
```

## Test

Đặt cùng cấu trúc feature để dễ tìm:
- Backend: `src/test/java/com/lingualoop/backend/<feature>/`
- Frontend: file `*.test.tsx` cạnh file được test, hoặc `features/<feature>/__tests__/`.

