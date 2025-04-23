import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Bell, Settings, User, Menu, Home, Edit, Image as ImageIcon, Video, Layout, Gift, MessageSquare, Sparkles } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SAS IA Platform - Dashboard",
  description: "Plataforma All-in-One com IA para Criadores de Conteúdo",
};

// Componente de navegação separado para melhorar a performance 
function Sidebar() {
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
              <p className="font-medium">Usuário</p>
              <p className="text-muted-foreground text-xs">Plano Pro</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Componente de cabeçalho separado para melhorar a performance
function Header() {
  return (
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
      <div className="md:hidden ml-auto">
        <button className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </button>
      </div>
      <div className="hidden md:flex flex-1 items-center justify-end gap-2">
        <ThemeToggle />
        <Link href="/dashboard/notifications" prefetch={false} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificações</span>
        </Link>
        <Link href="/dashboard/settings" prefetch={false} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Configurações</span>
        </Link>
        <Link href="/profile" prefetch={false} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          <User className="h-5 w-5" />
          <span className="sr-only">Perfil</span>
        </Link>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className={`min-h-screen flex flex-col ${inter.className}`}>
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          {/* Main content */}
          <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
} 