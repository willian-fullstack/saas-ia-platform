"use client";

import { useState, useEffect } from "react";
import { 
  Loader2,
  Gift,
  Copy,
  Plus,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

export default function OffersPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingDots, setLoadingDots] = useState("");
  const [formData, setFormData] = useState({
    niche: "",
    productName: "",
    productDescription: "",
    targetAudience: "",
    pricePoint: "",
    bonusCount: 3,
    painPoints: ["", "", ""],
    includeDiscount: true,
    includeUrgency: true,
    contentType: "completo"
  });

  // Efeito para mostrar mensagens durante o carregamento
  useEffect(() => {
    if (loading) {
      const messages = [
        "Analisando o nicho...",
        "Identificando dores do público...",
        "Elaborando a oferta principal...",
        "Criando bônus irresistíveis...",
        "Aplicando técnicas persuasivas...",
        "Estruturando a oferta...",
        "Finalizando a proposta..."
      ];
      
      let currentMessageIndex = 0;
      const messageInterval = setInterval(() => {
        if (currentMessageIndex < messages.length) {
          setLoadingMessage(messages[currentMessageIndex]);
          currentMessageIndex++;
        }
      }, 2000);
      
      // Animação de pontos
      const dotsInterval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev.length >= 3) return "";
          return prev + ".";
        });
      }, 500);
      
      return () => {
        clearInterval(messageInterval);
        clearInterval(dotsInterval);
      };
    }
  }, [loading]);

  // Atualizar o estado do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Atualizar um ponto de dor específico
  const handlePainPointChange = (index: number, value: string) => {
    const newPainPoints = [...formData.painPoints];
    newPainPoints[index] = value;
    setFormData(prev => ({
      ...prev,
      painPoints: newPainPoints
    }));
  };

  // Adicionar mais um campo de ponto de dor
  const addPainPoint = () => {
    if (formData.painPoints.length < 5) {
      setFormData(prev => ({
        ...prev,
        painPoints: [...prev.painPoints, ""]
      }));
    }
  };

  // Remover um ponto de dor
  const removePainPoint = (index: number) => {
    if (formData.painPoints.length > 1) {
      const newPainPoints = [...formData.painPoints];
      newPainPoints.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        painPoints: newPainPoints
      }));
    }
  };

  // Atualizar checkbox
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Atualizar contagem de bônus
  const handleBonusCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 7) {
      setFormData(prev => ({
        ...prev,
        bonusCount: value
      }));
    }
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!formData.niche || !formData.productName || !formData.productDescription) {
      toast.error("Preencha os campos obrigatórios: Nicho, Nome do Produto e Descrição");
      return;
    }
    
    // Filtrar pontos de dor vazios
    const filteredPainPoints = formData.painPoints.filter(point => point.trim() !== "");
    
    setLoading(true);
    setResult("");
    setLoadingMessage("Iniciando análise da oferta...");
    
    try {
      // Criar um AbortController para cancelar a requisição se necessário
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos de timeout
      
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          painPoints: filteredPainPoints
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao processar solicitação");
      }
      
      // Simular a geração de texto progressiva
      const data = await response.json();
      const textContent = data.result;
      
      // Mostrar o texto gradualmente para um melhor feedback visual
      const words = textContent.split(' ');
      let displayedText = "";
      
      for (let i = 0; i < words.length; i += 5) {
        const chunk = words.slice(i, i + 5).join(' ');
        displayedText += ' ' + chunk;
        setResult(displayedText);
        
        // Pequena pausa para criar efeito de digitação
        if (i < words.length - 5) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      toast.success("Oferta gerada com sucesso!");
    } catch (error) {
      console.error("Erro:", error);
      toast.error(`Falha ao gerar oferta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
      setLoadingMessage("");
      setLoadingDots("");
    }
  };
  
  // Copiar resultado para a área de transferência
  const handleCopy = () => {
    navigator.clipboard.writeText(result)
      .then(() => toast.success("Oferta copiada para a área de transferência"))
      .catch(() => toast.error("Erro ao copiar a oferta"));
  };

  // Renderizar conteúdo da área de resultado
  const renderResultContent = () => {
    if (loading) {
      return (
        <div className="relative flex-grow">
          <div className="absolute top-0 left-0 right-0 bg-primary/10 text-primary p-3 rounded-t-md flex items-center justify-between z-10">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">{loadingMessage}{loadingDots}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Pode levar até 20 segundos...
            </div>
          </div>
          <Textarea
            value={result}
            readOnly
            className="min-h-[500px] resize-none whitespace-pre-wrap pt-16"
            placeholder="Gerando oferta..."
          />
        </div>
      );
    }

    if (!result) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground h-full">
          <Gift className="h-16 w-16 mb-4 opacity-20" />
          <p>A oferta gerada aparecerá aqui</p>
          <p className="text-xs mt-1">Preencha o formulário e clique em Gerar Oferta</p>
        </div>
      );
    }

    return (
      <Textarea
        value={result}
        readOnly
        className="min-h-[500px] resize-none whitespace-pre-wrap"
        placeholder="A oferta gerada aparecerá aqui..."
      />
    );
  };
  
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IA de Ofertas</h1>
        <p className="text-muted-foreground">
          Crie ofertas persuasivas com headline, descrição do produto, bônus e urgência.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulário */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4 shadow-sm">
            {/* Nicho */}
            <div className="grid gap-2">
              <Label htmlFor="niche">
                Nicho <span className="text-red-500">*</span>
              </Label>
              <input
                id="niche"
                name="niche"
                value={formData.niche}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: Emagrecimento, Marketing Digital, Finanças..."
                required
                disabled={loading}
              />
            </div>
            
            {/* Nome do Produto */}
            <div className="grid gap-2">
              <Label htmlFor="productName">
                Nome do Produto <span className="text-red-500">*</span>
              </Label>
              <input
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: Método Emagrecimento Total"
                required
                disabled={loading}
              />
            </div>
            
            {/* Descrição do Produto */}
            <div className="grid gap-2">
              <Label htmlFor="productDescription">
                Descrição do Produto <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="productDescription"
                name="productDescription"
                value={formData.productDescription}
                onChange={handleChange}
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="Ex: Um programa completo de emagrecimento com dietas personalizadas e treinos..."
                required
                disabled={loading}
              />
            </div>
            
            {/* Público-alvo */}
            <div className="grid gap-2">
              <Label htmlFor="targetAudience">
                Público-alvo
              </Label>
              <input
                id="targetAudience"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: Mulheres entre 30-50 anos interessadas em emagrecimento"
                disabled={loading}
              />
            </div>
            
            {/* Faixa de Preço */}
            <div className="grid gap-2">
              <Label htmlFor="pricePoint">
                Faixa de Preço
              </Label>
              <select
                id="pricePoint"
                name="pricePoint"
                value={formData.pricePoint}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="">Selecione...</option>
                <option value="baixo">Baixo (R$ 47 - R$ 197)</option>
                <option value="médio">Médio (R$ 197 - R$ 997)</option>
                <option value="alto">Alto (R$ 997 - R$ 1997)</option>
                <option value="premium">Premium (R$ 1997+)</option>
              </select>
            </div>
            
            {/* Quantidade de Bônus */}
            <div className="grid gap-2">
              <Label htmlFor="bonusCount">
                Quantidade de Bônus
              </Label>
              <input
                id="bonusCount"
                name="bonusCount"
                type="number"
                min="1"
                max="7"
                value={formData.bonusCount}
                onChange={handleBonusCountChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              />
            </div>
            
            {/* Pontos de Dor */}
            <div className="grid gap-2">
              <Label>
                Dores/Problemas do Público
              </Label>
              {formData.painPoints.map((point, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={point}
                    onChange={(e) => handlePainPointChange(index, e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder={`Dor/Problema ${index + 1}`}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePainPoint(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                    disabled={loading}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.painPoints.length < 5 && !loading && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={addPainPoint}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" /> Adicionar dor/problema
                </Button>
              )}
            </div>
            
            {/* Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeDiscount"
                  name="includeDiscount"
                  checked={formData.includeDiscount}
                  onChange={handleCheckboxChange}
                  className="rounded border-input h-4 w-4"
                  disabled={loading}
                />
                <Label htmlFor="includeDiscount" className="text-sm cursor-pointer">
                  Incluir desconto com justificativa
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeUrgency"
                  name="includeUrgency"
                  checked={formData.includeUrgency}
                  onChange={handleCheckboxChange}
                  className="rounded border-input h-4 w-4"
                  disabled={loading}
                />
                <Label htmlFor="includeUrgency" className="text-sm cursor-pointer">
                  Incluir elemento de urgência/escassez
                </Label>
              </div>
            </div>
            
            {/* Tipo de Conteúdo */}
            <div className="grid gap-2">
              <Label htmlFor="contentType">
                Tipo de Conteúdo
              </Label>
              <select
                id="contentType"
                name="contentType"
                value={formData.contentType}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="completo">Oferta Completa (detalhada)</option>
                <option value="resumido">Resumo em Tópicos</option>
              </select>
            </div>
            
            {/* Botão de envio */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex items-center justify-center gap-2 w-full",
                  loading && "opacity-70 cursor-not-allowed"
                )}
              >
                {loading ? <Loading /> : (
                  <>
                    <Gift className="h-4 w-4" />
                    Gerar Oferta
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Resultado</h3>
              {result && !loading && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopy}
                  className="h-8 gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar</span>
                </Button>
              )}
            </div>
            
            <div className="flex-grow">
              {renderResultContent()}
            </div>
          </div>
          
          <div className="bg-primary/10 rounded-lg p-4 text-sm">
            <h3 className="font-medium mb-2">💡 Dicas para ofertas persuasivas:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Bônus devem complementar o produto principal, não competir com ele</li>
              <li>Use a Urgência/Escassez com honestidade (vagas limitadas, oferta por tempo limitado, etc.)</li>
              <li>O preço com desconto deve parecer um bom negócio comparado ao valor total</li>
              <li>Inclua garantias claras para reduzir a percepção de risco</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 