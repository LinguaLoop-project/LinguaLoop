/** Số ảnh nạp sẵn giữ lại; quá số này thì bỏ ảnh nạp sớm nhất (trình duyệt vẫn giữ ảnh đã tải trong cache của nó). */
const MAX_PRELOADED = 40;
const preloaded = new Map<string, HTMLImageElement>();

/**
 * Bắt đầu tải ảnh ở nền để lúc lật thẻ ảnh đã có sẵn, thay vì chờ tới lúc hiện. Gọi lại với cùng URL thì không tải lần nữa;
 * môi trường không có `Image` (test, máy chủ) thì bỏ qua.
 */
export function preloadImage(url: string | null | undefined): void {
  if (!url || preloaded.has(url) || typeof Image === "undefined") return;
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  preloaded.set(url, image);
  if (preloaded.size > MAX_PRELOADED) {
    const oldest = preloaded.keys().next().value;
    if (oldest !== undefined) preloaded.delete(oldest);
  }
}

/** Xoá bộ nhớ ảnh nạp sẵn; chỉ để test. */
export function resetPreloadedImages(): void {
  preloaded.clear();
}
