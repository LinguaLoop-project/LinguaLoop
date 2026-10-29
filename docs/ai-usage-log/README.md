# Quy ước ghi nhận việc sử dụng AI

Tài liệu này quy định cách ghi nhận việc sử dụng công cụ AI trong dự án **LinguaLoop**. Mục tiêu là giúp các thành viên ghi log nhất quán, có thể đối chiếu với code, kiểm thử và lịch sử Git, đồng thời thể hiện rõ trách nhiệm kiểm tra của sinh viên.

## 1. Cấu trúc thư mục

```text
docs/
└── ai-usage-log/
    ├── README.md
    ├── member-log-template.md
    ├── NguyenVanKe-23110234.md
    └── NguyenTriLam-23110250.md
.github/
└── pull_request_template.md
```

- `README.md`: quy ước dùng chung của nhóm.
- `member-log-template.md`: mẫu để sao chép khi tạo log cá nhân.
- `NguyenVanKe-23110234.md` (Nguyễn Văn Kế), `NguyenTriLam-23110250.md` (Nguyễn Trí Lâm): nhật ký thực tế của từng thành viên. Mỗi người chỉ sửa file của mình để tránh conflict.
- `.github/pull_request_template.md`: checklist áp dụng khi tạo Pull Request.

Mỗi thành viên chịu trách nhiệm cập nhật log của mình. Không ghi thay cho người khác nếu không có xác nhận của người đó.

## 2. Nguyên tắc ghi log

1. **Ghi trung thực:** chỉ ghi những gì thực sự đã xảy ra. Không tạo prompt, kết quả kiểm chứng, lỗi AI hoặc commit giả để làm đẹp hồ sơ.
2. **Ghi đủ ngữ cảnh:** mô tả AI được yêu cầu làm gì, code nằm ở đâu, sinh viên đã tự viết/chỉnh sửa/loại bỏ gì và đã kiểm chứng bằng cách nào.
3. **Đối chiếu được:** khi có thay đổi trong repository, liên kết log với mã hash commit.
4. **Không lộ dữ liệu nhạy cảm:** không lưu mật khẩu, token, secret, thông tin cá nhân nhạy cảm hoặc dữ liệu thật không được phép vào prompt hay log.
5. **Cập nhật khi có thay đổi:** nếu sau đó sửa code hoặc kiểm chứng bổ sung, cập nhật bản ghi tương ứng thay vì tạo thông tin mâu thuẫn.
6. **Không bắt buộc commit riêng:** code AI và phần sinh viên chỉnh sửa có thể nằm trong cùng commit. Log cần mô tả rõ đóng góp thực tế; không viết lại lịch sử Git để tạo bằng chứng không đúng sự thật.

## 3. Quy tắc mã định danh

### Nhật ký sử dụng AI

- Dùng dạng `AI-[MÃ]-[SỐ]`: `AI-KE-001`, `AI-KE-002`, `AI-LAM-001`, ...
- Mã thành viên: `KE` cho Kế, `LAM` cho Lâm. Mỗi người tự tăng số trong file của mình, nên ID không bao giờ trùng giữa hai người và không cần mở file của người kia.
- Số tăng dần, không tái sử dụng. Không đổi ID đã được tham chiếu từ mục lỗi hoặc PR.

### Nhật ký lỗi/đầu ra sai của AI

- Dùng dạng `AI-ERR-[MÃ]-[SỐ]`: `AI-ERR-KE-001`, `AI-ERR-LAM-001`, ...
- Cùng quy tắc mã thành viên và tự tăng số như trên.
- Mỗi lỗi phải liên kết với `AI Log ID` đã ghi nhận đầu ra AI liên quan.
- Chỉ ghi lỗi có căn cứ và mô tả được cách phát hiện. Không cần gọi mọi khác biệt về phong cách là “ảo giác AI”.

## 4. Enum dùng chung

Dùng đúng các giá trị dưới đây trong cột trạng thái/phân loại. Phần mô tả chi tiết vẫn viết bằng tiếng Việt tự do.

### 4.1. Công cụ AI (`AI Tool`)

Dùng tên công cụ nhất quán, ví dụ:

- `Claude Code`
- `ChatGPT`
- `GitHub Copilot`
- `Gemini`
- `Other: [tên công cụ]`, ví dụ `Other: Google Antigravity`

