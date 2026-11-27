import { useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import SpotlightCard from "./SpotlightCard";

type PhonemeKey = "theta" | "eth" | "r" | "ae" | "ih" | "ng" | "sh" | "ch" | "v" | "z" | "au" | "ei";

const SAMPLE_PHONEMES: { key: PhonemeKey; symbol: string; score: number; tier: "good" | "mid" | "weak" }[] = [
  { key: "theta", symbol: "/θ/", score: 62, tier: "weak" },
  { key: "eth", symbol: "/ð/", score: 68, tier: "weak" },
  { key: "r", symbol: "/r/", score: 74, tier: "mid" },
  { key: "ae", symbol: "/æ/", score: 79, tier: "mid" },
  { key: "ih", symbol: "/ɪ/", score: 85, tier: "good" },
  { key: "ng", symbol: "/ŋ/", score: 88, tier: "good" },
  { key: "sh", symbol: "/ʃ/", score: 91, tier: "good" },
  { key: "ch", symbol: "/tʃ/", score: 76, tier: "mid" },
  { key: "v", symbol: "/v/", score: 94, tier: "good" },
  { key: "z", symbol: "/z/", score: 64, tier: "weak" },
  { key: "au", symbol: "/aʊ/", score: 89, tier: "good" },
  { key: "ei", symbol: "/eɪ/", score: 93, tier: "good" },
];

const PHONEME_TIER_CLASS = {
  good: "border-success/30 bg-success/10 text-success hover:bg-success/18",
  mid: "border-warning/35 bg-warning/10 text-warning hover:bg-warning/18",
  weak: "border-danger/35 bg-danger/10 text-danger hover:bg-danger/18",
} as const;

const BAR_TONE_CLASS: Record<string, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-info",
  primary: "bg-primary",
};

interface DictationGroupItem {
  label: string;
  pct: number;
  tone: string;
}

