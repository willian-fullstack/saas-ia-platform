"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Bell, Settings, Menu, ShieldAlert, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserProfileButton } from "@/components/user-profile-button";
import { CreditBadge } from "@/components/subscription/CreditBadge";
import { MobileMenu } from "@/components/dashboard/mobile-menu";
import { useIsAdmin } from "@/lib/auth";
import { useTheme } from "next-themes";

export function DashboardHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAdmin, isLoading } = useIsAdmin();
  const { theme } = useTheme();
  
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header 
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled 
            ? 'border-b backdrop-blur-md bg-background/80 h-16 shadow-sm' 
            : 'bg-transparent h-20'
        }`}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="relative flex items-center gap-2 font-semibold group">
            <div className="relative md:hidden">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/60 to-primary/30 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
              <div className="relative w-10 h-10 flex items-center justify-center">
                <Image 
                  src="/logo.svg" 
                  alt="ExecutaAi Logo Icon" 
                  width={36} 
                  height={36} 
                  className="group-hover:scale-110 transition-transform duration-300"
                  priority
                />
              </div>
            </div>
            {/* Logo completo responsivo */}
            <div className="hidden md:block relative">
              {/* Logos oficiais da ExecutaAi */}
              <Image 
                src="/img/logo_claro.png" 
                alt="ExecutaAi" 
                width={180}
                height={50}
                className="block dark:hidden" 
                priority
              />
              <Image 
                src="/img/logo_escuro.png" 
                alt="ExecutaAi" 
                width={180}
                height={50}
                className="hidden dark:block" 
                priority
              />
            </div>
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden ml-auto flex items-center gap-2">
            <CreditBadge variant="compact" />
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-sm font-medium hover:bg-primary/20 hover:text-primary transition-colors"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-3">
            <CreditBadge variant="glass" />
            {isAdmin && !isLoading && (
              <Link 
                href="/dashboard/admin/credits" 
                prefetch={false} 
                className="group flex items-center px-3 h-10 rounded-lg text-sm font-medium 
                        bg-gradient-to-r from-primary/80 to-primary/90 text-primary-foreground 
                        hover:shadow-md hover:shadow-primary/20 transition-all"
              >
                <ShieldAlert className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="relative">
                  Admin
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-foreground group-hover:w-full transition-all duration-300"></span>
                </span>
              </Link>
            )}
            <div className="p-1 rounded-lg bg-background/50 backdrop-blur-sm border border-border/30 flex gap-1">
              <ThemeToggle />
              <Link 
                href="/dashboard/notifications" 
                prefetch={false} 
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary"></span>
                <span className="sr-only">Notificações</span>
              </Link>
              <Link 
                href="/dashboard/settings" 
                prefetch={false} 
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Configurações</span>
              </Link>
            </div>
            <UserProfileButton />
          </div>
        </div>
        
        {/* Barra de progresso decorativa */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0"></div>
      </header>
      
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} isAdmin={isAdmin} />
    </>
  );
} 