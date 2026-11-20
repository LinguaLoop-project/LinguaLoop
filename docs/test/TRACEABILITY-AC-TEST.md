# Bảng truy vết: tiêu chí chấp nhận (AC) → test case

> Mỗi module có một file riêng trong thư mục `traceability/`. Nguồn AC: `docs/srs/*/usecase.md`.
> Bảng tổng hợp bên dưới do `python tools/test-report/generate.py sync` tự tính lại; không sửa tay.

> Cột **Test** ghi `LớpTest.phươngThức` (backend) hoặc file Vitest/Playwright. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: xem định nghĩa bên dưới.

## Định nghĩa trạng thái

| Trạng thái | Ý nghĩa |
|---|---|
| **Đã có** | AC đã có test tự động (JUnit, Vitest hoặc Playwright) kiểm tra đầy đủ. |
| **Một phần** | Đã có test nhưng chưa phủ hết AC. Ví dụ chỉ có luồng thành công mà thiếu trường hợp lỗi hoặc biên, hoặc chỉ test ở backend mà chưa test giao diện. Cần bổ sung test. |
| **Thiếu** | Chưa có test nào cho AC này và cần viết. |
| **Thủ công** | AC chỉ kiểm tra bằng tay, vì khó hoặc không đáng tự động hoá. Ví dụ phát âm với Azure Speech thật, nghe chất lượng audio, cảm nhận giao diện, thanh toán thật. Kết quả ghi trong biên bản test tay hoặc nghiệm thu. |
| **Không áp dụng** | AC không cần test case. Ví dụ ràng buộc phi chức năng hoặc yêu cầu chỉ mang tính tài liệu, hoặc AC thuộc phạm vi đã bỏ hay do dịch vụ bên thứ ba đảm nhiệm. |

## Tổng hợp theo module

Hai tỉ lệ ở cột cuối đo hai việc khác nhau:

- **% phủ đủ AC** = Đã có / Số AC: bao nhiêu AC đã được test kiểm tra đầy đủ.
- **% tự động** = (Đã có + Một phần) / (Đã có + Một phần + Thủ công): trong các AC đã được kiểm tra, bao nhiêu phần trăm kiểm bằng test tự động (chỉ tiêu rubric ≥ 70%). AC `Thiếu` và `Không áp dụng` không tính.

| Module | Số AC | Đã có test | Một phần | Thiếu | Thủ công | Không áp dụng | % phủ đủ AC | % tự động |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| [AI-thuc-hanh-voi-ai](traceability/AI-thuc-hanh-voi-ai.md) | 30 | 0 | 0 | 30 | 0 | 0 | 0% | — |
| [BC-bao-cao-noi-dung](traceability/BC-bao-cao-noi-dung.md) | 8 | 3 | 3 | 2 | 0 | 0 | 38% | 100% |
| [BH-quan-ly-bai-hoc](traceability/BH-quan-ly-bai-hoc.md) | 101 | 67 | 2 | 29 | 0 | 3 | 66% | 100% |
| [BT-quan-ly-bo-the](traceability/BT-quan-ly-bo-the.md) | 80 | 54 | 19 | 7 | 0 | 0 | 68% | 100% |
| [CD-quan-ly-chu-de-danh-muc](traceability/CD-quan-ly-chu-de-danh-muc.md) | 28 | 0 | 0 | 28 | 0 | 0 | 0% | — |
| [DI-dictation-cau-da-luu](traceability/DI-dictation-cau-da-luu.md) | 45 | 0 | 0 | 45 | 0 | 0 | 0% | — |
| [GA-quan-ly-goi-han-muc-ai](traceability/GA-quan-ly-goi-han-muc-ai.md) | 37 | 0 | 0 | 37 | 0 | 0 | 0% | — |
| [HT-hoc-the-on-tap](traceability/HT-hoc-the-on-tap.md) | 75 | 12 | 20 | 43 | 0 | 0 | 16% | 100% |
| [NK-nhat-ky-thong-ke-he-thong](traceability/NK-nhat-ky-thong-ke-he-thong.md) | 25 | 0 | 0 | 25 | 0 | 0 | 0% | — |
| [NT-quan-ly-nhom-the-the](traceability/NT-quan-ly-nhom-the-the.md) | 76 | 52 | 8 | 16 | 0 | 0 | 68% | 100% |
| [PR-goi-pro](traceability/PR-goi-pro.md) | 23 | 0 | 0 | 23 | 0 | 0 | 0% | — |
| [QT-quan-tri-tai-khoan](traceability/QT-quan-tri-tai-khoan.md) | 46 | 0 | 0 | 46 | 0 | 0 | 0% | — |
| [SH-shadowing](traceability/SH-shadowing.md) | 28 | 0 | 0 | 28 | 0 | 0 | 0% | — |
| [TC-tra-cuu-hoc-thu-dong](traceability/TC-tra-cuu-hoc-thu-dong.md) | 40 | 9 | 2 | 24 | 5 | 0 | 22% | 68.8% |
| [TH-xem-thong-ke-hoc-tap](traceability/TH-xem-thong-ke-hoc-tap.md) | 22 | 0 | 0 | 22 | 0 | 0 | 0% | — |
| [TK-tai-khoan-xac-thuc](traceability/TK-tai-khoan-xac-thuc.md) | 58 | 42 | 7 | 8 | 1 | 0 | 72% | 98% |
| [TN-xem-thong-ke-noi-dung](traceability/TN-xem-thong-ke-noi-dung.md) | 23 | 0 | 0 | 23 | 0 | 0 | 0% | — |
| [XL-xu-ly-bao-cao](traceability/XL-xu-ly-bao-cao.md) | 62 | 14 | 27 | 21 | 0 | 0 | 23% | 100% |
| **Tổng** | **807** | **253** | **88** | **457** | **6** | **3** | **31%** | **98.3%** |
