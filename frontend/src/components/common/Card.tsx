import React, { forwardRef } from "react";

export type CardVariant = "standard" | "glass" | "highlight" | "elevated";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
}

const BASE = "rounded-2xl p-6 transition-[transform,border-color] duration-200";

/** Hai bề mặt chính của DESIGN.v2 §5: `card` (standard) và `glass`; "highlight" dùng viền primary 2px thay viền gradient. */
const VARIANTS: Record<CardVariant, string> = {
  standard: "bg-surface border border-border shadow-[var(--shadow-card)]",
  glass: "bg-surface-glass backdrop-blur-xl border border-border-strong shadow-[var(--shadow-card)]",
  highlight: "bg-surface border-2 border-primary shadow-[var(--shadow-card)]",
  elevated: "bg-bg-elevated border border-border shadow-[var(--shadow-card)]",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "standard", hoverable = false, children, className = "", ...props }, ref) => {
    const hoverClass = hoverable ? "hover:-translate-y-0.5 hover:border-border-strong cursor-pointer" : "";
    return (
      <div ref={ref} className={[BASE, VARIANTS[variant], hoverClass, className].filter(Boolean).join(" ")} {...props}>
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 pb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  ),
);
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as: Component = "h3", className = "", children, ...props }, ref) => (
    <Component
      ref={ref}
      className={`font-semibold text-lg leading-snug tracking-tight text-text ${className}`}
      {...props}
    >
      {children}
    </Component>
  ),
);
CardTitle.displayName = "CardTitle";

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;
export const CardDescription = forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className = "", children, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-text-muted ${className}`}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = "CardDescription";

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = "", children, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  ),
);
CardContent.displayName = "CardContent";

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center pt-4 border-t border-border ${className}`}
      {...props}
    >
      {children}
    </div>
  ),
);
CardFooter.displayName = "CardFooter";

export default Card;
