package com.lingualoop.backend.lesson.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.dto.request.CreateLessonFromYouTubeRequest;
import com.lingualoop.backend.lesson.dto.response.CreatedLessonResponse;
import com.lingualoop.backend.lesson.dto.response.YouTubePreviewResponse;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.ipa.IpaGenerator;
import com.lingualoop.backend.lesson.ipa.IpaGenerator.SentenceIpa;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.TopicRepository;
import com.lingualoop.backend.lesson.service.LessonDraftWriter.DraftLesson;
import com.lingualoop.backend.lesson.service.LessonDraftWriter.DraftSentence;
import com.lingualoop.backend.lesson.transcript.SegmentSanitizer;
import com.lingualoop.backend.lesson.transcript.TranscriptSegment;
import com.lingualoop.backend.lesson.transcript.VideoTranscriber;
import com.lingualoop.backend.lesson.youtube.YouTubeVideoId;
import com.lingualoop.backend.lesson.youtube.YouTubeVideoInfo;
import com.lingualoop.backend.lesson.youtube.YouTubeVideoLookup;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * UC-BH-03 theo đúng thứ tự các bước: kiểm tra form (5), đọc và kiểm tra video (6), lấy lời thoại thành câu (7), tạo IPA
 * (8), lưu bài Nháp (9). Lỗi ở bất kỳ bước nào đều không tạo bài.
 */
@Slf4j
@Service
@RequiredArgsConstructor
class TeacherLessonImportServiceImpl implements TeacherLessonImportService {

    static final int MAX_TITLE = 100;

    private final YouTubeVideoLookup videoLookup;
    private final VideoTranscriber transcriber;
    private final SegmentSanitizer sanitizer;
    private final IpaGenerator ipaGenerator;
    private final LessonDraftWriter writer;
    private final LessonRepository lessons;
    private final TopicRepository topics;

    /**
     * Video đang được tạo bài trong tiến trình này (BR-BH-18, AC-BH-95). Chặn yêu cầu thứ hai trước khi gọi Gemini; khi
     * chạy nhiều tiến trình, chỉ mục {@code uq_lessons_library_video} vẫn chặn ở bước lưu.
     */
    private final Set<String> inFlight = ConcurrentHashMap.newKeySet();

    @Override
    public CreatedLessonResponse createFromYouTube(UUID teacherId, CreateLessonFromYouTubeRequest request) {
        // Bước 5: link (5a), chủ đề (5b), tiêu đề trùng (5c), video đã có bài (5d)
        String videoId = YouTubeVideoId.parse(request.youtubeUrl());
        requireFreeVideo(teacherId, videoId);
        if (!inFlight.add(videoId)) {
            throw new BusinessException(ErrorCode.LESSON_VIDEO_TAKEN);
        }
        try {
            return create(teacherId, request, videoId);
        } finally {
            inFlight.remove(videoId);
        }
    }

    @Override
    public YouTubePreviewResponse previewYouTube(UUID teacherId, String youtubeUrl) {
        String videoId = YouTubeVideoId.parse(youtubeUrl);
        requireFreeVideo(teacherId, videoId);
        YouTubeVideoInfo video = videoLookup.fetch(videoId);
        return new YouTubePreviewResponse(videoId, titleFromVideo(video),
                (int) Math.ceil(video.duration().toMillis() / 1000.0));
    }

    private CreatedLessonResponse create(UUID teacherId, CreateLessonFromYouTubeRequest request, String videoId) {
        if (!topics.existsById(request.topicId())) {
            throw new BusinessException(ErrorCode.LESSON_TOPIC_NOT_FOUND);
        }
        String typedTitle = request.title() == null ? "" : request.title().strip();
        if (!typedTitle.isEmpty()) {
            requireFreeTitle(teacherId, typedTitle);
        }

        // Bước 6: thông tin video (6a, 6c, 6d)
        YouTubeVideoInfo video = videoLookup.fetch(videoId);
        String title = typedTitle.isEmpty() ? titleFromVideo(video) : typedTitle;
        if (typedTitle.isEmpty()) {
            requireFreeTitle(teacherId, title);
        }

        // Bước 7: lời thoại (6b khi không nhận được câu nào)
        int durationMs = (int) video.duration().toMillis();
        List<TranscriptSegment> segments = sanitizer.sanitize(transcriber.transcribe(video), durationMs);
        if (segments.isEmpty()) {
            throw new BusinessException(ErrorCode.YOUTUBE_NO_ENGLISH_SPEECH);
        }
        List<String> texts = segments.stream().map(TranscriptSegment::text).toList();

        // Bước 8: IPA (không tốn credit). Bản dịch để trống: giáo viên tự nhập hoặc tự chọn "Tạo gợi ý" (UC-BH-10).
        List<SentenceIpa> ipa = ipaGenerator.generate(texts);

        // Bước 9: lưu Nháp
        List<DraftSentence> rows = new ArrayList<>(segments.size());
        for (int i = 0; i < segments.size(); i++) {
            TranscriptSegment s = segments.get(i);
            rows.add(new DraftSentence(s.startMs(), s.endMs(), s.text(), null, ipa.get(i).us(), ipa.get(i).uk()));
        }
        int durationSec = (int) Math.ceil(durationMs / 1000.0);
        Lesson lesson = writer.save(new DraftLesson(teacherId, request.topicId(), title, videoId, durationSec,
                request.cefrLevel(), request.pro()), rows);

        int ipaCount = (int) ipa.stream().map(SentenceIpa::us).filter(Objects::nonNull).count();
        int ipaUkCount = (int) ipa.stream().map(SentenceIpa::uk).filter(Objects::nonNull).count();
        log.info("Giáo viên {} tạo bài {} từ video {}: {} câu, {} câu có IPA Mỹ, {} câu có IPA Anh", teacherId,
                lesson.getId(), videoId, rows.size(), ipaCount, ipaUkCount);
        return new CreatedLessonResponse(lesson.getId(), lesson.getTitle(), videoId, durationSec,
                request.cefrLevel().name(), request.pro(), lesson.getStatus().value(), rows.size(), ipaCount,
                ipaUkCount);
    }

    /**
     * BR-BH-18: video đã có bài thư viện chưa xóa thì không tạo bài. Chỉ báo bài cụ thể khi bài thuộc chính giáo viên
     * (AC-BH-93); bài của người khác chỉ báo video đã được dùng (AC-BH-94).
     */
    private void requireFreeVideo(UUID teacherId, String videoId) {
        lessons.findActiveByVideo(videoId).ifPresent(existing -> {
            if (teacherId.equals(existing.getOwnerId())) {
                throw new BusinessException(ErrorCode.LESSON_VIDEO_TAKEN,
                        Map.of("lessonId", existing.getId(), "title", existing.getTitle()));
            }
            throw new BusinessException(ErrorCode.LESSON_VIDEO_TAKEN);
        });
    }

    private void requireFreeTitle(UUID teacherId, String title) {
        if (lessons.existsActiveTitle(teacherId, title)) {
            throw new BusinessException(ErrorCode.LESSON_TITLE_TAKEN);
        }
    }

    /** Tiêu đề để trống thì lấy tên video, cắt còn tối đa 100 ký tự (AC-BH-15). */
    static String titleFromVideo(YouTubeVideoInfo video) {
        String title = video.title() == null || video.title().isBlank()
                ? "YouTube " + video.videoId() : video.title().strip();
        return title.length() > MAX_TITLE ? title.substring(0, MAX_TITLE).strip() : title;
    }
}
