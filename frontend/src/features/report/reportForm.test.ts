import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reportApi, toReportApiError } from "./api";
import {
  DEFAULT_REPORT_FILTER,
  defaultFixField,
  isFiltered,
  listParams,
  REASONS,
  reasonFilterGroups,
  reasonFitsType,
  toSubmitInput,
  validateNote,
  validateReportForm,
} from "./reportForm";
import { cellText, compareRows } from "./reportFormat";

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("@/api/axiosClient", () => ({ axiosClient: { get, post } }));

describe("REASONS (BR-BC-05)", () => {
  it("có đúng 6 lý do cho câu và 6 cho thẻ, đều có Phản cảm và Khác", () => {
    expect(REASONS.sentence).toEqual(["subtitle_en", "ipa", "translation", "timing", "offensive", "other"]);
    expect(REASONS.card).toEqual(["word", "phonetic", "meaning", "example", "offensive", "other"]);
  });
});

describe("reasonFilterGroups (BR-BC-05, BR-XL-01)", () => {
  it("không chọn loại: nhóm Câu, nhóm Thẻ, rồi nhóm chung ở cuối; giáo viên không có Phản cảm", () => {
    expect(reasonFilterGroups("", "admin")).toEqual([
      { group: "sentence", reasons: ["subtitle_en", "ipa", "translation", "timing"] },
      { group: "card", reasons: ["word", "phonetic", "meaning", "example"] },
      { group: "common", reasons: ["offensive", "other"] },
    ]);
    expect(reasonFilterGroups("", "teacher").at(-1)).toEqual({ group: "common", reasons: ["other"] });
  });

  it("đã chọn loại: chỉ còn nhóm của loại đó và nhóm chung", () => {
    expect(reasonFilterGroups("card", "admin").map((g) => g.group)).toEqual(["card", "common"]);
  });

  it("đổi loại nội dung thì lý do không hợp bị bỏ", () => {
    expect(reasonFitsType("ipa", "card")).toBe(false);
    expect(reasonFitsType("phonetic", "card")).toBe(true);
    expect(reasonFitsType("other", "sentence")).toBe(true);
    expect(reasonFitsType("ipa", "")).toBe(true);
  });
});

describe("validateReportForm (AC-BC-03)", () => {
  const empty = { fixField: "", suggestedFix: "", description: "" };

  it("chưa chọn lý do", () => {
    expect(validateReportForm({ reason: "", ...empty })).toEqual({ reason: "NotBlank" });
  });

  it("lý do có bản sửa mà bản sửa trống hoặc chỉ khoảng trắng", () => {
    expect(validateReportForm({ reason: "ipa", fixField: "ipa_us", suggestedFix: "   ", description: "" })).toEqual({
      suggestedFix: "NotBlank",
    });
  });

  it("lý do nhiều trường mà chưa chọn trường cần sửa (BR-BC-11)", () => {
    expect(
      validateReportForm({ reason: "meaning", fixField: "", suggestedFix: "môi trường", description: "" }),
    ).toEqual({ fixField: "NotBlank" });
    expect(
      validateReportForm({ reason: "meaning", fixField: "word", suggestedFix: "môi trường", description: "" }),
    ).toEqual({ fixField: "NotBlank" });
  });

  it("so bản sửa với đúng trường đã chọn", () => {
    const current = { ipa_us: "/ɡæt/", ipa_uk: "/ɡeɪt/" };
    expect(
      validateReportForm({ reason: "ipa", fixField: "ipa_uk", suggestedFix: "/ɡæt/", description: "" }, current),
    ).toEqual({});
    expect(
      validateReportForm({ reason: "ipa", fixField: "ipa_uk", suggestedFix: "/ɡeɪt/", description: "" }, current),
    ).toEqual({ suggestedFix: "Different" });
  });

  it("lý do một trường thì trường được chọn sẵn, nhiều trường thì để trống", () => {
    expect(defaultFixField("translation")).toBe("text_vi");
    expect(defaultFixField("meaning")).toBe("");
    expect(defaultFixField("other")).toBe("");
  });

  it("bản sửa giống hệt nội dung hiện tại", () => {
    const current = { text_en: "If things don't work out" };
    expect(
      validateReportForm(
        { reason: "subtitle_en", fixField: "text_en", suggestedFix: " If things don't work out ", description: "" },
        current,
      ),
    ).toEqual({ suggestedFix: "Different" });
  });

  it("Phụ đề lệch thời gian, Phản cảm, Khác bắt buộc mô tả", () => {
    for (const reason of ["timing", "offensive", "other"] as const) {
      expect(validateReportForm({ reason, ...empty })).toEqual({ description: "NotBlank" });
    }
  });

  it("501 ký tự bị chặn, 500 ký tự hợp lệ (BR-BC-09)", () => {
    expect(validateReportForm({ reason: "other", ...empty, description: "x".repeat(501) })).toEqual({
      description: "Size",
    });
    expect(validateReportForm({ reason: "other", ...empty, description: "x".repeat(500) })).toEqual({});
  });

  it("bản sửa hợp lệ, mô tả không bắt buộc", () => {
    expect(validateReportForm({ reason: "translation", fixField: "text_vi", suggestedFix: "Cửa ra máy bay", description: "" })).toEqual({});
  });
});

