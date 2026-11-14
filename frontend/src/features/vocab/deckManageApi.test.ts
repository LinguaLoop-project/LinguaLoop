import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminListParams, deckManageApi, teacherListParams, toDeckApiError } from "./deckManageApi";
import { DEFAULT_DECK_LIST_FILTER } from "./deckListState";

const { get, post, uploadFile } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), uploadFile: vi.fn() }));
vi.mock("@/api/axiosClient", () => ({ axiosClient: { get, post } }));
vi.mock("@/api/fileUpload", () => ({ uploadFile }));

function httpError(status: number, data: unknown = {}): AxiosError {
  const response = { status, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } };
  return new AxiosError("fail", "ERR_BAD_RESPONSE", undefined, undefined, response as AxiosResponse);
}

const page = { items: [{ id: "d1" }], page: 0, size: 10, totalElements: 1, totalPages: 1 };

describe("deckManageApi (UC-BT-01, UC-BT-02)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    uploadFile.mockReset();
  });

  it("Thử lại thành công thì trả danh sách (AC-BT-64, dương)", async () => {
    get.mockRejectedValueOnce(httpError(500)).mockResolvedValueOnce({ data: { data: page } });

    await expect(deckManageApi.fetchTeacherDecks(DEFAULT_DECK_LIST_FILTER, 0)).rejects.toMatchObject({
      kind: "server",
      status: 500,
    });
    await expect(deckManageApi.fetchTeacherDecks(DEFAULT_DECK_LIST_FILTER, 0)).resolves.toEqual(page);
    expect(get).toHaveBeenLastCalledWith("/teacher/vocab/decks", expect.objectContaining({ params: { page: 0 } }));
  });

  it("ánh xạ lỗi 401, 403, 5xx, mất mạng (AC-BT-64, âm)", () => {
    expect(toDeckApiError(httpError(401)).kind).toBe("unauthorized");
    expect(toDeckApiError(httpError(403)).kind).toBe("forbidden");
    expect(toDeckApiError(httpError(503)).kind).toBe("server");
    expect(toDeckApiError(new AxiosError("Network Error", "ERR_NETWORK")).kind).toBe("network");
    expect(toDeckApiError(new Error("x")).kind).toBe("unknown");
    const validation = toDeckApiError(httpError(400, { errors: [{ field: "name", code: "NotBlank", message: "x" }] }));
    expect(validation).toMatchObject({ kind: "validation", fieldErrors: [{ field: "name", code: "NotBlank" }] });
    expect(toDeckApiError(httpError(409, { message: "Bạn đã có bộ thẻ cùng tên" }))).toMatchObject({
      kind: "conflict",
      message: "Bạn đã có bộ thẻ cùng tên",
    });
  });

  it("gửi đúng tham số lọc cho từng vai trò (AC-BT-03, AC-BT-50, dương)", () => {
    const filter = { ...DEFAULT_DECK_LIST_FILTER, q: "  TOEIC ", status: "draft" as const, pro: true };
    expect(teacherListParams(filter, 2)).toEqual({ page: 2, q: "TOEIC", status: "draft", pro: true });
    expect(teacherListParams({ ...DEFAULT_DECK_LIST_FILTER, other: true, categoryId: "c1" }, 0)).toEqual({
      page: 0,
      other: true,
    });
    expect(adminListParams({ ...filter, ownerId: "t1" }, 0)).toEqual({ page: 0, q: "TOEIC", pro: true, ownerId: "t1" });
    expect(adminListParams({ ...DEFAULT_DECK_LIST_FILTER, system: true, ownerId: "t1" }, 0)).toEqual({
      page: 0,
      system: true,
    });
  });

  it("tạo bộ có ảnh: tải ảnh lên S3 trước rồi gửi imageKey (AC-BT-07, dương)", async () => {
    uploadFile.mockResolvedValueOnce("vocab-decks/u1/a.jpg");
    post.mockResolvedValueOnce({ data: { data: { id: "d1" } } });
    const image = new File([new Uint8Array(4)], "a.jpg", { type: "image/jpeg" });

    await expect(
      deckManageApi.createTeacherDeck({ name: "TOEIC 1", categoryId: null, pro: true }, image),
    ).resolves.toEqual({ id: "d1" });

    expect(uploadFile).toHaveBeenCalledWith("DECK_IMAGE", image);
    expect(post).toHaveBeenCalledWith(
      "/teacher/vocab/decks",
      { name: "TOEIC 1", categoryId: null, pro: true, imageKey: "vocab-decks/u1/a.jpg" },
      expect.anything(),
    );
  });

  it("lấy danh mục theo vai trò (BR-BT-14, dương)", async () => {
    const categories = [{ id: "c1", name: "TOEIC" }];
    get.mockResolvedValue({ data: { data: categories } });

    await expect(deckManageApi.fetchCategories("teacher")).resolves.toEqual(categories);
    await deckManageApi.fetchCategories("admin");

    expect(get.mock.calls.map(([url]) => url)).toEqual(["/teacher/vocab/categories", "/admin/vocab/categories"]);
  });

  it("tạo bộ không ảnh: không tải gì, imageKey null (AC-BT-08, dương)", async () => {
    post.mockResolvedValueOnce({ data: { data: { id: "d1" } } });

    await deckManageApi.createTeacherDeck({ name: "Bộ 1", categoryId: null, pro: false }, null);

    expect(uploadFile).not.toHaveBeenCalled();
    expect(post.mock.calls[0][1]).toEqual({ name: "Bộ 1", categoryId: null, pro: false, imageKey: null });
  });

  it("ảnh bị từ chối ở bước xin URL: lỗi validation, không gọi tạo bộ (AC-BT-12, âm)", async () => {
    uploadFile.mockRejectedValueOnce(httpError(400, { errors: [{ field: "size", code: "MaxBytes" }] }));
    const image = new File([new Uint8Array(4)], "a.png", { type: "image/png" });

    await expect(
      deckManageApi.createTeacherDeck({ name: "Bộ 1", categoryId: null, pro: false }, image),
    ).rejects.toMatchObject({ kind: "validation", fieldErrors: [{ field: "size", code: "MaxBytes" }] });
    expect(post).not.toHaveBeenCalled();
  });
});
