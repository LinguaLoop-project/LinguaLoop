import { useTranslation } from "react-i18next";
import FormAlert from "@/components/common/FormAlert";
import Skeleton from "@/components/common/Skeleton";
import Switch from "@/components/common/Switch";
import { useNotificationPreferences, useSetNotificationPreference } from "../notifications";
import { SettingRow, SettingsCard } from "./SettingsCard";

/**
 * Tab Thông báo trong Cài đặt của học viên (UC-TK-10, BR-TK-23): bật hoặc tắt từng loại nhắc học. Mỗi lựa chọn có hiệu lực
 * ngay và được lưu theo tài khoản. Thông báo về thanh toán, hết hạn gói và kết quả báo cáo luôn gửi nên không có công tắc.
 */
export default function NotificationPreferencesSection() {
  const { t } = useTranslation("auth");
  const query = useNotificationPreferences();
  const set = useSetNotificationPreference();

  return (
    <div className="flex flex-col gap-6" id="v-notifications">
      {set.isError && <FormAlert variant="danger">{t("settings.notifications.saveFailed")}</FormAlert>}

      <SettingsCard
        title={t("settings.notifications.title")}
        description={t("settings.notifications.hint")}
        icon="bell"
      >
        {query.isLoading ? (
          <div className="flex flex-col gap-4" aria-busy="true">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        ) : query.isError || !query.data ? (
          <FormAlert variant="danger">{t("settings.notifications.loadFailed")}</FormAlert>
        ) : (
          <div className="divide-y divide-border/70">
            {query.data.items.map((item) => {
              const labelId = `notification-pref-${item.type}`;
              return (
                <SettingRow
                  key={item.type}
                  label={t(`settings.notifications.types.${item.type}.title`, { defaultValue: item.type })}
                  hint={t(`settings.notifications.types.${item.type}.hint`, { defaultValue: "" })}
                  labelId={labelId}
                >
                  <Switch
                    checked={item.enabled}
                    ariaLabelledBy={labelId}
                    disabled={set.isPending && set.variables?.type === item.type}
                    onChange={(enabled) => set.mutate({ type: item.type, enabled })}
                  />
                </SettingRow>
              );
            })}
          </div>
        )}
      </SettingsCard>

      <p className="px-1 text-[13px] leading-relaxed text-text-subtle">{t("settings.notifications.alwaysOn")}</p>
    </div>
  );
}
