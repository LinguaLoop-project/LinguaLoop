/** Khớp với DTO backend (feature dictionary, `/api/v1/dictionary/**`, record `WordView`). Đổi DTO thì đổi cả file này. */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export type Accent = "us" | "uk";

export interface Pronunciation {
  ipaUk: string | null;
  ipaUs: string | null;
  audioUk: string | null;
  audioUs: string | null;
}

export interface Meaning {
  /** Số thứ tự nghĩa trong từ, dùng khi lưu nghĩa riêng. */
  no: number;
  translationVi: string | null;
  exampleEn: string | null;
  exampleVi: string | null;
}

export interface MeaningGroup {
  /** Loại từ (noun, verb...); null nếu nguồn không ghi. */
  pos: string | null;
  /** Đã chọn sẵn: ghi đè theo loại từ nếu có, không thì phát âm chung của từ. */
  pronunciation: Pronunciation;
  meanings: Meaning[];
}

export interface WordView {
  headword: string;
  cefrLevel: string | null;
  pronunciation: Pronunciation;
  groups: MeaningGroup[];
  /** Từ gốc khi từ này là dạng chia ("went" -> "go"). Có thể có cả nghĩa riêng lẫn từ gốc. Chỉ một cấp. */
  lemma: WordView | null;
}
