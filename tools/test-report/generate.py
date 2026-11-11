#!/usr/bin/env python3
"""Đồng bộ bảng truy vết AC -> test và sinh báo cáo kiểm thử theo rubric.

Chạy từ thư mục gốc của repo:

    python tools/test-report/generate.py sync              # thêm AC mới vào bảng truy vết, làm mới mục lục
    python tools/test-report/generate.py report            # sinh docs/test/reports/BAO-CAO-<ngày>.md
    python tools/test-report/generate.py report --ci-status pass

Chỉ dùng thư viện chuẩn của Python 3.9+. Không gọi mạng.
"""
from __future__ import annotations

import argparse
import datetime as dt
import glob
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding="utf-8")

STATUS_HAVE = "Đã có"
STATUS_PART = "Một phần"
STATUS_MISS = "Thiếu"
STATUS_MANUAL = "Thủ công"
STATUS_NA = "Không áp dụng"

LEGEND = (
    "> Nguồn AC: `docs/srs/{m}/usecase.md`. **Loại**: D (dương), A (âm), B (biên). "
    "**Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng`. "
    "Quay lại [mục lục](../TRACEABILITY-AC-TEST.md)."
)
TABLE_HEAD = ["| AC | Tên | UC | Loại | Test | Trạng thái |", "|---|---|---|:---:|---|---|"]


def read(path: str) -> str:
    with open(path, encoding="utf-8") as f:
        return f.read()


