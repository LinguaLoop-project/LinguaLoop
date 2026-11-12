# Bảng truy vết: tiêu chí chấp nhận (AC) → test case

> Mỗi module có một file riêng trong thư mục `traceability/`. Nguồn AC: `docs/srs/*/usecase.md`.
> Bảng tổng hợp bên dưới do `python tools/test-report/generate.py sync` tự tính lại; không sửa tay.

> Cột **Test** ghi `LớpTest.phươngThức` (backend) hoặc file Vitest/Playwright. **Loại**: D (dương), A (âm), B (biên). **Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng`.

## Tổng hợp theo module

| Module | Số AC | Đã có test | Một phần | Thiếu | % có test |
|---|---:|---:|---:|---:|---:|
| [AI-thuc-hanh-voi-ai](traceability/AI-thuc-hanh-voi-ai.md) | 30 | 0 | 0 | 30 | 0% |
| [BC-bao-cao-noi-dung](traceability/BC-bao-cao-noi-dung.md) | 7 | 0 | 0 | 7 | 0% |
| [BH-quan-ly-bai-hoc](traceability/BH-quan-ly-bai-hoc.md) | 75 | 0 | 0 | 75 | 0% |
| [BT-quan-ly-bo-the](traceability/BT-quan-ly-bo-the.md) | 56 | 0 | 0 | 56 | 0% |
| [CD-quan-ly-chu-de-danh-muc](traceability/CD-quan-ly-chu-de-danh-muc.md) | 28 | 0 | 0 | 28 | 0% |
| [DI-dictation-cau-da-luu](traceability/DI-dictation-cau-da-luu.md) | 45 | 0 | 0 | 45 | 0% |
| [GA-quan-ly-goi-han-muc-ai](traceability/GA-quan-ly-goi-han-muc-ai.md) | 37 | 0 | 0 | 37 | 0% |
| [HT-hoc-the-on-tap](traceability/HT-hoc-the-on-tap.md) | 57 | 0 | 0 | 57 | 0% |
| [NK-nhat-ky-thong-ke-he-thong](traceability/NK-nhat-ky-thong-ke-he-thong.md) | 25 | 0 | 0 | 25 | 0% |
| [NT-quan-ly-nhom-the-the](traceability/NT-quan-ly-nhom-the-the.md) | 58 | 0 | 0 | 58 | 0% |
| [PR-goi-pro](traceability/PR-goi-pro.md) | 23 | 0 | 0 | 23 | 0% |
| [QT-quan-tri-tai-khoan](traceability/QT-quan-tri-tai-khoan.md) | 45 | 0 | 0 | 45 | 0% |
| [SH-shadowing](traceability/SH-shadowing.md) | 28 | 0 | 0 | 28 | 0% |
| [TC-tra-cuu-hoc-thu-dong](traceability/TC-tra-cuu-hoc-thu-dong.md) | 33 | 0 | 0 | 33 | 0% |
| [TH-xem-thong-ke-hoc-tap](traceability/TH-xem-thong-ke-hoc-tap.md) | 20 | 0 | 0 | 20 | 0% |
| [TK-tai-khoan-xac-thuc](traceability/TK-tai-khoan-xac-thuc.md) | 52 | 41 | 3 | 8 | 79% |
| [TN-xem-thong-ke-noi-dung](traceability/TN-xem-thong-ke-noi-dung.md) | 23 | 0 | 0 | 23 | 0% |
| [XL-xu-ly-bao-cao](traceability/XL-xu-ly-bao-cao.md) | 62 | 0 | 0 | 62 | 0% |
| **Tổng** | **704** | **41** | **3** | **660** | **6%** |
