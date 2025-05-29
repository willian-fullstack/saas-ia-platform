"use client";

import { Edit, Image as ImageIcon, Video, Layout, Gift, MessageSquare } from "lucide-react";
import { useRequireAuth } from "@/lib/auth";
import { DashboardUserCreations } from "@/components/ai-modules/user-creations/DashboardUserCreations";
import { ModuleCard } from "@/components/dashboard/ModuleCard";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { isLoading } = useRequireAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Forçar remontagem do componente após 2 segundos
    const timer = setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Estado de carregamento enquanto verifica a autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Dashboard
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Bem-vindo à plataforma SAS IA - Escolha uma ferramenta para começar.
        </p>
      </div>

      {/* Contêiner de módulos com grade responsiva */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ModuleCard
          href="/dashboard/copywriting"
          icon={Edit}
          title="IA de Copywriting"
          description="Textos persuasivos para anúncios, landing pages e emails"
        />
        
        <ModuleCard
          href="/dashboard/creative"
          icon={ImageIcon}
          title="Criativos Visuais"
          description="Imagens com ganchos visuais e emojis para redes sociais"
        />
        
        <ModuleCard
          href="/dashboard/videos"
          icon={Video}
          title="Vídeos Curtos"
          description="Roteiros para Shorts/Reels com formato CapCut"
        />
        
        <ModuleCard
          href="/dashboard/landing-pages"
          icon={Layout}
          title="Landing Pages"
          description="Criação automática de páginas de venda otimizadas"
        />
        
        <ModuleCard
          href="/dashboard/offers"
          icon={Gift}
          title="IA de Ofertas"
          description="Geração de ofertas com headline, criativo e bônus"
        />
        
        <ModuleCard
          href="/dashboard/consultant"
          icon={MessageSquare}
          title="Consultor IA 24h"
          description="Chat com IA para sugestões de copy e marketing"
        />
      </div>

      {/* Lista de criações recentes com design aprimorado */}
      <div className="mt-6">
        <div className="flex items-center mb-4">
          <div className="w-1.5 h-6 bg-primary rounded-full mr-2 opacity-80"></div>
          <h2 className="text-xl font-bold">Atividade Recente</h2>
        </div>
        <div className="bg-background/70 backdrop-blur-sm rounded-xl border border-border/40 shadow-sm overflow-hidden">
          <DashboardUserCreations key={`dashboard-creations-${refreshKey}`} limit={5} className="p-4" />
        </div>
      </div>
    </div>
  );
} 