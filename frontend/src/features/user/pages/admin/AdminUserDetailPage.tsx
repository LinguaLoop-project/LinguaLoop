import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import Button from "@/components/common/Button";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { useAuthStore } from "@/features/auth";
import { formatDate, formatDateTime, formatNumber, formatVnd } from "../../adminFormat";
import { ADMIN_USERS_PATH } from "../../adminUsers";
import { Avatar, RoleBadge, StatusBadge } from "../../components/admin/AdminBits";
import ChangeRoleDialog from "../../components/admin/ChangeRoleDialog";
import GrantCreditDialog from "../../components/admin/GrantCreditDialog";
import LockUserDialog from "../../components/admin/LockUserDialog";
import TransferDialog from "../../components/admin/TransferDialog";
import UnlockUserDialog from "../../components/admin/UnlockUserDialog";
import { useAdminUserDetail } from "../../hooks";
import type { AdminApiError, AdminUserDetail } from "../../types";

type DialogKind = "lock" | "unlock" | "role" | "transferAll" | "grantCredit";

/**
 * Chi tiết một tài khoản (UC-QT-01 Bước 6) kèm các thao tác Khóa hoặc Mở khóa (UC-QT-02, 03), Đổi vai trò (UC-QT-04) và
 * Giao toàn bộ nội dung với giáo viên (UC-QT-07). Không có thao tác trên tài khoản của chính mình hay quản trị viên
 * khác (BR-QT-02).
 */
export default function AdminUserDetailPage() {
  const { t } = useTranslation("userAdmin");
  const { id } = useParams<{ id: string }>();
  const query = useAdminUserDetail(id);
  const [dialog, setDialog] = useState<DialogKind | null>(null);

  let body;
  if (query.isLoading) {
    body = <Skeleton className="h-96 w-full" />;
  } else if (query.isError || !query.data) {
    const error = query.error as unknown as AdminApiError | null;
    body = (
      <ErrorState
        kind={error?.kind === "network" ? "network" : error?.kind === "notFound" ? "notFound" : "server"}
        onRetry={() => void query.refetch()}
      />
    );
  } else {
    body = <DetailBody user={query.data} onAction={setDialog} />;
  }

  const user = query.data;
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <Link to={ADMIN_USERS_PATH} className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text">
        <Icon name="arrow-left" className="size-4" />
        {t("back")}
      </Link>
      {body}
      {user && dialog === "lock" && (
        <LockUserDialog user={user} onClose={() => setDialog(null)} onTransferAll={() => setDialog("transferAll")} />
      )}
      {user && dialog === "unlock" && <UnlockUserDialog user={user} onClose={() => setDialog(null)} />}
      {user && dialog === "role" && (
        <ChangeRoleDialog user={user} onClose={() => setDialog(null)} onTransferAll={() => setDialog("transferAll")} />
      )}
      {user && dialog === "grantCredit" && <GrantCreditDialog user={user} onClose={() => setDialog(null)} />}
      {user && dialog === "transferAll" && (
        <TransferDialog
          mode={{ kind: "all", teacherId: user.id, teacherName: user.displayName }}
          onClose={() => setDialog(null)}
        />
      )}
    </main>
  );
}

