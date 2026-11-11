# E2E / UI (Playwright)

Tầng kiểm thử luồng người dùng trên trình duyệt thật. Chưa có test nào; thư mục này là chỗ đặt chúng.

## Cấu trúc

```
e2e/
  README.md
  playwright.config.ts        # (thêm khi cài Playwright)
  fixtures/                   # đăng nhập sẵn, dữ liệu mẫu
  tk-dang-ky.spec.ts          # một file mỗi luồng, đặt tên <module>-<luồng>.spec.ts
  tk-dang-nhap.spec.ts
  tk-quen-mat-khau.spec.ts
  sh-hoc-shadowing.spec.ts
  ht-on-the.spec.ts
  pr-nang-cap-pro.spec.ts
```

## Quy tắc

- Mỗi `test(...)` ghi mã AC mới trong tiêu đề: `test("đăng nhập sai 5 lần bị khóa (AC-TK-13)", ...)`.
- Dùng bộ chọn theo vai trò và nhãn (`getByRole`, `getByLabel`), không dùng class CSS.
- Dữ liệu và tài khoản test tạo trong `fixtures/`, không dùng tài khoản thật. Gọi dịch vụ ngoài (Azure, Gemini, Google, VNPAY) bằng giả lập, không gọi thật.
- Chạy với backend dựng bằng Docker (Testcontainers hoặc docker compose) trong CI.

## Cài đặt (làm khi bắt đầu viết)

```bash
cd e2e
npm init -y
npm i -D @playwright/test
npx playwright install chromium
```

Danh sách luồng tối thiểu và AC tương ứng: `docs/convention/TESTING-CONVENTION.md`, mục 3.2.
