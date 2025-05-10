"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { useState } from "react";

interface ModuleCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ModuleCard({ href, icon: Icon, title, description }: ModuleCardProps) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <Link 
      href={href}
      prefetch={false}
      className="relative group/card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden rounded-xl p-6 backdrop-blur-sm 
                     transition-all duration-300 shadow-md hover:shadow-xl
                     bg-gradient-to-br from-background/70 via-background/80 to-background/60
                     group-hover/card:from-primary/5 group-hover/card:to-primary/20
                     border border-border/50 group-hover/card:border-primary/30">
        {/* Gradiente de borda animado */}
        <div className={`absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 
                        opacity-0 group-hover/card:opacity-100 blur-xl transition-opacity duration-1000
                        mix-blend-overlay`}></div>
        
        {/* Glow effect */}
        <div className={`absolute -inset-px bg-primary/10 opacity-0 group-hover/card:opacity-30 
                        rounded-xl blur-xl transition-opacity duration-500`}></div>
        
        <div className="absolute -top-8 -right-8 w-20 h-20 bg-primary/10 rounded-full opacity-0 
                      group-hover/card:opacity-70 transition-opacity duration-500 blur-xl"></div>
        
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center gap-4 mb-2 group-hover/card:translate-x-1 transition-transform duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-full 
                          bg-primary/10 group-hover/card:bg-primary/20 transition-colors duration-300
                          group-hover/card:shadow-md group-hover/card:shadow-primary/20">
              <Icon className={`h-6 w-6 text-primary transition-all duration-500 
                             group-hover/card:scale-110 ${hovered ? 'animate-pulse' : ''}`} />
            </div>
            <h3 className="font-semibold text-lg group-hover/card:text-primary transition-colors duration-500">
              {title}
            </h3>
          </div>
          
          <p className="text-sm text-muted-foreground pl-2 
                      group-hover/card:text-foreground transition-colors duration-500">
            {description}
          </p>
          
          {/* Arrow indicator */}
          <div className="absolute bottom-4 right-4 h-6 w-6 rounded-full bg-primary/0 
                        group-hover/card:bg-primary/90 flex items-center justify-center
                        transition-all duration-300 transform translate-x-2 opacity-0 
                        group-hover/card:translate-x-0 group-hover/card:opacity-100">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-3 w-3 text-primary-foreground" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
} 