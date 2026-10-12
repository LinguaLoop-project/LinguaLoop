import React, { useCallback } from "react";

export interface UseSpotlightOptions {
  /**
   * Bán kính vòng sáng tính bằng pixel (mặc định: 400)
   */
  radius?: number;
  /**
   * Màu của vòng sáng (mặc định: rgba(139, 92, 246, 0.15) - primary soft)
   */
  color?: string;
  /**
   * Độ phủ gradient dừng lại (mặc định: "40%")
   */
  stopPercent?: string;
}

export function useSpotlight<T extends HTMLElement = HTMLDivElement>(
  options: UseSpotlightOptions = {},
) {
  const {
    radius = 400,
    color = "rgba(139, 92, 246, 0.15)",
    stopPercent = "40%",
  } = options;

  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    e.currentTarget.style.setProperty("--mx", `${x}px`);
    e.currentTarget.style.setProperty("--my", `${y}px`);
  }, []);

  const onMouseLeave = useCallback((e: React.MouseEvent<T>) => {
    e.currentTarget.style.setProperty("--mx", "-999px");
    e.currentTarget.style.setProperty("--my", "-999px");
  }, []);

  const spotlightStyle: React.CSSProperties = {
    backgroundImage: `radial-gradient(${radius}px circle at var(--mx, -999px) var(--my, -999px), ${color}, transparent ${stopPercent})`,
  };

  return {
    onMouseMove,
    onMouseLeave,
    style: spotlightStyle,
    /**
     * Props tiện lợi để rải trực tiếp vào element JSX:
     * `<div {...spotlightProps}>`
     */
    spotlightProps: {
      onMouseMove,
      onMouseLeave,
      style: spotlightStyle,
    },
  };
}

export default useSpotlight;
