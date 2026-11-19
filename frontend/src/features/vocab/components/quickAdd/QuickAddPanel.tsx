import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import Button from "@/components/common/Button";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { useAuthStore } from "@/features/auth";
import { toast } from "@/stores/toastStore";
import { useDeckDetail } from "../../deckManageHooks";
import { myDeckPath } from "../../deckManagePaths";
import { validateMyDeckName } from "../../myDecks";
import { useMyDecks, useQuickAdd } from "../../myDecksHooks";
import {
  NEW_OPTION,
  loadLastChoice,
  pickDeckId,
  pickGroupId,
  quickAddFailure,
  saveLastChoice,
  type QuickAddFailure,
} from "../../quickAdd";

export interface QuickAddPanelProps {
  headword: string;
  meaningNo: number;
  /** Có khi từ được bấm trong một câu của bài học (BR-HT-28). */
  sentenceId?: string;
  onClose: () => void;
}

interface SelectOption {
  id: string;
  name: string;
}

interface QuickAddSelectProps {
  id: string;
  label: string;
  icon: string;
  value: string;
  disabled?: boolean;
  options: readonly SelectOption[];
  newOptionLabel: string;
  onChange: (value: string) => void;
}

const MENU_GAP = 6;
const VIEWPORT_PAD = 8;
const MENU_ESTIMATED_HEIGHT = 220;

/**
 * Hộp chọn tuỳ biến theo giao diện tối/sáng của LinguaLoop thay cho `<select>` mặc định của trình duyệt.
 * Danh sách mở qua portal để không bị cắt bởi vùng cuộn của hộp tra từ và tách biệt mục tạo mới ở cuối.
 */
