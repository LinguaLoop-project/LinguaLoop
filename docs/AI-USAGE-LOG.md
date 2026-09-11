# AI Usage Log — LinguaLoop

Nhật ký sử dụng AI trong đồ án, phục vụ minh chứng tiêu chí "làm chủ AI" (TC2, rubric TLCN/KLTN). File này phải đối chiếu được với `git log` — hội đồng chọn ngẫu nhiên bất kỳ vị trí nào trong bảng dưới, sinh viên phải giải thích được logic của đoạn code đó.

## Quy tắc ghi log

- Ghi **mỗi phiên làm việc có dùng AI để sinh/sửa code, tài liệu, hoặc quyết định thiết kế** — không ghi việc hỏi kiến thức chung không liên quan tới sản phẩm.
- Ghi ngay sau khi commit/PR liên quan được tạo, không dồn lại ghi bù cuối kỳ.
- Cột **Vai trò AI** phải trung thực: nếu AI viết toàn bộ hàm thì ghi "sinh mới", nếu chỉ gợi ý rồi người tự viết lại thì ghi "gợi ý", nếu review thì ghi "review".
- **Commit AI sinh** = hash commit chứa nguyên văn output AI (chưa sửa). **Commit sinh viên sửa** = hash commit sửa lại sau đó (nếu có) — để không lẫn "AI sinh" với "người đã viết lại". Không có sửa thì ghi `—`, không được bỏ trống.
- **Vị trí cụ thể** ghi `file:hàm` hoặc `file:dòng`, không ghi chung chung ở mức module — hội đồng hỏi bất kỳ dòng nào trong phạm vi này phải giải thích được.
- Cột **Người kiểm chứng** bắt buộc — mọi output AI đều phải qua ít nhất một hình thức xác minh (đọc lại, chạy test, chạy CI) trước khi merge.
- Không copy nguyên văn prompt dài — tóm tắt mục đích trong 1 câu. Không paste secret, dữ liệu người dùng thật, hay thông tin nhạy cảm vào prompt (xem checklist §4).

## 1. Bảng log chính

| Ngày | Người thực hiện | Công cụ / model | Nhiệm vụ (prompt chính, tóm tắt) | Vai trò AI | Vị trí cụ thể (file:hàm/dòng) | Commit AI sinh | Commit sinh viên sửa | Người kiểm chứng & cách kiểm chứng |
|------|------------------|------------------|-----------------------------------|------------|-------------------------------|-----------------|------------------------|--------------------------------------|
| 2026-09-11 | nvk3005 | Claude Sonnet 5 (Claude Code) | Tạo mẫu AI Usage Log và coding convention | sinh mới | `docs/AI-USAGE-LOG.md` (toàn file), `docs/convention/CODING-CONVENTION.md` (toàn file) | _(điền hash sau khi commit)_ | — | Đọc lại thủ công, đối chiếu với pom.xml/ci.yml/eslint.config.js thực tế |

<!--
Ví dụ dòng đầy đủ có sửa lại:

| 2026-09-12 | nvk3005 | Claude Sonnet 5 | Viết unit test cho UserService.register() | sinh mới | UserServiceTest.java:shouldThrowWhenEmailExists() | abc1234 | abc1235 (sửa lại mock không đúng behavior) | Chạy `mvn test`, review logic assert |
| 2026-09-13 | nvk3005 | Claude Sonnet 5 | Debug lỗi Flyway migration trùng version | giải thích | db/migration/V3__add_users.sql | — | — | Chạy lại migration trên DB local, xác nhận hết lỗi |
-->

## 2. Lỗi / ảo giác AI đã phát hiện

Bắt buộc tích luỹ **≥ 5 dòng** trước khi bảo vệ. Mỗi dòng phải có commit sửa thật (không ghi lý thuyết).

| # | Ngày phát hiện | Mô tả lỗi / ảo giác | Nguyên nhân (phân tích) | Vị trí (file:hàm) | Commit sửa |
|---|-----------------|----------------------|---------------------------|---------------------|--------------|
| 1 | _(điền)_ | _(vd: AI tự bịa tên method `findByEmailAndActive` không tồn tại trong Spring Data JPA, biên dịch lỗi)_ | _(vd: AI suy đoán theo pattern đặt tên phổ biến thay vì kiểm tra interface thật)_ | | |

<!--
Ví dụ loại lỗi hay gặp, điền khi thực tế xảy ra:
- Ảo giác API: gọi method/class không tồn tại trong version dependency đang dùng (vd Spring Boot 4 đổi tên so với Spring Boot 2/3 mà AI quen).
- Sai version: AI gợi ý cú pháp/annotation của phiên bản cũ (Spring Security 5 thay vì 6+, Lombok config sai).
- Bịa business rule: AI tự suy diễn luật nghiệp vụ không có trong đặc tả (vd tự thêm rule XP không có trong "Đặc tả usecase").
- Bỏ sót edge case: AI sinh code không xử lý null/exception cho case thực tế gặp phải (test/CI phát hiện).
- Sai kiểu dữ liệu/precision: AI dùng double cho tiền tệ/điểm số thay vì BigDecimal/int.
-->

## 3. Quy trình kiểm soát đầu ra AI

Checklist áp dụng cho **mọi** output AI trước khi đưa vào commit — không riêng code:

- [ ] **Review logic**: đọc toàn bộ output, không paste thẳng khi chưa hiểu.
- [ ] **Đối chiếu tài liệu chính thức**: API/annotation/method AI dùng có thật trong doc chính thức của đúng version đang dùng không (Spring Boot 4.1.1 docs, Spring Data JPA docs, React 19 docs...) — không tin AI nhớ đúng version.
- [ ] **Chạy được, qua CI**: build/lint/test/SpotBugs/Sonar (theo [`docs/convention/CODING-CONVENTION.md`](convention/CODING-CONVENTION.md)) pass trước khi merge, không có ngoại lệ cho code AI sinh.
- [ ] **Kiểm tra license mã nguồn**: nếu AI gợi ý đoạn code trông giống copy từ nguồn cụ thể (comment lạ, style khác hẳn phần còn lại, thuật toán đặc thù), tra xem có bản quyền/license ràng buộc không trước khi giữ lại.
- [ ] **Không đưa dữ liệu nhạy cảm vào prompt**: không paste secret (`.env`, API key, mật khẩu DB), dữ liệu người dùng thật, hay nội dung đặc tả có NDA vào prompt gửi AI.
- [ ] **Ghi log**: thêm dòng vào bảng §1 (và §2 nếu là lỗi AI phát hiện) trước khi coi task hoàn thành.
