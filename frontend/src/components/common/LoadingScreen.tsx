import { useTranslation } from "react-i18next";

const LoadingScreen = () => {
  const { t } = useTranslation();

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-label={t("loading")}
    >
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
};

export default LoadingScreen;
