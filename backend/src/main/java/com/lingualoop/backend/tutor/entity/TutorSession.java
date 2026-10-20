package com.lingualoop.backend.tutor.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.lingualoop.backend.tutor.AttemptTarget;
import com.lingualoop.backend.tutor.SessionOutcome;
import com.lingualoop.backend.tutor.TutorThresholds;
import com.lingualoop.backend.tutor.WordStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Một Phiên gia sư về một câu: trạng thái từng từ, số Lượt chấm, đếm lạc đề, thời điểm bắt đầu và kết thúc. Mọi chuyển
 * trạng thái đi qua các phương thức ở đây; lớp dịch vụ phải khoá dòng (khoá bi quan) trước khi gọi để hai yêu cầu
 * đồng thời không ghi chồng nhau. Thông báo của {@link IllegalStateException} là chỉ dẫn gửi cho gia sư.
 */
@Getter
@Entity
@Table(name = "tutor_sessions")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TutorSession {

    /** Từ cần thêm vào phiên: Danh sách từ lỗi lúc tạo, hoặc từ người học tự chọn. */
    public record WordSeed(String word, String key, Short focusPhonemeId, double scoreBefore) {
    }

    /** Kết quả ghi một Lượt chấm từ. */
    public record WordAttempt(TutorSessionWord word, int attemptNumber, boolean passed,
            Optional<TutorSessionWord> nextPending) {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "attempt_id", nullable = false, updatable = false)
    private Long attemptId;

    @Column(name = "offer_id", updatable = false)
    private UUID offerId;

    @Column(name = "live_model", updatable = false)
    private String liveModel;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Convert(converter = TutorConverters.Outcome.class)
    @Column(name = "outcome")
    private SessionOutcome outcome;

    @Column(name = "current_word_key")
    private String currentWordKey;

    @Column(name = "off_topic_streak", nullable = false)
    private Short offTopicStreak = 0;

    @Column(name = "sentence_tries", nullable = false)
    private Short sentenceTries = 0;

    @Column(name = "charged", nullable = false)
    private boolean charged;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("position")
    private List<TutorSessionWord> words = new ArrayList<>();

    /** @param seeds Danh sách từ lỗi theo thứ tự; từ đầu tiên là Từ đang luyện. Có thể rỗng. */
    public static TutorSession open(UUID userId, long attemptId, UUID offerId, String liveModel, Instant now,
            List<WordSeed> seeds) {
        TutorSession session = new TutorSession();
        session.userId = userId;
        session.attemptId = attemptId;
        session.offerId = offerId;
        session.liveModel = liveModel;
        session.createdAt = now;
        for (WordSeed seed : seeds) {
            session.addWordIfAbsent(seed);
        }
        session.currentWordKey = session.words.isEmpty() ? null : session.words.get(0).getWordKey();
        return session;
    }

    // --- vòng đời ---

    /** Gia sư chưa nói câu đầu tiên sau START_TIMEOUT_SECONDS thì phiên là "không kết nối được". */
    public void expireIfNotStarted(Instant now) {
        Instant deadline = createdAt.plusSeconds(TutorThresholds.START_TIMEOUT_SECONDS);
        if (startedAt == null && outcome == null && !now.isBefore(deadline)) {
            end(SessionOutcome.CONNECT_FAILED, deadline);
        }
    }

    /** @return true nếu đây là lần đầu báo đã bắt đầu (lúc đó dịch vụ mới trừ lượt) */
    public boolean markStarted(Instant now) {
        ensureOpen();
        if (startedAt != null) {
            return false;
        }
        startedAt = now;
        return true;
    }

    /** Ghi nhận đã trừ lượt hạn mức; chỉ hợp lệ sau khi đã bắt đầu. */
    public void markCharged() {
        if (startedAt == null) {
            throw new IllegalStateException("Phiên chưa bắt đầu nên chưa thể trừ lượt.");
        }
        charged = true;
    }

    public boolean open() {
        return outcome == null;
    }

    public void ensureOpen() {
        if (outcome != null) {
            throw new IllegalStateException("Phiên gia sư đã kết thúc (" + outcome + ").");
        }
    }

    public void end(SessionOutcome outcome, Instant now) {
        ensureOpen();
        this.outcome = outcome;
        this.endedAt = now;
    }

    // --- từ luyện ---

    public Optional<TutorSessionWord> currentWord() {
        return currentWordKey == null ? Optional.empty() : wordOf(currentWordKey);
    }

    public Optional<TutorSessionWord> wordOf(String key) {
        return words.stream().filter(w -> w.getWordKey().equals(key)).findFirst();
    }

    /**
     * Chuyển sang luyện một từ (thêm mới từ {@code seedIfMissing} nếu chưa có trong danh sách). Quay lại từ đã hết lượt
     * hoặc đã đạt thì được số Lượt chấm mới; từ đang dở thì giữ nguyên số lượt để đổi qua đổi lại không lách được giới
     * hạn.
     */
    public TutorSessionWord switchTo(String key, java.util.function.Supplier<WordSeed> seedIfMissing) {
        ensureOpen();
        TutorSessionWord word = wordOf(key).orElseGet(() -> addWordIfAbsent(seedIfMissing.get()));
        if (word.getAttempts() >= TutorThresholds.MAX_ATTEMPTS_PER_WORD || word.getStatus() != WordStatus.PENDING) {
            word.restart();
        }
        currentWordKey = word.getWordKey();
        return word;
    }

    /**
     * Kiểm tra còn được chấm trước khi tốn một lần gọi Azure.
     *
     * @return Từ đang luyện khi chấm từ; null khi chấm cả câu
     */
    public TutorSessionWord prepareAttempt(AttemptTarget target) {
        ensureOpen();
        if (target == AttemptTarget.SENTENCE) {
            if (sentenceTries >= TutorThresholds.MAX_SENTENCE_ATTEMPTS) {
                throw new IllegalStateException("Đã hết " + TutorThresholds.MAX_SENTENCE_ATTEMPTS
                        + " lượt chấm cả câu. Chuyển sang luyện từ hoặc kết thúc phiên.");
            }
            return null;
        }
        TutorSessionWord current = currentWord().orElseThrow(() -> new IllegalStateException(
                "Chưa có từ đang luyện. Hãy gọi switch_word(word=...) để chọn một từ trong câu."));
        if (current.getAttempts() >= TutorThresholds.MAX_ATTEMPTS_PER_WORD) {
            throw new IllegalStateException("Từ \"" + current.getWord() + "\" đã hết "
                    + TutorThresholds.MAX_ATTEMPTS_PER_WORD + " lượt chấm. Hỏi người học muốn sang từ khác "
                    + "(gọi switch_word) hay luyện lại từ này (cũng gọi switch_word với chính từ đó).");
        }
        return current;
    }

    /** Ghi một Lượt chấm cho Từ đang luyện. */
    public WordAttempt recordWordAttempt(double score) {
        TutorSessionWord current = prepareAttempt(AttemptTarget.WORD);
        int attemptNumber = current.getAttempts() + 1;
        boolean passed = score >= TutorThresholds.PASS_SCORE;
        WordStatus status = passed ? WordStatus.PASSED
                : attemptNumber >= TutorThresholds.MAX_ATTEMPTS_PER_WORD && current.getStatus() != WordStatus.PASSED
                        ? WordStatus.NEEDS_PRACTICE : current.getStatus();
        current.recordAttempt(score, status);
        return new WordAttempt(current, attemptNumber, passed, firstPending(current.getWordKey()));
    }

    /** Ghi một Lượt chấm cả câu; không ảnh hưởng Kết quả từng từ. */
    public int recordSentenceAttempt() {
        prepareAttempt(AttemptTarget.SENTENCE);
        sentenceTries = (short) (sentenceTries + 1);
        return sentenceTries;
    }

    /** Từ đầu tiên chưa luyện, bỏ qua {@code excludeKey} (có thể null). */
    public Optional<TutorSessionWord> firstPending(String excludeKey) {
        return words.stream()
                .filter(w -> w.getStatus() == WordStatus.PENDING && !w.getWordKey().equals(excludeKey))
                .findFirst();
    }

    // --- chủ đề ---

    /** @return số Lượt lạc đề liên tiếp sau lượt này (0 khi lượt này đúng chủ đề) */
    public int logTopic(boolean onTopic) {
        ensureOpen();
        offTopicStreak = onTopic ? 0 : (short) (offTopicStreak + 1);
        return offTopicStreak;
    }

    private TutorSessionWord addWordIfAbsent(WordSeed seed) {
        Optional<TutorSessionWord> existing = wordOf(seed.key());
        if (existing.isPresent()) {
            return existing.get();
        }
        TutorSessionWord word = new TutorSessionWord(this, words.size(), seed.word(), seed.key(),
                seed.focusPhonemeId(), seed.scoreBefore());
        words.add(word);
        return word;
    }
}
