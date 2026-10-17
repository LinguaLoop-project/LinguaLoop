import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "./Button";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/stores/authStore";
import { MAX_FREE_ACTIONS } from "@/hooks/useQuota";
import Icon from "@/components/common/Icon";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    // Navigate to a subscription page
    if (user?.role === "admin") {
      navigate("/admin/subs");
    } else {
      // Assuming student upgrade page
      navigate("/student/subs"); // Change this to real upgrade page if available
    }
  };

  const benefits = ["unlimited", "advanced", "support"] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
      <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-border-strong bg-surface shadow-[var(--shadow-card)]">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("upgradeModal.close")}
          className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          <Icon name="x" className="text-lg" />
        </button>

        <div className="px-6 pb-8 pt-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary-soft text-primary-text">
            <Icon name="crown" fill className="text-2xl" />
          </div>
          <h3 id="upgrade-title" className="mb-2 font-display text-2xl font-bold text-text">
            {t("upgradeModal.title")}
          </h3>
          <p className="mb-6 text-text-muted">
            <Trans
              t={t}
              i18nKey="upgradeModal.description"
              values={{ count: MAX_FREE_ACTIONS }}
              components={{ b: <span className="font-semibold text-primary-text" /> }}
            />
          </p>

          <ul className="mb-6 space-y-3 rounded-xl border border-border bg-surface-hover p-4 text-left">
            {benefits.map((key) => (
              <li key={key} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Icon name="check" className="text-sm" strokeWidth={3} />
                </span>
                <span className="text-sm font-medium text-text">{t(`upgradeModal.benefits.${key}`)}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3">
            <Button variant="primary" fullWidth onClick={handleUpgrade}>
              {t("upgradeModal.upgrade")}
            </Button>
            <Button variant="secondary" fullWidth onClick={onClose}>
              {t("upgradeModal.later")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
