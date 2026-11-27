import { useQuery } from "@tanstack/react-query";
import { publicAxios } from "@/api/axiosClient";

/** Một bài học giới thiệu trên trang chủ công khai (BR-TC-20). */
export interface ShowcaseLesson {
  id: string;
  title: string;
  youtubeId: string;
  durationSec: number;
  cefrLevel: string;
  topicName: string | null;
  sentenceCount: number;
  pro: boolean;
}

export interface Showcase {
  lessons: ShowcaseLesson[];
  topics: string[];
}

/** Gọi không kèm token: API công khai, khách chưa đăng nhập cũng xem được. */
export async function fetchShowcase(): Promise<Showcase> {
  const res = await publicAxios.get<{ data: Showcase }>("/public/lessons/showcase");
  return res.data.data;
}

/**
 * Bài học thật cho dải bài trên trang chủ. Máy chủ miễn phí có thể đang ngủ nên lần gọi đầu chậm; trang không chờ mà hiện
 * khung trống trong lúc tải, lỗi thì ẩn cả phần (AC-TC-44).
 */
export function useLessonShowcase() {
  return useQuery({
    queryKey: ["landing", "showcase"],
    queryFn: fetchShowcase,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

/** 125 giây → "02:05". */
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const minutes = Math.floor(sec / 60);
  return `${String(minutes).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}
