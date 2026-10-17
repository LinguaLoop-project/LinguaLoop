import AppShell from "@/components/layouts/shell/AppShell";
import { INSTRUCTOR_SHELL } from "@/components/layouts/shell/shellConfigs";

/** Khung giảng viên. Bảo vệ bằng AuthGuard ở routes.tsx. */
const InstructorLayout = () => <AppShell config={INSTRUCTOR_SHELL} />;

export default InstructorLayout;
