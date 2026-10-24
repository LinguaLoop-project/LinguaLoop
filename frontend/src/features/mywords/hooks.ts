import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { mywordsApi } from "./api";

const NETWORK_MODE = "always" as const;

export const mywordsKeys = {
  review: ["mywords", "review"] as const,
  notes: (lessonSlug?: string) => ["mywords", "notes", lessonSlug ?? "all"] as const,
};

/** Cache của màn nghe chép mang cờ `inReview` và `note` của từng câu nên phải làm mới cùng lúc. */
const refreshRelated = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ["mywords"] }),
    queryClient.invalidateQueries({ queryKey: ["dictation", "lesson"] }),
  ]);

export const useReviewSentences = () =>
  useQuery({ queryKey: mywordsKeys.review, queryFn: mywordsApi.listReview, networkMode: NETWORK_MODE });

export const useNotes = (lessonSlug?: string) =>
  useQuery({
    queryKey: mywordsKeys.notes(lessonSlug),
    queryFn: () => mywordsApi.listNotes(lessonSlug),
    networkMode: NETWORK_MODE,
  });

/** "Đã ổn": gỡ câu khỏi Câu cần ôn. */
export const useResolveReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: (sentenceId: string) => mywordsApi.resolveReview(sentenceId),
    onSuccess: () => refreshRelated(queryClient),
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: ({ sentenceId, content }: { sentenceId: string; content: string }) =>
      mywordsApi.saveNote(sentenceId, content),
    onSuccess: () => refreshRelated(queryClient),
  });
};

export const useRemoveNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: (sentenceId: string) => mywordsApi.deleteNote(sentenceId),
    onSuccess: () => refreshRelated(queryClient),
  });
};