function DetailBody({ user, onAction }: Readonly<{ user: AdminUserDetail; onAction: (kind: DialogKind) => void }>) {
  const { t, i18n } = useTranslation("userAdmin");
  const currentUserId = useAuthStore((s) => s.user?.id);
  const self = currentUserId === user.id;
  const manageable = !self && user.role !== "admin";
  const content = user.content;
  const lessons = content ? content.publishedLessons + content.draftLessons : 0;
  const decks = content ? content.publishedDecks + content.draftDecks : 0;
  const dateOr = (iso: string | null, withTime = false) =>
    (withTime ? formatDateTime(iso, i18n.language) : formatDate(iso, i18n.language)) ?? t("never");

  return (
    <>
      <section className="flex flex-wrap items-start gap-4 rounded-xl border border-border bg-surface p-5">
        <Avatar name={user.displayName} url={user.avatarUrl} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h1 className="truncate text-xl font-bold text-text">{user.displayName}</h1>
          <p className="truncate text-sm text-text-muted">{user.email}</p>
          <div className="flex flex-wrap items-center gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge locked={user.locked} />
            {user.plan && <span className="text-xs font-semibold text-text-muted">{t(`plans.${user.plan}`)}</span>}
          </div>
          {self && <p className="text-xs text-text-subtle">{t("detail.self")}</p>}
        </div>
        {manageable && (
          <div className="flex flex-wrap gap-2">
            {user.locked ? (
              <Button type="button" leftIcon={<Icon name="lock-open" />} onClick={() => onAction("unlock")}>
                {t("detail.unlock")}
              </Button>
            ) : (
              <Button type="button" variant="danger" leftIcon={<Icon name="lock" />} onClick={() => onAction("lock")}>
                {t("detail.lock")}
              </Button>
            )}
            <Button type="button" variant="secondary" leftIcon={<Icon name="user" />} onClick={() => onAction("role")}>
              {t("detail.changeRole")}
            </Button>
            {user.role === "teacher" && (
              <Button
                type="button"
                variant="secondary"
                leftIcon={<Icon name="arrow-left-right" />}
                onClick={() => onAction("transferAll")}
              >
                {t("detail.transferAll")}
              </Button>
            )}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <dl className="grid grid-cols-[auto_1fr] content-start gap-x-4 gap-y-2 rounded-xl border border-border bg-surface p-5 text-sm">
          <dt className="text-text-muted">{t("detail.joined")}</dt>
          <dd className="text-text">{dateOr(user.createdAt)}</dd>
          <dt className="text-text-muted">{t("detail.lastActive")}</dt>
          <dd className="text-text">{dateOr(user.lastActiveAt, true)}</dd>
          {user.locked && (
            <>
              <dt className="text-text-muted">{t("detail.lockedAt")}</dt>
              <dd className="text-text">{dateOr(user.lockedAt, true)}</dd>
              <dt className="text-text-muted">{t("detail.lockedReason")}</dt>
              <dd className="whitespace-pre-wrap break-words text-danger">{user.lockedReason}</dd>
            </>
          )}
          {user.role === "student" && (
            <>
              <dt className="text-text-muted">{t("detail.plan")}</dt>
              <dd className="text-text">{user.plan ? t(`plans.${user.plan}`) : t("dash")}</dd>
              <dt className="text-text-muted">{t("detail.proEndsAt")}</dt>
              <dd className="text-text">{formatDate(user.proEndsAt, i18n.language) ?? t("dash")}</dd>
            </>
          )}
          {user.role === "teacher" && content && (
            <>
              <dt className="text-text-muted">{t("detail.content")}</dt>
              <dd className="text-text">
                {t("detail.contentCounts", { lessons, decks })}
                {content.draftLessons + content.draftDecks > 0 && (
                  <span className="block text-xs text-text-muted">
                    {t("detail.contentDrafts", { lessons: content.draftLessons, decks: content.draftDecks })}
                  </span>
                )}
              </dd>
              <dt className="text-text-muted">{t("detail.waitingReports")}</dt>
              <dd className="text-text">{content.waitingTeacherReports}</dd>
              <dt className="text-text-muted">{t("detail.credit")}</dt>
              <dd className="flex flex-wrap items-center gap-2 text-text">
                {formatNumber(user.creditBalance ?? 0, i18n.language)}
                {user.locked ? (
                  <span className="text-xs text-text-muted">{t("grant.lockedNote")}</span>
                ) : (
                  <Button type="button" size="sm" variant="secondary" leftIcon={<Icon name="plus" />}
                    onClick={() => onAction("grantCredit")}>
                    {t("grant.open")}
                  </Button>
                )}
              </dd>
            </>
          )}
        </dl>

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-bold text-text">{t("detail.recent")}</h2>
          {user.recentActivities.length === 0 ? (
            <p className="text-sm text-text-muted">{t("detail.noActivity")}</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {user.recentActivities.map((a) => (
                <li key={`${a.kind}-${a.title}-${a.at}`} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-text">
                    <span className="font-semibold">{t(`activity.${a.kind}`)}</span> · {a.title || t("dash")}
                    {a.count > 1 && <span className="text-text-muted"> · {t("activity.times", { count: a.count })}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-text-subtle">{formatDateTime(a.at, i18n.language)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {user.role === "student" && (
        <section className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-bold text-text">{t("detail.payments")}</h2>
          {user.payments.length === 0 ? (
            <p className="text-sm text-text-muted">{t("detail.noPayments")}</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {user.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-text">
                    {t("detail.paymentRow", {
                      plan: p.planName,
                      months: p.months,
                      amount: formatVnd(p.amountVnd, i18n.language),
                    })}
                  </span>
                  <span className="text-xs text-text-subtle">
                    {t("detail.paymentPeriod", {
                      from: formatDate(p.startsAt, i18n.language) ?? t("dash"),
                      to: formatDate(p.endsAt, i18n.language) ?? t("dash"),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
