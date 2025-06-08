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
import { useCredits } from "@/lib/hooks/useCredits";
import { toast } from "sonner";
import Image from "next/image";

export default function CreativePage() {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [creationId, setCreationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { credits, fetchCredits, consumeCredits } = useCredits({ autoRefresh: true });
  
  const [formData, setFormData] = useState({
    prompt: "",
    style: "realista",
    ratio: "1:1",
    addText: "",
    noiseMode: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.prompt.trim()) {
      toast.error("Por favor, descreva a imagem que deseja gerar");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Erro ao gerar imagem");
      }

      setImageUrl(data.imageUrl);
      setCreationId(data.creationId);
      fetchCredits(); // Atualizar saldo de créditos
      toast.success("Imagem gerada com sucesso!");
    } catch (error) {
      console.error("Erro:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido ao gerar imagem");
      toast.error(error instanceof Error ? error.message : "Erro desconhecido ao gerar imagem");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (imageUrl) {
      try {
        await navigator.clipboard.writeText(imageUrl);
        toast.success("URL da imagem copiada para a área de transferência");
      } catch (err) {
        toast.error("Erro ao copiar URL");
      }
    }
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `imagem-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    setImageUrl(null);
    setCreationId(null);
    setError(null);
  };

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
          <form className="space-y-4 rounded-lg border p-4 shadow-sm" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label htmlFor="prompt" className="text-sm font-medium">
                Descreva sua imagem
              </label>
              <textarea
                id="prompt"
                name="prompt"
                value={formData.prompt}
                onChange={handleInputChange}
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
                value={formData.style}
                onChange={handleInputChange}
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
                value={formData.ratio}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="1:1">Quadrado (1:1) - 1024x1024</option>
                <option value="16:9">Paisagem (16:9) - 1792x1024</option>
                <option value="9:16">Retrato (9:16) - 1024x1792</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="addText" className="text-sm font-medium">
                Incluir Texto na Imagem
              </label>
              <input
                id="addText"
                name="addText"
                value={formData.addText}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: AUMENTE SUAS VENDAS HOJE!"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="noiseMode" 
                name="noiseMode"
                checked={formData.noiseMode}
                onChange={handleCheckboxChange}
                className="rounded border border-input" 
              />
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
              {imageUrl && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded-md hover:bg-muted"
                    title="Copiar URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-1 rounded-md hover:bg-muted"
                    title="Baixar imagem"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-1 rounded-md hover:bg-muted"
                    title="Limpar"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 relative bg-muted/30 rounded-md flex items-center justify-center overflow-hidden">
              {loading ? (
                <div className="text-center p-4">
                  <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin opacity-20" />
                  <p className="text-muted-foreground">Gerando sua imagem...</p>
                  <p className="text-xs mt-2 text-muted-foreground">Isso pode levar alguns segundos</p>
                </div>
              ) : imageUrl ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={imageUrl}
                    alt="Imagem gerada"
                    width={800}
                    height={800}
                    className="max-w-full max-h-full object-contain"
                    priority
                  />
                </div>
              ) : error ? (
                <div className="text-center p-4 text-destructive">
                  <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>{error}</p>
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>A imagem gerada aparecerá aqui</p>
                  <p className="text-xs mt-2">Preencha o formulário e clique em &quot;Gerar Imagem&quot;</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-primary/10 rounded-lg p-4 text-sm">
            <h3 className="font-medium mb-2">💡 Dicas para melhores resultados:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Seja específico sobre o que deseja ver na imagem</li>
              <li>Inclua detalhes como cores, estilo e mood</li>
              <li>Especifique ângulo da câmera ou iluminação para melhor controle</li>
              <li>As proporções disponíveis são otimizadas para a API do ChatGPT</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 