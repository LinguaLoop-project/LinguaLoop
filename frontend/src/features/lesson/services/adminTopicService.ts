import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/auth";
import { toAdminApiError } from "@/features/user";
import { topicListParams, type AdminTopic, type TopicListFilter } from "../adminTopics";

const TOPICS = "/admin/topics";
const REQUEST_TIMEOUT_MS = 15_000;

async function call<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    return (await request).data.data;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

/** Quản lý chủ đề của quản trị viên (UC-CD-01 đến 03). Lỗi ném ra là `AdminApiError`. */
export const adminTopicService = {
  list: (filter: TopicListFilter) =>
    call<AdminTopic[]>(axiosClient.get(TOPICS, { params: topicListParams(filter), timeout: REQUEST_TIMEOUT_MS })),
  create: (name: string) => call<AdminTopic>(axiosClient.post(TOPICS, { name }, { timeout: REQUEST_TIMEOUT_MS })),
  rename: (id: string, name: string) =>
    call<AdminTopic>(axiosClient.put(`${TOPICS}/${id}`, { name }, { timeout: REQUEST_TIMEOUT_MS })),
};
