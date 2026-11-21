package com.lingualoop.backend.aichat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.aichat.LessonChatAi.Generated;
import com.lingualoop.backend.aichat.LessonChatAi.Line;
import com.lingualoop.backend.aichat.LessonChatAi.Reply;
import com.lingualoop.backend.aichat.LessonChatRepository.ConversationRow;
import com.lingualoop.backend.aichat.LessonChatRepository.LessonRow;
import com.lingualoop.backend.aichat.LessonChatRepository.MessageRow;
import com.lingualoop.backend.aichat.LessonChatRepository.SentenceRow;
import com.lingualoop.backend.aichat.LessonChatView.Clip;
import com.lingualoop.backend.aichat.LessonChatView.Credit;
import com.lingualoop.backend.aichat.LessonChatView.HistoryItem;
import com.lingualoop.backend.aichat.LessonChatView.Hint;
import com.lingualoop.backend.aichat.LessonChatView.Limits;
import com.lingualoop.backend.aichat.LessonChatView.LiveStart;
import com.lingualoop.backend.aichat.LessonChatView.Message;
import com.lingualoop.backend.aichat.LessonChatView.Session;
import com.lingualoop.backend.aichat.LessonChatView.Turn;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.CreditProperties;
import com.lingualoop.backend.credit.AiFeature;
import com.lingualoop.backend.credit.CreditService;
import com.lingualoop.backend.credit.dto.CreditBalance;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;
import com.lingualoop.backend.tutor.LiveTokenIssuer;
import com.lingualoop.backend.tutor.LiveTokenIssuer.LiveToken;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Hai chế độ của một phiên. Giọng nói (Gemini Live): trình duyệt nói chuyện thẳng với Gemini, server cấp token, ghi lại
 * câu hỏi, câu trả lời và nhận xét do gia sư báo qua tool, và trừ credit cố định một lần khi gia sư nói câu đầu. Chat chữ
 * (dự phòng khi không dùng được micro hoặc Live): mỗi lượt một lần gọi Gemini, trừ theo token. Cố ý không có
 * {@code @Transactional} ở đây để lời gọi Gemini không giữ kết nối DB; các lần ghi nhiều câu lệnh nằm trong
 * {@link LessonChatRepository}. Credit chỉ chặn lúc bắt đầu (BR-AI-10) và việc trừ không để ví âm (BR-GA-06).
 */
@Slf4j
@Service
@RequiredArgsConstructor
class LessonChatServiceImpl implements LessonChatService {

    /** Số câu hỏi tối đa của một phiên (BR-AI-11). */
    static final int MAX_QUESTIONS = 5;
    /** Thời lượng tối đa của một phiên (BR-AI-11). */
    static final Duration MAX_DURATION = Duration.ofMinutes(15);
    /** Độ dài câu trả lời gõ chữ sau khi bỏ khoảng trắng hai đầu (BR-AI-06). */
    static final int MAX_TEXT_LENGTH = 1000;
    /** Giới hạn lời nhắc phiên giọng nói: nhắc chốt lại khi còn một phút. */
    static final int WRAP_UP_AT_SECONDS = 14 * 60;
    static final int START_TIMEOUT_SECONDS = 15;
    static final int IDLE_ASK_SECONDS = 60;
    static final int IDLE_END_SECONDS = 90;
    private static final int MAX_FEEDBACK_LENGTH = 2000;
    private static final int MAX_BETTER_LENGTH = 500;
    private static final int MAX_QUESTION_LENGTH = 500;

    private static final AiFeature FEATURE = AiFeature.LESSON_CHAT;

    private final LessonChatRepository repository;
    private final LessonChatAi ai;
    private final CreditService credits;
    private final CreditProperties creditProperties;
    private final SubscriptionQueryService subscriptions;
    private final LiveTokenIssuer tokenIssuer;
    private final Clock clock;

    // ── Chế độ giọng nói ───────────────────────────────────────────────────────────

