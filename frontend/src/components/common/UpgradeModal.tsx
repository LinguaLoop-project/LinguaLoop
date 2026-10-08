import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "./Button";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/stores/authStore";
import { MAX_FREE_ACTIONS } from "@/hooks/useQuota";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Image/Gradient */}
        <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
          <button 
            type="button"
            onClick={onClose}
            aria-label={t("upgradeModal.close")}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            <i className="ph ph-x text-lg"></i>
          </button>
          
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center transform -rotate-3">
              <i className="ph-fill ph-crown text-2xl text-white"></i>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-12 pb-8 px-6 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t("upgradeModal.title")}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            <Trans
              t={t}
              i18nKey="upgradeModal.description"
              values={{ count: MAX_FREE_ACTIONS }}
              components={{ b: <span className="font-semibold text-purple-600 dark:text-purple-400" /> }}
            />
          </p>
          
          <div className="space-y-3 text-left bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                <i className="ph-bold ph-check text-sm"></i>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("upgradeModal.benefits.unlimited")}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                <i className="ph-bold ph-check text-sm"></i>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("upgradeModal.benefits.advanced")}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                <i className="ph-bold ph-check text-sm"></i>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("upgradeModal.benefits.support")}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              variant="primary" 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0"
              onClick={handleUpgrade}
            >
              {t("upgradeModal.upgrade")}
            </Button>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={onClose}
            >
              {t("upgradeModal.later")}
            </Button>
          </div>
        </div>
        
      </div>
    </div>
  );
};
