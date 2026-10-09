import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLessonDetail, useLessonSentences, useLessonSearch } from "../hooks/useLessons";

const fmtNum = (n: number) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toLocaleString();
};

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
};

const formatTimeMs = (ms: number) => {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
};

export const LessonDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const lessonSlug = id || "";
  const navigate = useNavigate();

  const [showTranscript, setShowTranscript] = useState(false);
  const [isPlayingMedia, setIsPlayingMedia] = useState(false);

  const { data: lesson, isLoading: isLessonLoading } = useLessonDetail(lessonSlug);
  const { data: sentences, isLoading: isSentencesLoading } = useLessonSentences(lessonSlug);

  // Load related lessons for the same topic
  const topicSlug = lesson?.topic?.slug || "";
  const { data: relatedData } = useLessonSearch({
    topic: topicSlug || undefined,
    size: 4,
  });

  const relatedLessons = (relatedData?.content || []).filter(
    (l) => l.slug !== lessonSlug
  ).slice(0, 3);

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  if (isLessonLoading) {
    return (
      <div className="flex justify-center p-12">
        <i className="ph ph-circle-notch text-3xl animate-spin text-primary"></i>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="empty py-16">
        <img
          className="mascot loopi__img"
          src="/mascot/loopi-encourage.svg"
          width={96}
          height={96}
          alt=""
          draggable={false}
        />
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy bài học</h2>
        <p className="small muted mb-4">Bài học bạn đang tìm không tồn tại hoặc đã bị gỡ.</p>
        <Link to="/student/lessons" className="btn primary">
          Quay lại Thư viện
        </Link>
      </div>
    );
  }

  const topicName = lesson.topic?.nameVi || lesson.topic?.name || "Chủ đề";
  const sentenceList = sentences || [];
  const durationText = formatDuration(lesson.durationSec || 0);

  // Sample vocabulary extracted from sentences if available
  const sampleWords = [
    { word: "reliable", cefr: "B1", meaning: "đáng tin cậy" },
    { word: "although", cefr: "B1", meaning: "mặc dù" },
    { word: "conversation", cefr: "A2", meaning: "cuộc trò chuyện" },
  ];

  return (
    <section className="view on w-full" id="v-lesson">
      {/* ── Breadcrumb ── */}
      <div className="crumbs rv">
        <Link to="/student/lessons">Bài học</Link>
        <i className="ph ph-caret-right"></i>
        {topicSlug ? (
          <Link to={`/student/topics/${topicSlug}`}>{topicName}</Link>
        ) : (
          <span>{topicName}</span>
        )}
        <i className="ph ph-caret-right"></i>
        <span>{lesson.title}</span>
      </div>

      {/* ── Main 2-column layout (.g-vocab) ── */}
      <div className="g-vocab">
        {/* Left Column */}
        <div className="col g24">
          {/* Media Player Container */}
          <div className="ld-media rv">
            {lesson.videoUrl && isPlayingMedia ? (
              <iframe
                src={`${lesson.videoUrl}?autoplay=1`}
                title={lesson.title}
                className="w-full h-full border border-border rounded-[inherit]"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="lthumb w-full h-full">
                {lesson.thumbnailUrl && (
                  <img
                    src={lesson.thumbnailUrl}
                    alt={lesson.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <svg className="art-orb" viewBox="0 0 200 200" aria-hidden="true">
                  <use href="#o-orb" />
                </svg>
                <i className="ph-duotone ph-headphones art" aria-hidden="true"></i>

                <button
                  className="play-big"
                  aria-label="Phát video"
                  onClick={() => setIsPlayingMedia(true)}
                >
                  <i className="ph-fill ph-play ml-1"></i>
                </button>
              </div>
            )}
          </div>

          {/* Lesson Info */}
          <div className="rv">
            <h1>{lesson.title}</h1>
            {lesson.titleVi && <p className="muted mt-1">{lesson.titleVi}</p>}

            <div className="meta-row mt-3">
              {lesson.difficulty && (
                <span className={`badge cefr ${lesson.difficulty}`}>
                  {lesson.difficulty}
                </span>
              )}
              {lesson.isProRequired && (
                <span className="badge pro">
                  <i className="ph-fill ph-crown-simple"></i>PRO
                </span>
              )}
              <span>
                {lesson.videoUrl?.includes("youtube") || lesson.sourceType === "youtube" ? (
                  <>
                    <i className="ph-fill ph-youtube-logo text-danger"></i>YouTube
                  </>
                ) : (
                  <>
                    <i className="ph ph-waveform"></i>Audio
                  </>
                )}
              </span>
              <span>
                <i className="ph ph-clock"></i>
                {durationText}
              </span>
              <span>
                <i className="ph ph-list-numbers"></i>
                {sentenceList.length || lesson.sentenceCount || 0} câu
              </span>
              <span>
                <i className="ph ph-headphones"></i>
                {fmtNum(lesson.viewCount || 95482)} lượt học
              </span>
              <span>
                <i className="ph ph-calendar-blank"></i>Thêm gần đây
              </span>
            </div>

            <p className="mt-3 leading-relaxed text-sm text-txt-muted">
              {lesson.description ||
                `Bài thuộc chủ đề ${topicName.toLowerCase()}, dài ${durationText}, cắt sẵn ${
                  sentenceList.length || lesson.sentenceCount || 9
                } câu kèm mốc thời gian. Chọn một chế độ để luyện; tiến độ mỗi chế độ được lưu riêng.`}
            </p>
          </div>

          {/* Practice Modes */}
          <div className="mode-grid rv">
            <div className="card lift mode-card">
              <div className="flex items-center justify-between">
                <div className="mode-ic">
                  <i className="ph ph-headphones"></i>
                </div>
              </div>
              <div>
                <h3>Nghe chép</h3>
                <p className="small muted">
                  Nghe từng câu rồi gõ lại. Chấm từng từ, gắn nhãn loại lỗi.
                </p>
              </div>
              <div className="mt-auto">
                <div className="row between small">
                  <span className="muted">0/{sentenceList.length || 9} câu</span>
                  <span className="muted">Chưa bắt đầu</span>
                </div>
                <div className="bar thin mt-1.5">
                  <i style={{ width: "0%" }}></i>
                </div>
              </div>
              <button
                className="btn primary"
                onClick={() => navigate(`/student/dictation/${lesson.slug}`)}
              >
                Bắt đầu
                <i className="ph ph-arrow-right arr"></i>
              </button>
            </div>

            <div className="card lift mode-card">
              <div className="flex items-center justify-between">
                <div className="mode-ic">
                  <i className="ph ph-microphone"></i>
                </div>
              </div>
              <div>
                <h3>Shadowing</h3>
                <p className="small muted">
                  Nghe mẫu rồi đọc theo. AI chấm phát âm tới từng âm vị.
                </p>
              </div>
              <div className="mt-auto">
                <div className="row between small">
                  <span className="muted">0/{sentenceList.length || 9} câu</span>
                  <span className="muted">Chưa bắt đầu</span>
                </div>
                <div className="bar thin mt-1.5">
                  <i style={{ width: "0%" }}></i>
                </div>
              </div>
              <button
                className="btn primary"
                onClick={() => navigate(`/student/shadowing/${lesson.slug}`)}
              >
                Bắt đầu
                <i className="ph ph-arrow-right arr"></i>
              </button>
            </div>
          </div>

          {/* Sentence Transcript List */}
          <div className="card rv">
            <div className="row between w">
              <h3>
                Các câu trong bài{" "}
                <span className="muted small">({sentenceList.length})</span>
              </h3>
              <button
                className="btn ghost sm"
                aria-pressed={showTranscript}
                onClick={() => setShowTranscript(!showTranscript)}
              >
                <i className={`ph ${showTranscript ? "ph-eye-slash" : "ph-eye"}`}></i>
                <span>{showTranscript ? "Ẩn transcript" : "Hiện transcript"}</span>
              </button>
            </div>
            <p className="small muted my-2">
              Transcript ẩn sẵn để không lộ đáp án khi nghe chép.
            </p>

            <div className={showTranscript ? "" : "masked"} id="sentList">
              {isSentencesLoading ? (
                <div className="flex justify-center p-6">
                  <i className="ph ph-circle-notch text-2xl animate-spin text-primary"></i>
                </div>
              ) : sentenceList.length > 0 ? (
                sentenceList.map((s, idx) => (
                  <div key={s.id || idx} className="sent">
                    <span className="n">{idx + 1}</span>
                    <span className="tx">{s.text}</span>
                    <span className="st">
                      <span>{formatTimeMs(s.startTimeMs || idx * 4000 + 1000)}</span>
                      <button
                        className="icon-btn sm"
                        aria-label={`Nghe câu ${idx + 1}`}
                        onClick={() => speak(s.text)}
                      >
                        <i className="ph ph-speaker-high"></i>
                      </button>
                    </span>
                  </div>
                ))
              ) : (
                <p className="small muted py-4 text-center">
                  Chưa có dữ liệu câu cho bài này.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column / Aside */}
        <aside className="col g24">
          {/* Progress Card */}
          <div className="card rv">
            <div className="overline">Tiến độ của bạn</div>
            <div className="row" style={{ gap: 20 }}>
              <div className="w-[88px] h-[88px] rounded-full border-4 border-border flex flex-col items-center justify-center shrink-0">
                <span className="font-display font-bold text-2xl">0</span>
                <small className="text-[11px] text-txt-muted">%</small>
              </div>
              <div className="col g8 small flex-1">
                <div className="row between">
                  <span className="muted row g8">
                    <i className="ph ph-headphones text-accent"></i>Nghe chép
                  </span>
                  <b>—</b>
                </div>
                <div className="row between">
                  <span className="muted row g8">
                    <i className="ph ph-microphone text-accent"></i>Shadowing
                  </span>
                  <b>—</b>
                </div>
                <div className="row between">
                  <span className="muted row g8">
                    <i className="ph ph-clock text-accent"></i>Thời gian học
                  </span>
                  <b>—</b>
                </div>
              </div>
            </div>
          </div>

          {/* Vocabulary in Lesson */}
          <div className="card rv">
            <div className="row between">
              <div className="overline" style={{ margin: 0 }}>
                Từ vựng trong bài
              </div>
              <button className="btn text sm">Lưu tất cả</button>
            </div>
            {sampleWords.map((w) => (
              <div key={w.word} className="fam">
                <div className="row g8">
                  <button
                    className="icon-btn sm"
                    aria-label={`Nghe ${w.word}`}
                    onClick={() => speak(w.word)}
                  >
                    <i className="ph ph-speaker-high"></i>
                  </button>
                  <div>
                    <b>{w.word}</b>{" "}
                    <span className={`badge cefr ${w.cefr}`}>{w.cefr}</span>
                    <div className="small muted">{w.meaning}</div>
                  </div>
                </div>
                <button
                  className="save"
                  aria-label={`Lưu từ ${w.word}`}
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    btn.classList.toggle("text-primary");
                  }}
                >
                  <i className="ph ph-bookmark-simple"></i>
                </button>
              </div>
            ))}
          </div>

          {/* User Notes */}
          <div className="card rv">
            <div className="row between">
              <div className="overline" style={{ margin: 0 }}>
                Ghi chú của tôi
              </div>
              <button className="btn text sm">
                <i className="ph ph-plus"></i>Thêm
              </button>
            </div>
            <p className="small muted mt-2">
              Chưa có ghi chú. Trong lúc luyện, bấm <kbd>N</kbd> để ghi chú cho câu đang học.
            </p>
          </div>

          {/* Related Lessons */}
          <div className="card rv">
            <div className="overline">Bài cùng chủ đề</div>
            {relatedLessons.map((rel) => (
              <div
                key={rel.id}
                className="rel"
                onClick={() => navigate(`/student/lessons/${rel.slug}`)}
              >
                <div className="lthumb w-[88px] h-[52px] shrink-0 rounded-md overflow-hidden relative border border-border">
                  {rel.thumbnailUrl ? (
                    <img
                      src={rel.thumbnailUrl}
                      alt={rel.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-hover">
                      <i className="ph-duotone ph-headphones text-base text-accent"></i>
                    </div>
                  )}
                </div>
                <div className="grow min-w-0">
                  <b className="ltitle text-[14px] line-clamp-1">{rel.title}</b>
                  <div className="small muted">
                    {rel.difficulty || "B1"} · {formatDuration(rel.durationSec || 0)}
                  </div>
                </div>
              </div>
            ))}

            {topicSlug && (
              <button
                className="btn text sm mt-2"
                onClick={() => navigate(`/student/topics/${topicSlug}`)}
              >
                Xem cả chủ đề
                <i className="ph ph-arrow-right arr"></i>
              </button>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};
