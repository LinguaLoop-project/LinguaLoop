/** Giá trị enum backend gửi ở dạng chữ thường, khớp với tham số tool của gia sư (xem TutorDtos ở backend). */
export type AttemptTarget = "word" | "sentence";
export type TopicCategory = "on_topic" | "off_topic";
export type SessionOutcome = "completed" | "learner_exit" | "off_topic" | "idle" | "timeout" | "connect_failed";
export type NextStep = "retry_word" | "next_word" | "sentence" | "end";
export type WordStatus = "pending" | "passed" | "needs_practice";

/** Từ luyện do backend xếp vào Danh sách từ lỗi. */
export type PracticeWord = {
  word: string;
  /** null khi từ bị Azure bỏ sót (không có âm vị). */
  phoneme: string | null;
  score: number;
  tipVi: string | null;
};

/** Tiến độ một từ trong phiên, dùng cho các chip. */
export type WordView = {
  word: string;
  phoneme: string | null;
  /** Điểm trước khi luyện. */
  baseline: number;
  /** Điểm tốt nhất trong các Lượt chấm; undefined khi chưa chấm. */
  best?: number;
  attempts: number;
  status: WordStatus;
  tipVi?: string;
};

export type TutorLimits = {
  maxSeconds: number;
  wrapUpAtSeconds: number;
  startTimeoutSeconds: number;
  maxAttemptsPerWord: number;
  maxSentenceAttempts: number;
  idleAskSeconds: number;
  idleEndSeconds: number;
  offTopicEndStreak: number;
};

export type CreatedSession = {
  sessionId: string;
  token: string;
  model: string;
  tokenExpiresAt: string;
  words: WordView[];
  /** Vắng khi câu đọc tốt (Danh sách từ lỗi rỗng). */
  currentWord?: string;
  limits: TutorLimits;
};

export type SwitchResult = {
  currentWord: WordView;
  attemptsLeft: number;
  /** Chuyển nguyên cho gia sư làm kết quả tool switch_word. */
  instruction: string;
  words: WordView[];
};

export type AttemptResult = {
  attemptNumber: number;
  target: AttemptTarget;
  word?: string;
  score: number;
  accuracyScore: number;
  passed: boolean;
  wordStatus?: WordStatus;
  nextStep: NextStep;
  /** Từ gia sư vừa được chuyển sang (Từ đang luyện mới). */
  nextWord?: string;
  /** Có giá trị khi backend đã kết thúc phiên (đọc cả câu xong, hết danh sách). */
  outcome?: SessionOutcome;
  /** Chuyển nguyên cho gia sư làm kết quả tool request_retry. */
  instruction: string;
  words: WordView[];
};

export type TopicResult = {
  offTopicStreak?: number;
  ended?: boolean;
  instruction?: string;
  outcome?: SessionOutcome;
};

export type OfferResult = {
  offer: boolean;
  /** Lý do viết hoa, ví dụ LOW_WORD_SCORE, COOLDOWN. */
  reason: string;
  offerId?: string;
  words?: PracticeWord[];
};

export type LessonEvent = "start_on" | "start_off" | "toggle_on" | "toggle_off";

/** Một lượt hội thoại hiện trên màn hình; không lưu và không gửi lên server (BR-TUTOR-09). */
export type TutorTurn = {
  id: number;
  role: "tutor" | "learner";
  text: string;
};

/** Tóm tắt một Phiên gia sư để bài học ghi lại. */
export type TutorSummary = {
  outcome: SessionOutcome;
  /** Tiến độ các từ trong phiên; chỉ từ có attempts > 0 là đã luyện. */
  words: WordView[];
};

/** Lời nhắn tạm thời cho người học; giao diện dịch theo mã. `server` là câu do backend trả, hiện nguyên văn. */
export type TutorNotice =
  | { code: "pickWord" }
  | { code: "wordOutOfAttempts"; word: string; max: number }
  | { code: "holdTooShort" }
  | { code: "switchFailed" }
  | { code: "server"; message: string };
