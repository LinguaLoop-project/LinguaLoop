import type { ReactNode } from "react";
import {
  type LucideIcon,
  Menu,
  Moon,
  Music2,
  Upload,
  RotateCw,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpenText,
  Bookmark,
  Bot,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CirclePlay,
  CircleUser,
  Clapperboard,
  Clock,
  Contrast,
  CreditCard,
  Crown,
  Eye,
  EyeOff,
  FileCheck,
  Film,
  Filter,
  Flag,
  Flame,
  Folders,
  Globe,
  GraduationCap,
  Hash,
  Headphones,
  HeartPulse,
  History,
  House,
  Info,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Leaf,
  Library,
  Lightbulb,
  Link,
  ListOrdered,
  LoaderCircle,
  Lock,
  LockKeyhole,
  LockOpen,
  LogOut,
  Luggage,
  Mail,
  MessagesSquare,
  Mic,
  Music,
  Newspaper,
  Palette,
  PencilLine,
  Plane,
  PlaneTakeoff,
  Play,
  Plus,
  Presentation,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
  Timer,
  TrendingUp,
  TriangleAlert,
  User,
  Users,
  Utensils,
  Video,
  Volume2,
  WandSparkles,
  Pause,
  Square,
  Wrench,
  X,
  Zap,
} from "lucide-react";

/** Chỉ các icon liệt kê ở đây được đóng gói; thêm icon mới thì import ở trên và thêm vào bảng. */
const ICONS: Record<string, LucideIcon> = {
  "menu": Menu,
  "moon": Moon,
  "music-2": Music2,
  "upload": Upload,
  "rotate-cw": RotateCw,
  "pause": Pause,
  "square": Square,
  "wrench": Wrench,
  "panel-left-close": PanelLeftClose,
  "panel-left-open": PanelLeftOpen,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "audio-lines": AudioLines,
  "book-open-text": BookOpenText,
  "bookmark": Bookmark,
  "bot": Bot,
  "briefcase": Briefcase,
  "calendar": Calendar,
  "check": Check,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "circle-alert": CircleAlert,
  "circle-check": CircleCheck,
  "circle-play": CirclePlay,
  "circle-user": CircleUser,
  "clapperboard": Clapperboard,
  "clock": Clock,
  "contrast": Contrast,
  "credit-card": CreditCard,
  "crown": Crown,
  "eye": Eye,
  "eye-off": EyeOff,
  "file-check": FileCheck,
  "film": Film,
  "filter": Filter,
  "flag": Flag,
  "flame": Flame,
  "folders": Folders,
  "globe": Globe,
  "graduation-cap": GraduationCap,
  "hash": Hash,
  "headphones": Headphones,
  "heart-pulse": HeartPulse,
  "history": History,
  "house": House,
  "info": Info,
  "layers": Layers,
  "layout-dashboard": LayoutDashboard,
  "layout-grid": LayoutGrid,
  "leaf": Leaf,
  "library": Library,
  "lightbulb": Lightbulb,
  "link": Link,
  "list-ordered": ListOrdered,
  "loader-circle": LoaderCircle,
  "lock": Lock,
  "lock-keyhole": LockKeyhole,
  "lock-open": LockOpen,
  "log-out": LogOut,
  "luggage": Luggage,
  "mail": Mail,
  "messages-square": MessagesSquare,
  "mic": Mic,
  "music": Music,
  "newspaper": Newspaper,
  "palette": Palette,
  "pencil-line": PencilLine,
  "plane": Plane,
  "plane-takeoff": PlaneTakeoff,
  "play": Play,
  "plus": Plus,
  "presentation": Presentation,
  "refresh-cw": RefreshCw,
  "search": Search,
  "send": Send,
  "settings": Settings,
  "shield-check": ShieldCheck,
  "sliders-horizontal": SlidersHorizontal,
  "sparkles": Sparkles,
  "sun": Sun,
  "target": Target,
  "timer": Timer,
  "trending-up": TrendingUp,
  "triangle-alert": TriangleAlert,
  "user": User,
  "users": Users,
  "utensils": Utensils,
  "video": Video,
  "volume-2": Volume2,
  "wand-sparkles": WandSparkles,
  "x": X,
  "zap": Zap,
};


/** Icon thương hiệu mà Lucide 1.x không còn; vẽ cùng kiểu nét 24px của Lucide 0.468 (mockup v2). */
const BRAND_PATHS: Record<string, ReactNode> = {
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  youtube: (
    <>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </>
  ),
};

/** Cột `topics.icon` do backend lưu theo tên Phosphor cũ; ánh xạ sang Lucide cho tới khi dữ liệu được cập nhật. */
const LEGACY_ALIASES: Record<string, string> = {
  "chats-circle": "messages-square",
  "airplane-tilt": "plane",
  "airplane-takeoff": "plane-takeoff",
  "film-slate": "clapperboard",
  "briefcase": "briefcase",
  "newspaper": "newspaper",
  "exam": "file-check",
  "music-notes": "music",
  "leaf": "leaf",
  "books": "library",
  "suitcase-rolling": "luggage",
  "fork-knife": "utensils",
  "heartbeat": "heart-pulse",
  "graduation-cap": "graduation-cap",
  "microphone": "mic",
  "headphones": "headphones",
  "globe": "globe",
  "hash": "hash",
};

export interface IconProps {
  /** Tên Lucide (kebab-case). Tên không có trong bảng thì dùng `fallback`. */
  name?: string | null;
  fallback?: string;
  className?: string;
  /** Tô đặc, chỉ hợp icon ít nét (play, crown, flame, zap). */
  fill?: boolean;
  strokeWidth?: number;
}

/** Icon dùng chung. Mặc định cao bằng cỡ chữ hiện tại (1em) nên đổi cỡ bằng `text-*`. */
export default function Icon({ name, fallback = "hash", className, fill = false, strokeWidth }: IconProps) {
  const key = name ? (LEGACY_ALIASES[name] ?? name) : fallback;
  const brand = BRAND_PATHS[key];
  if (brand) {
    return (
      <svg
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill={fill ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={strokeWidth ?? 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`shrink-0 ${className ?? ""}`.trim()}
        aria-hidden="true"
        focusable="false"
      >
        {brand}
      </svg>
    );
  }
  const Component = ICONS[key] ?? ICONS[fallback] ?? ICONS.hash;
  return (
    <Component
      className={`shrink-0 ${className ?? ""}`.trim()}
      width="1em"
      height="1em"
      fill={fill ? "currentColor" : "none"}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      focusable="false"
    />
  );
}