    @Override
    public LiveStart startLive(UUID userId, UUID lessonId, String styleName) {
        LessonRow lesson = requireLesson(userId, lessonId);
        LessonChatStyle style = LessonChatStyle.parse(styleName);
        credits.requireCanStart(userId, FEATURE);

        UUID conversationId = repository.startFresh(userId, lessonId, "live", style.dbValue());
        List<SentenceRow> sentences = repository.sentences(lessonId);
        LiveToken token;
        try {
            token = tokenIssuer.issueWith(LessonChatLive.spec(numbered(lesson, sentences), style, MAX_QUESTIONS));
        } catch (RuntimeException e) {
            log.warn("Không cấp được token Gemini Live cho phiên theo bài: {}", e.toString());
            repository.failUnlessCharged(conversationId);
            credits.logFailure(userId, FEATURE, false);
            throw new BusinessException(ErrorCode.AI_CHAT_LIVE_UNAVAILABLE);
        }
        return new LiveStart(conversationId, token.token(), token.model(), token.expiresAt(),
                new Limits(MAX_QUESTIONS, (int) MAX_DURATION.toSeconds(), WRAP_UP_AT_SECONDS, START_TIMEOUT_SECONDS,
                        IDLE_ASK_SECONDS, IDLE_END_SECONDS),
                creditProperties.lessonChatCost(), credits.balanceOf(userId), style.dbValue(), clips(sentences));
    }

    @Override
    public Credit liveStarted(UUID userId, UUID lessonId, UUID conversationId) {
        ConversationRow conversation = requireLive(userId, lessonId, conversationId);
        requireActive(conversation);
        int cost = creditProperties.lessonChatCost();
        if (conversation.charged()) {
            return new Credit(0, credits.balanceOf(userId));
        }
        CreditBalance wallet = credits.balanceOf(userId);
        if (wallet.balance() < cost) {
            // Hết lượt giữa lúc tạo phiên và lúc bắt đầu (vd hai tab): đóng phiên, không trừ
            repository.failUnlessCharged(conversationId);
            credits.logFailure(userId, FEATURE, true);
            throw new BusinessException(ErrorCode.QUOTA_EXCEEDED,
                    Map.of("feature", FEATURE.dbValue(), "balance", wallet.balance(), "cost", cost));
        }
        int charged = repository.claimCharge(conversationId) ? credits.chargeFixed(userId, FEATURE, cost) : 0;
        return new Credit(charged, credits.balanceOf(userId));
    }

    @Override
    public Session liveQuestion(UUID userId, UUID lessonId, UUID conversationId, String question) {
        ConversationRow conversation = requireLiveRunning(userId, lessonId, conversationId);
        // Gia sư đôi khi chép luôn số câu "[2]" của lời thoại đánh số vào câu hỏi: bỏ đi để không hiện cho học viên
        String text = clean(question == null ? null : question.replaceAll("\\s*\\[\\d{1,3}\\]", ""), MAX_QUESTION_LENGTH);
        if (text.isEmpty()) {
            throw new BusinessException(ErrorCode.AI_CHAT_ANSWER_INVALID, Map.of("reason", "empty"));
        }
        repository.addQuestion(conversation.id(), text, MAX_QUESTIONS);
        return detail(userId, lessonId, conversationId);
    }

    @Override
    public Session liveFeedback(UUID userId, UUID lessonId, UUID conversationId, String answer, String feedback,
            String better) {
        ConversationRow conversation = requireLiveRunning(userId, lessonId, conversationId);
        String said = clean(answer, MAX_TEXT_LENGTH);
        String comment = clean(feedback, MAX_FEEDBACK_LENGTH);
        if (said.isEmpty() || comment.isEmpty()) {
            throw new BusinessException(ErrorCode.AI_CHAT_ANSWER_INVALID, Map.of("reason", "empty"));
        }
        repository.addLiveAnswer(conversation.id(), said, comment, clean(better, MAX_BETTER_LENGTH));
        return detail(userId, lessonId, conversationId);
    }

    @Override
    public Turn liveFinish(UUID userId, UUID lessonId, UUID conversationId) {
        ConversationRow conversation = requireLive(userId, lessonId, conversationId);
        requireActive(conversation);
        List<MessageRow> messages = repository.messages(conversationId);
        if (answered(messages) >= 1) {
            LessonRow lesson = requireLesson(userId, lessonId);
            Generated<String> summary;
            try {
                summary = ai.summarize(context(lesson), lines(messages));
            } catch (RuntimeException e) {
                // Phiên vẫn mở để học viên bấm tạo lại nhận xét; câu trả lời đã lưu không mất
                credits.logFailure(userId, FEATURE, false);
                throw e;
            }
            repository.complete(conversationId, summary.value());
        } else {
            repository.complete(conversationId, null);
        }
        return turn(userId, lessonId, conversationId, 0, false);
    }

