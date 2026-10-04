# API Convention — LinguaLoop

Quy ước chung cho mọi REST API của backend. Code nền nằm ở `common/`, `config/`, `security/` (Kế giữ). Muốn đổi định dạng hoặc thêm mã lỗi thì gửi PR nhỏ.

## 1. Đường dẫn

- Mọi endpoint bắt đầu bằng `/api/v1`. Tên tài nguyên dùng danh từ số nhiều, viết thường, nối bằng `-`: `/api/v1/lessons/{id}/sentences`.
- Màn giáo viên dùng `/api/v1/teacher/**` (vai trò `INSTRUCTOR` hoặc `ADMIN`). Màn admin dùng `/api/v1/admin/**` (chỉ `ADMIN`).
- Không cần đăng nhập: `/api/v1/auth/**`, `/actuator/health`, Swagger (`/swagger-ui.html`, `/v3/api-docs`). Mọi đường dẫn khác đều cần token.

## 2. Header

| Header | Chiều | Ý nghĩa |
|---|---|---|
| `Authorization: Bearer <token>` | request | Access token JWT do `JwtTokenService` cấp |
| `X-Request-Id` | request (tuỳ chọn) / response | Mã request dạng UUID. Client có thể tự gửi (`crypto.randomUUID()`), nếu không gửi thì server sinh. Mã này xuất hiện trong log và trong `traceId` của lỗi |

## 3. Response thành công

Controller trả `ApiResponse<T>`:

```json
{
  "success": true,
  "data": { "id": "6f1c...", "title": "Daily routine" },
  "timestamp": "2026-10-02T08:00:00Z"
}
```

Danh sách có phân trang trả `ApiResponse<PageResponse<T>>`. `page` đánh số từ 0. Tạo bằng `PageResponse.from(page)`:

```json
{
  "success": true,
  "data": { "items": [ ... ], "page": 0, "size": 20, "totalElements": 57, "totalPages": 3 },
  "timestamp": "2026-10-02T08:00:00Z"
}
```

Thời gian luôn ở UTC, định dạng ISO-8601.

Response thành công **không có `message` hay `code`**. Frontend biết mình vừa gọi API nào nên tự hiện câu thông báo đã dịch. Nếu một endpoint có nhiều kiểu kết quả thành công cần hiển thị khác nhau, đặt chúng thành field enum trong DTO của `data`, không trả câu chữ:

```json
{ "success": true, "data": { "result": "PERFECT", "accuracy": 1.0, "streakMilestone": 7 } }
```

## 4. Response lỗi

Mọi lỗi, kể cả 401/403 do Spring Security trả, đều có cùng một dạng `ErrorResponse`:

```json
{
  "status": 400,
  "code": "VALIDATION_FAILED",
  "message": "Dữ liệu không hợp lệ",
  "path": "/api/v1/dictation/attempts",
  "traceId": "3f2c1d4e-5b6a-4c7d-8e9f-0a1b2c3d4e5f",
  "timestamp": "2026-10-02T08:00:00Z",
  "errors": [
    { "field": "answer", "code": "Size", "params": { "min": 1, "max": 500 }, "message": "size must be between 1 and 500" }
  ]
}
```

- Frontend xử lý và dịch theo `code`. `message` chỉ là câu dự phòng cho dev đọc, không hiển thị cho người dùng.
- `errors` chỉ có phần tử khi lỗi validate. Các lỗi khác trả mảng rỗng.
- Trong `errors[]`, `code` là tên annotation constraint (`NotBlank`, `Size`, `Min`, `Email`, ...). `params` là thuộc tính của constraint đó (`min`, `max`, `value`, ...) để chèn vào câu dịch.
- Lỗi 500 không bao giờ chứa chi tiết exception. Muốn tra nguyên nhân thì tìm log theo `traceId`.

### Mã lỗi (`ErrorCode`)

