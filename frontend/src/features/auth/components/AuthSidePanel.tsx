import React from "react";

export const AuthSidePanel: React.FC = () => {
  return (
    <aside className="auth-side">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <svg className="ll-brand-mark" viewBox="0 0 100 100" aria-hidden="true">
          <use href="#logo-mark" />
        </svg>
        <span className="ll-wordmark">
          Lingua<b className="ll-loop">Loop</b>
        </span>
      </div>

      {/* Hero card */}
      <div className="auth-hero relative max-w-[460px]">
        {/* Decorative 3D objects */}
        <svg
          className="ll-obj"
          viewBox="0 0 200 200"
          style={{ "--s": "104px", top: "-48px", right: "-28px", "--d": "-2s" } as React.CSSProperties}
          aria-hidden="true"
        >
          <use href="#o-orb" />
        </svg>
        <svg
          className="ll-obj"
          viewBox="0 0 200 200"
          style={{ "--s": "80px", bottom: "-36px", left: "-28px", "--d": "-5s", "--dur": "9s" } as React.CSSProperties}
          aria-hidden="true"
        >
          <use href="#o-torus" />
        </svg>

        {/* Glass card */}
        <div className="auth-hero-card ll-glass ll-spotlight">
          <img
            src="/loopi-hello.svg"
            width={120}
            height={120}
            alt="Loopi vẫy tay chào"
            draggable={false}
            style={{ margin: "-12px 0 8px -10px" }}
          />
          <h2
            style={{
              fontSize: 32,
              lineHeight: 1.15,
              marginBottom: 24,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
            }}
          >
            Nghe, chép, nói theo.<br />
            Mỗi ngày 15 phút.
          </h2>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
            <li className="flex gap-[14px] items-start">
              <span className="ll-sec-ic">
                <i className="ph-duotone ph-headphones" />
              </span>
              <div>
                <b className="block text-[15px] mb-0.5">Nghe chép có chấm từng từ</b>
                <span className="text-[13px] leading-snug" style={{ color: "var(--text-muted)" }}>
                  Biết mình hay sót từ nhỏ hay sai đuôi -ed.
                </span>
              </div>
            </li>
            <li className="flex gap-[14px] items-start">
              <span className="ll-sec-ic">
                <i className="ph-duotone ph-microphone" />
              </span>
              <div>
                <b className="block text-[15px] mb-0.5">AI chấm phát âm tới từng âm</b>
                <span className="text-[13px] leading-snug" style={{ color: "var(--text-muted)" }}>
                  Thấy ngay /θ/ đang bị đọc thành /t/.
                </span>
              </div>
            </li>
            <li className="flex gap-[14px] items-start">
              <span className="ll-sec-ic">
                <i className="ph-duotone ph-cards" />
              </span>
              <div>
                <b className="block text-[15px] mb-0.5">Ôn từ đúng lúc sắp quên</b>
                <span className="text-[13px] leading-snug" style={{ color: "var(--text-muted)" }}>
                  Từ lưu khi học tự vào lịch ôn.
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer tagline */}
      <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Gần 670 bài từ video thật · 8 chủ đề · miễn phí để bắt đầu
      </p>
    </aside>
  );
};

export default AuthSidePanel;
