import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FileUploadError, uploadFile } from "./fileUpload";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("./axiosClient", () => ({ axiosClient: { post } }));

const presigned = {
  key: "vocab-decks/u1/x.png",
  uploadUrl: "https://bucket.s3.amazonaws.com/vocab-decks/u1/x.png?X-Amz-Signature=abc",
  method: "PUT",
  headers: { "Content-Type": "image/png" },
  expiresAt: "2026-11-13T04:00:00Z",
};

describe("uploadFile", () => {
  const fetchMock = vi.fn();
  const file = new File([new Uint8Array(16)], "anh.png", { type: "image/png" });

  beforeEach(() => {
    post.mockReset().mockResolvedValue({ data: { data: presigned } });
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("xin URL rồi PUT tệp thẳng lên S3 với đúng header, trả key", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await expect(uploadFile("DECK_IMAGE", file)).resolves.toBe(presigned.key);

    expect(post).toHaveBeenCalledWith("/uploads/presign", { purpose: "DECK_IMAGE", contentType: "image/png", size: 16 });
    expect(fetchMock).toHaveBeenCalledWith(
      presigned.uploadUrl,
      expect.objectContaining({ method: "PUT", headers: presigned.headers, body: file }),
    );
  });

  it("S3 từ chối (403) thì ném FileUploadError kèm status", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });

    await expect(uploadFile("DECK_IMAGE", file)).rejects.toMatchObject({ name: "FileUploadError", status: 403 });
  });

  it("mất mạng khi PUT thì ném FileUploadError không có status", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await uploadFile("DECK_IMAGE", file).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(FileUploadError);
    expect((error as FileUploadError).status).toBeNull();
  });

  it("bước xin URL lỗi thì không PUT", async () => {
    post.mockRejectedValue(new Error("400"));

    await expect(uploadFile("DECK_IMAGE", file)).rejects.toThrow("400");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
