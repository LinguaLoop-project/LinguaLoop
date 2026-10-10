import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useLessonSearch,
  useTopicList,
  useLessonOverview,
} from "../hooks/useLessons";
import { LessonCard } from "../components/LessonCard";
import { useDebounce } from "../../../hooks/useDebounce";

export const LessonLibraryPage = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("pop");
  const [level, setLevel] = useState<string>("all");
  const [freeOnly, setFreeOnly] = useState<boolean>(false);
  const [ytUrl, setYtUrl] = useState<string>("");
  const [showUxNotes, setShowUxNotes] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { data: topicsData } = useTopicList();
  const topics = useMemo(() => topicsData || [], [topicsData]);

  const { data: overviewData } = useLessonOverview();

  const getDifficulty = (lvl: string) => {
    if (lvl === "basic") return "A1,A2";
    if (lvl === "mid") return "B1,B2";
    if (lvl === "adv") return "C1,C2";
    return undefined;
  };

  const getSort = (s: string) => {
    if (s === "pop") return "viewCount,desc";
    if (s === "new") return "createdAt,desc";
    if (s === "short") return "durationSec,asc";
    return undefined;
  };

  const { data: searchResults, isLoading } = useLessonSearch({
    q: debouncedSearch,
    topic: selectedTopic !== "all" ? selectedTopic : undefined,
    difficulty: getDifficulty(level),
    free: freeOnly ? true : undefined,
    sort: getSort(sortOrder),
    size: 40,
  });

  const handleResetFilters = () => {
    setSearchTerm("");
    setLevel("all");
    setSortOrder("pop");
    setFreeOnly(false);
    setSelectedTopic("all");
  };

  const handleYtCreate = () => {
    if (!ytUrl.trim()) return;
    setToastMsg(
      "AI đang tách câu và ước lượng trình độ… Bài sẽ chờ duyệt trước khi công khai",
    );
    setTimeout(() => setToastMsg(null), 4000);
    setYtUrl("");
  };

  const totalLessons = searchResults?.totalElements || 0;
  const isFiltered =
    Boolean(searchTerm.trim()) ||
    level !== "all" ||
    freeOnly ||
    selectedTopic !== "all" ||
    sortOrder !== "pop";

  // Continue learning lessons
  const continueLessons = useMemo(() => {
    if (
      overviewData?.continueLessons &&
      overviewData.continueLessons.length > 0
    ) {
      return overviewData.continueLessons;
    }
    if (
      overviewData?.currentLessons &&
      overviewData.currentLessons.length > 0
    ) {
      return overviewData.currentLessons;
    }
    return [];
  }, [overviewData]);

  // Topic sections when not filtering
  const topicSections = useMemo(() => {
    if (overviewData?.topicRows && overviewData.topicRows.length > 0) {
      return overviewData.topicRows;
    }
    if (overviewData?.topTopics && overviewData.topTopics.length > 0) {
      return overviewData.topTopics;
    }
    // Fallback: Group lessons by topic from search results & topic list
    if (
      searchResults?.content &&
      searchResults.content.length > 0 &&
      topics.length > 0
    ) {
      return topics
        .map((t) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const topicLessons = searchResults.content.filter(
            (l: any) => l.topicSlug === t.slug || l.topic?.slug === t.slug,
          );
          return {
            topic: t,
            totalLessons: t.totalLessons || topicLessons.length,
            lessons: topicLessons,
          };
        })
        .filter((sec) => sec.lessons.length > 0);
    }
    return [];
  }, [overviewData, searchResults, topics]);

  // Lessons recommended for B1
  const b1Lessons = useMemo(() => {
    const all = searchResults?.content || [];
    const b1s = all.filter(
      (l) => l.difficulty === "B1" || l.cefrLevel === "B1",
    );
    return b1s.length > 0 ? b1s : all.slice(0, 4);
  }, [searchResults]);

  return (
    <section className="view on w-full" id="v-lessons">
      {/* ── Toast notification if triggered ── */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border-strong shadow-[var(--shadow-card)] text-sm font-medium text-txt animate-bounce">
          <i className="ph ph-magic-wand text-lg text-accent"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── UX Notes Modal ── */}
      {showUxNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-surface border border-border-strong shadow-[var(--shadow-card)] text-txt">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <i className="ph ph-lightbulb text-xl text-accent"></i>
                <h3 className="font-semi text-lg">
                  Ghi chú UX — Thư viện bài học
                </h3>
              </div>
              <button
                className="w-8 h-8 rounded-lg grid place-items-center text-txt-muted hover:text-txt hover:bg-surface-hover"
                onClick={() => setShowUxNotes(false)}
              >
                <i className="ph ph-x text-lg"></i>
              </button>
            </div>
            <div className="flex flex-col gap-3 text-sm text-txt-muted leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                <b className="text-txt">parroto.app/topics · YouTube:</b> Thẻ
                bài hiển thị đầy đủ thông tin: trình độ CEFR, thời lượng, nguồn
                YouTube/Audio, lượt học, PRO.
              </p>
              <p>
                <b className="text-txt">Hai chế độ ngay trên thẻ:</b> Nút Nghe
                chép / Shadowing ngay trên thẻ cho phép bấm thẳng vào luyện tập
                nhanh.
              </p>
              <p>
                <b className="text-txt">Tiếp tục học + gợi ý theo trình độ:</b>{" "}
                “Tiếp tục học” đặt trên cùng. Hàng “Hợp trình độ B1” gợi ý từ
                bài kiểm tra trình độ.
              </p>
              <p>
                <b className="text-txt">Lọc &amp; tìm:</b> Tìm kiếm tức thì với
                debounce 300ms, lọc 3 cấp độ (Cơ bản/Trung cấp/Nâng cao), sắp
                xếp Phổ biến/Mới/Ngắn, và bộ lọc bài miễn phí.
              </p>
              <p>
                <b className="text-txt">Tạo bài từ YouTube:</b> AI tách câu và
                ước lượng CEFR, bài duyệt trước khi công khai.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-border flex justify-end">
              <button
                className="btn ghost sm"
                onClick={() => setShowUxNotes(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="head rv">
        <div>
          <div className="overline" id="lsOver">
            Thư viện bài học
          </div>
          <h1 id="lsTitle">Bài học</h1>
          <p className="muted" id="lsSub">
            Nghe chép và shadowing trên video, audio thật · {totalLessons} bài ·{" "}
            {topics.length} chủ đề
          </p>
        </div>
        <button
          className="ux-btn"
          data-ux="lessons"
          onClick={() => setShowUxNotes(true)}
        >
          <i className="ph ph-lightbulb"></i>Ghi chú UX
        </button>
      </div>

      {/* ── YouTube Import Card ── */}
      <div className="yt-wrap rv">
        <svg
          className="obj m-hide"
          viewBox="0 0 200 200"
          style={
            {
              "--s": "84px",
              top: "-38px",
              right: "5%",
              "--d": "-2s",
            } as React.CSSProperties
          }
        >
          <use href="#o-cone" />
        </svg>
        <svg
          className="obj"
          viewBox="0 0 200 200"
          style={
            {
              "--s": "64px",
              bottom: "-26px",
              left: "-22px",
              "--d": "-4s",
              "--dur": "8s",
            } as React.CSSProperties
          }
        >
          <use href="#o-orb" />
        </svg>

        <div
          className="card glass spotlight yt-card"
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty(
              "--mx",
              `${e.clientX - r.left}px`,
            );
            e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
          }}
        >
          <div className="yt-ic">
            <i className="ph-fill ph-youtube-logo"></i>
          </div>
          <div className="grow">
            <div className="row w g8">
              <h3>Tạo bài từ video YouTube</h3>
              <span className="badge t-pri">
                <i className="ph-fill ph-sparkle"></i>AI
              </span>
              <span className="badge pro">
                <i className="ph-fill ph-crown-simple"></i>PRO
              </span>
            </div>
            <p className="small muted">
              Dán link video tiếng Anh, AI tách câu, gắn mốc thời gian và ước
              lượng trình độ. Bài được duyệt trước khi hiện công khai.
            </p>
          </div>
          <div className="yt-form">
            <div className="search-sm">
              <i className="ph ph-link"></i>
              <input
                placeholder="https://youtube.com/watch?v=…"
                aria-label="Link YouTube"
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleYtCreate();
                }}
              />
            </div>
            <button
              className="btn primary"
              data-act="ytCreate"
              onClick={handleYtCreate}
            >
              <i className="ph ph-magic-wand"></i>Tạo bài
            </button>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar rv">
        <div className="search-sm grow">
          <i className="ph ph-magnifying-glass"></i>
          <input
            id="lsSearch"
            placeholder="Tìm bài học theo tên…"
            autoComplete="off"
            aria-label="Tìm bài học"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Level Segments */}
        <div className="seg" id="lsLevel" role="group" aria-label="Trình độ">
          <button
            data-v="all"
            className={level === "all" ? "on" : ""}
            onClick={() => setLevel("all")}
          >
            Tất cả
          </button>
          <button
            data-v="basic"
            className={level === "basic" ? "on" : ""}
            onClick={() => setLevel("basic")}
          >
            Cơ bản
          </button>
          <button
            data-v="mid"
            className={level === "mid" ? "on" : ""}
            onClick={() => setLevel("mid")}
          >
            Trung cấp
          </button>
          <button
            data-v="adv"
            className={level === "adv" ? "on" : ""}
            onClick={() => setLevel("adv")}
          >
            Nâng cao
          </button>
        </div>

        {/* Sort Segments */}
        <div className="seg" id="lsSort" role="group" aria-label="Sắp xếp">
          <button
            data-v="pop"
            className={sortOrder === "pop" ? "on" : ""}
            onClick={() => setSortOrder("pop")}
          >
            <i className="ph ph-fire"></i>Phổ biến
          </button>
          <button
            data-v="new"
            className={sortOrder === "new" ? "on" : ""}
            onClick={() => setSortOrder("new")}
          >
            <i className="ph ph-clock"></i>Mới
          </button>
          <button
            data-v="short"
            className={sortOrder === "short" ? "on" : ""}
            onClick={() => setSortOrder("short")}
          >
            <i className="ph ph-timer"></i>Ngắn
          </button>
        </div>

        {/* Free Filter Button */}
        <button
          className={`chip lift ${freeOnly ? "on" : ""}`}
          id="lsFree"
          aria-pressed={freeOnly}
          onClick={() => setFreeOnly(!freeOnly)}
        >
          <i className="ph ph-lock-simple-open"></i>Chỉ bài miễn phí
        </button>
      </div>

      {/* ── Topic Chips Row ── */}
      <div className="chips-row rv" id="lsTopics">
        <button
          className={`chip lift ${selectedTopic === "all" ? "on" : ""}`}
          onClick={() => setSelectedTopic("all")}
        >
          <i className="ph ph-squares-four"></i>Tất cả
          <small>
            {topics.reduce((sum, t) => sum + (t.totalLessons || 0), 0) ||
              totalLessons}
          </small>
        </button>
        {topics.map((t) => (
          <button
            key={t.id || t.slug}
            className={`chip lift ${selectedTopic === t.slug ? "on" : ""}`}
            data-go="topic"
            data-id={t.slug}
            onClick={() => setSelectedTopic(t.slug)}
          >
            <i className={`ph ph-${t.iconUrl || "hash"}`}></i>
            {t.nameVi || t.name}
            <small>{t.totalLessons || 0}</small>
          </button>
        ))}
      </div>

      {/* ── Body Section ── */}
      <div id="lsBody">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <i className="ph ph-circle-notch text-3xl animate-spin text-primary"></i>
          </div>
        ) : isFiltered ? (
          /* ── Filter / Search Results Mode ── */
          <>
            <div className="sec-head rv">
              <h2>
                <span className="sec-ic">
                  <i className="ph-duotone ph-funnel" aria-hidden="true"></i>
                </span>
                Kết quả <small>{totalLessons} bài</small>
              </h2>
              <button
                className="btn text sm flex items-center gap-1.5"
                data-act="lsReset"
                onClick={handleResetFilters}
              >
                <i className="ph ph-x"></i>Xoá bộ lọc
              </button>
            </div>

            {searchResults?.content && searchResults.content.length > 0 ? (
              <div className="l-grid">
                {searchResults.content.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            ) : (
              <div className="empty">
                <img
                  className="mascot loopi__img"
                  src="/mascot/loopi-encourage.svg"
                  width={96}
                  height={96}
                  alt="Mascot Loopi"
                  draggable={false}
                />
                <h3>Không có bài nào khớp</h3>
                <p className="small muted">
                  Thử bỏ bớt điều kiện hoặc tìm bằng từ khác.
                </p>
                <button className="btn ghost" onClick={handleResetFilters}>
                  Xoá bộ lọc
                </button>
              </div>
            )}
          </>
        ) : (
          /* ── Default Topic-grouped Sections Mode (matches mockup & screenshots) ── */
          <>
            {/* 1. Tiếp tục học (nếu có bài đang học) */}
            {continueLessons.length > 0 && (
              <div className="mb-8">
                <div className="sec-head rv">
                  <h2>
                    <span className="sec-ic">
                      <i
                        className="ph-duotone ph-play-circle"
                        aria-hidden="true"
                      ></i>
                    </span>
                    Tiếp tục học
                  </h2>
                </div>
                <div className="cont-grid rv">
                  {continueLessons.slice(0, 3).map((l) => (
                    <article
                      key={l.id}
                      className="card lift ccard"
                      tabIndex={0}
                      onClick={() => navigate(`/student/lessons/${l.slug}`)}
                    >
                      <div className="lthumb">
                        <i className="ph-duotone ph-headphones art"></i>
                      </div>
                      <div className="meta">
                        <b className="ltitle" style={{ fontSize: 15 }}>
                          {l.title}
                        </b>
                        <span className="small muted">
                          Nghe chép · câu{" "}
                          {Math.round((l.sentenceCount || 10) * 0.4)}/
                          {l.sentenceCount || 10}
                        </span>
                        <div className="bar thin">
                          <i style={{ width: "40%" }}></i>
                        </div>
                      </div>
                      <button
                        className="icon-btn"
                        aria-label={`Tiếp tục ${l.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/student/lessons/${l.slug}?mode=dictation`);
                        }}
                      >
                        <i className="ph-fill ph-play"></i>
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Hợp trình độ B1 của bạn */}
            {b1Lessons.length > 0 && (
              <div className="mb-8">
                <div className="sec-head rv">
                  <h2>
                    <span className="sec-ic">
                      <i
                        className="ph-duotone ph-sparkle"
                        aria-hidden="true"
                      ></i>
                    </span>
                    Hợp trình độ B1 của bạn
                  </h2>
                  <span className="small muted hide-m">
                    Gợi ý từ bài kiểm tra trình độ
                  </span>
                </div>
                <div className="l-row rv">
                  {b1Lessons.slice(0, 4).map((l) => (
                    <LessonCard key={l.id} lesson={l} />
                  ))}
                </div>
              </div>
            )}

            {/* 3. Phân nhóm theo từng Topic */}
            {topicSections.length > 0 ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              topicSections.map((sec: any) => (
                <div key={sec.topic?.id || sec.topic?.slug} className="mb-8">
                  <div className="sec-head rv">
                    <h2>
                      <span className="sec-ic">
                        <i
                          className={`ph-duotone ph-${sec.topic?.iconUrl || "books"}`}
                          aria-hidden="true"
                        ></i>
                      </span>
                      {sec.topic?.nameVi || sec.topic?.name}
                      <small>
                        {sec.totalLessons ||
                          sec.topic?.totalLessons ||
                          sec.lessons?.length ||
                          0}{" "}
                        bài
                      </small>
                    </h2>
                    <button
                      className="btn ghost sm"
                      data-go="topic"
                      data-id={sec.topic?.slug}
                      onClick={() =>
                        navigate(`/student/topics/${sec.topic?.slug}`)
                      }
                    >
                      Xem tất cả
                      <i
                        className="ph ph-arrow-right arr"
                        aria-hidden="true"
                      ></i>
                    </button>
                  </div>
                  <div className="l-row rv">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(sec.lessons || []).slice(0, 4).map((l: any) => (
                      <LessonCard key={l.id} lesson={l} />
                    ))}
                  </div>
                </div>
              ))
            ) : searchResults?.content && searchResults.content.length > 0 ? (
              /* Fallback if no topic grouping available yet */
              <div className="l-grid">
                {searchResults.content.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
};
