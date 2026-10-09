import { useNavigate } from "react-router-dom";
import type { LessonSummary } from "../types";

interface LessonCardProps {
  lesson: LessonSummary;
}

const fmtNum = (n: number) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toString();
};

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export const LessonCard = ({ lesson }: LessonCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/student/lessons/${lesson.slug}`);
  };

  const handleStartMode = (e: React.MouseEvent, mode: "dictation" | "shadowing") => {
    e.stopPropagation();
    navigate(`/student/lessons/${lesson.slug}?mode=${mode}`);
  };

  return (
    <article
      className="card lift lcard group"
      data-lesson={lesson.slug}
      tabIndex={0}
      aria-label={`Bài ${lesson.title}`}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* ── Thumbnail ── */}
      <div className="lthumb">
        {lesson.thumbnailUrl ? (
          <img
            src={lesson.thumbnailUrl}
            alt={lesson.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : null}

        <svg className="art-orb" viewBox="0 0 200 200" aria-hidden="true">
          <use href="#o-orb" />
        </svg>
        <i className="ph-duotone ph-headphones art" aria-hidden="true"></i>

        {/* ── Corners ── */}
        <div className="corner tl">
          {lesson.isProRequired && (
            <span className="badge pro">
              <i className="ph-fill ph-crown-simple"></i>PRO
            </span>
          )}
          <span className="tag-glass" title="Lượt học">
            <i className="ph ph-headphones"></i>
            {fmtNum(lesson.viewCount || 0)}
          </span>
        </div>

        <div className="corner tr">
          {lesson.difficulty && (
            <span className={`badge cefr ${lesson.difficulty}`}>
              {lesson.difficulty}
            </span>
          )}
        </div>

        <div className="corner bl">
          <span className="tag-glass">
            {lesson.videoUrl?.includes("youtube") || lesson.youtubeVideoId ? (
              <>
                <i className="ph-fill ph-youtube-logo"></i>YouTube
              </>
            ) : (
              <>
                <i className="ph ph-waveform"></i>Audio
              </>
            )}
          </span>
        </div>

        <div className="corner br">
          <span className="tag-glass">
            <i className="ph ph-clock"></i>
            {formatDuration(lesson.durationSec || 0)}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="lbody">
        <h3 className="ltitle">{lesson.title}</h3>
        <div className="lvi">{lesson.titleVi || lesson.description || ""}</div>
        <div className="lmodes">
          <button
            className="lmode"
            data-start="dictation"
            data-lesson={lesson.slug}
            aria-label={`Nghe chép: ${lesson.title}`}
            onClick={(e) => handleStartMode(e, "dictation")}
          >
            <i className="ph ph-headphones"></i>Nghe chép
          </button>
          <button
            className="lmode"
            data-start="shadowing"
            data-lesson={lesson.slug}
            aria-label={`Shadowing: ${lesson.title}`}
            onClick={(e) => handleStartMode(e, "shadowing")}
          >
            <i className="ph ph-microphone"></i>Shadowing
          </button>
        </div>
      </div>
    </article>
  );
};
