# frontend/src/test

Tiện ích dùng chung cho test frontend. **Không** đặt test của một file nguồn ở đây; test đi cạnh file nguồn (`<tênFile>.test.ts(x)`), xem `docs/convention/TESTING-CONVENTION.md`.

## Nội dung nên có

```
src/test/
  setup.ts            # cấu hình chạy trước mọi test (khi cần)
  factories.ts        # hàm tạo dữ liệu mẫu: makeUser(), makeLesson(), ...
  mocks/
    axios.ts          # giả lập axios dùng chung cho test api và services
    i18n.ts           # giả lập i18next khi cần
```

Chỉ thêm tệp khi có ít nhất hai test dùng chung. Tệp trong thư mục này được loại khỏi phép đo coverage.
