import type { LessonListFilter, ManageRole } from "./types";

type Params = Record<string, string | number | boolean>;

/** Bỏ tham số rỗng để URL gọn và server dùng mặc định. */
export function listParams(role: ManageRole, filter: LessonListFilter, page: number): Params {
  const params: Params = { page };
  const q = filter.q.trim();
  if (q) params.q = q;
  if (filter.topicId) params.topicId = filter.topicId;
  if (filter.cefrLevel) params.cefrLevel = filter.cefrLevel;
  if (filter.pro) params.pro = true;
  if (role === "teacher" && filter.status !== "all") params.status = filter.status;
  if (role === "admin" && filter.ownerId) params.ownerId = filter.ownerId;
  return params;
}
