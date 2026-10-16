import AppShell from "@/components/layouts/shell/AppShell";
import { ADMIN_SHELL } from "@/components/layouts/shell/shellConfigs";

/** Khung quản trị. Bảo vệ bằng AuthGuard ở routes.tsx. */
const AdminLayout = () => <AppShell config={ADMIN_SHELL} />;

export default AdminLayout;
