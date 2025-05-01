"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Bell, Settings, Menu, ShieldAlert } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserProfileButton } from "@/components/user-profile-button";
import { CreditBadge } from "@/components/subscription/CreditBadge";
import { MobileMenu } from "@/components/dashboard/mobile-menu";
import { useIsAdmin } from "@/lib/auth";

export function DashboardHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAdmin, isLoading } = useIsAdmin();
  
  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image 
            src="/logo.svg" 
            alt="SAS IA Platform Logo" 
            width={30} 
            height={30} 
            className="dark:invert"
            priority
          />
          <span className="hidden md:inline">SAS IA Platform</span>
        </Link>
        <div className="md:hidden ml-auto flex items-center gap-2">
          <CreditBadge variant="compact" />
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </button>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-end gap-2">
          <CreditBadge variant="default" />
          {isAdmin && !isLoading && (
            <Link 
              href="/dashboard/admin/credits" 
              prefetch={false} 
              className="flex items-center px-3 h-10 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              Admin
            </Link>
          )}
          <ThemeToggle />
          <Link href="/dashboard/notifications" prefetch={false} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notificações</span>
          </Link>
          <Link href="/dashboard/settings" prefetch={false} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Configurações</span>
          </Link>
          <UserProfileButton />
        </div>
      </header>
      
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} isAdmin={isAdmin} />
    </>
  );
} 