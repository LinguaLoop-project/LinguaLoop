package com.lingualoop.backend.shadowing.azure;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.AzureSpeechProperties;
import com.microsoft.cognitiveservices.speech.CancellationDetails;
import com.microsoft.cognitiveservices.speech.PronunciationAssessmentConfig;
import com.microsoft.cognitiveservices.speech.PronunciationAssessmentGradingSystem;
import com.microsoft.cognitiveservices.speech.PronunciationAssessmentGranularity;
import com.microsoft.cognitiveservices.speech.PronunciationAssessmentResult;
import com.microsoft.cognitiveservices.speech.PropertyId;
import com.microsoft.cognitiveservices.speech.ResultReason;
import com.microsoft.cognitiveservices.speech.SpeechConfig;
import com.microsoft.cognitiveservices.speech.SpeechRecognitionResult;
import com.microsoft.cognitiveservices.speech.SpeechRecognizer;
import com.microsoft.cognitiveservices.speech.audio.AudioConfig;
import com.microsoft.cognitiveservices.speech.audio.AudioStreamFormat;
import com.microsoft.cognitiveservices.speech.audio.PushAudioInputStream;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Chấm bằng Azure Speech (Pronunciation Assessment, mức âm vị, IPA, en-US). Chuyển từ demo azure-pronunciation-demo. */
@Slf4j
@Service
@RequiredArgsConstructor
class AzurePronunciationScoringService implements PronunciationScoringService {

    private static final String LOCALE = "en-US";
    /** Quá thời gian này mà Azure chưa trả lời thì coi như dịch vụ lỗi (kết nối treo không giữ luồng mãi). */
    private static final long RECOGNIZE_TIMEOUT_SECONDS = 20;
    private static final ObjectMapper JSON = new ObjectMapper();

    private final AzureSpeechProperties properties;

    @Override
    public PronunciationAssessment assess(byte[] wav, String referenceText) {
        if (!properties.configured()) {
            log.error("Azure Speech chưa cấu hình (AZURE_SPEECH_KEY trống)");
            throw new BusinessException(ErrorCode.SHADOWING_SCORING_UNAVAILABLE);
        }
        try {
            return recognize(WavPcm.extract(wav), referenceText);
        } catch (BusinessException e) {
            throw e;
        } catch (ExecutionException | TimeoutException | RuntimeException e) {
            log.error("Azure chấm phát âm lỗi", e);
            throw new BusinessException(ErrorCode.SHADOWING_SCORING_UNAVAILABLE);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(ErrorCode.SHADOWING_SCORING_UNAVAILABLE);
        }
    }

    /** Đẩy PCM thô thẳng vào SDK qua luồng đẩy, nên không ghi tệp tạm ra đĩa. */
    private PronunciationAssessment recognize(byte[] pcm, String referenceText)
            throws ExecutionException, InterruptedException, TimeoutException {
        try (SpeechConfig speechConfig = SpeechConfig.fromSubscription(properties.key(), properties.region());
                PushAudioInputStream pushStream = PushAudioInputStream.create(
                        AudioStreamFormat.getWaveFormatPCM(16_000, (short) 16, (short) 1));
                AudioConfig audioConfig = AudioConfig.fromStreamInput(pushStream);
                PronunciationAssessmentConfig assessmentConfig = new PronunciationAssessmentConfig(
                        referenceText,
                        PronunciationAssessmentGradingSystem.HundredMark,
                        PronunciationAssessmentGranularity.Phoneme,
                        true)) {
            speechConfig.setSpeechRecognitionLanguage(LOCALE);
            pushStream.write(pcm);
            pushStream.close(); // báo hết dữ liệu để Azure kết thúc nhận dạng
            assessmentConfig.enableProsodyAssessment();
            // IPA (θ, ð, ʃ…) thay cho SAPI mặc định (th, dh, sh…) để chuyển được sang bảng phonemes.
            assessmentConfig.setPhonemeAlphabet("IPA");
            assessmentConfig.setNBestPhonemeCount(5); // ứng viên âm để biết người học đọc gần âm nào

            try (SpeechRecognizer recognizer = new SpeechRecognizer(speechConfig, audioConfig)) {
                assessmentConfig.applyTo(recognizer);
                SpeechRecognitionResult result = recognizer.recognizeOnceAsync().get(RECOGNIZE_TIMEOUT_SECONDS, TimeUnit.SECONDS);

                if (result.getReason() == ResultReason.RecognizedSpeech) {
                    return toAssessment(result);
                }
                if (result.getReason() == ResultReason.NoMatch) {
                    throw new BusinessException(ErrorCode.SHADOWING_NO_SPEECH);
                }
                if (result.getReason() == ResultReason.Canceled) {
                    CancellationDetails details = CancellationDetails.fromResult(result);
                    log.error("Azure huỷ nhận dạng: {} - {}", details.getReason(), details.getErrorDetails());
                } else {
                    log.error("Azure trả kết quả không mong đợi: {}", result.getReason());
                }
                throw new BusinessException(ErrorCode.SHADOWING_SCORING_UNAVAILABLE);
            }
        }
    }

    private PronunciationAssessment toAssessment(SpeechRecognitionResult result) {
        PronunciationAssessmentResult overall = PronunciationAssessmentResult.fromResult(result);
        Double prosody = null;
        try {
            prosody = overall.getProsodyScore();
        } catch (RuntimeException e) {
            log.debug("Không có điểm ngữ điệu");
        }
        return new PronunciationAssessment(
                result.getText(),
                overall.getPronunciationScore(),
                overall.getAccuracyScore(),
                overall.getFluencyScore(),
                overall.getCompletenessScore(),
                prosody,
                parseWords(result.getProperties().getProperty(PropertyId.SpeechServiceResponse_JsonResult)));
    }

    /** Đọc {@code NBest[0].Words[]} trong JSON đầy đủ của Azure (SDK không expose âm vị theo kiểu). */
    static List<PronunciationAssessment.WordResult> parseWords(String json) {
        List<PronunciationAssessment.WordResult> words = new ArrayList<>();
        if (json == null || json.isBlank()) {
            return words;
        }
        try {
            JsonNode best = JSON.readTree(json).path("NBest");
            if (!best.isArray() || best.isEmpty()) {
                return words;
            }
            for (JsonNode wordNode : best.get(0).path("Words")) {
                JsonNode assessment = wordNode.path("PronunciationAssessment");
                List<PronunciationAssessment.PhonemeResult> phonemes = new ArrayList<>();
                for (JsonNode phoneNode : wordNode.path("Phonemes")) {
                    JsonNode phoneAssessment = phoneNode.path("PronunciationAssessment");
                    List<PronunciationAssessment.Candidate> candidates = new ArrayList<>();
                    for (JsonNode candidate : phoneAssessment.path("NBestPhonemes")) {
                        candidates.add(new PronunciationAssessment.Candidate(
                                candidate.path("Phoneme").asText(), candidate.path("Score").asDouble(0)));
                    }
                    phonemes.add(new PronunciationAssessment.PhonemeResult(
                            phoneNode.path("Phoneme").asText(),
                            phoneAssessment.path("AccuracyScore").asDouble(0), candidates));
                }
                words.add(new PronunciationAssessment.WordResult(
                        wordNode.path("Word").asText(),
                        assessment.path("AccuracyScore").asDouble(0),
                        PronunciationAssessment.ErrorType.fromAzure(assessment.path("ErrorType").asText(null)),
                        phonemes));
            }
        } catch (IOException e) {
            throw new IllegalStateException("Không đọc được JSON kết quả chấm của Azure", e);
        }
        return words;
    }
}