    // ── Chế độ chat chữ ────────────────────────────────────────────────────────────

    @Override
    public Turn start(UUID userId, UUID lessonId) {
        LessonRow lesson = requireLesson(userId, lessonId);
        credits.requireCanStart(userId, FEATURE);
        LessonChatAi.Lesson context = context(lesson);

        UUID conversationId = repository.startFresh(userId, lessonId, "text", LessonChatStyle.QA.dbValue());
        Generated<String> opening;
        try {
            opening = ai.open(context);
            repository.addTutorMessage(conversationId, opening.value());
        } catch (RuntimeException e) {
            // Không có câu hỏi nào đến tay học viên: đóng phiên ở trạng thái lỗi, không trừ credit (BR-AI-04)
            repository.fail(conversationId);
            credits.logFailure(userId, FEATURE, false);
            throw e;
        }
        return turn(userId, lessonId, conversationId, charge(userId, opening), false);
    }

    @Override
    public Turn answer(UUID userId, UUID lessonId, UUID conversationId, String text) {
        ConversationRow conversation = requireText(userId, lessonId, conversationId);
        requireActive(conversation);
        String answer = validate(text);
        LessonRow lesson = requireLesson(userId, lessonId);
        List<MessageRow> messages = repository.messages(conversationId);
        if (expired(conversation)) {
            return expire(userId, lesson, conversation, messages);
        }

        MessageRow question = messages.isEmpty() ? null : messages.get(messages.size() - 1);
        if (question == null || !question.tutor()) {
            throw new BusinessException(ErrorCode.AI_CHAT_TURN_CONFLICT);
        }
        boolean finalTurn = messages.stream().filter(MessageRow::tutor).count() >= MAX_QUESTIONS;
        LessonChatAi.Lesson context = context(lesson);

        Generated<Reply> reply;
        try {
            reply = ai.reply(context, lines(messages), answer, finalTurn);
        } catch (RuntimeException e) {
            credits.logFailure(userId, FEATURE, false);
            throw e;
        }
        Reply value = reply.value();
        repository.saveTurn(conversationId, question.id(), answer, value.feedback(), value.better(),
                finalTurn ? null : value.nextQuestion());
        int charged = charge(userId, reply);

        if (finalTurn) {
            try {
                charged += summarize(userId, context, conversationId, lines(repository.messages(conversationId)));
            } catch (RuntimeException e) {
                // Câu trả lời đã được lưu và tính tiền; nhận xét tổng quát tạo lại được bằng "Kết thúc"
                log.warn("Chưa tạo được nhận xét tổng quát cho cuộc trò chuyện {}: {}", conversationId, e.getMessage());
            }
        }
        return turn(userId, lessonId, conversationId, charged, false);
    }

    @Override
    public Turn finish(UUID userId, UUID lessonId, UUID conversationId) {
        ConversationRow conversation = requireText(userId, lessonId, conversationId);
        requireActive(conversation);
        List<MessageRow> messages = repository.messages(conversationId);
        if (answered(messages) < 1) {
            throw new BusinessException(ErrorCode.AI_CHAT_FINISH_TOO_EARLY);
        }
        LessonRow lesson = requireLesson(userId, lessonId);
        int charged;
        try {
            charged = summarize(userId, context(lesson), conversationId, lines(messages));
        } catch (RuntimeException e) {
            credits.logFailure(userId, FEATURE, false);
            throw e;
        }
        return turn(userId, lessonId, conversationId, charged, false);
    }

    // ── Dùng chung cho hai chế độ ──────────────────────────────────────────────────

