import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buttonClasses } from "@/components/common/buttonStyles";

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="text-center">
        <h1 className="font-display text-6xl font-bold text-text mb-4">404</h1>
        <p className="text-xl text-text-muted mb-8">{t("notFound.title")}</p>
        <Link
          to="/"
          className={buttonClasses({ size: "lg" })}
        >
          {t("notFound.goHome")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
