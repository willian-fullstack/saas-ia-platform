"use client";

import { useEffect, useRef, useState } from 'react';

export function GradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Criar gradiente
    const createGradient = () => {
      const time = Date.now() * 0.001;
      
      // Posições dinâmicas para as cores do gradiente
      const x1 = Math.sin(time * 0.3) * canvas.width;
      const y1 = Math.cos(time * 0.2) * canvas.height;
      const x2 = canvas.width - x1;
      const y2 = canvas.height - y1;
      
      const gradient = ctx.createRadialGradient(
        x1, y1, 0,
        x2, y2, canvas.width * 0.8
      );
      
      // Cores do tema
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.03)'); // Azul primário muito transparente
      gradient.addColorStop(0.5, 'rgba(147, 197, 253, 0.02)'); // Azul médio transparente
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)'); // Azul primário muito transparente
      
      return gradient;
    };

    // Função de animação
    let animationId: number;
    const animate = () => {
      // Limpar canvas com transparência para criar rastro
      ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Desenhar formas com gradiente
      ctx.fillStyle = createGradient();
      
      // Formas geométricas fluidas
      const time = Date.now() * 0.001;
      
      // Desenhar círculos que se movem suavemente
      for (let i = 0; i < 3; i++) {
        const size = Math.max(canvas.width, canvas.height) * (0.1 + i * 0.2);
        const x = canvas.width / 2 + Math.sin(time * (0.2 + i * 0.1)) * canvas.width * 0.25;
        const y = canvas.height / 2 + Math.cos(time * (0.3 + i * 0.1)) * canvas.height * 0.25;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [dimensions]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 opacity-50 pointer-events-none"
    />
  );
} 