"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Evitar erros de hidratação
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div className="hidden md:block w-64 flex-shrink-0" />;
  }
  
  return (
    <aside className="hidden md:flex w-72 flex-col h-[calc(100vh-5rem)] sticky top-20 left-0">
      {/* Pseudo-elementos decorativos */}
      <div className="absolute top-8 right-0 w-[1px] h-[30%] bg-gradient-to-b from-primary/0 via-primary/20 to-primary/0"></div>
      <div className="absolute bottom-8 right-0 w-[1px] h-[30%] bg-gradient-to-t from-primary/0 via-primary/20 to-primary/0"></div>
      
      <div className="flex flex-col gap-1 p-6 overflow-y-auto custom-scrollbar">
        <h2 className="mb-4 px-2 text-xl font-bold tracking-tight text-foreground/90 flex items-center">
          <div className="w-1.5 h-6 bg-primary rounded-full mr-2 opacity-80"></div>
          Módulos
        </h2>
        
        <NavLink href="/dashboard" icon={Home} active={pathname === '/dashboard'}>
          Dashboard
        </NavLink>
        
        <NavLink href="/dashboard/copywriting" icon={Edit} active={pathname?.includes('/dashboard/copywriting')}>
          IA de Copywriting
        </NavLink>
        
        <NavLink href="/dashboard/creative" icon={ImageIcon} active={pathname?.includes('/dashboard/creative')}>
          Criativos Visuais
        </NavLink>
        
        <NavLink href="/dashboard/videos" icon={Video} active={pathname?.includes('/dashboard/videos')}>
          Vídeos Curtos
        </NavLink>
        
        <NavLink href="/dashboard/landing-pages" icon={Layout} active={pathname?.includes('/dashboard/landing-pages')}>
          Landing Pages
          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-md">NOVO</span>
        </NavLink>
        
        <NavLink href="/dashboard/offers" icon={Gift} active={pathname?.includes('/dashboard/offers')}>
          IA de Ofertas
        </NavLink>
        
        <NavLink href="/dashboard/consultant" icon={MessageSquare} active={pathname?.includes('/dashboard/consultant')}>
          Consultor IA 24h
        </NavLink>
        
        <h2 className="mt-8 mb-4 px-2 text-xl font-bold tracking-tight text-foreground/90 flex items-center">
          <div className="w-1.5 h-6 bg-primary rounded-full mr-2 opacity-80"></div>
          Gerenciamento
        </h2>
        
        <NavLink href="/dashboard/subscription" icon={CreditCard} active={pathname?.includes('/dashboard/subscription')}>
          Assinaturas
        </NavLink>
        
        <NavLink href="/dashboard/credits/history" icon={History} active={pathname?.includes('/dashboard/credits/history')}>
          Histórico de Créditos
        </NavLink>
        
        {isAdmin && (
          <Link 
            href="/dashboard/admin/credits" 
            prefetch={false} 
            className="group relative my-1 flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium
                     bg-gradient-to-r from-primary/90 via-primary/80 to-primary/90 text-primary-foreground
                     shadow-md hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl opacity-30 blur-md bg-primary/40 group-hover:opacity-40 transition-opacity"></div>
            
            <div className="relative flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="group-hover:translate-x-0.5 transition-transform">Admin</span>
            </div>
            
            {/* Animação de partículas no botão */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1 opacity-60">
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" style={{animationDelay: '300ms'}}></div>
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" style={{animationDelay: '600ms'}}></div>
            </div>
          </Link>
        )}
        
        <h2 className="mt-8 mb-4 px-2 text-xl font-bold tracking-tight text-foreground/90 flex items-center">
          <div className="w-1.5 h-6 bg-primary rounded-full mr-2 opacity-80"></div>
          Ferramentas Extras
        </h2>
        
        <NavLink href="/dashboard/tools" icon={Sparkles} active={pathname?.includes('/dashboard/tools')}>
          Todas as Ferramentas
        </NavLink>
        
        <div className="mt-auto pt-8 border-t border-border/30">
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-primary to-primary/30 opacity-30 blur-md group-hover:opacity-50 transition-opacity"></div>
              <div className="relative rounded-full h-10 w-10 bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
                <User className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <p className="font-medium text-sm">{typedSession?.user?.name || "Usuário"}</p>
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

// Componente de link de navegação com indicador de ativo
interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  active?: boolean;
  children: React.ReactNode;
}

function NavLink({ href, icon: Icon, active = false, children }: NavLinkProps) {
  return (
    <Link 
      href={href} 
      prefetch={false} 
      className={`group relative my-1 flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-all duration-300
                ${active 
                 ? 'bg-primary/10 text-primary shadow-sm border-l-2 border-primary' 
                 : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
    >
      {active && (
        <>
          <div className="absolute inset-0 rounded-xl opacity-10 blur-sm bg-primary/20"></div>
          <div className="absolute right-0 top-0 h-full w-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </>
      )}
      <div className="relative">
        <div className={`absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity ${active ? 'bg-primary' : 'bg-foreground/30'}`}></div>
        <Icon className={`h-5 w-5 relative group-hover:scale-110 transition-transform ${active ? 'text-primary' : ''}`} />
      </div>
      <span className="group-hover:translate-x-0.5 transition-transform">{children}</span>
      
      {active && (
        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary"></div>
      )}
    </Link>
  );
} 