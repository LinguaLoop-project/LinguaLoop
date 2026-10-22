import AppShell from "@/components/layouts/shell/AppShell";
import { STUDENT_SHELL } from "@/components/layouts/shell/shellConfigs";
import { UpgradeModal } from "@/components/common/UpgradeModal";
import { useQuotaStore } from "@/stores/quotaStore";

/** Khung học viên. Bảo vệ bằng AuthGuard ở routes.tsx. */
const StudentLayout = () => {
  const { showUpgradeModal, upgradeReason, setShowUpgradeModal } = useQuotaStore();

  return (
    <AppShell config={STUDENT_SHELL}>
      <UpgradeModal isOpen={showUpgradeModal} reason={upgradeReason} onClose={() => setShowUpgradeModal(false)} />
    </AppShell>
  );
};

export default StudentLayout;
