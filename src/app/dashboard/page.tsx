"use client";

import Link from "next/link";
import { Edit, Image as ImageIcon, Video, Layout, Gift, MessageSquare } from "lucide-react";
import { useRequireAuth } from "@/lib/auth";
import { UserCreationsList } from "@/components/ai-modules/user-creations/UserCreationsList";

export default function Dashboard() {
  const { isLoading } = useRequireAuth();

  // Estado de carregamento enquanto verifica a autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo à plataforma SAS IA - Escolha uma ferramenta para começar.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Módulos */}
        <Link 
          href="/dashboard/copywriting"
          className="group relative overflow-hidden rounded-lg border p-6 shadow-md transition-all hover:shadow-lg hover:border-primary/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Edit className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">IA de Copywriting</h3>
              <p className="text-sm text-muted-foreground">
                Textos persuasivos para anúncios, landing pages e emails
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </Link>

        <Link 
          href="/dashboard/creative"
          className="group relative overflow-hidden rounded-lg border p-6 shadow-md transition-all hover:shadow-lg hover:border-primary/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Criativos Visuais</h3>
              <p className="text-sm text-muted-foreground">
                Imagens com ganchos visuais e emojis para redes sociais
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </Link>

        <Link 
          href="/dashboard/videos"
          className="group relative overflow-hidden rounded-lg border p-6 shadow-md transition-all hover:shadow-lg hover:border-primary/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Vídeos Curtos</h3>
              <p className="text-sm text-muted-foreground">
                Roteiros para Shorts/Reels com formato CapCut
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </Link>

        <Link 
          href="/dashboard/landing-pages"
          className="group relative overflow-hidden rounded-lg border p-6 shadow-md transition-all hover:shadow-lg hover:border-primary/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Layout className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Landing Pages</h3>
              <p className="text-sm text-muted-foreground">
                Criação automática de páginas de venda otimizadas
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </Link>

        <Link 
          href="/dashboard/offers"
          className="group relative overflow-hidden rounded-lg border p-6 shadow-md transition-all hover:shadow-lg hover:border-primary/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">IA de Ofertas</h3>
              <p className="text-sm text-muted-foreground">
                Geração de ofertas com headline, criativo e bônus
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </Link>

        <Link 
          href="/dashboard/consultant"
          className="group relative overflow-hidden rounded-lg border p-6 shadow-md transition-all hover:shadow-lg hover:border-primary/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Consultor IA 24h</h3>
              <p className="text-sm text-muted-foreground">
                Chat com IA para sugestões de copy e marketing
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </Link>
      </div>

      {/* Lista de criações recentes */}
      <div className="mt-6">
        <UserCreationsList limit={5} className="rounded-lg border shadow-sm p-4" />
      </div>
    </div>
  );
} 