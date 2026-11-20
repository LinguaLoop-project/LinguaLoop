package com.lingualoop.backend.aichat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.aichat.LessonChatAi.Answer;
import com.lingualoop.backend.aichat.LessonChatAi.Generated;
import com.lingualoop.backend.aichat.LessonChatAi.Line;
import com.lingualoop.backend.aichat.LessonChatAi.Reply;
import com.lingualoop.backend.aichat.LessonChatRepository.ConversationRow;
import com.lingualoop.backend.aichat.LessonChatRepository.LessonRow;
import com.lingualoop.backend.aichat.LessonChatRepository.MessageRow;
import com.lingualoop.backend.aichat.LessonChatView.Credit;
import com.lingualoop.backend.aichat.LessonChatView.HistoryItem;
import com.lingualoop.backend.aichat.LessonChatView.Hint;
import com.lingualoop.backend.aichat.LessonChatView.Message;
import com.lingualoop.backend.aichat.LessonChatView.Session;
import com.lingualoop.backend.aichat.LessonChatView.Turn;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.credit.AiFeature;
import com.lingualoop.backend.credit.CreditService;
import com.lingualoop.backend.shadowing.service.WavAudio;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Luồng mỗi lượt: kiểm quyền và dữ liệu vào → nhờ AI → lưu → trừ credit theo token. Cố ý không có {@code @Transactional}
 * ở đây để lời gọi Gemini không giữ kết nối DB; các lần ghi nhiều câu lệnh nằm trong {@link LessonChatRepository}.
 * Credit chỉ chặn lúc bắt đầu (BR-AI-10): đã vào phiên thì các lượt sau vẫn chạy và việc trừ không để ví âm (BR-GA-06).
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

    private static final AiFeature FEATURE = AiFeature.LESSON_CHAT;

    private final LessonChatRepository repository;
    private final LessonChatAi ai;
    private final CreditService credits;
    private final SubscriptionQueryService subscriptions;
    private final Clock clock;

    @Override
    public Turn start(UUID userId, UUID lessonId) {
        LessonRow lesson = requireLesson(userId, lessonId);
        credits.requireCanStart(userId, FEATURE);
        LessonChatAi.Lesson context = context(lesson);

        UUID conversationId = repository.startFresh(userId, lessonId);
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
    public Session active(UUID userId, UUID lessonId) {
        ConversationRow conversation = repository.findActive(userId, lessonId).orElse(null);
        if (conversation == null) {
            return null;
        }
        if (expired(conversation)) {
            // Học viên bỏ đi giữa chừng: đóng lại, không tạo nhận xét (không ai đang chờ, đỡ tốn credit)
            repository.complete(conversation.id(), null);
            return null;
        }
        return session(conversation, repository.messages(conversation.id()));
    }

    @Override
    public Turn answer(UUID userId, UUID lessonId, UUID conversationId, String text, byte[] wav) {
        ConversationRow conversation = requireOwned(userId, lessonId, conversationId);
        requireActive(conversation);
        Answer answer = validate(text, wav);
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
        if (!value.heard()) {
            // Không nghe thấy lời nói: không lưu, không tính lượt, không trừ credit (AC-AI-10)
            throw new BusinessException(ErrorCode.AI_CHAT_NO_SPEECH);
        }
        repository.saveTurn(conversationId, question.id(), value.transcript(), answer.voice(), value.feedback(),
                value.better(), finalTurn ? null : value.nextQuestion());
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
    public Hint hint(UUID userId, UUID lessonId, UUID conversationId) {
        ConversationRow conversation = requireOwned(userId, lessonId, conversationId);
        requireActive(conversation);
        if (expired(conversation)) {
            repository.complete(conversationId, null);
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
    public Turn finish(UUID userId, UUID lessonId, UUID conversationId) {
        ConversationRow conversation = requireOwned(userId, lessonId, conversationId);
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

    private static void requireActive(ConversationRow conversation) {
        if (!"active".equals(conversation.status())) {
            throw new BusinessException(ErrorCode.AI_CHAT_NOT_ACTIVE);
        }
    }

    /** Đúng một trong chữ hoặc bản ghi, hợp lệ theo BR-AI-06; kiểm trước khi gọi AI để lỗi không tốn gì. */
    private static Answer validate(String text, byte[] wav) {
        boolean hasText = text != null && !text.isBlank();
        boolean hasWav = wav != null && wav.length > 0;
        if (hasText == hasWav) {
            throw new BusinessException(ErrorCode.AI_CHAT_ANSWER_INVALID, Map.of("reason", hasText ? "both" : "empty"));
        }
        if (hasText) {
            String trimmed = text.strip();
            if (trimmed.codePointCount(0, trimmed.length()) > MAX_TEXT_LENGTH) {
                throw new BusinessException(ErrorCode.AI_CHAT_ANSWER_INVALID, Map.of("reason", "too_long"));
            }
            return Answer.ofText(trimmed);
        }
        try {
            WavAudio.parse(wav);
        } catch (BusinessException e) {
            throw new BusinessException(ErrorCode.AI_CHAT_ANSWER_INVALID, Map.of("reason", "audio"));
        }
        return Answer.ofVoice(wav);
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
        return new Session(conversation.id(), conversation.status(), conversation.startedAt(), conversation.endedAt(),
                expiresAt, answered, MAX_QUESTIONS, awaitingSummary, conversation.summary(),
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

    private LessonChatAi.Lesson context(LessonRow lesson) {
        return new LessonChatAi.Lesson(lesson.title(), lesson.cefrLevel(), repository.transcript(lesson.id()));
    }
}
