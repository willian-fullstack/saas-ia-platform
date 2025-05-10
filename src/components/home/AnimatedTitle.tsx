"use client";

import { ReactNode, useEffect, useState } from "react";

interface AnimatedTitleProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  highlight?: boolean;
  glowEffect?: boolean;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "div" | "p";
}

export function AnimatedTitle({
  children,
  className = "",
  delay = 0,
  highlight = true,
  glowEffect = true,
  as: Component = "h1"
}: AnimatedTitleProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Component
      className={`relative transition-transform duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {/* Texto */}
      <span
        className={`relative z-10 
          ${highlight ? "bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 animate-highlight-flow" : ""}
        `}
        style={{
          backgroundSize: "200% auto",
          backgroundPosition: "0 0",
        }}
      >
        {children}
      </span>
      
      {/* Efeito de brilho */}
      {glowEffect && (
        <span className="absolute left-0 -bottom-1 w-full h-3/4 bg-primary/5 blur-xl -z-10 opacity-70"></span>
      )}
    </Component>
  );
} 