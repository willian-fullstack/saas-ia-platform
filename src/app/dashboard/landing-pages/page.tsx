"use client";

import { useState } from "react";
import { 
  Loader2,
  Layout,
  Copy,
  Code
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LandingPagesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [formData, setFormData] = useState({
    niche: "",
    product: "",
    benefits: ["", "", ""],
    targetAudience: "",
    callToAction: "",
    testimonials: true,
    pricing: "",
    style: "minimalista"
  });

  // Atualizar o estado do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Atualizar um benefício específico
  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData(prev => ({
      ...prev,
      benefits: newBenefits
    }));
  };

  // Adicionar mais um campo de benefício
  const addBenefit = () => {
    if (formData.benefits.length < 6) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, ""]
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

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!formData.niche || !formData.product) {
      toast.error("Preencha os campos obrigatórios: Nicho e Produto");
      return;
    }
    
    // Filtrar benefícios vazios
    const filteredBenefits = formData.benefits.filter(benefit => benefit.trim() !== "");
    
    setLoading(true);
    setResult("");
    
    try {
      const response = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          benefits: filteredBenefits
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar solicitação");
      }
      
      setResult(data.result);
      toast.success("Landing page gerada com sucesso!");
    } catch (error) {
      console.error("Erro:", error);
      toast.error((error as Error).message || "Falha ao gerar landing page");
    } finally {
      setLoading(false);
    }
  };
  
  // Copiar resultado para a área de transferência
  const handleCopy = () => {
    navigator.clipboard.writeText(result)
      .then(() => toast.success("Código copiado para a área de transferência"))
      .catch(() => toast.error("Erro ao copiar o código"));
  };
  
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IA de Landing Pages</h1>
        <p className="text-muted-foreground">
          Crie landing pages de alta conversão otimizadas para vender seu produto ou serviço.
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
              />
            </div>
            
            {/* Produto */}
            <div className="grid gap-2">
              <Label htmlFor="product">
                Produto <span className="text-red-500">*</span>
              </Label>
              <input
                id="product"
                name="product"
                value={formData.product}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: Curso de Emagrecimento Saudável, Mentorias..."
                required
              />
            </div>
            
            {/* Benefícios */}
            <div className="grid gap-2">
              <Label>
                Benefícios do Produto
              </Label>
              {formData.benefits.map((benefit, index) => (
                <input
                  key={index}
                  value={benefit}
                  onChange={(e) => handleBenefitChange(index, e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={`Benefício ${index + 1}`}
                />
              ))}
              {formData.benefits.length < 6 && (
                <button
                  type="button"
                  onClick={addBenefit}
                  className="text-sm text-primary hover:underline"
                >
                  + Adicionar mais um benefício
                </button>
              )}
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
              />
            </div>
            
            {/* Call-to-action */}
            <div className="grid gap-2">
              <Label htmlFor="callToAction">
                Call-to-action
              </Label>
              <input
                id="callToAction"
                name="callToAction"
                value={formData.callToAction}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: Comprar Agora, Garantir Acesso, Inscrever-se..."
              />
            </div>
            
            {/* Preço/Oferta */}
            <div className="grid gap-2">
              <Label htmlFor="pricing">
                Informações de Preço/Oferta
              </Label>
              <input
                id="pricing"
                name="pricing"
                value={formData.pricing}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: De R$ 997 por apenas R$ 497"
              />
            </div>
            
            {/* Estilo */}
            <div className="grid gap-2">
              <Label htmlFor="style">
                Estilo Visual
              </Label>
              <select
                id="style"
                name="style"
                value={formData.style}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="minimalista">Minimalista</option>
                <option value="moderno">Moderno</option>
                <option value="colorido">Colorido</option>
                <option value="corporativo">Corporativo</option>
                <option value="elegante">Elegante</option>
              </select>
            </div>
            
            {/* Testimonials checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="testimonials"
                name="testimonials"
                checked={formData.testimonials}
                onChange={handleCheckboxChange}
                className="rounded border-input h-4 w-4"
              />
              <Label htmlFor="testimonials" className="text-sm cursor-pointer">
                Incluir seção para depoimentos
              </Label>
            </div>
            
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
                    <Layout className="h-4 w-4" />
                    Gerar Landing Page
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
              <h2 className="text-lg font-semibold">Código HTML</h2>
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

            <div className="flex-1 relative bg-muted/30 rounded-md">
              {result ? (
                <Textarea
                  value={result}
                  readOnly
                  className="min-h-[350px] font-mono text-sm resize-none border-0 bg-transparent"
                />
              ) : (
                <div className="text-center p-4 text-muted-foreground flex flex-col items-center justify-center h-full">
                  <Code className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>O código HTML da landing page aparecerá aqui</p>
                  <p className="text-xs mt-2">Preencha o formulário e clique em "Gerar Landing Page"</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-primary/10 rounded-lg p-4 text-sm">
            <h3 className="font-medium mb-2">💡 Dicas para landing pages eficazes:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Mantenha o foco em um único objetivo/CTA</li>
              <li>Destaque os benefícios, não apenas características</li>
              <li>Inclua elementos de prova social (depoimentos)</li>
              <li>Use gatilhos de escassez e urgência (quando aplicável)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 