describe("toSubmitInput", () => {
  it("cắt khoảng trắng và bỏ bản sửa với lý do bắt buộc mô tả", () => {
    expect(
      toSubmitInput("sentence", "s1", { reason: "other", fixField: "", suggestedFix: "bỏ qua", description: "  Lỗi lạ  " }),
    ).toEqual({
      targetType: "sentence",
      targetId: "s1",
      reason: "other",
      suggestedFix: null,
      fixField: null,
      description: "Lỗi lạ",
    });
    expect(
      toSubmitInput("card", "c1", {
        reason: "meaning",
        fixField: "definition_en",
        suggestedFix: " môi trường ",
        description: "",
      }),
    ).toEqual({
      targetType: "card",
      targetId: "c1",
      reason: "meaning",
      suggestedFix: "môi trường",
      fixField: "definition_en",
      description: null,
    });
  });
});

describe("validateNote (BR-XL-04, AC-XL-25)", () => {
  it("trống, 501 ký tự lỗi; 500 ký tự hợp lệ", () => {
    expect(validateNote("  ")).toBe("NotBlank");
    expect(validateNote("x".repeat(501))).toBe("Size");
    expect(validateNote("x".repeat(500))).toBeNull();
  });
});

describe("listParams (BR-XL-03)", () => {
  it("mặc định chỉ gửi trang để server lọc sẵn báo cáo đang chờ", () => {
    expect(listParams(DEFAULT_REPORT_FILTER, 0, "teacher")).toEqual({ page: 0 });
    expect(isFiltered(DEFAULT_REPORT_FILTER)).toBe(false);
  });

  it("giáo viên không gửi bộ lọc chỉ dành cho quản trị viên", () => {
    const filter = { ...DEFAULT_REPORT_FILTER, noHandler: true, frequentRejected: true, reporterId: "u1", q: " air " };
    expect(listParams(filter, 1, "teacher")).toEqual({ page: 1, q: "air" });
    expect(listParams(filter, 1, "admin")).toEqual({
      page: 1,
      q: "air",
      noHandler: true,
      frequentRejected: true,
      reporterId: "u1",
    });
  });

  it("trạng thái, loại, lý do, quá hạn, sắp xếp chờ lâu nhất", () => {
    const filter = {
      ...DEFAULT_REPORT_FILTER,
      status: "all" as const,
      type: "card" as const,
      reason: "example" as const,
      overdue: true,
      sort: "oldest" as const,
    };
    expect(listParams(filter, 0, "teacher")).toEqual({
      page: 0,
      status: "all",
      type: "card",
      reason: "example",
      overdue: true,
      sort: "oldest",
    });
  });
});

describe("compareRows (BR-BC-10, AC-XL-07)", () => {
  it("đánh dấu cột đã đổi và bỏ cột trống ở cả hai bên", () => {
    const rows = compareRows(
      { text_en: "Where is the gate?", text_vi: "Cửa", ipa_uk: null },
      { text_en: "Where is the gate?", text_vi: "Cửa ra", ipa_uk: null },
    );
    expect(rows).toEqual([
      { field: "text_en", before: "Where is the gate?", after: "Where is the gate?", changed: false },
      { field: "text_vi", before: "Cửa", after: "Cửa ra", changed: true },
    ]);
  });

  it("không có bản chụp thì không đánh dấu đã đổi", () => {
    expect(compareRows({}, { word: "sustain" })).toEqual([
      { field: "word", before: null, after: "sustain", changed: false },
    ]);
  });
  it("bản chụp cũ chưa có ảnh thì ảnh không bị tính là đã đổi; ảnh hiện là Có ảnh", () => {
    const rows = compareRows({ word: "hell" }, { word: "hell", image_url: "cards/a.png" });
    expect(rows[1]).toEqual({ field: "image_url", before: null, after: "cards/a.png", changed: false });
    expect(compareRows({ image_url: "a.png" }, { image_url: "b.png" })[0].changed).toBe(true);
    const t = (key: string) => key;
    expect(cellText("image_url", "cards/a.png", t)).toBe("detail.hasImage");
    expect(cellText("word", null, t)).toBe("—");
  });
});

