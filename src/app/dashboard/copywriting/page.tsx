"use client";

import { useState } from "react";
import { 
  Loader2,
  Edit,
  Copy,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CopywritingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [formData, setFormData] = useState({
    topic: "",
    copyType: "headline",
    tone: "persuasivo",
    targetAudience: "",
    keyPoints: ["", "", ""],
    structure: "aida",
    wordCount: "médio"
  });

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
    
    try {
      // Simulação da chamada à API (em um projeto real, isso faria uma requisição)
      // Timeout simulando o processamento da IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Resultado simulado da IA
      let generatedCopy = "";
      
      if (formData.copyType === "headline") {
        generatedCopy = generateHeadline(formData.topic, formData.tone);
      } else if (formData.copyType === "paragraph") {
        generatedCopy = generateParagraph(formData.topic, formData.tone, filteredKeyPoints, formData.structure);
      } else if (formData.copyType === "email") {
        generatedCopy = generateEmail(formData.topic, formData.tone, filteredKeyPoints, formData.structure);
      }
      
      setResult(generatedCopy);
      toast.success("Copywriting gerado com sucesso!");
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Falha ao gerar o texto. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };
  
  // Copiar resultado para a área de transferência
  const handleCopy = () => {
    navigator.clipboard.writeText(result)
      .then(() => toast.success("Texto copiado para a área de transferência"))
      .catch(() => toast.error("Erro ao copiar o texto"));
  };
  
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IA de Copywriting</h1>
        <p className="text-muted-foreground">
          Gere textos persuasivos para anúncios, landing pages, emails e mais.
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
                placeholder="Ex: Curso de marketing digital, Produto de emagrecimento..."
                required
              />
            </div>
            
            {/* Tipo de Copy */}
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
              >
                <option value="headline">Headline (Título)</option>
                <option value="paragraph">Parágrafo de Venda</option>
                <option value="email">Email de Marketing</option>
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
              >
                <option value="persuasivo">Persuasivo</option>
                <option value="urgente">Urgente</option>
                <option value="amigavel">Amigável</option>
                <option value="informativo">Informativo</option>
                <option value="empolgante">Empolgante</option>
                <option value="autoridade">Autoridade</option>
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
                />
              ))}
              {formData.keyPoints.length < 5 && (
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
              >
                <option value="aida">AIDA (Atenção, Interesse, Desejo, Ação)</option>
                <option value="pas">PAS (Problema, Agitação, Solução)</option>
                <option value="future-pacing">Future Pacing (Projeção de Futuro)</option>
                <option value="faq">FAQ (Perguntas e Respostas)</option>
                <option value="star-story-solution">Estrela-História-Solução</option>
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
                >
                  <option value="curto">Curto</option>
                  <option value="médio">Médio</option>
                  <option value="longo">Longo</option>
                </select>
              </div>
            )}
            
            {/* Botão de envio */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex items-center justify-center gap-2",
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
                    <Edit className="h-4 w-4" />
                    Gerar Texto
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Resultado</h2>
              {result && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCopy}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 relative bg-muted/30 rounded-md p-4">
              {result ? (
                <div className="whitespace-pre-wrap">{result}</div>
              ) : (
                <div className="text-center p-4 text-muted-foreground flex flex-col items-center justify-center h-full">
                  <Rocket className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Seu texto persuasivo aparecerá aqui</p>
                  <p className="text-xs mt-2">Preencha o formulário e clique em "Gerar Texto"</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-primary/10 rounded-lg p-4 text-sm">
            <h3 className="font-medium mb-2">💡 Dicas para textos persuasivos:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Use palavras de impacto que ativam emoções</li>
              <li>Foque nos benefícios, não apenas em recursos</li>
              <li>Adicione gatilhos de escassez e urgência quando relevante</li>
              <li>Direcione o texto para resolver problemas específicos do público</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Funções de simulação de geração de textos
function generateHeadline(topic: string, tone: string): string {
  const headlines = [
    `🔥 Descubra o Segredo para ${topic} Que Ninguém Te Contou Antes!`,
    `O Método Comprovado Para ${topic} Em Apenas 30 Dias`,
    `As 3 Etapas Simples Para Transformar ${topic} Em Resultados Reais`,
    `ALERTA: A Verdade Sobre ${topic} Que a Maioria Das Pessoas Ignora`,
    `Como ${topic} Pode Transformar Sua Vida Hoje Mesmo`,
    `Finalmente Revelado: O Sistema Para ${topic} Sem Sacrifícios`,
    `[GUIA DEFINITIVO] Domine ${topic} Como Um Profissional`,
    `Pare de Cometer Estes 5 Erros em ${topic} Agora Mesmo!`
  ];
  
  return headlines[Math.floor(Math.random() * headlines.length)];
}

function generateParagraph(topic: string, tone: string, keyPoints: string[], structure: string): string {
  let paragraph = "";
  
  if (structure === "aida") {
    paragraph = `Você já se perguntou como seria dominar ${topic} de uma vez por todas? Imagine alcançar resultados impressionantes sem as frustrações e erros comuns que a maioria comete.\n\n`;
    
    paragraph += `O que poucas pessoas sabem é que existe um método comprovado que já ajudou centenas de pessoas a conquistarem resultados excepcionais com ${topic}. `;
    
    if (keyPoints.length > 0) {
      paragraph += `Este método exclusivo oferece benefícios extraordinários como:\n\n`;
      keyPoints.forEach(point => {
        if (point) paragraph += `✅ ${point}\n`;
      });
      paragraph += "\n";
    }
    
    paragraph += `A oportunidade de transformar sua experiência com ${topic} está ao seu alcance agora. Não perca mais tempo com métodos ultrapassados. Dê o próximo passo hoje mesmo e descubra como podemos te ajudar a alcançar o sucesso que você merece.`;
  } else if (structure === "pas") {
    paragraph = `Você está enfrentando dificuldades com ${topic}? Se você é como a maioria das pessoas, provavelmente já tentou várias abordagens sem obter os resultados que realmente deseja.\n\n`;
    
    paragraph += `Imagine como seria frustrante continuar tentando, investindo tempo e recursos, apenas para descobrir que você está seguindo o caminho errado. A cada dia que passa sem uma solução eficaz, você pode estar perdendo oportunidades valiosas que não voltarão.\n\n`;
    
    if (keyPoints.length > 0) {
      paragraph += `Felizmente, existe uma solução que resolve exatamente esses problemas. Um método revolucionário que proporciona:\n\n`;
      keyPoints.forEach(point => {
        if (point) paragraph += `✅ ${point}\n`;
      });
      paragraph += "\n";
    }
    
    paragraph += `Esta é sua chance de finalmente superar seus desafios com ${topic} e alcançar os resultados que você sempre desejou. A decisão está em suas mãos - continue lutando com os mesmos problemas ou dê um passo decisivo em direção à solução definitiva.`;
  }
  
  return paragraph;
}

function generateEmail(topic: string, tone: string, keyPoints: string[], structure: string): string {
  let email = `Assunto: A estratégia definitiva para dominar ${topic} está mais próxima do que você imagina\n\n`;
  
  email += `Olá,\n\n`;
  
  if (structure === "aida") {
    email += `Você sabia que 83% das pessoas que buscam melhorar em ${topic} estão cometendo os mesmos erros básicos que impedem seu progresso?\n\n`;
    
    email += `Recentemente, nossa equipe desenvolveu uma metodologia revolucionária após anos de pesquisa e teste com centenas de clientes reais. Os resultados são simplesmente impressionantes.\n\n`;
    
    if (keyPoints.length > 0) {
      email += `Nosso método exclusivo para ${topic} oferece:\n\n`;
      keyPoints.forEach(point => {
        if (point) email += `• ${point}\n`;
      });
      email += "\n";
    }
    
    email += `Para celebrar o lançamento oficial desta metodologia, estamos oferecendo acesso antecipado e com condições especiais para nossos primeiros 50 participantes.\n\n`;
    
    email += `Clique no link abaixo para garantir sua vaga e transformar sua experiência com ${topic} de uma vez por todas:\n\n`;
    
    email += `[BOTÃO: QUERO GARANTIR MINHA VAGA]\n\n`;
    
    email += `Não perca esta oportunidade única. As vagas são limitadas e estão sendo preenchidas rapidamente.\n\n`;
    
    email += `Atenciosamente,\n\nEquipe SAS IA Platform`;
  } else {
    email += `Você está enfrentando algum destes desafios com ${topic}?\n\n`;
    
    email += `• Frustração por não ver resultados concretos\n`;
    email += `• Sensação de estar desperdiçando tempo e recursos\n`;
    email += `• Dúvidas sobre qual é o melhor caminho a seguir\n\n`;
    
    email += `Se você se identificou com algum destes pontos, saiba que você não está sozinho. Milhares de pessoas enfrentam os mesmos obstáculos todos os dias.\n\n`;
    
    if (keyPoints.length > 0) {
      email += `Pensando nisso, desenvolvemos uma solução completa que oferece:\n\n`;
      keyPoints.forEach(point => {
        if (point) email += `• ${point}\n`;
      });
      email += "\n";
    }
    
    email += `Nosso objetivo é simples: ajudá-lo a superar os desafios de ${topic} com uma metodologia prática e comprovada.\n\n`;
    
    email += `Para conhecer todos os detalhes, basta clicar no botão abaixo:\n\n`;
    
    email += `[BOTÃO: QUERO CONHECER A SOLUÇÃO]\n\n`;
    
    email += `Está na hora de transformar sua relação com ${topic}.\n\n`;
    
    email += `Abraços,\n\nEquipe SAS IA Platform`;
  }
  
  return email;
} 