/** Lưới Bento bất đối xứng cho 4 tính năng cốt lõi với tương tác và UI mockup trực quan. */
export default function FeatureBento() {
  const { t } = useTranslation("landing");
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeKey>("theta");

  const activePhoneme = SAMPLE_PHONEMES.find((p) => p.key === selectedPhoneme) ?? SAMPLE_PHONEMES[0];
  const dictationGroups = t("features.dictation.groups", { returnObjects: true }) as DictationGroupItem[];
  const vocabModes = t("features.vocab.modes", { returnObjects: true }) as string[];

  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-12">
      {/* 1. Spotlight 7 cột: Bản đồ 44 âm vị tương tác */}
      <SpotlightCard
        as="article"
        glowColor="var(--fn-weakness)"
        className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-7 lg:col-span-7"
      >
        <div>
          <Badge variant="danger">
            <Icon name="target" />
            {t("features.weakness.badge")}
          </Badge>
          <h3 className="mt-3 font-display text-2xl font-bold text-text">{t("features.weakness.title")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">{t("features.weakness.desc")}</p>
        </div>

        <div className="rounded-lg border border-border bg-bg-elevated/80 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5 font-medium text-text">
              <Icon name="crosshair" className="text-primary-text" />
              {t("features.weakness.tapHint")}
            </span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <i aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
                {t("features.weakness.legendGood")}
              </span>
              <span className="inline-flex items-center gap-1">
                <i aria-hidden="true" className="h-2 w-2 rounded-full bg-warning" />
                {t("features.weakness.legendMid")}
              </span>
              <span className="inline-flex items-center gap-1">
                <i aria-hidden="true" className="h-2 w-2 rounded-full bg-danger" />
                {t("features.weakness.legendWeak")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {SAMPLE_PHONEMES.map((p) => {
              const isSelected = p.key === selectedPhoneme;
              return (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedPhoneme(p.key)}
                  className={`flex flex-col items-center rounded-md border px-2 py-2 text-center transition-all ${
                    PHONEME_TIER_CLASS[p.tier]
                  } ${isSelected ? "scale-[1.03] ring-2 ring-primary ring-offset-1 ring-offset-bg-elevated" : ""}`}
                >
                  <span className="font-mono text-sm font-bold">{p.symbol}</span>
                  <span className="mt-0.5 text-[11px] font-medium tabular-nums opacity-90">{p.score}%</span>
                </button>
              );
            })}
          </div>

          {/* Chi tiết âm vị đang chọn */}
          <div className="mt-3.5 rounded-md border border-border bg-surface p-3.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-sm bg-primary-soft px-2 py-0.5 font-mono text-sm font-bold text-primary-text">
                {activePhoneme.symbol}
              </span>
              <span className="font-semibold text-text">
                {t("features.weakness.exampleLabel")}:{" "}
                <em className="font-normal not-italic text-text-muted">
                  {t(`features.weakness.items.${activePhoneme.key}.example`)}
                </em>
              </span>
              <span className="text-border-strong">•</span>
              <span className="font-semibold text-text">
                {t("features.weakness.confusionLabel")}:{" "}
                <span className="font-medium text-danger">
                  {t(`features.weakness.items.${activePhoneme.key}.confusion`)}
                </span>
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
              {t(`features.weakness.items.${activePhoneme.key}.tip`)}
            </p>
          </div>
        </div>
      </SpotlightCard>

      {/* 2. 5 cột: Biểu đồ nhóm từ lỗi nghe chép */}
      <SpotlightCard
        as="article"
        glowColor="var(--fn-dictation)"
        className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-7 lg:col-span-5"
      >
        <div>
          <Badge variant="info">
            <Icon name="headphones" />
            {t("features.dictation.badge")}
          </Badge>
          <h3 className="mt-3 font-display text-2xl font-bold text-text">{t("features.dictation.title")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">{t("features.dictation.desc")}</p>
        </div>

        <div className="rounded-lg border border-border bg-bg-elevated/80 p-4">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold text-text-muted">
            <span>{t("features.dictation.chartTitle")}</span>
            <Icon name="chart-line" className="text-fn-dictation" />
          </div>
          <div className="flex flex-col gap-3">
            {dictationGroups.map((g) => (
              <div key={g.label}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-text">{g.label}</span>
                  <span className="font-mono font-semibold tabular-nums text-text-muted">{g.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full ${BAR_TONE_CLASS[g.tone] ?? "bg-primary"}`}
                    style={{ width: `${Math.min(100, g.pct * 2.2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3.5 border-t border-border pt-3 text-xs text-text-muted">
            {t("features.dictation.footnote")}
          </p>
        </div>
      </SpotlightCard>

      {/* 3. 6 cột: Khung chat mini Gia sư AI thời gian thực */}
      <SpotlightCard
        as="article"
        glowColor="var(--primary)"
        className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-7 lg:col-span-6"
      >
        <div>
          <Badge variant="primary">
            <Icon name="bot" />
            {t("features.tutor.badge")}
          </Badge>
          <h3 className="mt-3 font-display text-2xl font-bold text-text">{t("features.tutor.title")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">{t("features.tutor.desc")}</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-primary/25 bg-bg-elevated/85">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-primary-soft/50 px-4 py-2.5 text-xs font-semibold text-primary-text">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="audio-lines" className="text-sm" />
              {t("features.tutor.chat.header")}
            </span>
            <span className="inline-flex items-center gap-1 text-success">
              <i aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
              Live
            </span>
          </div>

          <div className="flex flex-col gap-3 p-4 text-[13px]">
            {/* Bong bóng AI nhắc lỗi */}
            <div className="max-w-[92%] self-start rounded-lg rounded-tl-xs border border-border bg-surface px-3.5 py-2.5 leading-relaxed text-text">
              {t("features.tutor.chat.aiPrompt")}
            </div>

            {/* Lượt đọc lại của học viên + nhảy điểm */}
            <div className="flex max-w-[90%] flex-wrap items-center gap-2 self-end rounded-lg rounded-tr-xs border border-fn-shadowing/30 bg-fn-shadowing-soft px-3.5 py-2 text-text">
              <Icon name="mic" className="text-sm text-fn-shadowing" />
              <span className="font-medium">{t("features.tutor.chat.userRetry")}</span>
              <Badge variant="success">
                <Icon name="trending-up" />
                {t("features.tutor.chat.scoreJump")}
              </Badge>
            </div>

            {/* Bong bóng AI khen & chốt */}
            <div className="max-w-[92%] self-start rounded-lg rounded-tl-xs border border-success/30 bg-success/10 px-3.5 py-2.5 leading-relaxed text-text">
              {t("features.tutor.chat.aiPraise")}
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* 4. 6 cột: Khung Học thụ động mini + 4 chế độ học thẻ SM-2 */}
      <SpotlightCard
        as="article"
        glowColor="var(--fn-watch)"
        className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-7 lg:col-span-6"
      >
        <div>
          <Badge variant="success">
            <Icon name="monitor-play" />
            {t("features.vocab.badge")}
          </Badge>
          <h3 className="mt-3 font-display text-2xl font-bold text-text">{t("features.vocab.title")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">{t("features.vocab.desc")}</p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Khung giả lập video Học thụ động nền tối */}
          <div className="overflow-hidden rounded-lg border border-border-strong bg-[#0B0816] p-4 text-[#F4F1FF]">
            <div className="flex items-center justify-between gap-2 text-[11px] text-[#A59DC0]">
              <span className="inline-flex items-center gap-1.5 font-medium text-watch-video">
                <Icon name="circle-play" className="text-sm" />
                {t("features.vocab.watchCaption")}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-medium text-video-accent">
                {t("features.vocab.sm2Badge")}
              </span>
            </div>

            <p className="mt-3 font-display text-lg font-bold leading-snug">
              {t("features.vocab.watchLineBefore")}
              <span className="rounded-sm bg-video-accent/20 px-1.5 py-0.5 text-video-accent underline decoration-video-accent/70 underline-offset-4">
                {t("features.vocab.watchLineActive")}
              </span>
              {t("features.vocab.watchLineAfter")}
            </p>

            <div className="mt-2.5 flex items-center gap-2 text-xs text-[#C8C2DE]">
              <Icon name="bookmark-check" className="text-watch-video" />
              <span>{t("features.vocab.watchMeaning")}</span>
            </div>
          </div>

          {/* 4 cách học thẻ */}
          <div className="grid grid-cols-2 gap-2">
            {vocabModes.map((modeLabel, idx) => (
              <div
                key={modeLabel}
                className="flex items-center gap-2 rounded-md border border-border bg-bg-elevated/80 px-3 py-2 text-xs font-semibold text-text sm:text-sm"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-sm bg-fn-vocab-soft text-[11px] font-bold text-fn-vocab">
                  {idx + 1}
                </span>
                <span className="truncate">{modeLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}
