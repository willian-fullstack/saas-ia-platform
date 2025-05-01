"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { X, User, Home, Edit, MessageSquare, Gift, CreditCard, History, ShieldAlert, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CreditBadge } from "@/components/subscription/CreditBadge";

// Definição de tipo estendida para incluir a propriedade role no usuário
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: 'user' | 'admin';
}

interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function MobileMenu({ isOpen, onClose, isAdmin: isAdminProp }: MobileMenuProps) {
  const { data: session } = useSession();
  const typedSession = session as ExtendedSession | null;
  const isAdmin = isAdminProp !== undefined ? isAdminProp : typedSession?.user?.role === "admin";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm md:hidden">
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/" className="flex items-center gap-2 font-semibold" onClick={onClose}>
            <Image 
              src="/logo.svg" 
              alt="SAS IA Platform Logo" 
              width={30} 
              height={30} 
              className="dark:invert"
              priority
            />
            <span>SAS IA Platform</span>
          </Link>
          <button 
            onClick={onClose}
            className="rounded-full p-2 hover:bg-accent"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Fechar menu</span>
          </button>
        </div>

        <div className="p-4">
          <CreditBadge variant="large" className="w-full mb-6" showBuyButton />
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
                Módulos
              </h2>
              <div className="space-y-1">
                <Link href="/dashboard" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent" onClick={onClose}>
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                
                <Link href="/dashboard/copywriting" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent" onClick={onClose}>
                  <Edit className="h-5 w-5" />
                  <span>IA de Copywriting</span>
                </Link>
                
                <Link href="/dashboard/consultant" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent" onClick={onClose}>
                  <MessageSquare className="h-5 w-5" />
                  <span>Consultor IA 24h</span>
                </Link>
                
                <Link href="/dashboard/offers" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent" onClick={onClose}>
                  <Gift className="h-5 w-5" />
                  <span>IA de Ofertas</span>
                </Link>
              </div>
            </div>

            <div>
              <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
                Gerenciamento
              </h2>
              <div className="space-y-1">
                <Link href="/dashboard/subscription" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent" onClick={onClose}>
                  <CreditCard className="h-5 w-5" />
                  <span>Assinaturas</span>
                </Link>
                
                <Link href="/dashboard/credits/history" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent" onClick={onClose}>
                  <History className="h-5 w-5" />
                  <span>Histórico de Créditos</span>
                </Link>
                
                {isAdmin && (
                  <Link href="/dashboard/admin/credits" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 bg-primary text-primary-foreground transition-all hover:bg-primary/90" onClick={onClose}>
                    <ShieldAlert className="h-5 w-5" />
                    <span>Admin</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="p-4 mt-auto border-t">
          <div className="flex items-center gap-3">
            <div className="rounded-full h-10 w-10 bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{typedSession?.user?.name || "Usuário"}</p>
              <p className="text-muted-foreground text-sm">
                {isAdmin ? "Administrador" : "Plano Pro"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Link 
              href="/dashboard/settings" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
} 