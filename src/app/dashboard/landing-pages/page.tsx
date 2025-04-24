"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Loader2,
  Layout,
  Copy,
  Code,
  Eye,
  Download,
  Image as ImageIcon,
  X,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LandingPagesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingDots, setLoadingDots] = useState("");
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const previewRef = useRef<HTMLDivElement>(null);
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
  const [images, setImages] = useState<{file: File, preview: string}[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  let timeoutId: NodeJS.Timeout | null = null;
  let controller: AbortController | null = null;

  // Efeito para mostrar mensagens durante o carregamento
  useEffect(() => {
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

  // Efeito para renderizar o HTML quando o código muda ou a aba ativa é alterada
  useEffect(() => {
    if (result && activeTab === "preview" && previewRef.current) {
      try {
        // Definir o HTML diretamente
        previewRef.current.innerHTML = result;
        
        // Adicionar sandbox CSS para evitar que CSS da página afete a preview
        const style = document.createElement('style');
        style.textContent = `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { overflow-x: hidden; }
        `;
        
        // Adicionar estilo ao início da preview
        if (previewRef.current.firstChild) {
          previewRef.current.insertBefore(style, previewRef.current.firstChild);
        } else {
          previewRef.current.appendChild(style);
        }
        
        // Ajustar scripts se existirem (para segurança)
        const scripts = previewRef.current.querySelectorAll('script');
        scripts.forEach(oldScript => {
          const newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.textContent = oldScript.textContent;
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });
        
        console.log('Preview renderizada com sucesso');
      } catch (error) {
        console.error('Erro ao renderizar preview:', error);
        // Fallback para visualização básica
        previewRef.current.innerHTML = `
          <div style="padding: 20px; color: red;">
            Erro ao renderizar a preview. Verifique o código HTML gerado.
            <pre style="margin-top: 10px; background: #f0f0f0; padding: 10px; overflow: auto; max-height: 300px;">${
              result.substring(0, 500) + '...'
            }</pre>
          </div>
        `;
      }
    }
  }, [result, activeTab]);

  // Limpar as URLs das imagens ao desmontar o componente
  useEffect(() => {
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
    setResult("");
    setLoadingMessage("Iniciando criação da landing page...");
    
    // Iniciar exibição de mensagens sequenciais para melhorar experiência de usuário
    const loadingMessages = [
      "Analisando o nicho e produto...",
      "Estruturando o layout da página...",
      "Criando seções de benefícios...",
      "Otimizando elementos visuais...",
      "Aplicando design responsivo...",
      "Implementando call-to-action eficaz...",
      "Refinando estilos CSS...",
      "Finalizando a landing page...",
      "Quase finalizado..."
    ];
    
    let messageIndex = 0;
    const messageTimer = setInterval(() => {
      // Atualizar mensagem a cada 15 segundos
      if (messageIndex < loadingMessages.length) {
        setLoadingMessage(loadingMessages[messageIndex]);
        messageIndex++;
      }
    }, 15000);
    
    try {
      // Limpar qualquer controlador anterior
      if (controller) {
        controller.abort();
      }
      
      // Criar novo controlador
      controller = new AbortController();
      
      // Definir um timeout de 180 segundos (3 minutos)
      timeoutId = setTimeout(() => {
        console.log("Timeout atingido após 180 segundos");
        if (controller) {
          controller.abort();
        }
      }, 180000);

      // Converter imagens para URLs de dados (base64)
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
        signal: controller.signal
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar a landing page');
      }
      
      const data = await response.json();
      const codeContent = data.result;
      
      // Simular uma geração progressiva para feedback visual
      const codeLines = codeContent.split('\n');
      let displayedCode = "";
      
      for (let i = 0; i < codeLines.length; i += 3) {
        const chunk = codeLines.slice(i, i + 3).join('\n');
        displayedCode += chunk + '\n';
        setResult(displayedCode);
        
        // Pequena pausa para criar efeito de digitação
        if (i < codeLines.length - 3) {
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }
      
      // Salvar landing page no banco de dados
      try {
        const saveResponse = await fetch('/api/user-creations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `Landing Page - ${formData.product}`,
            type: 'landing-page',
            content: {
              title: formData.product,
              niche: formData.niche,
              benefits: filteredBenefits,
              targetAudience: formData.targetAudience,
              callToAction: formData.callToAction,
              pricing: formData.pricing,
              style: formData.style,
              testimonials: formData.testimonials,
              result: codeContent
            }
          })
        });
        
        if (!saveResponse.ok) {
          console.error('Erro ao salvar landing page:', await saveResponse.json());
        }
      } catch (saveError) {
        console.error('Erro ao salvar landing page:', saveError);
        // Não exibir erro para o usuário, pois a landing page já foi gerada
      }
      
      toast.success("Landing page gerada com sucesso!");
    } catch (error: unknown) {
      console.error("Erro ao gerar landing page:", error);
      
      // Verificar se o erro foi devido ao abort
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
        toast.error("A geração da landing page excedeu o tempo limite. Tente novamente com uma descrição mais curta ou entre em contato com o suporte se o problema persistir.");
      } else {
        toast.error(`Erro ao gerar a landing page: ${error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'}`);
      }
    } finally {
      // Limpar o timeout e o controller
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // Limpar o timer de mensagens
      clearInterval(messageTimer);
      
      controller = null;
      setLoading(false);
      setLoadingMessage("");
      setLoadingDots("");
    }
  };
  
  // Copiar resultado para a área de transferência
  const handleCopy = () => {
    navigator.clipboard.writeText(result)
      .then(() => toast.success("Código copiado para a área de transferência"))
      .catch(() => toast.error("Erro ao copiar o código"));
  };
  
  // Download do código HTML
  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `landing-page-${formData.niche.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Arquivo HTML baixado com sucesso!");
  };

  // Função para abrir a visualização em uma nova janela
  const openInNewWindow = useCallback(() => {
    if (!result) return;
    
    try {
      const newWindow = window.open('', '_blank');
      if (!newWindow) {
        toast.error("Não foi possível abrir uma nova janela. Verifique se o bloqueador de pop-ups está desativado.");
        return;
      }
      
      // Escreve o conteúdo HTML diretamente no novo documento
      newWindow.document.open();
      newWindow.document.write(result);
      newWindow.document.close();
    } catch (error) {
      console.error('Erro ao abrir nova janela:', error);
      toast.error("Não foi possível abrir a visualização em uma nova janela.");
    }
  }, [result]);

  // Efeito para renderizar o conteúdo HTML diretamente
  useEffect(() => {
    if (result && previewRef.current && activeTab === "preview") {
      try {
        // Limpar conteúdo anterior
        previewRef.current.innerHTML = '';
        
        // Criar um iframe para isolar completamente o conteúdo
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        // Configurar o sandbox (forma segura)
        const sandboxAttr = document.createAttribute('sandbox');
        sandboxAttr.value = 'allow-same-origin allow-scripts allow-forms';
        iframe.attributes.setNamedItem(sandboxAttr);
        
        // Adicionar ao DOM
        previewRef.current.appendChild(iframe);
        
        // Escrever o conteúdo no iframe após ele estar pronto
        iframe.onload = () => {
          if (iframe.contentDocument) {
            iframe.contentDocument.open();
            iframe.contentDocument.write(result);
            iframe.contentDocument.close();
            
            console.log("Conteúdo HTML renderizado com sucesso no iframe");
          }
        };
        
        // Iniciar carregamento do iframe
        iframe.srcdoc = '<html><head></head><body></body></html>';
        
      } catch (error) {
        console.error("Erro ao renderizar HTML:", error);
        
        // Exibir mensagem de erro em caso de falha
        if (previewRef.current) {
          previewRef.current.innerHTML = `
            <div class="p-4 text-center">
              <h3 class="text-lg font-medium text-red-600">Erro ao renderizar a visualização</h3>
              <p class="mt-2 text-sm text-gray-600">Tente abrir em uma nova janela.</p>
            </div>
          `;
        }
      }
    }
  }, [result, activeTab]);

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
              Pode levar até 3 minutos...
            </div>
          </div>
          <div className="min-h-[500px] pt-16 flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse" style={{width: '100%'}}></div>
              </div>
              <p className="text-sm text-center mt-4 text-muted-foreground">
                Estamos criando sua landing page com IA. Esse processo pode levar até 3 minutos.
              </p>
              <p className="text-xs text-center mt-1 text-muted-foreground">
                As páginas geradas incluem HTML, CSS e JavaScript responsivos e otimizados.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground h-full">
          <Code className="h-16 w-16 mb-4 opacity-20" />
          <p>O código HTML da landing page aparecerá aqui</p>
          <p className="text-xs mt-1">Preencha o formulário e clique em Gerar Landing Page</p>
        </div>
      );
    }

    if (activeTab === "code") {
      return (
        <Textarea
          value={result}
          readOnly
          className="min-h-[500px] font-mono text-sm resize-none border-0 bg-muted/30"
        />
      );
    } else {
      return (
        <div className="flex flex-col h-full">
          <div className="flex justify-end mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewWindow}
              className="h-7 gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Abrir em nova janela</span>
            </Button>
          </div>
          <div 
            ref={previewRef} 
            className="min-h-[450px] overflow-auto border rounded p-1 bg-white w-full flex-grow"
            style={{ height: 'calc(500px - 30px)', maxHeight: 'calc(500px - 30px)' }}
          />
        </div>
      );
    }
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
                disabled={loading}
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
                disabled={loading}
              />
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
                disabled={loading || images.length >= 5}
              />
              
              {/* Botão de upload */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={triggerFileInput}
                disabled={loading || images.length >= 5}
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
                  disabled={loading}
                />
              ))}
              {formData.benefits.length < 6 && !loading && (
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                  "flex items-center justify-center gap-2 w-full",
                  loading && "opacity-70 cursor-not-allowed"
                )}
              >
                {loading ? <Loading /> : (
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
          <div className="rounded-lg border p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Resultado</h3>
              
              {result && !loading && (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopy}
                    className="h-8 gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload}
                    className="h-8 gap-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Baixar</span>
                  </Button>
                </div>
              )}
            </div>

            {result && !loading && (
              <Tabs 
                defaultValue="code" 
                className="w-full mb-4"
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "code" | "preview")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="code" className="flex items-center gap-1">
                    <Code className="h-4 w-4" />
                    <span>Código</span>
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>Visualização</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            
            <div className="flex-grow">
              {renderResultContent()}
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