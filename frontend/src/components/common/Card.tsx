import React, { forwardRef } from "react";
import { useSpotlight } from "@/hooks/useSpotlight";

export type CardVariant = "standard" | "glass" | "highlight" | "elevated";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
  spotlight?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "standard",
      hoverable = false,
      spotlight = false,
      children,
      className = "",
      onMouseMove,
      onMouseLeave,
      style,
      ...props
    },
    ref,
  ) => {
    const {
      onMouseMove: handleSpotlightMove,
      onMouseLeave: handleSpotlightLeave,
      style: spotlightStyle,
    } = useSpotlight({
      color: "color-mix(in srgb, var(--primary) 18%, transparent)",
      stopPercent: "60%",
    });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (spotlight) {
        handleSpotlightMove(e);
      }
      onMouseMove?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      if (spotlight) {
        handleSpotlightLeave(e);
      }
      onMouseLeave?.(e);
    };

    // Variant classes mapping
    let variantClass = "bg-surface border border-border rounded-2xl shadow-[var(--shadow-card)] p-6 transition-all duration-200";
    if (variant === "glass") {
      variantClass = "bg-surface-glass backdrop-blur-xl border border-border-strong rounded-2xl shadow-[var(--shadow-card)] p-6 transition-all duration-200";
    } else if (variant === "highlight") {
      variantClass = "relative bg-surface border border-accent/30 rounded-2xl shadow-[var(--shadow-card)] p-6 transition-all duration-200";
    } else if (variant === "elevated") {
      variantClass = "bg-bg-elevated border border-border rounded-2xl shadow-[var(--shadow-card)] p-6 transition-all duration-200";
    }

    const hoverClass = hoverable
      ? "hover:-translate-y-1 hover:border-border-strong hover:shadow-2xl cursor-pointer"
      : "";

    const dynamicStyle: React.CSSProperties = spotlight
      ? ({
          ...spotlightStyle,
          ...style,
        } as React.CSSProperties)
      : (style || {});

    return (
      <div
        ref={ref}
        className={[variantClass, hoverClass, className]
          .filter(Boolean)
          .join(" ")}
        style={dynamicStyle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
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
