import { useMutation, useQueryClient, useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { watchApi } from "./api";
import type { WatchFeedPage, WatchItem } from "./types";

export const watchKeys = {
  feed: (seed: string, start: string | undefined) => ["watch", "feed", seed, start ?? ""] as const,
};

/** Luồng video theo trang; cùng `seed` thì giữ thứ tự trong cả phiên xem. */
export const useWatchFeed = (seed: string, start: string | undefined) =>
  useInfiniteQuery({
    queryKey: watchKeys.feed(seed, start),
    queryFn: ({ pageParam }) => watchApi.getFeed(seed, pageParam, start),
    initialPageParam: 0,
    getNextPageParam: (last: WatchFeedPage) => (last.hasMore ? last.page + 1 : undefined),
    networkMode: "always",
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

type FeedData = InfiniteData<WatchFeedPage, number>;

/** Sửa một video trong mọi trang đã tải của luồng. */
function patchItem(data: FeedData | undefined, lessonId: string, patch: (item: WatchItem) => WatchItem) {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => (item.lessonId === lessonId ? patch(item) : item)),
    })),
  };
}

/** Thích hoặc bỏ thích: đổi ngay trên giao diện, lỗi thì trả lại như cũ (BR-TC-16). */
export function useToggleLike(seed: string, start: string | undefined) {
  const client = useQueryClient();
  const key = watchKeys.feed(seed, start);
  return useMutation({
    mutationFn: ({ lessonId, liked }: { lessonId: string; liked: boolean }) => watchApi.setLiked(lessonId, liked),
    onMutate: async ({ lessonId, liked }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<FeedData>(key);
      client.setQueryData<FeedData>(key, (data) =>
        patchItem(data, lessonId, (item) =>
          item.liked === liked ? item : { ...item, liked, likeCount: Math.max(0, item.likeCount + (liked ? 1 : -1)) },
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },
    onSuccess: (state, { lessonId }) => {
      client.setQueryData<FeedData>(key, (data) => patchItem(data, lessonId, (item) => ({ ...item, ...state })));
    },
  });
}

/** Lưu hoặc bỏ lưu câu vào Câu cần ôn Shadowing (BR-TC-17); lỗi thì trả lại như cũ. */
export function useToggleSaved(seed: string, start: string | undefined) {
  const client = useQueryClient();
  const key = watchKeys.feed(seed, start);
  const setSaved = (data: FeedData | undefined, lessonId: string, sentenceId: string, saved: boolean) =>
    patchItem(data, lessonId, (item) => ({
      ...item,
      sentences: item.sentences.map((line) => (line.id === sentenceId ? { ...line, saved } : line)),
    }));
  return useMutation({
    mutationFn: ({ sentenceId, saved }: { lessonId: string; sentenceId: string; saved: boolean }) =>
      watchApi.setSaved(sentenceId, saved),
    onMutate: async ({ lessonId, sentenceId, saved }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<FeedData>(key);
      client.setQueryData<FeedData>(key, (data) => setSaved(data, lessonId, sentenceId, saved));
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ["review"] });
    },
  });
}
