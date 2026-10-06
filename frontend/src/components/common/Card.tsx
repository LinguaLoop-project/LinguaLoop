import React, { forwardRef, useState } from "react";

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
      style,
      ...props
    },
    ref,
  ) => {
    const [mousePos, setMousePos] = useState({ x: -999, y: -999 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (spotlight) {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      onMouseMove?.(e);
    };

    // Variant classes mapping
    let variantClass = "ll-card";
    if (variant === "glass") {
      variantClass = "ll-glass";
    } else if (variant === "highlight") {
      variantClass = "ll-card-highlight";
    } else if (variant === "elevated") {
      variantClass = "bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]";
    }

    const hoverClass = hoverable
      ? "transition-all duration-200 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-lg"
      : "";

    const spotlightClass = spotlight ? "ll-spotlight" : "";

    const dynamicStyle = spotlight
      ? ({
          ...style,
          "--mx": `${mousePos.x}px`,
          "--my": `${mousePos.y}px`,
        } as React.CSSProperties)
      : style;

    return (
      <div
        ref={ref}
        className={[variantClass, hoverClass, spotlightClass, className]
          .filter(Boolean)
          .join(" ")}
        style={dynamicStyle}
        onMouseMove={handleMouseMove}
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
      className={`font-semibold text-lg leading-snug tracking-tight text-[var(--text)] ${className}`}
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
    className={`text-sm text-[var(--text-muted)] ${className}`}
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
      className={`flex items-center pt-4 border-t border-[var(--border)] ${className}`}
      {...props}
    >
      {children}
    </div>
  ),
);
CardFooter.displayName = "CardFooter";

export default Card;