    @Override
    public Hint hint(UUID userId, UUID lessonId, UUID conversationId) {
        ConversationRow conversation = requireOwned(userId, lessonId, conversationId);
        requireActive(conversation);
        if (expired(conversation)) {
            if ("text".equals(conversation.mode())) {
                repository.complete(conversationId, null);
            }
            // Phiên giọng nói hết giờ vẫn mở để học viên bấm kết thúc và nhận nhận xét tổng quát
            throw new BusinessException(ErrorCode.AI_CHAT_NOT_ACTIVE);
        }
        List<MessageRow> messages = repository.messages(conversationId);
        MessageRow question = messages.isEmpty() ? null : messages.get(messages.size() - 1);
        if (question == null || !question.tutor()) {
            throw new BusinessException(ErrorCode.AI_CHAT_TURN_CONFLICT);
        }
        if (question.hint() != null) {
            return new Hint(question.hint(), true);
        }
        LessonRow lesson = requireLesson(userId, lessonId);
        Generated<String> generated = ai.hint(context(lesson), lines(messages));
        String stored = repository.saveHint(conversationId, question.id(), generated.value());
        // Gợi ý không trừ credit (BR-AI-08); yêu cầu đến trước đã lưu bản khác thì trả bản đó
        return new Hint(stored, !stored.equals(generated.value()));
    }

    @Override
    public List<HistoryItem> history(UUID userId, UUID lessonId) {
        return repository.history(userId, lessonId).stream()
                .map(row -> new HistoryItem(row.id(), row.status(), row.startedAt(), row.endedAt(), row.answered(),
                        row.hasSummary()))
                .toList();
    }

    @Override
    public Session detail(UUID userId, UUID lessonId, UUID conversationId) {
        ConversationRow conversation = requireOwned(userId, lessonId, conversationId);
        return session(conversation, repository.messages(conversationId));
    }

    // ── Điều kiện vào ──────────────────────────────────────────────────────────────

    private LessonRow requireLesson(UUID userId, UUID lessonId) {
        LessonRow lesson = repository.findLesson(userId, lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
        if (lesson.pro() && !subscriptions.isPro(userId)) {
            throw new BusinessException(ErrorCode.LESSON_PRO_REQUIRED);
        }
        return lesson;
    }

    /** Cuộc trò chuyện của người khác hay của bài khác đều báo không tìm thấy (BR-AI-03). */
    private ConversationRow requireOwned(UUID userId, UUID lessonId, UUID conversationId) {
        return repository.findOwned(userId, lessonId, conversationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AI_CHAT_NOT_FOUND));
    }

    private ConversationRow requireLive(UUID userId, UUID lessonId, UUID conversationId) {
        ConversationRow conversation = requireOwned(userId, lessonId, conversationId);
        if (!"live".equals(conversation.mode())) {
            throw new BusinessException(ErrorCode.AI_CHAT_NOT_FOUND);
        }
        return conversation;
    }

    private ConversationRow requireText(UUID userId, UUID lessonId, UUID conversationId) {
        ConversationRow conversation = requireOwned(userId, lessonId, conversationId);
        if (!"text".equals(conversation.mode())) {
            throw new BusinessException(ErrorCode.AI_CHAT_NOT_FOUND);
        }
        return conversation;
    }

    /** Phiên giọng nói đang chạy: còn mở, đã bắt đầu (đã trừ credit) và chưa quá 15 phút. */
    private ConversationRow requireLiveRunning(UUID userId, UUID lessonId, UUID conversationId) {
        ConversationRow conversation = requireLive(userId, lessonId, conversationId);
        requireActive(conversation);
        if (!conversation.charged() || expired(conversation)) {
            throw new BusinessException(ErrorCode.AI_CHAT_NOT_ACTIVE);
        }
        return conversation;
    }

    private static void requireActive(ConversationRow conversation) {
        if (!"active".equals(conversation.status())) {
            throw new BusinessException(ErrorCode.AI_CHAT_NOT_ACTIVE);
        }
    }

    /** Câu trả lời gõ chữ hợp lệ theo BR-AI-06; kiểm trước khi gọi AI để lỗi không tốn gì. */
    private static String validate(String text) {
        if (text == null || text.isBlank()) {
            throw new BusinessException(ErrorCode.AI_CHAT_ANSWER_INVALID, Map.of("reason", "empty"));
        }
        String trimmed = text.strip();
        if (trimmed.codePointCount(0, trimmed.length()) > MAX_TEXT_LENGTH) {
            throw new BusinessException(ErrorCode.AI_CHAT_ANSWER_INVALID, Map.of("reason", "too_long"));
        }
        return trimmed;
    }