function QuickAddSelect({
  id,
  label,
  icon,
  value,
  disabled = false,
  options,
  newOptionLabel,
  onChange,
}: Readonly<QuickAddSelectProps>) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;

  const isNew = value === NEW_OPTION;
  const selectedName = isNew
    ? newOptionLabel
    : (options.find((item) => item.id === value)?.name ?? newOptionLabel);

  const allValues = useMemo(() => [...options.map((item) => item.id), NEW_OPTION], [options]);

  const updateCoords = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.max(rect.width, 188);
    const left = Math.max(VIEWPORT_PAD, Math.min(rect.left, window.innerWidth - width - VIEWPORT_PAD));
    const fitsBelow = rect.bottom + MENU_GAP + MENU_ESTIMATED_HEIGHT <= window.innerHeight;
    const openAbove = !fitsBelow && rect.top > window.innerHeight - rect.bottom;
    setCoords(
      openAbove
        ? { left, width, bottom: window.innerHeight - rect.top + MENU_GAP }
        : { left, width, top: rect.bottom + MENU_GAP },
    );
  };

  useEffect(() => {
    if (!open) return;
    updateCoords();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onScrollOrResize = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  const pick = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const currentIndex = Math.max(0, allValues.indexOf(value));
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + delta + allValues.length) % allValues.length;
      onChange(allValues[nextIndex]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((prev) => !prev);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id={labelId} className="text-xs font-semibold text-text-muted">
        {label}
      </span>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
        className={`flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md border bg-bg-elevated px-2.5 text-left text-[13px] transition-[border-color,background-color,box-shadow] duration-150 focus:outline-none disabled:cursor-not-allowed disabled:opacity-55 ${
          open
            ? "border-primary bg-surface-hover/50 shadow-[0_0_0_3px_var(--primary-soft)]"
            : "border-border-strong hover:border-primary/60 hover:bg-surface-hover/35 focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--primary-soft)]"
        }`}
      >
        <Icon
          name={isNew ? "plus" : icon}
          className={`size-3.5 shrink-0 ${isNew ? "text-primary-text" : "text-text-subtle"}`}
        />
        <span className={`min-w-0 flex-1 truncate ${isNew ? "font-semibold text-primary-text" : "font-medium text-text"}`}>
          {selectedName}
        </span>
        <Icon
          name="chevron-down"
          className={`size-3.5 shrink-0 text-text-subtle transition-transform duration-200 ${
            open ? "rotate-180 text-primary-text" : ""
          }`}
        />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            data-word-popover-keep="true"
            style={coords}
            className="fixed z-[110] flex flex-col rounded-md border border-border-strong bg-surface p-1.5 shadow-[0_16px_36px_-10px_rgba(0,0,0,0.72),0_0_0_1px_var(--border)] animate-[menu-in_140ms_var(--ease-out)]"
          >
            {options.length > 0 && (
              <div className="flex max-h-44 flex-col gap-0.5 overflow-y-auto pr-0.5">
                {options.map((option) => {
                  const selected = option.id === value;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => pick(option.id)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                        selected
                          ? "bg-primary-soft font-semibold text-primary-text"
                          : "font-medium text-text hover:bg-surface-hover"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.name}</span>
                      {selected && <Icon name="check" className="size-3.5 shrink-0 text-primary-text" />}
                    </button>
                  );
                })}
              </div>
            )}

            {options.length > 0 && <div className="my-1 border-t border-border" role="separator" />}

            <button
              type="button"
              role="option"
              aria-selected={isNew}
              onClick={() => pick(NEW_OPTION)}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-left text-[13px] font-semibold transition-colors ${
                isNew
                  ? "bg-primary-soft text-primary-text"
                  : "text-primary-text hover:bg-primary-soft/60"
              }`}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <Icon name="plus" className="size-3.5 shrink-0" />
                <span className="truncate">{newOptionLabel}</span>
              </span>
              {isNew && <Icon name="check" className="size-3.5 shrink-0 text-primary-text" />}
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

interface QuickAddInputProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  error?: string;
  onChange: (value: string) => void;
}

/** Ô nhập nhỏ gọn đồng bộ chiều cao `h-9` với hộp chọn Bộ / Nhóm trong khung thêm nhanh. */
function QuickAddInput({
  id,
  label,
  value,
  placeholder,
  maxLength = 120,
  autoFocus = false,
  error,
  onChange,
}: Readonly<QuickAddInputProps>) {
  const errorId = `${id}-error`;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-text-muted">
        {label}
      </label>
      <div
        className={`flex h-9 min-w-0 items-center rounded-md border bg-bg-elevated px-2.5 transition-[border-color,box-shadow] duration-150 ${
          error
            ? "border-danger focus-within:border-danger focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--danger)_22%,transparent)]"
            : "border-border-strong focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--primary-soft)]"
        }`}
      >
        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-[13px] font-medium text-text outline-none placeholder:font-normal placeholder:text-text-subtle"
        />
      </div>
      {error && (
        <p id={errorId} className="flex items-center gap-1 text-xs text-danger">
          <Icon name="circle-alert" className="size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Khung mở dưới một nghĩa: chọn bộ và nhóm rồi thêm thẻ vào "Bộ của tôi" (UC-HT-10). Điền sẵn bộ và nhóm dùng gần nhất;
 * chưa có bộ thì tạo bộ mới, bộ chưa có nhóm thì tạo nhóm "Từ mới" (BR-HT-28). Lỗi hiện trong khung và giữ khung mở để
 * chọn lại (từ đã có trong bộ, mất kết nối).
 */
export default function QuickAddPanel({ headword, meaningNo, sentenceId, onClose }: Readonly<QuickAddPanelProps>) {
  const { t } = useTranslation("vocab");
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);
  const decks = useMyDecks();
  const quickAdd = useQuickAdd();
  const last = useMemo(() => loadLastChoice(userId), [userId]);

  const [deckSel, setDeckSel] = useState<string | null>(null);
  const [groupSel, setGroupSel] = useState<string | null>(null);
  const [deckName, setDeckName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [failure, setFailure] = useState<QuickAddFailure | null>(null);

  const deckList = useMemo(() => decks.data ?? [], [decks.data]);
  const deckId = deckSel ?? pickDeckId(deckList, last?.deckId);
  const newDeck = deckId === NEW_OPTION;
  const detail = useDeckDetail("learner", newDeck ? undefined : deckId);
  const groups = useMemo(() => detail.data?.groups ?? [], [detail.data]);
  const groupId = newDeck ? NEW_OPTION : (groupSel ?? pickGroupId(groups, last?.groupId));
  const newGroup = groupId === NEW_OPTION;
  const defaultGroupName = t("quickAdd.defaultGroup");
  const ready = !decks.isPending && (newDeck || !detail.isPending);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFailure(null);
    if (newDeck) {
      const invalid = validateMyDeckName(deckName);
      if (invalid) {
        setFailure({ kind: "deckName", error: invalid });
        return;
      }
    }
    const newGroupName = (groupName.trim() || defaultGroupName).trim();
    quickAdd.mutate(
      {
        headword,
        meaningNo,
        sentenceId,
        deck: newDeck ? { newName: deckName.trim() } : { id: deckId },
        group: newGroup ? { newName: newGroupName } : { id: groupId },
      },
      {
        onSuccess: (result) => {
          saveLastChoice(userId, { deckId: result.deckId, groupId: result.groupId });
          const deck = newDeck ? deckName.trim() : (deckList.find((item) => item.id === result.deckId)?.name ?? "");
          const group = newGroup ? newGroupName : (groups.find((item) => item.id === result.groupId)?.name ?? "");
          toast(t("quickAdd.added", { word: headword, deck, group }), {
            icon: "circle-check",
            action: { label: t("quickAdd.viewDeck"), onClick: () => navigate(myDeckPath(result.deckId)) },
          });
          onClose();
        },
        onError: (error) => setFailure(quickAddFailure(error)),
      },
    );
  };

  const message = (): string | null => {
    if (!failure) return null;
    switch (failure.kind) {
      case "taken":
        return t("quickAdd.errors.taken", { word: headword, group: failure.groupName });
      case "meaningGone":
        return t("quickAdd.errors.meaningGone");
      case "forbidden":
        return t("quickAdd.errors.forbidden");
      case "gone":
        return t("quickAdd.errors.gone");
      case "retry":
        return t("quickAdd.errors.retry");
      default:
        return null;
    }
  };
  const text = message();
  const loadFailed = decks.isError || (!newDeck && detail.isError);
  const offline = isAxiosError(decks.error) && !decks.error.response;
  const fieldKey = `${headword}-${meaningNo}`;

  return (
    <form
      onSubmit={submit}
      aria-label={t("quickAdd.formAria", { word: headword })}
      className="mt-1.5 flex w-full flex-col gap-3 rounded-md border border-border-strong bg-surface p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_24px_-12px_rgba(0,0,0,0.5)] animate-[menu-in_150ms_var(--ease-out)]"
      noValidate
    >
      {loadFailed ? (
        <FormAlert variant="danger">{offline ? t("quickAdd.errors.offline") : t("quickAdd.errors.loadFailed")}</FormAlert>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className={`grid gap-2.5 ${newDeck ? "grid-cols-1" : "grid-cols-2"}`}>
            <QuickAddSelect
              id={`quick-deck-select-${fieldKey}`}
              label={t("quickAdd.deck")}
              icon="layers"
              value={deckId}
              disabled={!ready || quickAdd.isPending}
              options={deckList}
              newOptionLabel={t("quickAdd.newDeck")}
              onChange={(nextValue) => {
                setDeckSel(nextValue);
                setGroupSel(null);
                setFailure(null);
              }}
            />

            {!newDeck && (
              <QuickAddSelect
                id={`quick-group-select-${fieldKey}`}
                label={t("quickAdd.group")}
                icon="folders"
                value={groupId}
                disabled={!ready || quickAdd.isPending}
                options={groups}
                newOptionLabel={groups.length === 0 ? defaultGroupName : t("quickAdd.newGroup")}
                onChange={(nextValue) => {
                  setGroupSel(nextValue);
                  setFailure(null);
                }}
              />
            )}
          </div>

          {(newDeck || newGroup) && (
            <div className={`grid gap-2.5 ${newDeck ? "sm:grid-cols-2" : "grid-cols-1"}`}>
              {newDeck && (
                <QuickAddInput
                  id={`quick-deck-${fieldKey}`}
                  label={t("quickAdd.deckName")}
                  value={deckName}
                  maxLength={120}
                  autoFocus
                  error={failure?.kind === "deckName" ? t(`mine.dialog.errors.${failure.error}`) : undefined}
                  onChange={setDeckName}
                />
              )}
              <QuickAddInput
                id={`quick-group-${fieldKey}`}
                label={t("quickAdd.groupName")}
                value={groupName}
                placeholder={defaultGroupName}
                maxLength={120}
                autoFocus={!newDeck}
                error={failure?.kind === "groupName" ? t(`content.group.errors.${failure.error}`) : undefined}
                onChange={setGroupName}
              />
            </div>
          )}
        </div>
      )}

      {text && <FormAlert variant="danger">{text}</FormAlert>}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-2.5">
        <Button
          variant="ghost"
          size="sm"
          className="!h-8 !px-3 !text-xs"
          onClick={onClose}
          disabled={quickAdd.isPending}
        >
          {t("quickAdd.cancel")}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="!h-8 !px-3.5 !text-xs"
          leftIcon={<Icon name="plus" className="size-3.5" />}
          isLoading={quickAdd.isPending}
          disabled={!ready || loadFailed}
        >
          {t("quickAdd.submit")}
        </Button>
      </div>
    </form>
  );
}
