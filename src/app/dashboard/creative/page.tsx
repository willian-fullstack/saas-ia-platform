"use client";

import { useState } from "react";
import { 
  Check, 
  Copy, 
  Download, 
  RotateCcw, 
  Send,
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreativePage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IA de Criativos Visuais</h1>
        <p className="text-muted-foreground">
          Gere imagens impactantes com ganchos visuais e elementos otimizados para conversão.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulário */}
        <div className="space-y-6">
          <form className="space-y-4 rounded-lg border p-4 shadow-sm">
            <div className="grid gap-2">
              <label htmlFor="prompt" className="text-sm font-medium">
                Descreva sua imagem
              </label>
              <textarea
                id="prompt"
                name="prompt"
                className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: Uma pessoa feliz olhando para um laptop, com gráficos de crescimento, cores vibrantes, estilo minimalista"
                required
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="style" className="text-sm font-medium">
                Estilo Visual
              </label>
              <select
                id="style"
                name="style"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="realista">Realista</option>
                <option value="cartoon">Cartoon</option>
                <option value="minimalista">Minimalista</option>
                <option value="3d">3D Render</option>
                <option value="flat">Flat Design</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="ratio" className="text-sm font-medium">
                Proporção
              </label>
              <select
                id="ratio"
                name="ratio"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="1:1">Quadrado (1:1) - Instagram</option>
                <option value="4:5">Retrato (4:5) - Instagram</option>
                <option value="9:16">Story (9:16) - Instagram/Facebook</option>
                <option value="16:9">Paisagem (16:9) - Facebook/LinkedIn</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="addText" className="text-sm font-medium">
                Incluir Texto na Imagem
              </label>
              <input
                id="addText"
                name="addText"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: AUMENTE SUAS VENDAS HOJE!"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="noiseMode" className="rounded border border-input" />
              <label htmlFor="noiseMode" className="text-sm font-medium">
                Modo Ruído (Anti-bloqueio para anúncios)
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
                    <ImageIcon className="h-4 w-4" />
                    Gerar Imagem
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
              <h2 className="text-lg font-semibold">Resultado</h2>
              <div className="flex gap-2">
                {/* Botões apareceriam aqui quando houver resultado */}
              </div>
            </div>

            <div className="flex-1 relative bg-muted/30 rounded-md flex items-center justify-center">
              <div className="text-center p-4 text-muted-foreground">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>A imagem gerada aparecerá aqui</p>
                <p className="text-xs mt-2">Preencha o formulário e clique em &quot;Gerar Imagem&quot;</p>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 rounded-lg p-4 text-sm">
            <h3 className="font-medium mb-2">💡 Dicas para melhores resultados:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Seja específico sobre o que deseja ver na imagem</li>
              <li>Inclua detalhes como cores, estilo e mood</li>
              <li>Especifique ângulo da câmera ou iluminação para melhor controle</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 