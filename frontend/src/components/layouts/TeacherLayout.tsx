import AppShell from "@/components/layouts/shell/AppShell";
import { TEACHER_SHELL } from "@/components/layouts/shell/shellConfigs";

/** Khung giáo viên. Bảo vệ bằng AuthGuard ở routes.tsx. */
const TeacherLayout = () => <AppShell config={TEACHER_SHELL} />;

export default TeacherLayout;