def write(path: str, text: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


# --------------------------------------------------------------------------- AC trong SRS
def srs_acs(root: str) -> dict[str, list[tuple[str, str, str]]]:
    """Trả về {module: [(mã AC, tên, mã UC)]} đọc từ docs/srs/*/usecase.md."""
    result: dict[str, list[tuple[str, str, str]]] = {}
    for f in sorted(glob.glob(os.path.join(root, "docs", "srs", "*", "usecase.md"))):
        module = os.path.basename(os.path.dirname(f))
        parts = re.split(r"\n### (UC-[A-Z]+-\d+): [^\n]+\n", read(f))
        rows = []
        for i in range(1, len(parts), 2):
            uc, body = parts[i], parts[i + 1]
            for m in re.finditer(r"\*\*(AC-[A-Z]+-\d+) — ([^*]+)\*\*", body):
                rows.append((m.group(1), m.group(2).strip().replace("|", "/"), uc))
        result[module] = rows
    return result


# --------------------------------------------------------------------------- bảng truy vết
def parse_row(line: str) -> list[str]:
    cells = line.strip().strip("|").split(" | ")
    cells = [c.strip() for c in cells]
    while len(cells) < 6:
        cells.append("")
    return cells[:6]


def load_trace(root: str) -> dict[str, list[list[str]]]:
    trace: dict[str, list[list[str]]] = {}
    for f in sorted(glob.glob(os.path.join(root, "docs", "test", "traceability", "*.md"))):
        module = os.path.splitext(os.path.basename(f))[0]
        trace[module] = [parse_row(l) for l in read(f).splitlines() if l.startswith("| AC-")]
    return trace


def status_key(cell: str) -> str:
    return cell.split(" (")[0].strip()


def counts(rows: list[list[str]]) -> dict[str, int]:
    c = {STATUS_HAVE: 0, STATUS_PART: 0, STATUS_MISS: 0, STATUS_MANUAL: 0, STATUS_NA: 0}
    for r in rows:
        c[status_key(r[5])] = c.get(status_key(r[5]), 0) + 1
    return c


def module_file(root: str, module: str, rows: list[list[str]]) -> str:
    c = counts(rows)
    summary = (
        f"Tổng hợp: {len(rows)} AC, {c[STATUS_HAVE]} đã có test, "
        f"{c[STATUS_PART]} một phần, {c[STATUS_MISS]} thiếu."
    )
    body = [f"# Truy vết AC → test: {module}", "", LEGEND.format(m=module), "", summary, "", *TABLE_HEAD]
    body += ["| " + " | ".join(r) + " |" for r in rows]
    return "\n".join(body) + "\n"


def index_file(trace: dict[str, list[list[str]]]) -> str:
    lines = [
        "# Bảng truy vết: tiêu chí chấp nhận (AC) → test case",
        "",
        "> Mỗi module có một file riêng trong thư mục `traceability/`. Nguồn AC: `docs/srs/*/usecase.md`.",
        "> Bảng tổng hợp bên dưới do `python tools/test-report/generate.py sync` tự tính lại; không sửa tay.",
        "",
        "> Cột **Test** ghi `LớpTest.phươngThức` (backend) hoặc file Vitest/Playwright. **Loại**: D (dương), A (âm), B (biên). "
        "**Trạng thái**: `Đã có`, `Một phần`, `Thiếu`, `Thủ công`, `Không áp dụng`.",
        "",
        "## Tổng hợp theo module",
        "",
        "| Module | Số AC | Đã có test | Một phần | Thiếu | % có test |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    tot = [0, 0, 0, 0]
    for module, rows in trace.items():
        c = counts(rows)
        n = len(rows)
        pct = round(100 * c[STATUS_HAVE] / n) if n else 0
        lines.append(f"| [{module}](traceability/{module}.md) | {n} | {c[STATUS_HAVE]} | {c[STATUS_PART]} | {c[STATUS_MISS]} | {pct}% |")
        tot[0] += n
        tot[1] += c[STATUS_HAVE]
        tot[2] += c[STATUS_PART]
        tot[3] += c[STATUS_MISS]
    pct = round(100 * tot[1] / tot[0]) if tot[0] else 0
    lines.append(f"| **Tổng** | **{tot[0]}** | **{tot[1]}** | **{tot[2]}** | **{tot[3]}** | **{pct}%** |")
    return "\n".join(lines) + "\n"


def cmd_sync(root: str) -> int:
    srs = srs_acs(root)
    trace = load_trace(root)
    warnings = 0
    for module, acs in srs.items():
        rows = trace.get(module, [])
        known = {r[0]: r for r in rows}
        merged: list[list[str]] = []
        for ac, name, uc in acs:
            if ac in known:
                r = known[ac]
                r[1], r[2] = name, uc  # tên và UC luôn theo SRS
                merged.append(r)
            else:
                merged.append([ac, name, uc, "", "", STATUS_MISS])
                print(f"[thêm]  {module}: {ac}")
        in_srs = {a[0] for a in acs}
        for ac, r in known.items():
            if ac not in in_srs:
                if r[4] or status_key(r[5]) != STATUS_MISS:
                    merged.append(r)
                    warnings += 1
                    print(f"[CẢNH BÁO] {module}: {ac} không còn trong SRS nhưng đã có test/ghi chú, hãy xem lại")
                else:
                    print(f"[bỏ]    {module}: {ac} (không còn trong SRS)")
        trace[module] = merged
        write(os.path.join(root, "docs", "test", "traceability", f"{module}.md"), module_file(root, module, merged))
    for module in list(trace):
        if module not in srs:
            print(f"[CẢNH BÁO] file truy vết {module}.md không có module tương ứng trong docs/srs")
            warnings += 1
    write(os.path.join(root, "docs", "test", "TRACEABILITY-AC-TEST.md"), index_file(trace))
    print(f"Đã đồng bộ {len(srs)} module, {warnings} cảnh báo.")
    return 0


# --------------------------------------------------------------------------- số liệu cho báo cáo
def backend_tests(root: str) -> dict[str, int] | None:
    files = glob.glob(os.path.join(root, "backend", "target", "surefire-reports", "TEST-*.xml"))
    if not files:
        return None
    t = {"tests": 0, "failures": 0, "errors": 0, "skipped": 0}
    for f in files:
        r = ET.parse(f).getroot()
        for k in t:
            t[k] += int(r.get(k, 0))
    return t


def jacoco(root: str) -> dict[str, float] | None:
    p = os.path.join(root, "backend", "target", "site", "jacoco", "jacoco.xml")
    if not os.path.exists(p):
        return None
    out = {}
    for c in ET.parse(p).getroot().findall("counter"):
        if c.get("type") in ("LINE", "BRANCH"):
            m, cv = int(c.get("missed")), int(c.get("covered"))
            out[c.get("type")] = round(100 * cv / (cv + m), 1) if cv + m else 0.0
            out[c.get("type") + "_n"] = cv + m
    return out


def frontend_cov(root: str) -> float | None:
    p = os.path.join(root, "frontend", "coverage", "coverage-summary.json")
    if not os.path.exists(p):
        return None
    return json.load(open(p, encoding="utf-8"))["total"]["lines"]["pct"]


def layers(root: str) -> dict[str, int]:
    bt = os.path.join(root, "backend", "src", "test")
    java = [f for f in glob.glob(os.path.join(bt, "**", "*.java"), recursive=True)]
    names = [os.path.basename(f) for f in java]
    unit = [n for n in names if n.endswith("Test.java") and "Integration" not in n and "External" not in n]
    integ = [n for n in names if n.endswith("IntegrationTest.java")]
    api = [f for f in java if f.endswith("IntegrationTest.java") and os.sep + "controller" + os.sep in f]
    fe = glob.glob(os.path.join(root, "frontend", "src", "**", "*.test.ts*"), recursive=True)
    e2e = glob.glob(os.path.join(root, "e2e", "**", "*.spec.ts"), recursive=True)
    perf = [f for f in glob.glob(os.path.join(root, "perf", "**", "*"), recursive=True)
            if f.endswith((".js", ".jmx", ".ts"))]
    sec = [n for n in names if "Security" in n]
    return {
        "Unit (backend)": len(unit),
        "Unit (frontend)": len(fe),
        "Integration": len(integ),
        "API": len(api),
        "E2E / UI": len(e2e),
        "Phi chức năng (hiệu năng)": len(perf),
        "Phi chức năng (bảo mật)": len(sec),
    }


def open_critical(root: str) -> tuple[int, int, bool]:
    """Trả về (số lỗi mở Critical/Blocker, tổng số lỗi, có file đăng ký lỗi)."""
    p = os.path.join(root, "docs", "test", "BUG-REGISTER.md")
    if not os.path.exists(p):
        return 0, 0, False
    crit = total = 0
    for line in read(p).splitlines():
        if re.match(r"\| BUG-\d+", line):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            total += 1
            if len(cells) >= 4 and cells[2] in ("Critical", "Blocker") and cells[3] != "Đóng":
                crit += 1
    return crit, total, True


def mark(ok: bool | None) -> str:
    return "Đạt" if ok else ("Chưa đạt" if ok is False else "Chưa đo được")


def cmd_report(root: str, ci_status: str | None, today: str) -> int:
    trace = load_trace(root)
    rows = [r for v in trace.values() for r in v]
    tot = len(rows)
    c = counts(rows)
    have, manual = c[STATUS_HAVE], c[STATUS_MANUAL]
    cov_ac = round(100 * have / tot, 1) if tot else 0.0
    auto = round(100 * have / (have + manual), 1) if have + manual else 0.0
    neg = sum(1 for r in rows if "A" in [x.strip() for x in r[3].split(",")] and status_key(r[5]) == STATUS_HAVE)
    edge = sum(1 for r in rows if "B" in [x.strip() for x in r[3].split(",")] and status_key(r[5]) == STATUS_HAVE)
    bt, jc, fc = backend_tests(root), jacoco(root), frontend_cov(root)
    ly = layers(root)
    crit, bugs, has_reg = open_critical(root)

    tiers = {
        "Unit": ly["Unit (backend)"] + ly["Unit (frontend)"] > 0,
        "Integration": ly["Integration"] > 0,
        "API": ly["API"] > 0,
        "E2E / UI": ly["E2E / UI"] > 0,
        "Phi chức năng": ly["Phi chức năng (hiệu năng)"] + ly["Phi chức năng (bảo mật)"] > 0,
    }
    n_tiers = sum(tiers.values())
    all_pass = None
    if bt is not None:
        all_pass = bt["failures"] == 0 and bt["errors"] == 0
        if ci_status:
            all_pass = all_pass and ci_status == "pass"
    elif ci_status:
        all_pass = ci_status == "pass"

    checks = [
        ("Kế hoạch kiểm thử rõ ràng", os.path.exists(os.path.join(root, "docs", "test", "TEST-PLAN.md")), "docs/test/TEST-PLAN.md"),
        (f"≥ 4 tầng kiểm thử (hiện {n_tiers}/5)", n_tiers >= 4, ", ".join(k for k, v in tiers.items() if v) or "không có"),
        ("Coverage dòng backend ≥ 70%", (jc["LINE"] >= 70) if jc else None, f"{jc['LINE']}%" if jc else "chưa có jacoco.xml (chạy ./mvnw verify)"),
        ("Tỉ lệ test tự động ≥ 70% (tự động / (tự động + thủ công))",
         (auto >= 70) if (have + c[STATUS_PART] + manual) >= 0.8 * tot and tot else None,
         f"{auto}%" if (have + c[STATUS_PART] + manual) >= 0.8 * tot and tot
         else f"chưa đo được: bảng truy vết mới có {round(100 * (have + c[STATUS_PART] + manual) / tot, 1) if tot else 0}% AC có test (cần ≥ 80% mới có ý nghĩa)"),
        ("100% test pass lần chạy cuối", all_pass, (f"{bt['tests']} test, {bt['failures']} failure, {bt['errors']} error" if bt else "chưa có báo cáo surefire")
         + (f"; CI: {ci_status}" if ci_status else "; chưa nhập kết quả CI (--ci-status pass|fail)")),
        ("0 lỗi Critical/Blocker còn mở", (crit == 0) if has_reg else None, f"{crit} mở / {bugs} lỗi đã ghi" if has_reg else "chưa có BUG-REGISTER.md"),
        ("Có bug tracker, vòng đời lỗi và test hồi quy", has_reg and os.path.exists(os.path.join(root, ".github", "ISSUE_TEMPLATE", "bug_report.yml")), "docs/test/BUG-REGISTER.md, .github/ISSUE_TEMPLATE/bug_report.yml"),
        ("Test truy vết tới AC (tỉ lệ AC có test)", (cov_ac >= 80) if tot else None, f"{cov_ac}% ({have}/{tot}); mục tiêu đề xuất ≥ 80%"),
        ("Có ca âm và ca biên", (neg > 0 and edge > 0), f"{neg} AC có ca âm, {edge} AC có ca biên (trong số AC đã có test)"),
    ]

    L = [f"# Báo cáo kiểm thử: {today}", "",
         "> Sinh tự động bởi `tools/test-report/generate.py report`. Chạy `./mvnw verify` và `python tools/test-report/generate.py sync` trước để số liệu mới.", "",
         "## 1. Đối chiếu rubric", "", "| Yêu cầu | Kết quả | Số liệu |", "|---|---|---|"]
    for name, ok, detail in checks:
        L.append(f"| {name} | **{mark(ok)}** | {detail} |")
    L += ["", "## 2. Số liệu chi tiết", "", "### 2.1. Kết quả chạy test (backend)", ""]
    if bt:
        L += ["| Tổng | Failure | Error | Bỏ qua |", "|---:|---:|---:|---:|", f"| {bt['tests']} | {bt['failures']} | {bt['errors']} | {bt['skipped']} |"]
    else:
        L += ["Chưa có `backend/target/surefire-reports`. Chạy `./mvnw verify`."]
    L += ["", "### 2.2. Coverage", "", "| Phần | Dòng | Nhánh |", "|---|---:|---:|"]
    L.append(f"| Backend (JaCoCo) | {jc['LINE']}% ({jc['LINE_n']} dòng) | {jc['BRANCH']}% |" if jc else "| Backend (JaCoCo) | chưa đo | chưa đo |")
    L.append(f"| Frontend (Vitest) | {fc}% | n/a |" if fc is not None else "| Frontend (Vitest) | chưa đo (cần `vitest run --coverage` với reporter `json-summary`) | n/a |")
    L += ["", "### 2.3. Số file test theo tầng", "", "| Tầng | Số file |", "|---|---:|"]
    L += [f"| {k} | {v} |" for k, v in ly.items()]
    L += ["", "### 2.4. Truy vết AC → test", "", "| Trạng thái | Số AC |", "|---|---:|"]
    L += [f"| {k} | {v} |" for k, v in c.items()]
    L += [f"| **Tổng** | **{tot}** |", "", "Theo module:", "", "| Module | Số AC | Đã có | Thiếu | % |", "|---|---:|---:|---:|---:|"]
    for module, rs in trace.items():
        cc = counts(rs)
        L.append(f"| {module} | {len(rs)} | {cc[STATUS_HAVE]} | {cc[STATUS_MISS]} | {round(100 * cc[STATUS_HAVE] / len(rs)) if rs else 0}% |")
    L += ["", "## 3. Việc còn thiếu", ""]
    todo = [f"- {n}: {d}" for n, ok, d in checks if ok is not True]
    L += todo or ["Không có."]
    out = os.path.join(root, "docs", "test", "reports", f"BAO-CAO-{today}.md")
    write(out, "\n".join(L) + "\n")
    print(f"Đã ghi {os.path.relpath(out, root)}")
    for n, ok, _ in checks:
        print(f"  [{mark(ok):>12}] {n}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["sync", "report"])
    ap.add_argument("--root", default=".", help="thư mục gốc repo (mặc định: thư mục hiện tại)")
    ap.add_argument("--ci-status", choices=["pass", "fail"], help="kết quả lần chạy CI cuối trên GitHub Actions")
    ap.add_argument("--date", default=dt.date.today().isoformat(), help="ngày ghi trong báo cáo (YYYY-MM-DD)")
    a = ap.parse_args()
    root = os.path.abspath(a.root)
    return cmd_sync(root) if a.command == "sync" else cmd_report(root, a.ci_status, a.date)


if __name__ == "__main__":
    sys.exit(main())
