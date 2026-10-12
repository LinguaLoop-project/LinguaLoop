import React from "react";

export interface PasswordStrengthMeterProps {
  score: number; // 0 to 4
  className?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  score,
  className = "",
}) => {
  const getSegmentColor = (index: number) => {
    if (index >= score) return "bg-border-strong";
    if (score === 1) return "bg-danger";
    if (score === 2) return "bg-warning";
    if (score === 3) return "bg-accent";
    return "bg-success";
  };

  return (
    <div
      className={`grid grid-cols-4 gap-1 h-1 mt-1.5 ${className}`}
      aria-hidden="true"
    >
      {[0, 1, 2, 3].map((idx) => (
        <span
          key={idx}
          className={`h-full rounded-sm transition-colors duration-200 ${getSegmentColor(idx)}`}
        />
      ))}
    </div>
  );
};

export default PasswordStrengthMeter;
