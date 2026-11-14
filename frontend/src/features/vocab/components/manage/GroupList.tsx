import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import type { DeckGroup } from "../../deckManageTypes";

export interface GroupListProps {
  groups: DeckGroup[];
  activeId: string | null;
  onSelect: (id: string) => void;
  /** Có thì hiện nút "Thêm nhóm thẻ" ở cuối khung (giáo viên, UC-NT-01). */
  onAdd?: () => void;
}

/**
 * Danh sách nhóm thẻ của bộ trong một khung riêng: mỗi nhóm là một ô có icon chồng thẻ trên nền gradient (dùng chung
 * vì nhóm thẻ chưa có ảnh riêng, icon theo chủ đề dễ sai ngữ cảnh), tên và số thẻ. Danh sách dài thì cuộn bên trong khung (thanh cuộn
 * mảnh) thay vì đẩy cả trang xuống; trên màn rộng khung bám theo khi cuộn trang.
 */
export default function GroupList({ groups, activeId, onSelect, onAdd }: Readonly<GroupListProps>) {
  const { t } = useTranslation("vocab");
  return (
    <nav
      aria-label={t("manage.detail.groups")}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface md:sticky md:top-4"
    >
      <h2 className="flex items-center justify-between px-4 pb-2 pt-4 text-xs font-bold uppercase tracking-wider text-text-muted">
        <span>{t("content.groupList")}</span>
        <span className="font-semibold normal-case tracking-normal">{groups.length}</span>
      </h2>
      <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto px-3 pb-3 [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin] md:max-h-[calc(100vh-14rem)]">
        {groups.map((group) => {
          const active = group.id === activeId;
          return (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => onSelect(group.id)}
                aria-current={active ? "true" : undefined}
                className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                  active
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-bg-elevated hover:border-border-strong hover:bg-surface-hover"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-md text-xl ${
                    active
                      ? "bg-[linear-gradient(135deg,var(--fn-vocab),var(--primary))] text-white shadow-[0_4px_12px_-4px_var(--primary)]"
                      : "bg-[linear-gradient(135deg,var(--fn-vocab-soft),var(--primary-soft))] text-fn-vocab"
                  }`}
                  aria-hidden="true"
                >
                  <Icon name="gallery-vertical-end" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={`truncate text-sm ${active ? "font-bold text-text" : "font-semibold text-text"}`}>
                    {group.name}
                  </span>
                  <span className="text-xs text-primary-text">{t("content.groupCards", { count: group.cardCount })}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {onAdd && (
        <div className="border-t border-border p-3">
          <Button variant="ghost" size="sm" fullWidth leftIcon={<Icon name="plus" />} onClick={onAdd}>
            {t("content.addGroup")}
          </Button>
        </div>
      )}
    </nav>
  );
}
