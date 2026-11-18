// Đường dẫn khu giáo viên và quản trị viên trong `src/app/routes.tsx` (`/teacher/decks`, `/admin/decks`).
export const TEACHER_DECKS_PATH = "/teacher/decks";
export const ADMIN_DECKS_PATH = "/admin/decks";

/** Mục "Bộ của tôi" của học viên ở trang Từ vựng và trang quản lý nội dung một bộ cá nhân (UC-HT-08, UC-HT-09). */
export const MY_DECKS_PATH = "/student/vocab?tab=mine";
export const myDeckPath = (deckId: string) => `/student/vocab/mine/${deckId}`;

/** Gốc đường dẫn API nội dung bộ theo vai trò; bộ cá nhân của học viên ở `/vocab/my-decks`. */
export const contentApiBase = (role: "teacher" | "admin" | "learner") =>
  role === "learner" ? "/vocab/my-decks" : `/${role}/vocab/decks`;
