/**
 * SVG Sprite container — chứa tất cả symbol dùng chung trong app.
 * Đặt component này ở root layout để các trang con có thể dùng <use href="#...">
 */
const SvgSprites = () => (
  <svg
    className="sprite"
    aria-hidden="true"
    focusable="false"
    style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
  >
    <defs>
      {/* ── Gradient cho 3D objects ── */}
      <radialGradient id="gBody" cx=".38" cy=".3" r=".85">
        <stop offset="0" style={{ stopColor: "var(--surface-hover)" }} />
        <stop offset=".55" style={{ stopColor: "var(--bg-base)" }} />
        <stop offset="1" style={{ stopColor: "var(--bg-base)" }} />
      </radialGradient>
      <radialGradient id="gRim" cx=".75" cy=".85" r=".7">
        <stop offset="0" style={{ stopColor: "var(--primary)", stopOpacity: 0.9 }} />
        <stop offset=".45" style={{ stopColor: "var(--primary)", stopOpacity: 0.25 }} />
        <stop offset="1" style={{ stopColor: "var(--primary)", stopOpacity: 0 }} />
      </radialGradient>
      <linearGradient id="gEdge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.85 }} />
        <stop offset=".45" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
        <stop offset="1" style={{ stopColor: "var(--accent-2)", stopOpacity: 0.85 }} />
      </linearGradient>
      <radialGradient id="gSpec">
        <stop offset="0" stopColor="#fff" stopOpacity={0.85} />
        <stop offset="1" stopColor="#fff" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="gHalo">
        <stop offset="0" style={{ stopColor: "var(--primary)", stopOpacity: 0.45 }} />
        <stop offset="1" style={{ stopColor: "var(--primary)", stopOpacity: 0 }} />
      </radialGradient>
      <linearGradient id="gLogo" x1="20" y1="88" x2="80" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0" style={{ stopColor: "var(--ll-s1, #8B5CF6)" }} />
        <stop offset=".55" style={{ stopColor: "var(--ll-s2, #C084FC)" }} />
        <stop offset="1" style={{ stopColor: "var(--ll-s3, #F0ABFC)" }} />
      </linearGradient>
    </defs>

    {/* ── Logo mark ── */}
    <symbol id="logo-mark-lg" viewBox="0 0 100 100">
      <path d="M24 88 L34 73.7 A32 32 0 1 1 66 73.7" fill="none" style={{ stroke: "url(#gLogo)" }} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M79.8 76.1 L66 73.7 L70.8 60.5" fill="none" style={{ stroke: "url(#gLogo)" }} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M37 39 V53 M50 32 V60 M63 38 V54" fill="none" style={{ stroke: "var(--text)" }} strokeWidth="7" strokeLinecap="round" />
    </symbol>
    <symbol id="logo-mark" viewBox="0 0 100 100">
      <path d="M24 88 L34 73.7 A32 32 0 1 1 66 73.7" fill="none" style={{ stroke: "url(#gLogo)" }} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M79.8 76.1 L66 73.7 L70.8 60.5" fill="none" style={{ stroke: "url(#gLogo)" }} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M37 39 V53 M50 32 V60 M63 38 V54" fill="none" style={{ stroke: "var(--text)" }} strokeWidth="9" strokeLinecap="round" />
    </symbol>
    <symbol id="logo-mark-sm" viewBox="0 0 100 100">
      <path d="M24 88 L34 73.7 A32 32 0 1 1 66 73.7" fill="none" style={{ stroke: "url(#gLogo)" }} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 41 V51 M50 35 V57 M62 41 V51" fill="none" style={{ stroke: "var(--text)" }} strokeWidth="11" strokeLinecap="round" />
    </symbol>

    {/* ── Decorative 3D objects ── */}
    <symbol id="o-orb" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="86" fill="url(#gBody)" />
      <circle cx="100" cy="100" r="86" fill="url(#gRim)" />
      <circle cx="100" cy="100" r="85" fill="none" stroke="url(#gEdge)" strokeWidth="2.5" />
      <ellipse cx="66" cy="58" rx="28" ry="13" transform="rotate(-32 66 58)" fill="url(#gSpec)" />
    </symbol>
    <symbol id="o-torus" viewBox="0 0 200 200">
      <path fillRule="evenodd" d="M10 100a90 58 0 1 0 180 0a90 58 0 1 0-180 0ZM60 92a40 18 0 1 0 80 0a40 18 0 1 0-80 0Z" fill="url(#gBody)" />
      <path fillRule="evenodd" d="M10 100a90 58 0 1 0 180 0a90 58 0 1 0-180 0ZM60 92a40 18 0 1 0 80 0a40 18 0 1 0-80 0Z" fill="url(#gRim)" />
      <path fillRule="evenodd" d="M10 100a90 58 0 1 0 180 0a90 58 0 1 0-180 0ZM60 92a40 18 0 1 0 80 0a40 18 0 1 0-80 0Z" fill="none" stroke="url(#gEdge)" strokeWidth="2.5" />
      <ellipse cx="56" cy="74" rx="26" ry="8" transform="rotate(-18 56 74)" fill="url(#gSpec)" />
    </symbol>
    <symbol id="o-star" viewBox="0 0 200 200">
      <path d="M100 6C107 72 128 93 194 100C128 107 107 128 100 194C93 128 72 107 6 100C72 93 93 72 100 6Z" fill="url(#gBody)" />
      <path d="M100 6C107 72 128 93 194 100C128 107 107 128 100 194C93 128 72 107 6 100C72 93 93 72 100 6Z" fill="url(#gRim)" />
      <path d="M100 6C107 72 128 93 194 100C128 107 107 128 100 194C93 128 72 107 6 100C72 93 93 72 100 6Z" fill="none" stroke="url(#gEdge)" strokeWidth="2.5" />
      <ellipse cx="82" cy="80" rx="14" ry="6" transform="rotate(-40 82 80)" fill="url(#gSpec)" />
    </symbol>
    <symbol id="o-cone" viewBox="0 0 200 200">
      <path d="M100 10L174 158A74 26 0 0 1 26 158Z" fill="url(#gBody)" />
      <path d="M100 10L174 158A74 26 0 0 1 26 158Z" fill="url(#gRim)" />
      <path d="M100 10L174 158A74 26 0 0 1 26 158Z" fill="none" stroke="url(#gEdge)" strokeWidth="2.5" />
      <path d="M26 158A74 26 0 0 0 174 158" fill="none" stroke="url(#gEdge)" strokeWidth="2" opacity="0.6" />
      <ellipse cx="74" cy="92" rx="5" ry="40" transform="rotate(26 74 92)" fill="url(#gSpec)" />
    </symbol>

    {/* ── Google logo ── */}
    <symbol id="g-google" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </symbol>
  </svg>
);

export default SvgSprites;
