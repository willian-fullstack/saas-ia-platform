"use client";

import { useState, useEffect } from "react";
import { 
  Loader2,
  Copy,
  BookText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

export default function CopywritingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingDots, setLoadingDots] = useState("");
  const [formData, setFormData] = useState({
    topic: "",
    copyType: "headline",
    tone: "persuasivo",
    targetAudience: "",
    keyPoints: ["", "", ""],
    structure: "aida",
    wordCount: "médio"
  });

  // Efeito para mostrar mensagens durante o carregamento
  useEffect(() => {
    if (loading) {
      const messages = [
        "Analisando o tema...",
        "Identificando pontos fortes...",
        "Aplicando técnicas persuasivas...",
        "Criando texto impactante...",
        "Refinando a mensagem...",
        "Finalizando o texto..."
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

  // Atualizar um ponto-chave específico
  const handleKeyPointChange = (index: number, value: string) => {
    const newKeyPoints = [...formData.keyPoints];
    newKeyPoints[index] = value;
    setFormData(prev => ({
      ...prev,
      keyPoints: newKeyPoints
    }));
  };

  // Adicionar mais um campo de ponto-chave
  const addKeyPoint = () => {
    if (formData.keyPoints.length < 5) {
      setFormData(prev => ({
        ...prev,
        keyPoints: [...prev.keyPoints, ""]
      }));
    }
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!formData.topic) {
      toast.error("Por favor, informe o tópico ou produto");
      return;
    }
    
    // Filtrar pontos-chave vazios
    const filteredKeyPoints = formData.keyPoints.filter(point => point.trim() !== "");
    
    setLoading(true);
    setResult("");
    setLoadingMessage("Iniciando geração do texto...");
    
    try {
      // Criar um AbortController para cancelar a requisição se necessário
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos de timeout
      
      // Realizar chamada à API
      const response = await fetch('/api/copywriting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: formData.topic,
          copyType: formData.copyType,
          tone: formData.tone,
          targetAudience: formData.targetAudience,
          keyPoints: filteredKeyPoints,
          structure: formData.structure,
          wordCount: formData.wordCount
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar solicitação');
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
      
      toast.success("Copywriting gerado com sucesso!");
    } catch (error) {
      console.error("Erro:", error);
      toast.error(`Falha ao gerar o texto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
      setLoadingMessage("");
      setLoadingDots("");
    }
  };
  
  // Copiar resultado para a área de transferência
  const handleCopy = () => {
    navigator.clipboard.writeText(result)
      .then(() => toast.success("Texto copiado para a área de transferência"))
      .catch(() => toast.error("Erro ao copiar o texto"));
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
            placeholder="Gerando texto..."
          />
        </div>
      );
    }

    if (!result) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground h-full">
          <BookText className="h-16 w-16 mb-4 opacity-20" />
          <p>O texto gerado aparecerá aqui</p>
          <p className="text-xs mt-1">Preencha o formulário e clique em Gerar Copywriting</p>
        </div>
      );
    }

    return (
      <Textarea
        value={result}
        readOnly
        className="min-h-[500px] resize-none whitespace-pre-wrap"
        placeholder="O texto gerado aparecerá aqui..."
      />
    );
  };
  
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IA de Copywriting Black</h1>
        <p className="text-muted-foreground">
          Gere textos persuasivos para anúncios, landing pages, emails e mais sem restrições.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulário */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4 shadow-sm">
            {/* Tópico/Produto */}
            <div className="grid gap-2">
              <Label htmlFor="topic">
                Tópico / Produto <span className="text-red-500">*</span>
              </Label>
              <input
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: Curso de marketing digital, Programa de emagrecimento..."
                required
                disabled={loading}
              />
            </div>
            
            {/* Tipo de Texto */}
            <div className="grid gap-2">
              <Label htmlFor="copyType">
                Tipo de Texto
              </Label>
              <select
                id="copyType"
                name="copyType"
                value={formData.copyType}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="headline">Headline (Título)</option>
                <option value="paragraph">Parágrafo de Venda</option>
                <option value="email">Email de Marketing</option>
                <option value="fullcopy">Copy Completa</option>
                <option value="blackhat">Black Hat Marketing</option>
                <option value="sales">Texto de Vendas Agressivo</option>
              </select>
            </div>
            
            {/* Tom */}
            <div className="grid gap-2">
              <Label htmlFor="tone">
                Tom da Mensagem
              </Label>
              <select
                id="tone"
                name="tone"
                value={formData.tone}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="persuasivo">Persuasivo</option>
                <option value="urgente">Urgente</option>
                <option value="amigavel">Amigável</option>
                <option value="agressivo">Agressivo</option>
                <option value="controverso">Controverso</option>
                <option value="manipulador">Manipulador</option>
                <option value="chocante">Chocante</option>
              </select>
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
                placeholder="Ex: Mulheres entre 30-50 anos, empreendedores iniciantes..."
                disabled={loading}
              />
            </div>
            
            {/* Pontos-chave */}
            <div className="grid gap-2">
              <Label>
                Pontos-chave / Benefícios
              </Label>
              {formData.keyPoints.map((point, index) => (
                <input
                  key={index}
                  value={point}
                  onChange={(e) => handleKeyPointChange(index, e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={`Ponto-chave ${index + 1}`}
                  disabled={loading}
                />
              ))}
              {formData.keyPoints.length < 5 && !loading && (
                <button
                  type="button"
                  onClick={addKeyPoint}
                  className="text-sm text-primary hover:underline"
                >
                  + Adicionar mais um ponto-chave
                </button>
              )}
            </div>
            
            {/* Estrutura do texto */}
            <div className="grid gap-2">
              <Label htmlFor="structure">
                Estrutura de Persuasão
              </Label>
              <select
                id="structure"
                name="structure"
                value={formData.structure}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="aida">AIDA (Atenção, Interesse, Desejo, Ação)</option>
                <option value="pas">PAS (Problema, Agitação, Solução)</option>
                <option value="future-pacing">Future Pacing (Projeção de Futuro)</option>
                <option value="faq">FAQ (Perguntas e Respostas)</option>
                <option value="star-story-solution">Estrela-História-Solução</option>
                <option value="dualpath">Dual Path (Caminho Duplo)</option>
                <option value="fear">Fear Based (Baseado em Medo)</option>
                <option value="scarcity">Escassez e Urgência</option>
              </select>
            </div>
            
            {/* Tamanho do Texto */}
            {formData.copyType !== "headline" && (
              <div className="grid gap-2">
                <Label htmlFor="wordCount">
                  Tamanho do Texto
                </Label>
                <select
                  id="wordCount"
                  name="wordCount"
                  value={formData.wordCount}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={loading}
                >
                  <option value="curto">Curto</option>
                  <option value="médio">Médio</option>
                  <option value="longo">Longo</option>
                  <option value="muito longo">Muito Longo</option>
                </select>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? <Loading /> : "Gerar Copywriting"}
            </Button>
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
        </div>
      </div>
    </div>
  );
} 