    /** Chuỗi do AI báo qua tool: bỏ khoảng trắng hai đầu và cắt theo số ký tự thay vì từ chối. */
    private static String clean(String value, int max) {
        if (value == null) {
            return "";
        }
        String trimmed = value.strip();
        if (trimmed.codePointCount(0, trimmed.length()) <= max) {
            return trimmed;
        }
        return trimmed.substring(0, trimmed.offsetByCodePoints(0, max));
    }

    private boolean expired(ConversationRow conversation) {
        return !clock.instant().isBefore(conversation.startedAt().plus(MAX_DURATION));
    }

    // ── Kết thúc ───────────────────────────────────────────────────────────────────

    /** Quá 15 phút: câu trả lời không được nhận; có ít nhất một câu thì tạo nhận xét tổng quát, không thì đóng trơn. */
    private Turn expire(UUID userId, LessonRow lesson, ConversationRow conversation, List<MessageRow> messages) {
        int charged = 0;
        if (answered(messages) >= 1) {
            try {
                charged = summarize(userId, context(lesson), conversation.id(), lines(messages));
            } catch (RuntimeException e) {
                log.warn("Hết giờ nhưng chưa tạo được nhận xét tổng quát cho {}: {}", conversation.id(), e.getMessage());
            }
        }
        repository.complete(conversation.id(), null);
        return turn(userId, lesson.id(), conversation.id(), charged, true);
    }

    /** Tạo nhận xét tổng quát, đóng phiên rồi trừ credit; phiên đã được yêu cầu khác đóng trước thì không trừ lại. */
    private int summarize(UUID userId, LessonChatAi.Lesson context, UUID conversationId, List<Line> history) {
        Generated<String> summary = ai.summarize(context, history);
        return repository.complete(conversationId, summary.value()) ? charge(userId, summary) : 0;
    }

    // ── Dựng kết quả ───────────────────────────────────────────────────────────────

    private int charge(UUID userId, Generated<?> generated) {
        return credits.charge(userId, FEATURE, generated.inputTokens(), generated.outputTokens());
    }

    private Turn turn(UUID userId, UUID lessonId, UUID conversationId, int charged, boolean expired) {
        ConversationRow conversation = requireOwned(userId, lessonId, conversationId);
        return new Turn(session(conversation, repository.messages(conversationId)),
                new Credit(charged, credits.balanceOf(userId)), expired);
    }

    private Session session(ConversationRow conversation, List<MessageRow> messages) {
        int answered = answered(messages);
        Instant expiresAt = conversation.startedAt().plus(MAX_DURATION);
        boolean awaitingSummary = "active".equals(conversation.status()) && answered >= MAX_QUESTIONS;
        return new Session(conversation.id(), conversation.mode(), conversation.style(), conversation.status(), conversation.startedAt(),
                conversation.endedAt(), expiresAt, answered, MAX_QUESTIONS, awaitingSummary, conversation.summary(),
                messages.stream()
                        .map(m -> new Message(m.id(), m.tutor() ? "tutor" : "student", m.content(), m.feedback(),
                                m.better(), m.hint(), m.voice(), m.createdAt()))
                        .toList());
    }

    private static int answered(List<MessageRow> messages) {
        return (int) messages.stream().filter(m -> !m.tutor()).count();
    }

    private static List<Line> lines(List<MessageRow> messages) {
        return messages.stream().map(m -> new Line(m.tutor(), m.content())).toList();
    }

    /** Lời thoại đánh số từ 1 để gia sư gọi {@code play_clip} đúng câu; cùng thứ tự với {@link #clips}. */
    private static LessonChatAi.Lesson numbered(LessonRow lesson, List<SentenceRow> sentences) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < sentences.size(); i++) {
            out.append('[').append(i + 1).append("] ").append(sentences.get(i).text()).append('\n');
        }
        return new LessonChatAi.Lesson(lesson.title(), lesson.cefrLevel(), out.toString().stripTrailing());
    }

    private static List<Clip> clips(List<SentenceRow> sentences) {
        return java.util.stream.IntStream.range(0, sentences.size())
                .mapToObj(i -> new Clip(i + 1, sentences.get(i).startMs(), sentences.get(i).endMs()))
                .toList();
    }

    private LessonChatAi.Lesson context(LessonRow lesson) {
        return new LessonChatAi.Lesson(lesson.title(), lesson.cefrLevel(), repository.transcript(lesson.id()));
    }
}
