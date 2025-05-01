"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { User, Home, Edit, Image as ImageIcon, Video, Layout, Gift, MessageSquare, Sparkles, CreditCard, History, ShieldAlert } from "lucide-react";

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

export function DashboardSidebar() {
  const { data: session } = useSession();
  const typedSession = session as ExtendedSession | null;
  const isAdmin = typedSession?.user?.role === "admin";
  
  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <div className="flex flex-col gap-1 p-4">
        <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
          Módulos
        </h2>
        
        <Link href="/dashboard" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent">
          <Home className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>
        
        <Link href="/dashboard/copywriting" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent">
          <Edit className="h-5 w-5" />
          <span>IA de Copywriting</span>
        </Link>
        
        <Link href="/dashboard/creative" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent">
          <ImageIcon className="h-5 w-5" />
          <span>Criativos Visuais</span>
        </Link>
        
        <Link href="/dashboard/videos" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent">
          <Video className="h-5 w-5" />
          <span>Vídeos Curtos</span>
        </Link>
        
        <Link href="/dashboard/landing-pages" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent">
          <Layout className="h-5 w-5" />
          <span>Landing Pages</span>
        </Link>
        
        <Link href="/dashboard/offers" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent">
          <Gift className="h-5 w-5" />
          <span>IA de Ofertas</span>
        </Link>
        
        <Link href="/dashboard/consultant" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent">
          <MessageSquare className="h-5 w-5" />
          <span>Consultor IA 24h</span>
        </Link>
        
        <h2 className="mt-6 mb-2 px-2 text-lg font-semibold tracking-tight">
          Gerenciamento
        </h2>
        
        <Link href="/dashboard/subscription" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent">
          <CreditCard className="h-5 w-5" />
          <span>Assinaturas</span>
        </Link>
        
        <Link href="/dashboard/credits/history" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent">
          <History className="h-5 w-5" />
          <span>Histórico de Créditos</span>
        </Link>
        
        {isAdmin && (
          <Link href="/dashboard/admin/credits" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 bg-primary text-primary-foreground transition-all hover:bg-primary/90">
            <ShieldAlert className="h-5 w-5" />
            <span>Admin</span>
          </Link>
        )}
        
        <h2 className="mt-6 mb-2 px-2 text-lg font-semibold tracking-tight">
          Ferramentas Extras
        </h2>
        
        <Link href="/dashboard/tools" prefetch={false} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent">
          <Sparkles className="h-5 w-5" />
          <span>Todas as Ferramentas</span>
        </Link>
        
        <div className="mt-auto pt-6 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="rounded-full h-8 w-8 bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <p className="font-medium">{typedSession?.user?.name || "Usuário"}</p>
              <p className="text-muted-foreground text-xs">
                {isAdmin ? "Administrador" : "Plano Pro"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
} 