| code | HTTP | Khi nào |
|---|---|---|
| `VALIDATION_FAILED` | 400 | `@Valid` trên body hoặc tham số không đạt |
| `BAD_REQUEST` | 400 | JSON sai cú pháp, thiếu tham số, sai kiểu tham số |
| `UNAUTHORIZED` | 401 | Không gửi token |
| `TOKEN_INVALID` | 401 | Token sai chữ ký, sai issuer hoặc đã hết hạn |
| `FORBIDDEN` | 403 | Đã đăng nhập nhưng vai trò không đủ quyền |
| `NOT_FOUND` | 404 | Không có dữ liệu hoặc không có endpoint |
| `METHOD_NOT_ALLOWED` | 405 | Sai HTTP method |
| `CONFLICT` | 409 | Trùng dữ liệu, vi phạm ràng buộc DB |
| `PAYLOAD_TOO_LARGE` | 413 | File upload vượt giới hạn (vd file ghi âm) |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Sai `Content-Type` hoặc `Accept` |
| `QUOTA_EXCEEDED` | 429 | Hết lượt Free/Pro trong ngày |
| `INTERNAL_ERROR` | 500 | Lỗi không lường trước |

### Thêm mã lỗi mới

1. Thêm hằng vào `common/exception/ErrorCode.java`, đặt tên theo dạng `<FEATURE>_<VAN_DE>` (vd `LESSON_NOT_PUBLISHED`), kèm HTTP status và message dự phòng.
2. Trong service ném `new BusinessException(ErrorCode.LESSON_NOT_PUBLISHED)`. Với các trường hợp thường gặp có sẵn `NotFoundException`, `ConflictException`, `ForbiddenException`.
3. Không bắt exception rồi tự trả `ResponseEntity` lỗi trong controller. `GlobalExceptionHandler` đã lo phần này.

## 5. Đa ngôn ngữ (vi / en)

- **Backend không trả câu chữ cho người dùng.** Frontend (`react-i18next`) dịch mọi thứ theo các mã:
  - lỗi chung: `errors.<ErrorCode>`, vd `errors.QUOTA_EXCEEDED`
  - lỗi field: `validation.<code>`, vd `validation.Size` = "Từ {{min}} đến {{max}} ký tự"
  - kết quả nghiệp vụ: `<feature>.<field>.<ENUM>`, vd `dictation.result.PERFECT`
- PR thêm hằng vào `ErrorCode` hoặc thêm enum kết quả phải thêm khoá dịch vào cả `vi` và `en`.
- Ngôn ngữ của người dùng lưu ở `users.ui_language` (`vi` | `en`, mặc định `vi`). Trước khi đăng nhập, frontend dùng `localStorage`/trình duyệt.
- Ngoại lệ duy nhất là **email** (xác thực, quên mật khẩu): backend tự dịch bằng `MessageSource` (`messages_vi.properties`, `messages_en.properties`), ngôn ngữ lấy theo `users.ui_language`.
- Nội dung học (bài, câu, nghĩa từ điển) là dữ liệu trong DB, không thuộc phạm vi i18n.

## 6. Xác thực và người dùng hiện tại

- Token chứa `sub` = id người dùng (UUID), `role` (`student` | `instructor` | `admin`), `iss` = `lingualoop` và `exp` (mặc định 1 giờ).
- Feature `auth` cấp token bằng `JwtTokenService.issueAccessToken(userId, Role.STUDENT)` sau khi kiểm tra mật khẩu bằng bean `PasswordEncoder` (BCrypt). Refresh token do feature `auth` quyết định.
- Controller lấy id người đang đăng nhập bằng `@CurrentUserId`. Không đọc `userId` từ body hay query:

  ```java
  @GetMapping("/api/v1/me/saved-words")
  public ApiResponse<PageResponse<SavedWordResponse>> list(@CurrentUserId UUID userId, Pageable pageable) { ... }
  ```

- Ngoài controller dùng `SecurityUtils.currentUserId()`.
- Phân quyền chi tiết hơn mức URL thì dùng `@PreAuthorize("hasRole('ADMIN')")`.

## 7. Entity

Entity có đủ ba cột `id uuid`, `created_at`, `updated_at` thì kế thừa `common/entity/BaseEntity`, khi đó hai cột thời gian được tự điền. Bảng thiếu `updated_at` hoặc dùng khoá ghép thì tự khai báo các cột này.
