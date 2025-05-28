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
  ExternalLink,
  Smartphone,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Corrigir a interface do formData no início do componente
interface FormData {
  titulo: string;
  objetivo: string;
  descricao: string;
  tom: string;
  cta: string;
  elementos: string;
  cores: string;
  estilo: string;
}

export default function LandingPagesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("Gerando sua landing page");
  const [loadingDots, setLoadingDots] = useState("");
  const [activeTab, setActiveTab] = useState<"code" | "preview" | "external" | "html">("preview");
  const previewRef = useRef<HTMLDivElement>(null);
  const externalPreviewRef = useRef<HTMLDivElement>(null);
  const htmlCodeRef = useRef<HTMLPreElement>(null);
  const [formData, setFormData] = useState<FormData>({
    titulo: "",
    objetivo: "",
    descricao: "",
    tom: "profissional",
    cta: "",
    elementos: "",
    cores: "",
    estilo: "moderno"
  });
  const [images, setImages] = useState<{file: File, preview: string, description: string}[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  
  // Controle de requisições e timeouts
  const controllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showMethodsContainer, setShowMethodsContainer] = useState(false);
  const [processingStats, setProcessingStats] = useState<{
    time: string;
    originalLength: number;
    sanitizedLength: number;
    improvement: string;
  }>({
    time: "0",
    originalLength: 0,
    sanitizedLength: 0,
    improvement: "0%"
  });

  // Adicionar estado para controlar a visualização desktop/mobile
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

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
        
        // Corrigir problema com "Mídia X" se existir no HTML
        const mediaPlaceholders = previewRef.current.querySelectorAll('img[src^="Mídia "]');
        mediaPlaceholders.forEach((img, index) => {
          const mediaNumber = (img.getAttribute('src') || '').replace('Mídia ', '');
          if (mediaNumber && !isNaN(parseInt(mediaNumber)) && parseInt(mediaNumber) <= images.length) {
            const imgIndex = parseInt(mediaNumber) - 1;
            if (images[imgIndex]) {
              img.setAttribute('src', images[imgIndex].preview);
            }
          }
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
  }, [result, activeTab, images]);

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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Adicionar mais um campo de benefício
  const addBenefit = () => {
    // Não é mais necessário, estamos usando um novo formato de formulário
  };

  // Adicionar função para alternar entre modos de visualização
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === "desktop" ? "mobile" : "desktop");
  };
  
  // Função para manipular a remoção de imagens corrigida para incluir description
  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      // Revogar URL de preview para evitar vazamento de memória
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };
  
  // Função para manipular upload de imagens corrigida para incluir description
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      // Limitar a 5 imagens no total
      if (images.length + newFiles.length > 5) {
        toast.error("Máximo de 5 imagens permitido");
          return;
        }
        
      const newImages = newFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        description: "" // Adicionar descrição vazia por padrão
      }));
      
        setImages(prev => [...prev, ...newImages]);
    }
  };
  
  // Função para atualizar descrição da imagem
  const updateImageDescription = (index: number, description: string) => {
    setImages(prev => {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], description };
      return newImages;
    });
  };
  
  // Adicionar renderização de controles para descrição de imagem
  const renderImageItem = (image: { file: File; preview: string; description: string }, index: number) => {
    return (
      <div key={index} className="relative border rounded-md p-2 mb-2">
        <div className="flex items-start gap-2">
          <div className="w-16 h-16 relative flex-shrink-0">
            <img 
              src={image.preview} 
              alt={`Imagem ${index + 1}`}
              className="w-full h-full object-cover rounded"
            />
          </div>
          <div className="flex-grow">
            <p className="text-sm font-medium truncate mb-1">{image.file.name}</p>
            <div className="text-xs text-muted-foreground mb-1">
              {Math.round(image.file.size / 1024)} KB
            </div>
            <div className="mt-1">
              <input
                type="text"
                placeholder="Descreva esta imagem"
                value={image.description}
                onChange={(e) => updateImageDescription(index, e.target.value)}
                className="w-full px-2 py-1 text-xs border rounded"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-1 right-1 h-6 w-6 p-0"
            onClick={() => handleRemoveImage(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return;
    
    try {
    setLoading(true);
      setLoadingMessage("Gerando sua landing page");
      setLoadingDots("");
    setResult("");
      setShowDebugInfo(false);
      setShowMethodsContainer(false);
      
      // Iniciar o intervalo para os pontos animados
      const dotsInterval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev === "...") return "";
          return prev + ".";
        });
      }, 500);
      
      // Preparar dados para envio
      const imageDataForAPI = images.map((img, index) => ({
        description: img.description || `Imagem ${index + 1}`,
        preview: img.preview
      }));
      
      // Construir o prompt para a API
      const apiPrompt = `
Crie uma landing page completa e moderna para o seguinte produto/serviço:

TÍTULO: ${formData.titulo}

OBJETIVO: ${formData.objetivo}

DESCRIÇÃO DETALHADA: ${formData.descricao}

TOM DE COMUNICAÇÃO: ${formData.tom || "profissional"}

CALL-TO-ACTION PRINCIPAL: ${formData.cta || ""}

ELEMENTOS A INCLUIR: ${formData.elementos || "Cabeçalho, Hero section, Benefícios, Funcionalidades, Depoimentos, FAQ, Formulário de contato, Rodapé"}

CORES PRINCIPAIS: ${formData.cores || "Use cores modernas que combinem com o objetivo do produto/serviço"}

ESTILO VISUAL: ${formData.estilo || "moderno"}

IMAGENS DISPONÍVEIS:
${images?.map((img, index) => `Mídia ${index + 1}: ${img.description || `Imagem ${index + 1}`}`).join('\n') || "Não há imagens disponíveis. Use placeholders adequados."}

Crie uma landing page HTML5 completa, moderna e responsiva com todos os elementos necessários.
A página DEVE incluir:
- Cabeçalho com logo e menu de navegação
- Seção hero com título impactante e CTA principal
- Seção de benefícios/recursos em formato visual atraente (pelo menos 3-4 benefícios)
- Seção de depoimentos com pelo menos 3 depoimentos fictícios com nomes e imagens/ícones
- Seção "Sobre nós" ou informativa sobre a empresa/serviço
- Seção de preços/planos (se aplicável)
- Formulário de contato ou captura de leads funcionais
- Seção FAQ com pelo menos 3-4 perguntas comuns
- Rodapé completo com links de navegação, contato e redes sociais
- Design totalmente responsivo para celulares, tablets e desktop

Use as imagens disponíveis nos locais mais adequados usando: <img src="__IMG_X__" alt="Descrição">
Por exemplo: <img src="__IMG_1__" alt="Imagem principal do produto">
Ou alternativamente: <img src="Mídia X" alt="Descrição">

IMPORTANTE:
- Use Bootstrap 5 para componentes e layout responsivo
- Adicione efeitos de animação AOS (Animate On Scroll)
- Use FontAwesome para ícones
- Adicione estilos CSS personalizados para criar uma aparência única e profissional
- Inclua JavaScript para interações como validação de formulários, sliders, etc.
- Certifique-se de que todos os links e botões tenham efeitos de hover
- Use gradientes, sombras e efeitos visuais modernos
- NUNCA use markdown ou backticks em sua resposta, apenas HTML puro

Gere APENAS o código HTML completo e pronto para uso, SEM COMENTÁRIOS EXTRAS, incluindo todos os estilos CSS e scripts JavaScript necessários.
NÃO inclua texto explicativo em volta do código.`;
      
      // Enviar solicitação para a API
      const response = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: apiPrompt,
          images: imageDataForAPI,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }
      
      const data = await response.json();
      clearInterval(dotsInterval); // Parar a animação de pontos
      
      // Verificar se há erro na resposta
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Atualizar estado com o resultado
      const htmlResult = data.html || "";
      setResult(htmlResult);
      
      // Processar e exibir estatísticas
      setProcessingStats({
        time: parseFloat(data.processingTime || "0").toFixed(2),
        originalLength: data.originalLength || 0,
        sanitizedLength: data.sanitizedLength || 0,
        improvement: data.sanitizedLength && data.originalLength ? 
          (((data.sanitizedLength - data.originalLength) / data.originalLength) * 100).toFixed(2) + "%" : 
          "N/A"
      });
      
      // Exibir estatísticas de processamento
      setShowDebugInfo(true);
      
      // Aplicar resultado ao iframe
      setTimeout(() => {
        applyMethod4();
        setShowMethodsContainer(false);
      }, 500);
    } catch (error: any) {
      console.error("Erro ao enviar formulário:", error);
      setLoadingMessage(`Erro: ${error.message || "Falha ao gerar landing page"}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Função para verificar a qualidade da landing page gerada
  const checkLandingPageQuality = (html: string): { hasIssues: boolean, issues: string[] } => {
    const issues: string[] = [];
    const lowerHtml = html.toLowerCase();
    
    // Verificar elementos essenciais
    if (!lowerHtml.includes('<header') && !lowerHtml.includes('class="header"') && !lowerHtml.includes('id="header"')) {
      issues.push("Cabeçalho ausente ou mal identificado");
    }
    
    if (!lowerHtml.includes('<footer') && !lowerHtml.includes('class="footer"') && !lowerHtml.includes('id="footer"')) {
      issues.push("Rodapé ausente ou mal identificado");
    }
    
    if (!lowerHtml.includes('id="depoimentos"') && !lowerHtml.includes('id="testimonials"') && 
        !lowerHtml.includes('class="depoimentos"') && !lowerHtml.includes('class="testimonials"')) {
      issues.push("Seção de depoimentos ausente ou mal identificada");
    }
    
    if (!lowerHtml.includes('id="faq"') && !lowerHtml.includes('class="faq"')) {
      issues.push("Seção de FAQ ausente ou mal identificada");
    }
    
    // Verificar recursos importantes
    if (!lowerHtml.includes('data-aos')) {
      issues.push("Animações AOS ausentes");
    }
    
    if (!lowerHtml.includes('class="fa-') && !lowerHtml.includes('fa fa-') && !lowerHtml.includes('fas fa-')) {
      issues.push("Ícones FontAwesome ausentes");
    }
    
    // Verificar imagens
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    if (imgTags.length < 2) {
      issues.push("Poucas imagens na página");
    }
    
    // Verificar formulário
    if (!lowerHtml.includes('<form') || !lowerHtml.includes('</form>')) {
      issues.push("Formulário ausente");
    }
    
    return {
      hasIssues: issues.length > 0,
      issues
    };
  };
  
  // Função para copiar o HTML para a área de transferência
  const handleCopy = () => {
    if (result) {
    navigator.clipboard.writeText(result)
        .then(() => {
          toast.success("HTML copiado para a área de transferência!");
        })
        .catch((err) => {
          console.error("Erro ao copiar HTML:", err);
          toast.error("Erro ao copiar HTML para a área de transferência");
        });
    }
  };
  
  // Função para fazer o download do HTML como arquivo
  const handleDownload = () => {
    if (!result) return;
    
    try {
    const blob = new Blob([result], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
      a.download = `landing-page-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
      toast.success("Download do HTML iniciado");
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      toast.error("Erro ao fazer download do HTML");
    }
  };

  // Função para abrir a visualização em uma nova janela
  const openInNewWindow = () => {
    if (!result) return;
    
    try {
      const processedHTML = fixImagePlaceholders(result);
      const blob = new Blob([processedHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Erro ao abrir em nova janela:", error);
      toast.error("Erro ao abrir em nova janela");
    }
  };

  // Métodos de visualização
  const applyMethod1 = () => {
    try {
      console.log('Aplicando método 1: document.write');
      const iframe = previewIframeRef.current;
      if (!iframe) return;
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;
      
      // Processar o HTML para substituir os placeholders de imagem
      const processedHTML = fixImagePlaceholders(result);
      
      iframeDoc.open();
      iframeDoc.write(processedHTML);
      iframeDoc.close();
      
      toast.success("Método 1 aplicado: document.write");
    } catch (error) {
      console.error('Erro ao usar Método 1:', error);
      toast.error("Erro ao aplicar método 1");
    }
  };
  
  const applyMethod2 = () => {
    try {
      console.log('Aplicando método 2: data URL');
      const iframe = previewIframeRef.current;
      if (!iframe) return;
      
      // Processar o HTML para substituir os placeholders de imagem
      const processedHTML = fixImagePlaceholders(result);
      
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(processedHTML);
      iframe.src = dataUrl;
      
      toast.success("Método 2 aplicado: data URL");
    } catch (error) {
      console.error('Erro ao usar Método 2:', error);
      toast.error("Erro ao aplicar método 2");
    }
  };
  
  const applyMethod3 = () => {
    try {
      console.log('Aplicando método 3: HTML Externo');
      if (!externalPreviewRef.current) return;
      
      // Usar a função de carregamento externo
      loadExternalPreview();
    } catch (error) {
      console.error('Erro ao usar Método 3:', error);
      toast.error("Erro ao aplicar método 3");
    }
  };
  
  const applyMethod4 = () => {
    try {
      console.log('Aplicando método Blob (método recomendado)');
      const iframe = previewIframeRef.current;
      if (!iframe || !result) return;
      
      // Processar o HTML para substituir os placeholders de imagem
      const processedHTML = fixImagePlaceholders(result);
      
      // Verificar se o HTML está completo com DOCTYPE, html, head e body
      let completeHTML = processedHTML;
      
      // Garantir que temos doctype, html, head e body
      if (!completeHTML.toLowerCase().includes('<!doctype')) {
        completeHTML = '<!DOCTYPE html>\n' + completeHTML;
      }
      
      if (!completeHTML.toLowerCase().includes('<html')) {
        completeHTML = completeHTML.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<html lang="pt-BR">');
        
        if (!completeHTML.toLowerCase().includes('</html>')) {
          completeHTML += '\n</html>';
        }
      }
      
      if (!completeHTML.toLowerCase().includes('<head')) {
        const htmlTagMatch = completeHTML.match(/<html[^>]*>/i);
        if (htmlTagMatch) {
          const htmlTag = htmlTagMatch[0];
          completeHTML = completeHTML.replace(
            htmlTag, 
            `${htmlTag}\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Preview Landing Page</title>\n</head>`
          );
        }
      }
      
      if (!completeHTML.toLowerCase().includes('<body')) {
        const headEndIndex = completeHTML.toLowerCase().indexOf('</head>');
        if (headEndIndex !== -1) {
          completeHTML = completeHTML.substring(0, headEndIndex + 7) + '\n<body>\n' + completeHTML.substring(headEndIndex + 7);
          
          if (!completeHTML.toLowerCase().includes('</body>')) {
            const htmlEndIndex = completeHTML.toLowerCase().indexOf('</html>');
            if (htmlEndIndex !== -1) {
              completeHTML = completeHTML.substring(0, htmlEndIndex) + '\n</body>\n' + completeHTML.substring(htmlEndIndex);
            }
          }
        }
      }
      
      // Adicionar sandbox style para isolar CSS
      const headEndIndex = completeHTML.toLowerCase().indexOf('</head>');
      if (headEndIndex !== -1) {
        const sandboxStyle = `
          <style>
            /* Sandbox reset para evitar conflitos de estilos */
            html, body { height: 100%; margin: 0; padding: 0; overflow-x: hidden; }
            * { box-sizing: border-box; }
          </style>
        `;
        completeHTML = completeHTML.substring(0, headEndIndex) + sandboxStyle + completeHTML.substring(headEndIndex);
      }
      
      // Criar um blob URL e atribuir ao iframe
      const blob = new Blob([completeHTML], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Atribuir URL ao iframe
      iframe.src = blobUrl;
      
      // Configurar evento onload para lidar com erros e limpar recursos
      iframe.onload = () => {
        try {
          // Verificar se o iframe carregou corretamente
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            console.log('Preview carregado com sucesso');
            // Adicionar script para capturar erros dentro do iframe
            const errorScript = iframeDoc.createElement('script');
            errorScript.textContent = `
              window.onerror = function(message, source, lineno, colno, error) {
                window.parent.postMessage({
                  type: 'iframe-error',
                  message: message,
                  source: source,
                  lineno: lineno
                }, '*');
                return true;
              };
            `;
            iframeDoc.body.appendChild(errorScript);
          }
        } catch (error) {
          console.error('Erro ao acessar iframe após carregamento:', error);
        } finally {
          // Sempre revogar o URL para evitar vazamentos de memória
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }
      };
      
      // Configurar evento de erro para o iframe
      iframe.onerror = (event) => {
        console.error('Erro ao carregar iframe:', event);
        toast.error('Erro ao carregar a visualização. Tente outro método.');
        // Revogar URL em caso de erro
        URL.revokeObjectURL(blobUrl);
      };
      
      // Adicionar listener para mensagens do iframe (para capturar erros)
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.type === 'iframe-error') {
          console.error('Erro capturado no iframe:', event.data);
          toast.error(`Erro no JavaScript da página: linha ${event.data.lineno}`);
      }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Limpar o listener quando o componente for desmontado
      return () => {
        window.removeEventListener('message', messageHandler);
      };
      
      } catch (error) {
      console.error('Erro ao usar Método 4 (Blob):', error);
      toast.error("Erro ao aplicar método 4. Tente outro método de visualização.");
    }
  };
  
  const applyMethod5 = () => {
    try {
      console.log('Aplicando método 5: innerHTML no iframe');
      const iframe = previewIframeRef.current;
      if (!iframe) return;
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;
      
      // Processar o HTML para substituir os placeholders de imagem
      const processedHTML = fixImagePlaceholders(result);
      
      iframeDoc.body.innerHTML = ''; // Limpar conteúdo atual
      
      // Extrair e adicionar estilos do head
      const styleMatches = processedHTML.match(/<style[^>]*>([\s\S]*?)<\/style>/g);
      if (styleMatches) {
        styleMatches.forEach(styleTag => {
          const styleElement = iframeDoc.createElement('style');
          styleElement.textContent = styleTag.replace(/<style[^>]*>|<\/style>/g, '');
          iframeDoc.head.appendChild(styleElement);
        });
      }
      
      // Extrair e adicionar scripts
      const scriptMatches = processedHTML.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
      if (scriptMatches) {
        scriptMatches.forEach(scriptTag => {
          if (!scriptTag.includes('src=')) {
            const scriptElement = iframeDoc.createElement('script');
            scriptElement.textContent = scriptTag.replace(/<script[^>]*>|<\/script>/g, '');
            iframeDoc.body.appendChild(scriptElement);
          }
        });
      }
      
      // Extrair apenas o conteúdo do body
      const bodyContent = processedHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/);
      if (bodyContent && bodyContent[1]) {
        iframeDoc.body.innerHTML = bodyContent[1];
      } else {
        // Se não conseguir extrair o body, tente colocar todo o HTML
        iframeDoc.body.innerHTML = processedHTML;
      }
      
      toast.success("Método 5 aplicado: innerHTML");
    } catch (error) {
      console.error('Erro ao usar Método 5:', error);
      toast.error("Erro ao aplicar método 5");
    }
  };

  // Melhorar a função fixImagePlaceholders para lidar com diferentes formatos de referência
  const fixImagePlaceholders = (htmlContent: string): string => {
    let fixedHtml = htmlContent;
    
    // Substituir referências no formato "Mídia X"
    fixedHtml = fixedHtml.replace(/src=["']Mídia\s*(\d+)["']/gi, (match, num) => {
      const index = parseInt(num) - 1;
      if (images[index]) {
        return `src="${images[index].preview}" alt="${images[index].description || `Imagem ${num}`}"`;
      }
      
      // Imagem não encontrada, usar placeholder
      return `src="https://placehold.co/600x400?text=Imagem+${num}" alt="Placeholder ${num}"`;
    });
    
    // Substituir referências no formato "__IMG_X__"
    fixedHtml = fixedHtml.replace(/src=["']__IMG_(\d+)__["']/gi, (match, num) => {
      const index = parseInt(num) - 1;
      if (images[index]) {
        return `src="${images[index].preview}" alt="${images[index].description || `Imagem ${num}`}"`;
      }
      
      // Imagem não encontrada, usar placeholder
      return `src="https://placehold.co/600x400?text=Imagem+${num}" alt="Placeholder ${num}"`;
    });
    
    // Verificar por tags de imagem sem src ou com src vazio
    fixedHtml = fixedHtml.replace(/<img([^>]*)(src=["'][\s]*["']|src=["']#["']|src=["']undefined["']|src=["']null["']|(?!\s*src=))([^>]*)>/gi, (match, before, src, after) => {
      // Gerar um placeholder genérico para imagens sem src
      return `<img${before} src="https://placehold.co/600x400?text=Imagem" alt="Imagem placeholder"${after}>`;
    });
    
    // Corrigir URLs relativas que podem estar causando problemas
    fixedHtml = fixedHtml.replace(/src=["'](\.\/|\/)(images|img|assets)\/([^"']+)["']/gi, (match, prefix, folder, file) => {
      // Substituir por URL de placeholder com nome do arquivo
      return `src="https://placehold.co/600x400?text=${file.replace(/\.[^.]+$/, '')}"`;
    });
    
    return fixedHtml;
  };

  // Adicionar método para carregar o iframe usando um blob
  const loadIframeWithBlob = () => {
    try {
      if (!previewIframeRef.current || !result) return;
      
      console.log('Aplicando método Blob');
      
      let processedHTML = fixImagePlaceholders(result);
      
      const blob = new Blob([processedHTML], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      previewIframeRef.current.src = blobUrl;
      
      // Limpar URL quando o iframe for carregado
      previewIframeRef.current.onload = () => {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      };
      
      toast.success("Visualização atualizada usando método Blob");
    } catch (error) {
      console.error('Erro ao usar método Blob:', error);
      toast.error("Erro ao atualizar visualização");
    }
  };

  // Aplicar método de visualização externa (diretamente no div)
  const loadExternalPreview = () => {
    try {
      if (!externalPreviewRef.current || !result) return;
      
      console.log('Aplicando método HTML Externo');
      
      let processedHTML = fixImagePlaceholders(result);
      externalPreviewRef.current.innerHTML = processedHTML;
      setActiveTab("external");
      
      toast.success("Visualização externa atualizada");
    } catch (error) {
      console.error('Erro ao usar método HTML Externo:', error);
      toast.error("Erro ao atualizar visualização externa");
    }
  };

  // Renderizar conteúdo da área de resultado
  const renderResultContent = () => {
    if (loading) {
      return (
        <div className="mt-8 border rounded-lg overflow-hidden">
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              <div className="flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <h3 className="text-lg font-medium">{loadingMessage}{loadingDots}</h3>
              </div>
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
        <div className="mt-8 border rounded-lg overflow-hidden">
          <div className="p-8 flex flex-col items-center justify-center">
          <Code className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-center text-muted-foreground">O código HTML da landing page aparecerá aqui</p>
            <p className="text-xs text-center mt-1 text-muted-foreground">Preencha o formulário e clique em Gerar Landing Page</p>
          </div>
        </div>
      );
    }

      return (
      <div className="mt-8 border rounded-lg overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <div className="flex items-center justify-between border-b px-4">
            <TabsList className="grid grid-cols-3 h-12">
              <TabsTrigger value="preview" className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                Visualização
              </TabsTrigger>
              <TabsTrigger value="external" className="flex items-center gap-1">
                <Layout className="w-4 h-4" />
                HTML Renderizado
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-1">
                <Code className="w-4 h-4" />
                Código HTML
              </TabsTrigger>
            </TabsList>
            
            {/* Botões de modo desktop/mobile */}
            {activeTab === "preview" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleViewMode}
                className="flex items-center"
              >
                {viewMode === "desktop" ? (
                  <>
                    <Smartphone className="h-4 w-4 mr-1" />
                    <span>Mobile</span>
                  </>
                ) : (
                  <>
                    <Monitor className="h-4 w-4 mr-1" />
                    <span>Desktop</span>
                  </>
                )}
              </Button>
            )}
          </div>
          
          <div className="p-4">
            {activeTab === "preview" && (
              <div className={cn(
                "transition-all duration-300",
                viewMode === "mobile" ? "max-w-[375px] mx-auto border border-gray-300 rounded-lg overflow-hidden" : "w-full"
              )}>
                <iframe 
                  ref={previewIframeRef}
                  className={cn(
                    "w-full bg-white", 
                    viewMode === "mobile" ? "h-[667px]" : "h-[800px]"
                  )}
                  title="Preview da Landing Page"
                />
              </div>
            )}
            
            {activeTab === "external" && (
              <div ref={externalPreviewRef} className="min-h-[500px] p-4 bg-white border rounded">
                {/* Conteúdo HTML renderizado diretamente */}
                {!result && <p className="text-muted-foreground">A visualização HTML será exibida aqui.</p>}
              </div>
            )}
            
            {activeTab === "code" && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="absolute top-2 right-2 z-10"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                <pre
                  ref={htmlCodeRef}
                  className="text-xs p-4 bg-slate-950 text-slate-50 rounded-md overflow-auto max-h-[800px]"
                >
                  {result || "O código HTML será exibido aqui."}
                </pre>
              </div>
            )}
          </div>
        </Tabs>
        
        {showMethodsContainer && (
          <div className="p-4 border-t bg-slate-50">
            <h3 className="font-medium mb-2">Métodos de visualização</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Se estiver tendo problemas para visualizar a landing page, tente um dos métodos abaixo:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={applyMethod1}>
                Método 1: document.write
              </Button>
              <Button variant="outline" size="sm" onClick={applyMethod2}>
                Método 2: Data URL
              </Button>
              <Button variant="outline" size="sm" onClick={applyMethod3}>
                Método 3: HTML Direto
              </Button>
              <Button variant="outline" size="sm" onClick={applyMethod4}>
                Método 4: Objeto Blob
              </Button>
              <Button variant="outline" size="sm" onClick={applyMethod5}>
                Método 5: innerHTML
              </Button>
              <Button variant="outline" size="sm" onClick={openInNewWindow} className="ml-auto">
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir em nova aba
              </Button>
            </div>
          </div>
        )}
        
        {showDebugInfo && (
          <div className="p-4 border-t bg-amber-50">
            <h3 className="font-medium mb-2">Informações de depuração</h3>
            <div className="text-sm">
              <p><strong>Tamanho do HTML:</strong> {result?.length || 0} caracteres</p>
              <p><strong>Imagens disponíveis:</strong> {images.length}</p>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar HTML
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Baixar HTML
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Modificar a renderização dos controles de visualização
  const renderResultActions = () => {
    if (!result || loading) return null;
    
      return (
      <div className="flex items-center justify-between mb-4 border-b pb-4">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 max-w-md">
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="external">
              <Layout className="h-4 w-4 mr-2" />
              Externo
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code className="h-4 w-4 mr-2" />
              Código
            </TabsTrigger>
            <TabsTrigger value="html">
              <Code className="h-4 w-4 mr-2" />
              HTML
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleViewMode}
            className="flex items-center hidden md:flex"
          >
            {viewMode === "desktop" ? (
              <>
                <Smartphone className="h-4 w-4 mr-1" />
                <span>Mobile</span>
              </>
            ) : (
              <>
                <Monitor className="h-4 w-4 mr-1" />
                <span>Desktop</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(result);
              toast.success("HTML copiado para área de transferência");
            }}
            className="flex items-center"
          >
            <Copy className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Copiar</span>
          </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={openInNewWindow}
            className="flex items-center"
            >
            <ExternalLink className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Nova Aba</span>
            </Button>
          </div>
        </div>
      );
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="order-2 md:order-1 shadow-md rounded-lg border p-4 bg-white">
            <h2 className="text-lg font-semibold mb-4">Gerar Landing Page</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Campo de título */}
                <div>
                  <Label htmlFor="titulo">Título da Página</Label>
                  <Textarea 
                    id="titulo"
                    name="titulo"
                    placeholder="Ex: Soluções Inovadoras para seu Negócio"
                    value={formData.titulo}
                onChange={handleChange}
                    className="resize-none h-16"
                required
              />
            </div>
            
                {/* Campo de objetivo */}
                <div>
                  <Label htmlFor="objetivo">Objetivo da Página</Label>
                  <Textarea 
                    id="objetivo"
                    name="objetivo"
                    placeholder="Ex: Captar leads para nossa solução de marketing digital"
                    value={formData.objetivo}
                onChange={handleChange}
                    className="resize-none h-16"
                required
              />
            </div>
            
                {/* Campo de descrição */}
                <div>
                  <Label htmlFor="descricao">Descrição do Produto/Serviço</Label>
                  <Textarea 
                    id="descricao"
                    name="descricao"
                    placeholder="Descreva seu produto ou serviço em detalhes"
                    value={formData.descricao}
                    onChange={handleChange}
                    className="resize-none h-24"
                    required
                  />
            </div>
            
                {/* Tom de comunicação */}
                <div>
                  <Label htmlFor="tom">Tom de Comunicação</Label>
                  <select
                    id="tom"
                    name="tom"
                    value={formData.tom}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="profissional">Profissional</option>
                    <option value="casual">Casual</option>
                    <option value="amigavel">Amigável</option>
                    <option value="formal">Formal</option>
                    <option value="tecnico">Técnico</option>
                  </select>
            </div>
            
                {/* CTA principal */}
                <div>
                  <Label htmlFor="cta">Call-to-Action Principal</Label>
                  <Textarea 
                    id="cta"
                    name="cta"
                    placeholder="Ex: Agende uma demonstração gratuita"
                    value={formData.cta}
                onChange={handleChange}
                    className="resize-none h-16"
              />
            </div>
            
                {/* Elementos */}
                <div>
                  <Label htmlFor="elementos">Elementos a Incluir</Label>
                  <Textarea 
                    id="elementos"
                    name="elementos"
                    placeholder="Ex: Formulário de contato, seção de benefícios, depoimentos"
                    value={formData.elementos}
                onChange={handleChange}
                    className="resize-none h-16"
              />
            </div>
            
                {/* Cores */}
                <div>
                  <Label htmlFor="cores">Cores Principais</Label>
                  <Textarea 
                    id="cores"
                    name="cores"
                    placeholder="Ex: Azul escuro (#0c4a6e), verde (#10b981) e branco"
                    value={formData.cores}
                onChange={handleChange}
                    className="resize-none h-16"
              />
            </div>
            
            {/* Estilo */}
                <div>
                  <Label htmlFor="estilo">Estilo de Design</Label>
              <select
                    id="estilo"
                    name="estilo"
                    value={formData.estilo}
                onChange={handleChange}
                    className="w-full p-2 border rounded-md"
              >
                <option value="moderno">Moderno</option>
                    <option value="minimalista">Minimalista</option>
                <option value="corporativo">Corporativo</option>
                    <option value="criativo">Criativo</option>
                    <option value="tecnologico">Tecnológico</option>
              </select>
            </div>
            
                {/* Upload de imagens */}
                <div>
                  <Label>Imagens (opcional, até 5)</Label>
                  <div className="mt-1">
              <input
                      ref={imageInputRef} 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={loading || images.length >= 5}
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      className="w-full"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={loading || images.length >= 5}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {images.length === 0 ? "Adicionar imagens" : `Adicionar mais imagens (${images.length}/5)`}
                    </Button>
            </div>
            
                  {/* Lista de imagens com descrições */}
                  {images.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {images.map((img, index) => renderImageItem(img, index))}
                    </div>
                  )}
                </div>
                
                {/* Botão de geração */}
              <Button
                type="submit"
                  className="w-full"
                disabled={loading}
              >
                  {loading ? (
                  <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                  </>
                  ) : (
                    "Gerar Landing Page"
                )}
              </Button>
            </div>
          </form>
        </div>

          <div className="order-1 md:order-2 shadow-md rounded-lg border bg-white overflow-hidden">
            <div className="bg-muted p-4 border-b">
              <h2 className="text-lg font-semibold">Resultado</h2>
            </div>

            {renderResultActions()}
            
            <div className="flex-grow">
              {renderResultContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 