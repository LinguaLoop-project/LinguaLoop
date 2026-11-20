import type { LessonItem, ManageRole } from "./types";

export type LessonAction = "publish" | "unpublish" | "delete" | "restore";

/** Thao tác hiện trên một bài theo vai trò và trạng thái (BR-BH-01, 02). */
export function lessonActions(lesson: Pick<LessonItem, "status" | "deletedAt">, role: ManageRole): LessonAction[] {
  if (role === "admin") return lesson.status === "published" ? ["unpublish"] : [];
  if (lesson.deletedAt) return ["restore"];
  return lesson.status === "draft" ? ["publish", "delete"] : ["unpublish", "delete"];
}