Ghi kèm model trong ngoặc nếu biết, ví dụ `Claude Code (Sonnet 5.5)`, `Other: Google Antigravity (Gemini 3.1 Pro)`. Chỉ thêm công cụ thực sự đã sử dụng.

### 4.2. Phạm vi (`Scope`)

Chọn một phạm vi chính phù hợp nhất:

- `AUTH` — đăng ký, đăng nhập, xác thực và phân quyền.
- `USER` — hồ sơ, cài đặt tài khoản.
- `LESSON` — thư viện bài học, chủ đề, transcript, tiến độ bài.
- `DICTATION` — luyện nghe chép chính tả.
- `SHADOWING` — luyện phát âm.
- `DICTIONARY` — tra cứu và lưu từ vựng.
- `SUBSCRIPTION` — gói Free/Pro, quota.
- `AUDIT` — ghi nhận thay đổi nội dung.
- `ASSESSMENT` — đánh giá trình độ.
- `LEARNING_PATH` — lộ trình học.
- `DATABASE` — schema, migration, truy vấn và dữ liệu.
- `FRONTEND` — giao diện và xử lý phía frontend.
- `BACKEND_COMMON` — thành phần dùng chung phía backend.
- `TESTING` — kiểm thử hoặc review kiểm thử.
- `DOCUMENTATION` — đặc tả, báo cáo và tài liệu.
- `DEVOPS_CI` — Docker, CI/CD, cấu hình triển khai.
- `OTHER` — phạm vi khác; phải giải thích trong phần mô tả.

Nếu một hoạt động liên quan nhiều phạm vi, chọn một phạm vi chính và nêu phạm vi phụ trong mô tả.

### 4.3. Loại công việc (`Task Type`)

Chọn loại chính:

- `EXPLANATION` — giải thích khái niệm hoặc code.
- `CODE_GENERATION` — sinh code mới.
- `CODE_MODIFICATION` — sửa code có sẵn.
- `CODE_REVIEW` — review code.
- `DEBUGGING` — tìm nguyên nhân/sửa lỗi.
- `TEST_GENERATION` — sinh hoặc bổ sung test.
- `DESIGN` — đề xuất thiết kế kiến trúc, dữ liệu hoặc giải pháp.
- `DOCUMENTATION` — soạn/sửa tài liệu.
- `OTHER` — loại khác; giải thích rõ.

### 4.4. Loại lỗi AI (`Error Type`)

- `LOGIC_ERROR` — sai logic nghiệp vụ/thuật toán.
- `API_MISUSE` — sử dụng API/thư viện sai hoặc gọi phương thức không tồn tại.
- `HALLUCINATED_REFERENCE` — bịa hoặc dẫn sai API, tài liệu hay nguồn tham khảo.
- `SECURITY_ISSUE` — tạo ra rủi ro bảo mật.
- `DATA_ERROR` — xử lý sai dữ liệu, schema, null hoặc mapping.
- `EDGE_CASE_MISSED` — bỏ sót trường hợp biên.
- `TEST_GAP` — thiếu kiểm thử cần thiết.
- `PERFORMANCE_ISSUE` — vấn đề hiệu năng.
- `STYLE_OR_MAINTAINABILITY` — khó đọc, khó bảo trì hoặc trùng lặp không hợp lý.
- `OTHER` — lỗi khác; giải thích rõ.

Chỉ ghi lỗi AI khi có thể chỉ ra đầu ra/đề xuất cụ thể và bằng chứng cho thấy nó sai, thiếu hoặc không phù hợp.

### 4.5. Trạng thái xử lý lỗi (`Error Status`)

- `OPEN` — đã ghi nhận, chưa điều tra đầy đủ.
- `INVESTIGATING` — đang xác minh nguyên nhân/phương án.
- `FIXED` — đã sửa nhưng chưa xác minh đầy đủ.
- `VERIFIED` — đã kiểm tra lại và xác nhận cách sửa.
- `WONT_FIX` — quyết định không sửa; phải ghi lý do và ảnh hưởng.

Không chuyển sang `VERIFIED` chỉ vì đã sửa code. Cần ghi test hoặc bằng chứng kiểm chứng sau sửa.


## 5. Quy ước ngày và commit

