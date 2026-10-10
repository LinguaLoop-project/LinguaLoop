import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useTopicDetail, useLessonSearch } from "../hooks/useLessons";
import { LessonCard } from "../components/LessonCard";

export const TopicDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const topicSlug = id || "";

  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number>(24);

  const { data: topic, isLoading: isTopicLoading } = useTopicDetail(topicSlug);

  const getDifficulty = (lvl: string) => {
    if (lvl === "basic") return "A1,A2";
    if (lvl === "mid") return "B1,B2";
    if (lvl === "adv") return "C1,C2";
    return undefined;
  };

  const { data: searchResults, isLoading: isLessonsLoading } = useLessonSearch({
    topic: topicSlug,
    difficulty: getDifficulty(levelFilter),
    state: stateFilter !== "all" ? stateFilter : undefined,
    size: pageSize,
  });

  const lessons = searchResults?.content || [];
  const totalCount = searchResults?.totalElements || topic?.displayOrder || lessons.length;
  const doneN = useMemo(() => {
    return lessons.filter((l) => l.isCompleted).length;
  }, [lessons]);

  const handleLoadMore = () => {
    setPageSize((prev) => prev + 24);
  };

  if (isTopicLoading && !topic) {
    return (
      <div className="flex justify-center p-12">
        <i className="ph ph-circle-notch text-3xl animate-spin text-primary"></i>
      </div>
    );
  }

  return (
    <section className="view on w-full" id="v-topic">
      {/* ── Breadcrumb & Topic Hero ── */}
      <div id="tpHead" className="rv">
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-txt-muted mb-4 [&>a]:text-txt-muted [&>a]:min-h-8 [&>a]:inline-flex [&>a]:items-center hover:[&>a]:text-text hover:[&>a]:underline [&>i]:text-[14px]">
          <Link to="/student/lessons">Bài học</Link>
          <i className="ph ph-caret-right"></i>
          <span>{topic?.nameVi || topic?.name || topicSlug}</span>
        </div>

        <div className="relative flex flex-wrap items-center gap-6 my-2 mb-7">
          <div className="relative w-24 h-24 shrink-0 grid place-items-center">
            <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute inset-0 w-full h-full">
              <use href="#o-orb" />
            </svg>
            <i
              className={`ph-duotone ph-${topic?.iconUrl || "books"} relative text-[40px] text-accent`}
              aria-hidden="true"
            ></i>
          </div>

          <div className="grow">
            <div className="overline">Chủ đề · {topic?.name}</div>
            <h1>{topic?.nameVi || topic?.name}</h1>
            <p className="muted">{topic?.description}</p>
          </div>

          <div className="card tight" style={{ minWidth: 240 }}>
            <div className="row between small">
              <span className="muted">Bạn đã hoàn thành</span>
              <b>
                {doneN}/{totalCount} bài
              </b>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden" style={{ marginTop: 10 }}>
              <i
                className="relative block h-full rounded-[inherit] bg-gradient-primary overflow-hidden transition-[width] duration-500 ease-out"
                style={{
                  width: `${totalCount ? Math.min(100, Math.round((doneN / totalCount) * 100)) : 0}%`,
                }}
              ></i>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Level & State Filter ── */}
      <div className="toolbar rv">
        {/* Level segment */}
        <div className="seg" id="tpLevel" role="group" aria-label="Trình độ">
          <button
            data-v="all"
            className={levelFilter === "all" ? "on" : ""}
            onClick={() => setLevelFilter("all")}
          >
            Mọi trình độ
          </button>
          <button
            data-v="basic"
            className={levelFilter === "basic" ? "on" : ""}
            onClick={() => setLevelFilter("basic")}
          >
            A1–A2
          </button>
          <button
            data-v="mid"
            className={levelFilter === "mid" ? "on" : ""}
            onClick={() => setLevelFilter("mid")}
          >
            B1–B2
          </button>
          <button
            data-v="adv"
            className={levelFilter === "adv" ? "on" : ""}
            onClick={() => setLevelFilter("adv")}
          >
            C1–C2
          </button>
        </div>

        {/* State segment */}
        <div className="seg" id="tpState" role="group" aria-label="Trạng thái">
          <button
            data-v="all"
            className={stateFilter === "all" ? "on" : ""}
            onClick={() => setStateFilter("all")}
          >
            Tất cả
          </button>
          <button
            data-v="todo"
            className={stateFilter === "todo" ? "on" : ""}
            onClick={() => setStateFilter("todo")}
          >
            Chưa học
          </button>
          <button
            data-v="doing"
            className={stateFilter === "doing" ? "on" : ""}
            onClick={() => setStateFilter("doing")}
          >
            Đang học
          </button>
          <button
            data-v="done"
            className={stateFilter === "done" ? "on" : ""}
            onClick={() => setStateFilter("done")}
          >
            Đã xong
          </button>
        </div>

        <span className="grow"></span>
        <span className="small muted" id="tpCount">
          Đang hiện {lessons.length} / {totalCount} bài
        </span>
      </div>

      {/* ── Grid of lessons ── */}
      {isLessonsLoading && lessons.length === 0 ? (
        <div className="flex justify-center p-12">
          <i className="ph ph-circle-notch text-3xl animate-spin text-primary"></i>
        </div>
      ) : lessons.length > 0 ? (
        <div className="l-grid" id="tpGrid">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      ) : (
        <div className="l-grid" id="tpGrid">
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="empty">
              <img
                className="mascot loopi__img"
                src="/mascot/loopi-encourage.svg"
                width={96}
                height={96}
                alt=""
                draggable={false}
              />
              <h3>Chưa có bài nào ở mục này</h3>
              <p className="small muted">
                Đổi trình độ hoặc trạng thái để xem thêm bài.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Load more button ── */}
      {lessons.length < totalCount && (
        <div style={{ textAlign: "center", marginTop: 32 }} id="tpMore">
          <button className="btn ghost" onClick={handleLoadMore}>
            Xem thêm {totalCount - lessons.length} bài
            <i className="ph ph-caret-down" aria-hidden="true"></i>
          </button>
        </div>
      )}
    </section>
  );
};
