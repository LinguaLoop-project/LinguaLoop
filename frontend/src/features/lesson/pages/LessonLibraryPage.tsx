import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useLessonSearch,
  useTopicList,
  useLessonOverview,
} from "../hooks/useLessons";
import { LessonCard } from "../components/LessonCard";
import { useDebounce } from "../../../hooks/useDebounce";
import Badge from "../../../components/common/Badge";
import Chip from "../../../components/common/Chip";
import SearchInput from "../../../components/common/SearchInput";
import SegmentedControl from "../../../components/common/SegmentedControl";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import Icon from "@/components/common/Icon";

export const LessonLibraryPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["pages", "common", "layout"]);

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

  const {
    data: searchResults,
    isLoading,
    isError,
    refetch,
  } = useLessonSearch({
    q: debouncedSearch,
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
      t(
        "pages:student.lessons.ytCard.toast",
        "AI đang tách câu và ước lượng trình độ… Bài sẽ chờ duyệt trước khi công khai",
      ),
    );
    setTimeout(() => setToastMsg(null), 4000);
    setYtUrl("");
  };

  const totalLessons = searchResults?.totalElements || 0;
  const isFiltered =
    Boolean(searchTerm.trim()) ||
    level !== "all" ||
    freeOnly ||
    sortOrder !== "pop";

  const handleTopicClick = (slug: string) => {
    setSelectedTopic(slug);

    if (isFiltered) {
      setSearchTerm("");
      setLevel("all");
      setSortOrder("pop");
      setFreeOnly(false);
    }

    setTimeout(() => {
      if (slug === "all") {
        const topEl =
          document.getElementById("lsBody") ||
          document.getElementById("lsTitle");
        topEl?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const targetEl = document.getElementById(`topic-sec-${slug}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  const continueLessons = overviewData?.continueLessons ?? [];
  const topicSections = overviewData?.topicRows ?? [];
  const results = useMemo(() => searchResults?.items ?? [], [searchResults]);

  // Lessons recommended for B1
  const b1Lessons = useMemo(() => {
    const b1s = results.filter((l) => l.difficulty === "B1");
    return b1s.length > 0 ? b1s : results.slice(0, 4);
  }, [results]);

  return (
    <section className="w-full" id="v-lessons">
      {/* ── Toast notification if triggered ── */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border-strong shadow-[var(--shadow-card)] text-sm font-medium text-text animate-bounce">
          <Icon name="wand-sparkles" className="text-lg text-accent" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── UX Notes Modal ── */}
      {showUxNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-surface border border-border-strong shadow-[var(--shadow-card)] text-text">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Icon name="lightbulb" className="text-xl text-accent" />
                <h3 className="font-semibold text-lg">
                  {t(
                    "pages:student.lessons.uxNotesTitle",
                    "Ghi chú UX — Thư viện bài học",
                  )}
                </h3>
              </div>
              <button
                className="w-8 h-8 rounded-lg grid place-items-center text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
                onClick={() => setShowUxNotes(false)}
              >
                <Icon name="x" className="text-lg" />
              </button>
            </div>
            <div className="flex flex-col gap-3 text-sm text-text-muted leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                <b className="text-text">
                  {t(
                    "pages:student.lessons.uxNotes.item1Title",
                    "parroto.app/topics · YouTube:",
                  )}{" "}
                </b>
                {t(
                  "pages:student.lessons.uxNotes.item1Desc",
                  "Thẻ bài hiển thị đầy đủ thông tin: trình độ CEFR, thời lượng, nguồn YouTube/Audio, lượt học, PRO.",
                )}
              </p>
              <p>
                <b className="text-text">
                  {t(
                    "pages:student.lessons.uxNotes.item2Title",
                    "Hai chế độ ngay trên thẻ:",
                  )}{" "}
                </b>
                {t(
                  "pages:student.lessons.uxNotes.item2Desc",
                  "Nút Nghe chép / Shadowing ngay trên thẻ cho phép bấm thẳng vào luyện tập nhanh.",
                )}
              </p>
              <p>
                <b className="text-text">
                  {t(
                    "pages:student.lessons.uxNotes.item3Title",
                    "Tiếp tục học + gợi ý theo trình độ:",
                  )}{" "}
                </b>
                {t(
                  "pages:student.lessons.uxNotes.item3Desc",
                  "“Tiếp tục học” đặt trên cùng. Hàng “Hợp trình độ B1” gợi ý từ bài kiểm tra trình độ.",
                )}
              </p>
              <p>
                <b className="text-text">
                  {t(
                    "pages:student.lessons.uxNotes.item4Title",
                    "Lọc & tìm:",
                  )}{" "}
                </b>
                {t(
                  "pages:student.lessons.uxNotes.item4Desc",
                  "Tìm kiếm tức thì với debounce 300ms, lọc 3 cấp độ (Cơ bản/Trung cấp/Nâng cao), sắp xếp Phổ biến/Mới/Ngắn, và bộ lọc bài miễn phí.",
                )}
              </p>
              <p>
                <b className="text-text">
                  {t(
                    "pages:student.lessons.uxNotes.item5Title",
                    "Tạo bài từ YouTube:",
                  )}{" "}
                </b>
                {t(
                  "pages:student.lessons.uxNotes.item5Desc",
                  "AI tách câu và ước lượng CEFR, bài duyệt trước khi công khai.",
                )}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-border flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUxNotes(false)}
              >
                {t("common:actions.close", "Đóng")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div
            className="text-xs font-bold tracking-[0.12em] uppercase text-accent mb-1.5"
            id="lsOver"
          >
            {t("pages:student.lessons.overline", "Thư viện bài học")}
          </div>
          <h1
            id="lsTitle"
            className="text-3xl sm:text-4xl font-extrabold text-text font-display"
          >
            {t("pages:student.lessons.title", "Bài học")}
          </h1>
          <p className="text-[15px] text-text-muted mt-1.5" id="lsSub">
            {t("pages:student.lessons.subtitle", {
              total: totalLessons,
              topics: topics.length,
              defaultValue: `Nghe chép và shadowing trên video, audio thật · ${totalLessons} bài · ${topics.length} chủ đề`,
            })}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-md border border-border bg-surface text-text-muted text-sm font-semibold cursor-pointer transition-colors hover:bg-surface-hover hover:text-text hover:border-border-strong"
          data-ux="lessons"
          onClick={() => setShowUxNotes(true)}
        >
          <Icon name="lightbulb" />
          {t("pages:student.lessons.uxNotesBtn", "Ghi chú UX")}
        </button>
      </div>

      {/* ── YouTube Import Card ── */}
      <div className="relative mb-8 isolate">

        <div
          className="relative flex flex-wrap lg:flex-nowrap items-center gap-5 p-5 sm:p-6 rounded-4xl bg-surface-glass backdrop-blur-xl border border-border-strong shadow-[var(--shadow-card)]"
          style={{
            background:
              "radial-gradient(circle at 85% 15%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 55%), var(--surface)",
          }}
        >
          <div className="w-[52px] h-[52px] rounded-md grid place-items-center text-[28px] text-danger bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] shrink-0">
            <Icon name="video" />
          </div>
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xl text-text">
                {t(
                  "pages:student.lessons.ytCard.title",
                  "Tạo bài từ video YouTube",
                )}
              </h3>
              <Badge variant="primary">
                <Icon name="sparkles" />AI
              </Badge>
              <Badge variant="pro">
                <Icon name="crown" fill />PRO
              </Badge>
            </div>
            <p className="text-sm sm:text-[15px] text-text-muted mt-1 leading-relaxed">
              {t(
                "pages:student.lessons.ytCard.desc",
                "Dán link video tiếng Anh, AI tách câu, gắn mốc thời gian và ước lượng trình độ. Bài được duyệt trước khi hiện công khai.",
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto lg:flex-[0_1_460px]">
            <SearchInput
              className="flex-1"
              placeholder={t(
                "pages:student.lessons.ytCard.placeholder",
                "https://youtube.com/watch?v=…",
              )}
              ariaLabel="Link YouTube"
              icon={<Icon name="link" />}
              value={ytUrl}
              onChange={setYtUrl}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleYtCreate();
              }}
            />
            <Button
              variant="primary"
              data-act="ytCreate"
              onClick={handleYtCreate}
              leftIcon={<Icon name="wand-sparkles" />}
              className="w-full sm:w-auto justify-center"
            >
              {t("pages:student.lessons.ytCard.createBtn", "Tạo bài")}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 mb-5">
        <SearchInput
          className="w-full sm:flex-1 min-w-[200px]"
          id="lsSearch"
          placeholder={t(
            "pages:student.lessons.toolbar.searchPlaceholder",
            "Tìm bài học theo tên…",
          )}
          ariaLabel={t(
            "pages:student.lessons.toolbar.searchAria",
            "Tìm bài học",
          )}
          value={searchTerm}
          onChange={setSearchTerm}
        />

        {/* Level Segments */}
        <div className="overflow-x-auto scrollbar-none max-w-full">
          <SegmentedControl
            id="lsLevel"
            ariaLabel={t(
              "pages:student.lessons.toolbar.levels.label",
              "Trình độ",
            )}
            options={[
              {
                value: "all",
                label: t("pages:student.lessons.toolbar.levels.all", "Tất cả"),
              },
              {
                value: "basic",
                label: t(
                  "pages:student.lessons.toolbar.levels.basic",
                  "Cơ bản",
                ),
              },
              {
                value: "mid",
                label: t(
                  "pages:student.lessons.toolbar.levels.mid",
                  "Trung cấp",
                ),
              },
              {
                value: "adv",
                label: t(
                  "pages:student.lessons.toolbar.levels.adv",
                  "Nâng cao",
                ),
              },
            ]}
            value={level}
            onChange={setLevel}
          />
        </div>

        {/* Sort Segments */}
        <div className="overflow-x-auto scrollbar-none max-w-full">
          <SegmentedControl
            id="lsSort"
            ariaLabel={t(
              "pages:student.lessons.toolbar.sorts.label",
              "Sắp xếp",
            )}
            options={[
              {
                value: "pop",
                label: t("pages:student.lessons.toolbar.sorts.pop", "Phổ biến"),
                icon: <Icon name="flame" />,
              },
              {
                value: "new",
                label: t("pages:student.lessons.toolbar.sorts.new", "Mới"),
                icon: <Icon name="clock" />,
              },
              {
                value: "short",
                label: t("pages:student.lessons.toolbar.sorts.short", "Ngắn"),
                icon: <Icon name="timer" />,
              },
            ]}
            value={sortOrder}
            onChange={setSortOrder}
          />
        </div>

        {/* Free Filter Button */}
        <Chip
          id="lsFree"
          active={freeOnly}
          lift
          onClick={() => setFreeOnly(!freeOnly)}
          className="self-start sm:self-auto"
        >
          <Icon name="lock-open" />
          {t("pages:student.lessons.toolbar.freeOnly", "Chỉ bài miễn phí")}
        </Chip>
      </div>

      {/* ── Body Section ── */}
      <div id="lsBody">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Icon name="loader-circle" className="text-3xl animate-spin text-primary" />
          </div>
        ) : isError ? (
          <EmptyState
            title={t(
              "pages:student.lessons.error.title",
              "Không tải được thư viện bài học",
            )}
            description={t(
              "pages:student.lessons.error.desc",
              "Có lỗi khi kết nối tới máy chủ. Vui lòng thử lại.",
            )}
            actionText={t("pages:student.lessons.error.retry", "Thử lại")}
            onAction={() => void refetch()}
          />
        ) : isFiltered ? (
          /* ── Filter / Search Results Mode ── */
          <div className="mb-8">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
              <h2 className="font-display font-bold text-2xl text-text flex items-center">
                <span className="w-8 h-8 rounded-md inline-grid place-items-center bg-primary-soft text-accent text-lg align-middle mr-2.5">
                  <Icon name="filter" />
                </span>
                {t("pages:student.lessons.filterResults.title", "Kết quả")}{" "}
                <small className="text-sm font-medium text-text-muted ml-2">
                  {t("pages:student.lessons.filterResults.count", {
                    count: totalLessons,
                    defaultValue: `${totalLessons} bài`,
                  })}
                </small>
              </h2>
              <button
                className="inline-flex items-center gap-1.5 h-8.5 px-3 text-sm font-semibold text-text-muted hover:text-text cursor-pointer transition-colors"
                data-act="lsReset"
                onClick={handleResetFilters}
              >
                <Icon name="x" />
                {t(
                  "pages:student.lessons.filterResults.resetBtn",
                  "Xoá bộ lọc",
                )}
              </button>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {results.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={t(
                  "pages:student.lessons.empty.title",
                  "Không có bài nào khớp",
                )}
                description={t(
                  "pages:student.lessons.empty.desc",
                  "Thử bỏ bớt điều kiện hoặc tìm bằng từ khác.",
                )}
                actionText={t(
                  "pages:student.lessons.filterResults.resetBtn",
                  "Xoá bộ lọc",
                )}
                onAction={handleResetFilters}
              />
            )}
          </div>
        ) : (
          /* ── Default Topic-grouped Sections Mode (matches mockup & screenshots) ── */
          <>
            {/* 1. Tiếp tục học (nếu có bài đang học) */}
            {continueLessons.length > 0 && (
              <div className="mb-8">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
                  <h2 className="font-display font-bold text-2xl text-text flex items-center">
                    <span className="w-8 h-8 rounded-md inline-grid place-items-center bg-primary-soft text-accent text-lg align-middle mr-2.5">
                      <Icon name="circle-play" />
                    </span>
                    {t("pages:student.lessons.continue.title", "Tiếp tục học")}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {continueLessons.slice(0, 3).map((l) => (
                    <article
                      key={l.id}
                      className="group relative grid grid-cols-[88px_1fr_auto] items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-surface border border-border shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg cursor-pointer"
                      tabIndex={0}
                      onClick={() => navigate(`/student/lessons/${l.slug}`)}
                    >
                      <div className="w-[88px] h-14 rounded-sm relative grid place-items-center overflow-hidden border border-border bg-[radial-gradient(120%_100%_at_25%_10%,var(--primary-soft),transparent_60%)] bg-surface-hover">
                        <Icon name="headphones" className="relative z-10 text-2xl text-accent" />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <b className="font-body font-semibold text-base leading-tight text-text truncate">
                          {l.title}
                        </b>
                        <span className="text-sm text-text-muted truncate">
                          {t(
                            "pages:student.lessons.continue.dictationProgress",
                            {
                              current: Math.round(
                                (l.sentenceCount || 10) * 0.4,
                              ),
                              total: l.sentenceCount || 10,
                              defaultValue: `Nghe chép · câu ${Math.round(
                                (l.sentenceCount || 10) * 0.4,
                              )}/${l.sentenceCount || 10}`,
                            },
                          )}
                        </span>
                        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden relative mt-0.5">
                          <div
                            className="h-full rounded-full bg-gradient-primary transition-all duration-500 ease-out"
                            style={{ width: "40%" }}
                          ></div>
                        </div>
                      </div>
                      <button
                        className="w-10 h-10 rounded-full grid place-items-center bg-primary-soft text-accent border border-border hover:bg-primary hover:text-white hover:scale-105 transition-all duration-150 cursor-pointer"
                        aria-label={t("pages:student.lessons.continue.resume", {
                          title: l.title,
                          defaultValue: `Tiếp tục ${l.title}`,
                        })}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/student/lessons/${l.slug}?mode=dictation`);
                        }}
                      >
                        <Icon name="play" fill className="ml-0.5" />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Hợp trình độ B1 của bạn */}
            {b1Lessons.length > 0 && (
              <div className="mb-8">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
                  <h2 className="font-display font-bold text-2xl text-text flex items-center">
                    <span className="w-8 h-8 rounded-md inline-grid place-items-center bg-primary-soft text-accent text-lg align-middle mr-2.5">
                      <Icon name="sparkles" />
                    </span>
                    {t(
                      "pages:student.lessons.b1Section.title",
                      "Hợp trình độ B1 của bạn",
                    )}
                  </h2>
                  <span className="text-sm text-text-muted hidden sm:inline">
                    {t(
                      "pages:student.lessons.b1Section.hint",
                      "Gợi ý từ bài kiểm tra trình độ",
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {b1Lessons.slice(0, 4).map((l) => (
                    <LessonCard key={l.id} lesson={l} />
                  ))}
                </div>
              </div>
            )}

            {/* 3. Phân nhóm theo từng Topic */}
            {topicSections.length > 0 ? (
              topicSections.map((sec) => (
                <div
                  key={sec.topic.id || sec.topic.slug}
                  id={`topic-sec-${sec.topic.slug}`}
                  className="mb-8 scroll-mt-24"
                >
                  <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-4">
                    <h2 className="font-display font-bold text-xl sm:text-2xl text-text flex items-center">
                      <span className="w-8 h-8 rounded-md inline-grid place-items-center bg-primary-soft text-accent text-lg align-middle mr-2.5">
                        <Icon name={sec.topic.icon} fallback="library" />
                      </span>
                      {i18n.language === "en"
                        ? sec.topic.name || sec.topic.nameVi
                        : sec.topic.nameVi || sec.topic.name}
                      <small className="text-xs sm:text-sm font-medium text-text-muted ml-2">
                        {t("pages:student.lessons.topicSec.count", {
                          count: sec.totalLessons,
                          defaultValue: `${sec.totalLessons} bài`,
                        })}
                      </small>
                    </h2>
                    <button
                      className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-md border border-border bg-transparent hover:bg-surface-hover hover:border-border-strong text-text text-sm font-semibold transition-colors duration-150 cursor-pointer"
                      data-go="topic"
                      data-id={sec.topic.slug}
                      onClick={() =>
                        navigate(`/student/topics/${sec.topic.slug}`)
                      }
                    >
                      {t(
                        "pages:student.lessons.topicSec.viewAll",
                        "Xem tất cả",
                      )}
                      <Icon name="arrow-right" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {sec.lessons.slice(0, 4).map((l) => (
                      <LessonCard key={l.id} lesson={l} />
                    ))}
                  </div>
                </div>
              ))
            ) : results.length > 0 ? (
              /* Fallback if no topic grouping available yet */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mb-8">
                {results.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* ── Topic Chips Row ── */}
      <div
        className="flex flex-wrap gap-2 mb-6 max-w-full overflow-x-auto scrollbar-none pb-1"
        id="lsTopics"
      >
        {topics.map((t) => (
          <Chip
            key={t.id || t.slug}
            active={selectedTopic === t.slug}
            lift
            onClick={() => handleTopicClick(t.slug)}
            count={t.totalLessons}
          >
            <Icon name={t.icon} fallback="hash" />
            {i18n.language === "en" ? t.name || t.nameVi : t.nameVi || t.name}
          </Chip>
        ))}
      </div>
    </section>
  );
};
