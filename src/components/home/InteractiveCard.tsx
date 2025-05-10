"use client";

import { ReactNode, useState, useRef, MouseEvent } from "react";

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  border?: boolean;
  shine?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}

export function InteractiveCard({
  children,
  className = "",
  intensity = 15,
  border = true,
  shine = true,
  highlight = true,
  onClick,
}: InteractiveCardProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Calcular a posição relativa do mouse dentro do cartão
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Converter para coordenadas normalizadas (-0.5 a 0.5)
    const normX = (x / rect.width) - 0.5;
    const normY = (y / rect.height) - 0.5;
    
    // Aplicar o efeito de rotação
    setRotate({
      x: normY * intensity,
      y: -normX * intensity,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden transform-gpu transition-all duration-200 ${className}`}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(1.02)`
          : "perspective(1000px) rotateX(0) rotateY(0) scale(1)",
        transition: "transform 0.2s ease-out",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {/* Borda com efeito de brilho */}
      {border && isHovered && (
        <div 
          className="absolute inset-0 border rounded-[inherit] opacity-100 transition-all duration-500"
          style={{
            border: "1px solid transparent",
            backgroundImage: `linear-gradient(var(--card), var(--card)), 
              linear-gradient(to right, hsl(var(--primary)/0.5) 0%, hsl(var(--primary)/0.1) 50%, hsl(var(--primary)/0.5) 100%)`,
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            animation: highlight ? "highlight-flow 3s linear infinite" : "none",
          }}
        />
      )}
      
      {/* Efeito de brilho que segue o cursor */}
      {shine && isHovered && (
        <div 
          className="absolute inset-0 opacity-10 transition-all duration-300"
          style={{
            background: `radial-gradient(circle at ${(rotate.y / intensity) * 0.5 + 0.5} ${(rotate.x / intensity) * 0.5 + 0.5}, 
              hsl(var(--primary)) 0%, 
              transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}
      
      {/* Conteúdo do cartão */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
} 