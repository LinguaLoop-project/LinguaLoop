package com.lingualoop.backend.tutor;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.google.genai.Client;
import com.google.genai.types.AudioTranscriptionConfig;
import com.google.genai.types.AuthToken;
import com.google.genai.types.Content;
import com.google.genai.types.CreateAuthTokenConfig;
import com.google.genai.types.FunctionDeclaration;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.LiveConnectConfig;
import com.google.genai.types.LiveConnectConstraints;
import com.google.genai.types.Modality;
import com.google.genai.types.Part;
import com.google.genai.types.PrebuiltVoiceConfig;
import com.google.genai.types.Schema;
import com.google.genai.types.SpeechConfig;
import com.google.genai.types.Tool;
import com.google.genai.types.Type;
import com.google.genai.types.VoiceConfig;
import com.lingualoop.backend.config.GeminiLiveProperties;
import com.lingualoop.backend.config.GeminiProperties;

import lombok.extern.slf4j.Slf4j;

/**
 * Cấp ephemeral token Gemini Live (API v1alpha). Token dùng một lần, khoá model, system prompt, tools và cấu hình
 * transcript để người dùng không sửa được.
 */
@Slf4j
@Component("geminiLiveTokenIssuer")
class GeminiLiveTokenIssuer implements LiveTokenIssuer {

    /** Thời gian để trình duyệt mở kết nối bằng token. */
    private static final Duration NEW_SESSION_WINDOW = Duration.ofMinutes(1);

    /** Thời hạn token, đủ cho trần 10 phút của phiên kèm thời gian chờ Azure chấm (ADR 0003). */
    private static final Duration TOKEN_LIFETIME = Duration.ofMinutes(12);

    private final GeminiProperties gemini;
    private final GeminiLiveProperties live;
    private final Clock clock;
    private Client client;

    GeminiLiveTokenIssuer(GeminiProperties gemini, GeminiLiveProperties live, Clock clock) {
        this.gemini = gemini;
        this.live = live;
        this.clock = clock;
    }

    @Override
    public LiveToken issue(String systemPrompt) {
        Instant now = clock.instant();
        Instant expiresAt = now.plus(TOKEN_LIFETIME);

        CreateAuthTokenConfig config = CreateAuthTokenConfig.builder()
                .uses(1)
                .expireTime(expiresAt)
                .newSessionExpireTime(now.plus(NEW_SESSION_WINDOW))
                .liveConnectConstraints(LiveConnectConstraints.builder()
                        .model(live.model())
                        .config(liveConfig(systemPrompt)))
                .lockAdditionalFields(List.of())
                .build();

        AuthToken token = client().authTokens.create(config);
        String name = token.name().orElseThrow(() -> new IllegalStateException("Gemini không trả về token."));
        log.info("Đã cấp token Gemini Live cho model {}", live.model());
        return new LiveToken(name, live.model(), expiresAt);
    }

    private LiveConnectConfig liveConfig(String systemPrompt) {
        LiveConnectConfig.Builder builder = LiveConnectConfig.builder()
                .responseModalities(Modality.Known.AUDIO)
                .systemInstruction(Content.fromParts(Part.fromText(systemPrompt)))
                .tools(Tool.builder().functionDeclarations(tools()).build())
                .inputAudioTranscription(AudioTranscriptionConfig.builder().build())
                .outputAudioTranscription(AudioTranscriptionConfig.builder().build());
        if (!live.voice().isEmpty()) {
            builder.speechConfig(SpeechConfig.builder()
                    .voiceConfig(VoiceConfig.builder()
                            .prebuiltVoiceConfig(PrebuiltVoiceConfig.builder().voiceName(live.voice()))));
        }
        return builder.build();
    }

    /** Bốn tool của gia sư, tên phải khớp với TutorPromptBuilder. */
    static List<FunctionDeclaration> tools() {
        return List.of(
                function("request_retry",
                        "Mở Lượt chấm: người học giữ nút để đọc từ đang luyện hoặc cả câu và hệ thống chấm bằng Azure. "
                                + "Gọi sau khi đã giải thích.",
                        "target", "Đọc từ đang luyện hay cả câu", List.of("word", "sentence")),
                function("switch_word",
                        "Đổi từ đang luyện sang một từ trong câu khi người học muốn ôn từ khác.",
                        "word", "Từ trong câu mà người học muốn luyện", null),
                function("log_turn",
                        "Gọi sau mỗi lượt người học nói trong chế độ trò chuyện, trước khi trả lời, "
                                + "để ghi lượt đó có liên quan tới câu đang học hay không.",
                        "topic", "Chủ đề của lượt vừa rồi", List.of("on_topic", "off_topic")),
                function("end_session",
                        "Kết thúc phiên khi instruction yêu cầu hoặc người học muốn tiếp tục bài.",
                        "reason", "Lý do kết thúc", List.of("completed", "learner_exit", "off_topic")));
    }

    /** @param values các giá trị cho phép; null khi tham số là chuỗi tự do */
    private static FunctionDeclaration function(String name, String description, String param,
            String paramDescription, List<String> values) {
        Schema.Builder property = Schema.builder().type(Type.Known.STRING).description(paramDescription);
        if (values != null) {
            property.enum_(values);
        }
        return FunctionDeclaration.builder()
                .name(name)
                .description(description)
                .parameters(Schema.builder()
                        .type(Type.Known.OBJECT)
                        .properties(Map.of(param, property.build()))
                        .required(param))
                .build();
    }

    /** Cùng timeout với GeminiFeedbackGenerator, để Gemini treo không giữ luồng yêu cầu mãi. */
    static HttpOptions httpOptions(GeminiProperties gemini) {
        return HttpOptions.builder().apiVersion("v1alpha").timeout((int) gemini.timeout().toMillis()).build();
    }

    private synchronized Client client() {
        if (!gemini.configured()) {
            throw new IllegalStateException("Chưa cấu hình GEMINI_API_KEY.");
        }
        if (client == null) {
            client = Client.builder()
                    .apiKey(gemini.apiKey())
                    .httpOptions(httpOptions(gemini))
                    .build();
        }
        return client;
    }
}
