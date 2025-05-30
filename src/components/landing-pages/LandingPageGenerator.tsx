import React, { useState, useRef } from 'react';
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { 
  Loader2,
  Image as ImageIcon,
  X,
  Layout
} from "lucide-react";
import { toast } from "sonner";

interface LandingPageGeneratorProps {
  onSuccess: (landingPageId: string) => void;
}

export default function LandingPageGenerator({ onSuccess }: LandingPageGeneratorProps) {
  // Estados do formulário
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingDots, setLoadingDots] = useState("");
  
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
  
  // Estado para imagens
  const [images, setImages] = useState<{file: File, preview: string}[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Animação de pontos de carregamento
  React.useEffect(() => {
    if (loading) {
      const messages = [
        "Analisando o nicho...",
        "Definindo o layout ideal...",
        "Estruturando o conteúdo...",
        "Criando elementos visuais...",
        "Otimizando para conversão...",
        "Aplicando design responsivo...",
        "Finalizando a landing page..."
      ];
      
      let currentMessageIndex = 0;
      const messageInterval = setInterval(() => {
        if (currentMessageIndex < messages.length) {
          setLoadingMessage(messages[currentMessageIndex]);
          currentMessageIndex++;
        }
      }, 3000);
      
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
  
  // Limpar as URLs das imagens ao desmontar o componente
  React.useEffect(() => {
    return () => {
      // Revogar as URLs de objeto criadas para as previews
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [images]);
  
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
  
  // Upload de imagens
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: {file: File, preview: string}[] = [];
      
      Array.from(e.target.files).forEach(file => {
        // Verificar se é uma imagem
        if (!file.type.startsWith('image/')) {
          toast.error(`O arquivo ${file.name} não é uma imagem válida`);
          return;
        }
        
        // Limitar o tamanho a 5MB
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`A imagem ${file.name} excede 5MB`);
          return;
        }
        
        // Criar URL de preview
        const preview = URL.createObjectURL(file);
        newImages.push({ file, preview });
      });
      
      // Adicionar novas imagens (limitando a 5 no total)
      if (images.length + newImages.length > 5) {
        toast.error("Limite de 5 imagens excedido");
        newImages.slice(0, 5 - images.length).forEach(img => {
          setImages(prev => [...prev, img]);
        });
      } else {
        setImages(prev => [...prev, ...newImages]);
      }
    }
    
    // Limpar o input file
    if (e.target.value) {
      e.target.value = '';
    }
  };
  
  // Remover uma imagem 
  const removeImage = (index: number) => {
    // Revogar a URL do objeto para liberar memória
    URL.revokeObjectURL(images[index].preview);
    
    // Remover a imagem do array
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  // Abrir o seletor de arquivo
  const triggerFileInput = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
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
    setLoadingMessage("Iniciando criação da landing page...");
    
    try {
      // Converter imagens para base64
      const imageUrls: string[] = [];
      
      // Se tiver imagens, converter para base64 em paralelo
      if (images.length > 0) {
        setLoadingMessage("Processando imagens...");
        const imagePromises = images.map(img => 
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.readAsDataURL(img.file);
          })
        );
        
        const imageResults = await Promise.all(imagePromises);
        imageUrls.push(...imageResults);
      }
      
      setLoadingMessage("Enviando dados para IA...");

      const response = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          benefits: filteredBenefits,
          images: imageUrls
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar a landing page');
      }
      
      const data = await response.json();
      
      // Verificar resposta
      if (data.success && data.data && data.data._id) {
        toast.success("Landing page gerada com sucesso!");
        
        // Limpar formulário
        setFormData({
          niche: "",
          product: "",
          benefits: ["", "", ""],
          targetAudience: "",
          callToAction: "",
          testimonials: true,
          pricing: "",
          style: "minimalista"
        });
        
        // Limpar imagens
        images.forEach(img => URL.revokeObjectURL(img.preview));
        setImages([]);
        
        // Notificar sucesso
        onSuccess(data.data._id);
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      console.error("Erro ao gerar landing page:", error);
      toast.error(`Erro ao gerar a landing page: ${error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'}`);
    } finally {
      setLoading(false);
      setLoadingMessage("");
      setLoadingDots("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Gerar Landing Page com IA</h2>
        <p className="text-sm text-muted-foreground">
          Preencha as informações abaixo para criar uma landing page personalizada com IA.
        </p>
      </div>
      
      {loading ? (
        <div className="border rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <h3 className="font-medium text-lg mb-2">{loadingMessage}{loadingDots}</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Estamos criando sua landing page com IA. Esse processo pode levar até 3 minutos.
            As páginas geradas incluem HTML, CSS e JavaScript responsivos e otimizados.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-6 shadow-sm">
          {/* Campos obrigatórios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          
          {/* Upload de imagens */}
          <div className="grid gap-2">
            <Label>
              Imagens do Produto/Serviço <span className="text-xs text-muted-foreground">(Opcional, máx. 5)</span>
            </Label>
            <input 
              ref={imageInputRef}
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleImageChange}
              className="hidden"
              disabled={images.length >= 5}
            />
            
            {/* Botão de upload */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={triggerFileInput}
              disabled={images.length >= 5}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              {images.length === 0 
                ? "Fazer upload de imagens" 
                : `Adicionar mais imagens (${images.length}/5)`}
            </Button>
            
            {/* Preview das imagens */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={img.preview} 
                      alt={`Imagem ${index + 1}`}
                      className="h-20 w-full object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover imagem"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
          
          {/* Campos adicionais em duas colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
            >
              <Layout className="h-4 w-4 mr-2" />
              Gerar Landing Page
            </Button>
          </div>
        </form>
      )}
      
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
  );
} 