/** Một câu lời thoại của video; `saved` là câu đang ở Câu cần ôn chế độ Shadowing (BR-TC-17). */
export interface WatchLine {
  id: string;
  textEn: string;
  textVi: string | null;
  ipaUs: string | null;
  ipaUk: string | null;
  startMs: number;
  endMs: number;
  saved: boolean;
}

/** Một video trong luồng Học thụ động: một bài học thư viện đã xuất bản (UC-TC-04). */
export interface WatchItem {
  lessonId: string;
  title: string;
  youtubeId: string;
  durationSec: number;
  cefrLevel: string;
  topicName: string | null;
  pro: boolean;
  likeCount: number;
  liked: boolean;
  /** Học viên đã lưu video (bài học) vào Bài đã lưu (UC-TC-05). */
  saved: boolean;
  sentences: WatchLine[];
}

/** Một trang 10 video; `proHidden` là học viên gói Free đang bị ẩn video Pro (AC-TC-32). */
export interface WatchFeedPage {
  items: WatchItem[];
  page: number;
  hasMore: boolean;
  proHidden: boolean;
}

export interface LikeState {
  liked: boolean;
  likeCount: number;
}
