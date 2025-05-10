"use client";

import { useRef, useEffect, useState } from "react";

interface Point {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  connections: number[];
}

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initPoints();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    const handleMouseLeave = () => {
      setMousePosition(null);
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    handleResize();
    
    const cleanup = () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameRef.current);
    };

    return cleanup;
  }, []);

  const initPoints = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const numPoints = Math.max(20, Math.floor((canvas.width * canvas.height) / 40000));
    const points: Point[] = [];
    
    // Criar pontos aleatórios
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connections: []
      });
    }

    // Estabelecer conexões entre pontos próximos
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const otherPoint = points[j];
        const dx = point.x - otherPoint.x;
        const dy = point.y - otherPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          point.connections.push(j);
        }
      }
    }

    pointsRef.current = points;
    startAnimation();
  };

  const startAnimation = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lastTimeRef.current = performance.now();
    
    const animate = (time: number) => {
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      if (!canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Atualizar e desenhar pontos
      for (let i = 0; i < pointsRef.current.length; i++) {
        const point = pointsRef.current[i];
        
        // Movimento básico
        point.x += point.vx;
        point.y += point.vy;
        
        // Verificar limites da tela
        if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1;
        
        // Efeito do mouse: pontos se movem em direção ao cursor
        if (mousePosition) {
          const dx = mousePosition.x - point.x;
          const dy = mousePosition.y - point.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            const angle = Math.atan2(dy, dx);
            const intensity = 0.05 * (1 - distance / 120);
            
            point.vx += Math.cos(angle) * intensity;
            point.vy += Math.sin(angle) * intensity;
            
            // Limitar a velocidade
            const speed = Math.sqrt(point.vx * point.vx + point.vy * point.vy);
            if (speed > 1.5) {
              point.vx = (point.vx / speed) * 1.5;
              point.vy = (point.vy / speed) * 1.5;
            }
          }
        }
        
        // Desenhar o ponto
        const hue = 220; // Cor azul (matching com a cor primária do tema)
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.6)`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Desenhar conexões
        for (let j = 0; j < point.connections.length; j++) {
          const connectedPointIndex = point.connections[j];
          const connectedPoint = pointsRef.current[connectedPointIndex];
          
          const dx = point.x - connectedPoint.x;
          const dy = point.y - connectedPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            const opacity = Math.max(0, Math.min(0.3, 1 - distance / 150));
            ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(connectedPoint.x, connectedPoint.y);
            ctx.stroke();
          }
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 opacity-40 pointer-events-auto"
      style={{ filter: "blur(0px)" }}
    />
  );
} 