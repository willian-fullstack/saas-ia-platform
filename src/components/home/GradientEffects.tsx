"use client";

import { useRef, useEffect, useState } from "react";

export function GradientEffects() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isMovingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      
      // Normalizar as coordenadas para percentuais (0-100)
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      
      setMousePosition({ x, y });
      
      if (!isMovingRef.current) {
        isMovingRef.current = true;
        setTimeout(() => {
          isMovingRef.current = false;
        }, 100);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden">
      {/* Gradiente principal que segue o mouse */}
      <div 
        className="absolute inset-0 bg-opacity-20 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            hsl(var(--primary)/0.15) 0%, 
            transparent 50%)`,
          opacity: isMovingRef.current ? 1 : 0.7,
          transition: "opacity 0.3s ease-out",
        }}
      />

      {/* Efeito de luz em movimento lento */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-full w-full opacity-20 overflow-hidden">
          <div className="absolute -inset-[100%] blur-3xl bg-gradient-to-br from-primary/20 via-transparent to-primary/30 animate-slow-rotate" />
        </div>
      </div>

      {/* Brilhos de destaque */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '15s' }} />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-primary/5 blur-3xl opacity-40 animate-pulse" style={{ animationDuration: '20s' }} />
      
      {/* Particulas que flutuam (apenas visual, não interativas) */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 6 }).map((_, index) => (
          <div 
            key={index}
            className="absolute rounded-full bg-primary/40 blur-sm animate-float"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
} 