describe("toReportApiError", () => {
  const error = (status: number, data: unknown) =>
    new AxiosError("x", "ERR", undefined, undefined, {
      status,
      statusText: "",
      headers: {},
      config: { headers: new AxiosHeaders() },
      data,
    } as AxiosResponse);

  it("REPORT_NOT_FIXED kèm các trường cần sửa (AC-XL-26)", () => {
    const e = toReportApiError(error(422, { code: "REPORT_NOT_FIXED", details: { fields: ["ipa_us", "ipa_uk"] } }));
    expect(e.kind).toBe("notFixed");
    expect(e.details.fields).toEqual(["ipa_us", "ipa_uk"]);
  });

  it("trùng báo cáo, không có quyền, lỗi trường, mất mạng", () => {
    expect(toReportApiError(error(409, { code: "REPORT_DUPLICATE" })).kind).toBe("conflict");
    expect(toReportApiError(error(403, {})).kind).toBe("forbidden");
    const validation = toReportApiError(error(400, { errors: [{ field: "note", code: "Size" }] }));
    expect(validation.fieldErrors).toEqual([{ field: "note", code: "Size" }]);
    expect(toReportApiError(new AxiosError("Network Error")).kind).toBe("network");
  });
});

describe("reportApi", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("gửi báo cáo của học viên tới /reports (AC-BC-01)", async () => {
    post.mockResolvedValue({ data: {} });
    const input = { targetType: "sentence" as const, targetId: "s1", reason: "translation" as const, suggestedFix: "Cửa ra máy bay", fixField: "text_vi", description: null };
    await reportApi.submit(input);
    expect(post).toHaveBeenCalledWith("/reports", input, expect.anything());
  });

  it("từ chối hàng loạt trả số báo cáo đã từ chối (AC-XL-32)", async () => {
    post.mockResolvedValue({ data: { data: { rejected: 5 } } });
    await expect(reportApi.rejectAllByReporter("u1", "Báo cáo rác")).resolves.toBe(5);
    expect(post).toHaveBeenCalledWith("/admin/reports/reporters/u1/reject", { note: "Báo cáo rác" }, expect.anything());
  });

  it("gỡ nội dung và yêu cầu xuất bản lại gọi đúng đường dẫn (UC-XL-04, UC-BT-05 2b)", async () => {
    post.mockResolvedValue({ data: {} });
    await reportApi.takedown("r1", "Phản cảm");
    await reportApi.requestRepublish("deck", "d1");
    expect(post).toHaveBeenCalledWith("/admin/reports/r1/takedown", { note: "Phản cảm" }, expect.anything());
    expect(post).toHaveBeenCalledWith("/teacher/republish-requests", { targetType: "deck", targetId: "d1" }, expect.anything());
  });

  it("còn nội dung chưa sửa khi gửi yêu cầu thì báo notFixed kèm số lượng (UC-BT-05 2c)", async () => {
    post.mockRejectedValue(
      new AxiosError("x", "ERR", undefined, undefined, {
        status: 422,
        statusText: "",
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: { code: "REPUBLISH_NOT_FIXED", details: { unchanged: 2 } },
      } as AxiosResponse),
    );
    await expect(reportApi.requestRepublish("deck", "d1")).rejects.toMatchObject({
      kind: "notFixed",
      details: { unchanged: 2 },
    });
  });

  it("danh sách giáo viên gọi đúng đường dẫn và lỗi mạng đổi thành network", async () => {
    get.mockRejectedValue(new AxiosError("Network Error"));
    await expect(reportApi.list("teacher", DEFAULT_REPORT_FILTER, 0)).rejects.toMatchObject({ kind: "network" });
    expect(get).toHaveBeenCalledWith("/teacher/reports", expect.objectContaining({ params: { page: 0 } }));
  });
});
