# Báo cáo kiểm thử

Mỗi file `BAO-CAO-<ngày>.md` là một lần chạy báo cáo, sinh bằng:

```bash
cd backend && ./mvnw verify && cd ..          # tạo surefire-reports và jacoco.xml
python tools/test-report/generate.py sync     # làm mới bảng truy vết
python tools/test-report/generate.py report --ci-status pass
```

Dùng `--ci-status fail` nếu lần CI cuối đỏ. Tham số `--date YYYY-MM-DD` đổi ngày ghi trong báo cáo.

Giữ lại các báo cáo cuối mỗi tuần và báo cáo trước bảo vệ làm minh chứng. Báo cáo mới nhất nằm cuối danh sách theo tên file.
