import { Link } from "react-router-dom";
import Logo from "@/components/common/Logo";
import {
  Headphones,
  Mic,
  BookOpen,
  MessageSquare,
  Award,
  Bookmark,
  TrendingUp,
  User,
  Crown,
  HelpCircle,
  MessageCircle,
  AlertCircle,
  Mail,
  ShieldCheck,
  FileText,
  Sparkles,
  Globe,
  Send,
  Video,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-elevated)] border-t border-[var(--border)] pt-16 pb-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8 mb-14">
          {/* Brand Info (2 cols on large screen) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group" aria-label="LinguaLoop Trang chủ">
              <Logo size={36} showText={true} />
            </Link>

            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">
              Nền tảng luyện nghe chép chính tả (Dictation) và phát âm (Shadowing) trên video thực tế. Mỗi ngày 15 phút, giải quyết tận gốc các điểm yếu ngữ âm của bạn.
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs text-[var(--text-subtle)]">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Phát âm chuẩn</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                <Headphones className="w-3.5 h-3.5 text-pink-400" />
                <span>Video thực tế</span>
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-[var(--surface)] hover:bg-[#1877F2]/15 border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[#1877F2] transition-all hover:scale-105"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-[var(--surface)] hover:bg-[#FF0000]/15 border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[#FF0000] transition-all hover:scale-105"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-[var(--surface)] hover:bg-cyan-500/15 border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-cyan-400 transition-all hover:scale-105"
                aria-label="TikTok"
              >
                <Video className="w-4 h-4" />
              </a>
              <a
                href="mailto:support@lingualoop.app"
                className="w-9 h-9 rounded-lg bg-[var(--surface)] hover:bg-purple-500/15 border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-purple-400 transition-all hover:scale-105"
                aria-label="Gửi email cho LinguaLoop"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-[var(--surface)] hover:bg-blue-500/15 border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-blue-400 transition-all hover:scale-105"
                aria-label="Telegram Community"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Cột 1: Học tập */}
          <div>
            <h4 className="font-display font-semibold text-sm tracking-wide text-[var(--text)] uppercase mb-4">
              Luyện tập
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/dictation" className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                  <Headphones className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>Nghe chép chính tả</span>
                </Link>
              </li>
              <li>
                <Link to="/shadowing" className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                  <Mic className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
                  <span>Phát âm Shadowing</span>
                </Link>
              </li>
              <li>
                <Link to="/vocabulary" className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Kho từ vựng & SRS</span>
                </Link>
              </li>
              <li>
                <Link to="/practice-english-speaking" className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>Luyện nói giao tiếp</span>
                </Link>
              </li>
              <li>
                <Link to="/exams/ielts" className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                  <Award className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span>Luyện thi IELTS</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 2: Cá nhân */}
          <div>
            <h4 className="font-display font-semibold text-sm tracking-wide text-[var(--text)] uppercase mb-4">
              Cá nhân
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/mywords" className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                  <Bookmark className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span>Từ & câu đã lưu</span>
                </Link>
              </li>
              <li>
                <Link to="/weakness" className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Chẩn đoán điểm yếu</span>
                </Link>
              </li>
              <li>
                <Link to="/settings" className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                  <User className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Tài khoản cá nhân</span>
                </Link>
              </li>
              <li>
                <Link to="/settings?id=plan" className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                  <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Nâng cấp gói Pro</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ */}
          <div>
            <h4 className="font-display font-semibold text-sm tracking-wide text-[var(--text)] uppercase mb-4">
              Hỗ trợ
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors text-left">
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span>Hướng dẫn bắt đầu</span>
                </button>
              </li>
              <li>
                <button className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors text-left">
                  <MessageCircle className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
                  <span>Câu hỏi thường gặp</span>
                </button>
              </li>
              <li>
                <button className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors text-left">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span>Báo lỗi nội dung</span>
                </button>
              </li>
              <li>
                <button className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors text-left">
                  <Mail className="w-3.5 h-3.5 text-violet-400 group-hover:scale-110 transition-transform" />
                  <span>Góp ý phát triển</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Cột 4: Về LinguaLoop */}
          <div>
            <h4 className="font-display font-semibold text-sm tracking-wide text-[var(--text)] uppercase mb-4">
              Về LinguaLoop
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/brand" className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 group-hover:scale-110 transition-transform" />
                  <span>Bộ nhận diện & Loopi</span>
                </Link>
              </li>
              <li>
                <button className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors text-left">
                  <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:scale-110 transition-transform" />
                  <span>Điều khoản dịch vụ</span>
                </button>
              </li>
              <li>
                <button className="group flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors text-left">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Chính sách bảo mật</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-subtle)]">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>© 2026 LinguaLoop. Video bài học thuộc bản quyền của kênh gốc, chỉ dùng cho mục đích giáo dục.</span>
          </div>

          <div className="flex items-center gap-4">
            {/* System Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span>Hệ thống bình thường</span>
            </div>

            {/* Language Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
              <Globe className="w-3.5 h-3.5" />
              <span>Tiếng Việt (VN)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
