"use client";

import { useState } from "react";
import { 
  Loader2,
  Video,
  Code
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function VideosPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IA de Vídeos Curtos</h1>
        <p className="text-muted-foreground">
          Crie roteiros para Shorts/Reels com formato otimizado para captar atenção e gerar engajamento.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulário */}
        <div className="space-y-6">
          <form className="space-y-4 rounded-lg border p-4 shadow-sm">
            <div className="grid gap-2">
              <label htmlFor="topic" className="text-sm font-medium">
                Tópico do Vídeo
              </label>
              <input
                id="topic"
                name="topic"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: Como aumentar suas vendas usando marketing de afiliados"
                required
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="videoType" className="text-sm font-medium">
                Tipo de Vídeo
              </label>
              <select
                id="videoType"
                name="videoType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="tutorial">Tutorial Rápido</option>
                <option value="storytelling">Storytelling</option>
                <option value="reaction">Reação/Opinião</option>
                <option value="trends">Tendências</option>
                <option value="challenge">Desafio</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="platform" className="text-sm font-medium">
                Plataforma Principal
              </label>
              <select
                id="platform"
                name="platform"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram Reels</option>
                <option value="youtube">YouTube Shorts</option>
                <option value="facebook">Facebook Reels</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="duration" className="text-sm font-medium">
                Duração Aproximada
              </label>
              <select
                id="duration"
                name="duration"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="15">15 segundos</option>
                <option value="30">30 segundos</option>
                <option value="60">60 segundos</option>
                <option value="90">90 segundos</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="keyPoints" className="text-sm font-medium">
                Pontos-Chave (1 por linha)
              </label>
              <textarea
                id="keyPoints"
                name="keyPoints"
                className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: Estratégia de funil&#10;Oferta irresistível&#10;Call-to-action"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="capcut" className="rounded border border-input" />
              <label htmlFor="capcut" className="text-sm font-medium">
                Gerar formato para CapCut (com tempos)
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1",
                  loading && "opacity-70 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Gerar Roteiro
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Roteiro</h2>
              <div className="flex gap-2">
                {/* Botões apareceriam aqui quando houver resultado */}
              </div>
            </div>

            <div className="flex-1 relative bg-muted/30 rounded-md flex items-center justify-center">
              <div className="text-center p-4 text-muted-foreground">
                <Code className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>O roteiro do vídeo aparecerá aqui</p>
                <p className="text-xs mt-2">Preencha o formulário e clique em &quot;Gerar Roteiro&quot;</p>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 rounded-lg p-4 text-sm">
            <h3 className="font-medium mb-2">💡 Dicas para vídeos de alta conversão:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Capture a atenção nos primeiros 3 segundos</li>
              <li>Use perguntas provocativas no início</li>
              <li>Termine com um call-to-action claro</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 