- Ngày dùng `YYYY-MM-DD`, ví dụ `2026-10-25`.
- Chỉ ghi mã hash commit, không ghi số PR hay trạng thái như `PENDING`. Ghi log **sau khi** đã commit để điền được hash thật; chưa commit thì chưa ghi bản ghi đó.
- Nếu bản ghi không tạo thay đổi trong repo (ví dụ chỉ hỏi giải thích), để trống `Commit` và nêu rõ trong phần "Phần sinh viên".
- Không bắt buộc tách commit riêng cho code AI và phần chỉnh sửa. Cần ghi rõ phần AI đề xuất/sinh, phần sinh viên tự viết/chỉnh sửa và cách kiểm chứng.

### 5.1. Quy ước ghi hash commit

- **Định dạng:** 7 ký tự đầu của hash, chữ thường, lấy từ `git log --oneline`. Ví dụ `c5b0496`. Không ghi hash đầy đủ, không bọc dấu nháy, không thêm chữ như "commit".
- **Nhiều commit:** ngăn cách bằng dấu phẩy và một dấu cách: `82db906, 78207df`. Thứ tự theo thời gian.
- **Hash nào:** ghi hash của commit **chứa code** (commit `feat`, `fix`, `refactor`...), không ghi hash của merge commit `Merge pull request ...`.
- **Ghi sau khi hash đã ổn định:** `rebase`, `commit --amend`, `fixup`/`squash` đều làm đổi hash. Chỉ ghi log khi commit đã push và sẽ không còn bị viết lại. Nếu đang trên nhánh chưa push hoặc còn phải rebase, chờ xong rồi mới ghi.
- **Squash merge:** hash trên nhánh không còn trên `main`. Nếu PR được squash, ghi hash của commit squash trên `main` sau khi merge.
- **Hai loại commit trong mục lỗi:** `Commit gây ra lỗi` là commit đưa đầu ra AI vào code; `Commit sửa` là commit khác, sửa lỗi đó. Hai hash không được giống nhau.
- **Kiểm tra hash có thật:** trước khi lưu, chạy `git cat-file -e <hash>^{commit}` (không in gì nghĩa là hash tồn tại) hoặc `git show --stat <hash>`.
- **Không ghi:** hash minh họa như thể là thật, hash của commit chưa tồn tại, hoặc hash của người khác mà chưa kiểm tra bằng `git show`.

- **Kiểm chứng:** bản ghi AI không có trường kiểm chứng. Việc kiểm chứng (build, test, lint, thử tay, review) ghi ở mục "Cách kiểm tra" của PR chứa commit, theo `.github/pull_request_template.md`; từ hash trong log tra được PR trên GitHub. Các bản ghi chuyển từ log cũ có phần kiểm chứng trong `docs/AI-USAGE-LOG.md`.

## 6. Yêu cầu tối thiểu cho mỗi bản ghi AI

Mỗi bản ghi nên trả lời được:

1. AI được yêu cầu hỗ trợ việc gì?
2. Nội dung AI đóng góp nằm ở đâu trong repo (`file:hàm`)? Hội đồng chọn ngẫu nhiên vị trí code và yêu cầu giải thích, nên phải tra ngược được từ code về log.
3. Sinh viên đã tự viết, chỉnh sửa, giữ lại hoặc loại bỏ phần nào?
4. Kết quả gắn với commit nào, nếu có?
5. Có đầu ra sai hoặc thiếu sót nào cần ghi ở mục lỗi không?

Không cần chép toàn bộ hội thoại dài vào log. Có thể tóm tắt prompt và ghi đường dẫn/bằng chứng bổ sung nếu cần; phải đảm bảo nội dung tóm tắt không làm sai lệch việc đã diễn ra.

## 7. Checklist kiểm tra trước khi hoàn tất log

- [ ] ID đúng dạng `AI-[MÃ]-[SỐ]`, số kế tiếp bản ghi trước trong file của mình.
- [ ] Có vị trí `file:hàm` cho mọi thay đổi trong repo.
- [ ] Enum được ghi đúng chính tả.
- [ ] Prompt và phần sinh viên tự viết/chỉnh sửa được mô tả đủ rõ.
- [ ] Commit là mã hash thật (7 ký tự), đã kiểm tra bằng `git cat-file -e` (xem §5.1).
- [ ] Lỗi có căn cứ, có cách phát hiện và trạng thái xử lý phù hợp.
- [ ] Mỗi lỗi có hash commit sửa thật, khác commit sinh; `Commit sửa` không để trống.
- [ ] Không đưa secret hoặc dữ liệu nhạy cảm vào log.
