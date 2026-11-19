// Thêm thẻ nhanh vào "Bộ của tôi" từ một nghĩa trong từ điển hoặc câu bài học (UC-HT-10, BR-HT-28).
import { deckContentApi } from "./deckContentApi";
import type { DeckApiError, DeckCard } from "./deckManageTypes";
import { myDeckFailure, type MyDeckNameError } from "./myDecks";
import { myDecksApi } from "./myDecksApi";

/** Giá trị của hộp chọn cho "Tạo bộ mới…" và "Nhóm mới…". */
export const NEW_OPTION = "__new__";

/** Bộ và nhóm học viên dùng gần nhất, để điền sẵn lần sau. */
export interface QuickAddChoice {
  deckId: string;
  groupId: string | null;
}

const storageKey = (userId: string) => `ll.quickAdd.${userId}`;

/** Đọc lựa chọn gần nhất; bộ nhớ trình duyệt có thể bị chặn hoặc hỏng nên mọi lỗi coi như chưa có. */
export function loadLastChoice(userId: string | undefined): QuickAddChoice | null {
  if (!userId) return null;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(userId)) ?? "null");
    if (parsed && typeof parsed === "object" && "deckId" in parsed && typeof parsed.deckId === "string") {
      const groupId = "groupId" in parsed && typeof parsed.groupId === "string" ? parsed.groupId : null;
      return { deckId: parsed.deckId, groupId };
    }
  } catch {
    // không đọc được thì bỏ qua
  }
  return null;
}

export function saveLastChoice(userId: string | undefined, choice: QuickAddChoice): void {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(choice));
  } catch {
    // không ghi được thì lần sau không điền sẵn
  }
}

/** Bộ điền sẵn: bộ dùng gần nhất nếu còn, không thì bộ đầu tiên, chưa có bộ nào thì "Tạo bộ mới" (Q2). */
export function pickDeckId(decks: readonly { id: string }[], lastDeckId: string | null | undefined): string {
  if (lastDeckId && decks.some((deck) => deck.id === lastDeckId)) return lastDeckId;
  return decks[0]?.id ?? NEW_OPTION;
}

/** Nhóm điền sẵn: nhóm dùng gần nhất nếu còn, không thì nhóm cuối của bộ, bộ chưa có nhóm thì "Nhóm mới". */
export function pickGroupId(groups: readonly { id: string }[], lastGroupId: string | null | undefined): string {
  if (lastGroupId && groups.some((group) => group.id === lastGroupId)) return lastGroupId;
  return groups[groups.length - 1]?.id ?? NEW_OPTION;
}

/** Việc cần làm: bộ và nhóm có sẵn hoặc cần tạo mới trước khi thêm thẻ. */
export interface QuickAddPlan {
  headword: string;
  meaningNo: number;
  /** Có khi từ được bấm trong một câu của bài học: thẻ nhớ câu gốc (BR-HT-28). */
  sentenceId?: string;
  deck: { id: string } | { newName: string };
  group: { id: string } | { newName: string };
}

export interface QuickAddResult {
  deckId: string;
  groupId: string;
  card: DeckCard;
}

export type QuickAddStage = "deck" | "group" | "card";

/** Lỗi của một bước, để giao diện gắn lỗi vào đúng ô (tên bộ, tên nhóm hay khung chung). */
export class QuickAddError extends Error {
  readonly stage: QuickAddStage;
  readonly error: DeckApiError;

  constructor(stage: QuickAddStage, error: DeckApiError) {
    super(`quick add failed at ${stage}`);
    this.stage = stage;
    this.error = error;
  }
}

async function step<T>(stage: QuickAddStage, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw new QuickAddError(stage, error as DeckApiError);
  }
}

/**
 * Tạo bộ rồi nhóm (nếu chọn mới) rồi thêm thẻ. Thêm thẻ thất bại (từ đã có, nghĩa không còn…) thì gỡ bộ và nhóm vừa tạo
 * trong lần này để không để lại bộ hoặc nhóm trống; gỡ lỗi thì bỏ qua vì thẻ chưa được thêm.
 */
export async function runQuickAdd(plan: QuickAddPlan): Promise<QuickAddResult> {
  let deckId = "id" in plan.deck ? plan.deck.id : null;
  let createdDeck = false;
  let createdGroup: string | null = null;
  const rollback = async () => {
    if (createdDeck && deckId) await myDecksApi.remove(deckId).catch(() => undefined);
    else if (createdGroup && deckId) await deckContentApi.deleteGroup(deckId, createdGroup, "learner").catch(() => undefined);
  };

  if ("newName" in plan.deck) {
    const name = plan.deck.newName;
    deckId = (await step("deck", () => myDecksApi.create(name))).id;
    createdDeck = true;
  }
  if (!deckId) throw new Error("deck missing");

  let groupId = "id" in plan.group ? plan.group.id : null;
  if ("newName" in plan.group) {
    const name = plan.group.newName;
    const target = deckId;
    try {
      groupId = (await step("group", () => deckContentApi.addGroup(target, name, "learner"))).id;
    } catch (error) {
      await rollback();
      throw error;
    }
    createdGroup = groupId;
  }
  if (!groupId) throw new Error("group missing");

  try {
    const target = { deckId, groupId };
    const card = await step("card", () =>
      myDecksApi.addFromDictionary(target.deckId, target.groupId, {
        headword: plan.headword,
        meaningNo: plan.meaningNo,
        sentenceId: plan.sentenceId,
      }),
    );
    return { ...target, card };
  } catch (error) {
    await rollback();
    throw error;
  }
}

/** Kết quả một lần thêm thất bại, để khung hiện đúng lời nhắn. */
export type QuickAddFailure =
  | { kind: "deckName"; error: MyDeckNameError }
  | { kind: "groupName"; error: "NotBlank" | "Size" | "Duplicate" }
  /** Bộ đã có thẻ cùng từ vựng; `groupName` là nhóm đang chứa nó (BR-HT-26). */
  | { kind: "taken"; groupName: string }
  /** Nghĩa không còn trong từ điển. */
  | { kind: "meaningGone" }
  /** Không có quyền với bài học của câu. */
  | { kind: "forbidden" }
  /** Bộ, nhóm hoặc câu không còn: tải lại danh sách. */
  | { kind: "gone" }
  | { kind: "retry" };

export function quickAddFailure(failure: unknown): QuickAddFailure {
  if (!(failure instanceof QuickAddError)) return { kind: "retry" };
  const { stage, error } = failure;
  if (stage === "deck") {
    const mapped = myDeckFailure(error);
    return mapped.kind === "name" ? { kind: "deckName", error: mapped.error } : { kind: "retry" };
  }
  if (stage === "group") {
    if (error.code === "VOCAB_GROUP_NAME_TAKEN") return { kind: "groupName", error: "Duplicate" };
    const field = error.fieldErrors.find((item) => item.field === "name");
    if (field) return { kind: "groupName", error: field.code === "Size" ? "Size" : "NotBlank" };
    return error.kind === "notFound" ? { kind: "gone" } : { kind: "retry" };
  }
  if (error.code === "VOCAB_CARD_WORD_TAKEN") {
    return { kind: "taken", groupName: String(error.details?.groupName ?? "") };
  }
  if (error.code === "VOCAB_MEANING_NOT_FOUND") return { kind: "meaningGone" };
  if (error.kind === "forbidden") return { kind: "forbidden" };
  if (error.kind === "notFound") return { kind: "gone" };
  return { kind: "retry" };
}
