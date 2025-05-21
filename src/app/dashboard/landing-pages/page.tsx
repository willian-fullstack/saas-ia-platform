"use client";

import { useState, useEffect, useRef } from "react";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Smartphone, Monitor, Download, Copy, Eye, Code, Paintbrush, FileCog, Info, CheckCircle, Upload } from "lucide-react";
import { LANDING_PAGE_STYLES } from "@/templates/landing-page-templates";

// Componente simples de loading dots
function LoadingDots() {
  return (
    <div className="flex items-center space-x-1">
      <div className="h-1.5 w-1.5 animate-bounce bg-white rounded-full" />
      <div className="h-1.5 w-1.5 animate-bounce delay-75 bg-white rounded-full" />
      <div className="h-1.5 w-1.5 animate-bounce delay-150 bg-white rounded-full" />
    </div>
  );
}

// Componente de loading com mensagem
function LoadingWithMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4">
        <Loading />
      </div>
      <p className="text-gray-700">{message}</p>
    </div>
  );
}

interface FormData {
  niche: string;
  product: string;
  benefits: string[];
  targetAudience: string;
  callToAction: string;
  pricing: string;
  style: string;
  testimonials: boolean;
  separateFiles: boolean;
  productImage?: File | null;
  productImagePreview?: string;
}

export default function LandingPagesPage() {
  // Estados para o formulário
  const [formData, setFormData] = useState<FormData>({
    niche: "",
    product: "",
    benefits: ["", "", ""],
    targetAudience: "",
    callToAction: "",
    pricing: "",
    style: "moderno",
    testimonials: true,
    separateFiles: false,
    productImage: null,
    productImagePreview: undefined
  });

  // Estados para o processo de geração
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingDots, setLoadingDots] = useState("");
  
  // Estados para os códigos gerados
  const [generatedCode, setGeneratedCode] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [separatedFiles, setSeparatedFiles] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [zipDownloadUrl, setZipDownloadUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Referência para o iframe de visualização
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Função para lidar com mudanças nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // Asserting that e.target exists (TypeScript non-null assertion)
    const target = e.target!;
    const name = target.name;
    const value = target.value;

    // Handler específico para campos de benefícios
    if (name && name.startsWith("benefit-")) {
      const indexStr = name.substring(8); // "benefit-".length = 8
      const index = parseInt(indexStr);
      
      if (!isNaN(index)) {
        // Criar uma cópia do array de benefícios
    const newBenefits = [...formData.benefits];
        // Atualizar o benefício no índice específico
    newBenefits[index] = value;
        
        // Atualizar o estado com o novo array
    setFormData(prev => ({
      ...prev,
      benefits: newBenefits
    }));
        
        console.log(`Benefício ${index} atualizado para: ${value}`);
      }
    } else {
      // Para todos os outros campos
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Função para lidar com mudanças em checkboxes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Função para lidar com upload de imagens
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
        // Verificar se é uma imagem
        if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione um arquivo de imagem válido.");
          return;
        }
        
    // Verificar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
          return;
        }
        
    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        setFormData(prev => ({
          ...prev,
          productImage: file,
          productImagePreview: event.target.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Função para adicionar um novo benefício
  const addBenefit = () => {
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, ""]
    }));
  };

  // Função para remover um benefício
  const removeBenefit = (index: number) => {
    if (formData.benefits.length <= 1) return;
    
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  // Limpar URL de download quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (zipDownloadUrl) {
        URL.revokeObjectURL(zipDownloadUrl);
      }
    };
  }, [zipDownloadUrl]);

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage("Preparando para gerar sua landing page");
    setLoadingDots("");
    
    try {
      // Iniciar o intervalo para atualizar os pontos de carregamento
      const dotsInterval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev === "...") return "";
          return prev + ".";
        });
      }, 500);

      // Atualizar mensagem após alguns segundos
      setTimeout(() => {
        setLoadingMessage("Criando sua landing page perfeita");
      }, 2000);

      setTimeout(() => {
        setLoadingMessage("Aplicando estilo e otimizando o design");
      }, 5000);

      // Criar um FormData para enviar a imagem junto com os outros dados
      const requestFormData = new FormData();
      
      // Adicionar a imagem se existir
      if (formData.productImage) {
        requestFormData.append('productImage', formData.productImage);
      }
      
      // Remover o preview da imagem dos dados do formulário para o JSON
      const { productImagePreview, ...formDataWithoutPreview } = formData;
      requestFormData.append('data', JSON.stringify(formDataWithoutPreview));
      
      // Configurar as opções da requisição com FormData
      const requestOptions: RequestInit = {
        method: 'POST',
        body: requestFormData, 
        // Não definir o Content-Type, o navegador irá configurar automaticamente
      };

      // Fazer a requisição para gerar a landing page
      const response = await fetch('/api/landing-pages', requestOptions);
      
      // Parar o intervalo de atualização dos pontos
      clearInterval(dotsInterval);

      if (!response.ok) {
        // Tentativa de obter detalhes do erro
        let errorMessage = "Erro ao gerar landing page";
        try {
        const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Se não conseguir obter o JSON, usar o texto
          try {
            errorMessage = await response.text() || errorMessage;
          } catch {
            // Manter a mensagem padrão se nada funcionar
          }
        }
        throw new Error(errorMessage);
      }
      
      // Verificar o tipo de conteúdo da resposta
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        // Se for JSON, estamos recebendo arquivos separados
        const responseData = await response.json();
        console.log("Resposta da API (arquivos separados):", responseData);
        
        if (responseData.separatedFiles) {
          setHtmlCode(responseData.separatedFiles.html || "");
          setCssCode(responseData.separatedFiles.css || "");
          setJsCode(responseData.separatedFiles.js || "");
          setSeparatedFiles(true);
        }
        
        setGeneratedCode(responseData.code || "");
      } else {
        // Se for HTML, estamos recebendo o HTML completo
        const htmlContent = await response.text();
        console.log("Resposta da API: HTML recebido com tamanho", htmlContent.length);
        
        setHtmlCode(htmlContent);
        setCssCode("");
        setJsCode("");
        setSeparatedFiles(false);
        setGeneratedCode(htmlContent);
      }
      
      // Rolar para o resultado
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
      
      toast.success("Landing page gerada com sucesso!");
    } catch (error) {
      console.error("Erro:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar landing page");
    } finally {
      setLoading(false);
    }
  };

  // Renderizar a visualização da landing page no iframe quando estiver disponível
  useEffect(() => {
    if (iframeRef.current && previewOpen && generatedCode) {
      const iframeDocument = iframeRef.current.contentDocument;
      if (iframeDocument) {
        iframeDocument.open();
        iframeDocument.write(generatedCode);
        iframeDocument.close();
      }
    }
  }, [previewOpen, generatedCode]);

  // Função para abrir/fechar a visualização da landing page
  const togglePreview = () => {
    setPreviewOpen(!previewOpen);
  };

  // Função para criar o HTML combinado a partir dos arquivos separados
  const createCombinedHTML = (html: string, css: string, js: string) => {
    // Se o HTML já estiver completo (com tags html, head e body), extrair apenas o conteúdo do corpo
    let bodyContent = html;
    
    if (html.includes('<body') && html.includes('</body>')) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        bodyContent = bodyMatch[1];
      }
    } else if (html.includes('<html') && html.includes('</html>')) {
      // Se é um HTML completo, retornar com o CSS e JS injetados
      let fullHtml = html;
      
      // Adicionar o CSS no head se necessário
      if (css && !fullHtml.includes('<style>')) {
        fullHtml = fullHtml.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
      }
      
      // Adicionar o JS no final do body se necessário
      if (js && !fullHtml.includes('<script>')) {
        fullHtml = fullHtml.replace('</body>', `<script>\n${js}\n</script>\n</body>`);
      }
      
      return fullHtml;
    }
    
    // Construir o HTML combinado
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <style>
${css}
  </style>
</head>
<body>
${bodyContent}
  <script>
${js}
  </script>
</body>
</html>
    `.trim();
  };

  // Função para criar o ZIP para download
  const createZipDownload = async (html: string, css: string, js: string) => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      zip.file("index.html", html);
      zip.file("styles.css", css);
      zip.file("script.js", js);
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      
      setZipDownloadUrl(url);
      } catch (error) {
      console.error("Erro ao criar ZIP:", error);
      toast.error("Erro ao criar arquivo para download");
    }
  };
  
  // Função para copiar texto para a área de transferência
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copiado para a área de transferência!"))
      .catch(() => toast.error("Erro ao copiar. Tente novamente."));
  };
  
  // Função para download de arquivo individual
  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Gerador de Landing Pages Profissionais</h1>
      <p className="text-gray-600 mb-8">
        Crie landing pages de alta conversão com código HTML, CSS e JavaScript separados e otimizados para seu negócio.
        </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="md:col-span-2">
          <Card className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Informações da Landing Page</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="niche" className="block text-sm font-medium text-gray-700 mb-1">
                    Nicho*
                  </label>
              <input
                    type="text"
                id="niche"
                name="niche"
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Ex: Educação, Saúde, Tecnologia..."
                value={formData.niche}
                onChange={handleChange}
                required
              />
            </div>
                <div>
                  <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
                    Produto/Serviço*
                  </label>
              <input
                    type="text"
                id="product"
                name="product"
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Ex: Curso online, Consultoria..."
                value={formData.product}
                onChange={handleChange}
                required
              />
                </div>
            </div>
            
              <div>
                <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-1">
                  Público-alvo
                </label>
              <input 
                  type="text"
                  id="targetAudience"
                  name="targetAudience"
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Ex: Profissionais de marketing, Mulheres 25-45 anos..."
                  value={formData.targetAudience}
                  onChange={handleChange}
              />
            </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Principais Benefícios* (3-5 benefícios do seu produto/serviço)
                </label>
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="mb-2 flex">
              <input 
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder={`Benefício ${index + 1}`}
                      value={benefit}
                      onChange={(e) => {
                        const newBenefits = [...formData.benefits];
                        newBenefits[index] = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          benefits: newBenefits
                        }));
                      }}
                      required={index < 3}
                    />
                    {index > 2 && (
                      <button
                        type="button"
                        className="ml-2 px-3 py-2 bg-red-50 text-red-500 rounded hover:bg-red-100"
                        onClick={() => removeBenefit(index)}
                      >
                        &times;
                      </button>
              )}
            </div>
              ))}
                {formData.benefits.length < 5 && (
                <button
                  type="button"
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  onClick={addBenefit}
                >
                    + Adicionar outro benefício
                </button>
              )}
            </div>
            
              <div>
                <label htmlFor="callToAction" className="block text-sm font-medium text-gray-700 mb-1">
                  Call to Action
                </label>
              <input
                  type="text"
                id="callToAction"
                name="callToAction"
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Ex: Assinar agora, Agendar demonstração..."
                value={formData.callToAction}
                onChange={handleChange}
              />
            </div>
            
              <div>
                <label htmlFor="pricing" className="block text-sm font-medium text-gray-700 mb-1">
                  Preço ou Oferta
                </label>
              <input
                  type="text"
                id="pricing"
                name="pricing"
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Ex: R$ 97/mês, 30% de desconto..."
                value={formData.pricing}
                onChange={handleChange}
              />
            </div>
            
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Estilo da Landing Page*
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.values(LANDING_PAGE_STYLES).map(style => (
                    <div 
                      key={style.id}
                      className={cn(
                        "flex items-center justify-center p-3 border rounded-md cursor-pointer transition-all",
                        formData.style === style.id
                          ? "border-2 border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                      onClick={() => setFormData({...formData, style: style.id})}
              >
                      <div className="text-center">
                        <div 
                          className="w-5 h-5 rounded-full mx-auto mb-2"
                          style={{backgroundColor: style.colors.primary}}
                        />
                        <span className="text-sm font-medium">{style.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
            
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                name="testimonials"
                checked={formData.testimonials}
                    onChange={(e) => handleCheckboxChange(e)}
                    className="rounded text-blue-600"
                  />
                  <span>Incluir depoimentos</span>
                </label>
                
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    name="separateFiles"
                    checked={formData.separateFiles}
                    onChange={(e) => handleCheckboxChange(e)}
                    className="rounded text-blue-600"
                  />
                  <span>Gerar HTML, CSS e JS separados</span>
                </label>
            </div>
            
              {/* Upload de imagem do produto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagem do Produto
                </label>
                <div className="mt-1 flex flex-col items-center justify-center">
                  {formData.productImagePreview ? (
                    <div className="relative w-full max-w-md">
                      <img 
                        src={formData.productImagePreview} 
                        alt="Preview" 
                        className="rounded-lg border shadow-sm w-full object-contain max-h-64" 
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, productImage: null, productImagePreview: undefined }))}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                        aria-label="Remover imagem"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="group w-full max-w-md h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-gray-500" />
                        <p className="mt-1 text-sm text-gray-500 group-hover:text-gray-600">
                          Clique para fazer upload ou arraste e solte
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, WEBP até 5MB
                        </p>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    Gerando
                    <LoadingDots />
                  </span>
                ) : (
                  "Gerar Landing Page"
                )}
              </Button>
          </form>
          </Card>
        </div>

        {/* Informações sobre estilos */}
        <div className="md:col-span-1">
          <Card className="p-6 bg-white rounded-lg shadow-md h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Info size={18} className="text-blue-500" />
              <span>Guia de Estilos</span>
            </h2>
            
            <div className="space-y-6">
              {Object.values(LANDING_PAGE_STYLES).map((style) => (
                <div key={style.id} className="border-b pb-4 last:border-b-0">
                  <h3 className="font-medium text-lg mb-1">
                    {style.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {style.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {style.recommendedFor.map((item, i) => (
                      <span key={i} className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2">
                    <h4 className="text-xs font-medium uppercase text-gray-500 mb-1">Características</h4>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {style.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
              
              <div className="bg-blue-50 p-3 rounded-md text-sm">
                <h3 className="font-medium mb-2 text-blue-700">Dica Profissional</h3>
                <p className="text-xs text-blue-800 mb-2">
                  Para obter resultados de melhor qualidade:
                </p>
                <ul className="text-xs text-blue-800 space-y-1 pl-5 list-disc">
                  <li>Forneça detalhes específicos sobre seu produto</li>
                  <li>Descreva claramente quem é seu público-alvo</li>
                  <li>Liste de 3 a 5 benefícios fortes e persuasivos</li>
                  <li>Escolha um estilo que combine com seu nicho</li>
                  <li>Use um Call-to-Action claro e direto</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Resultado da landing page */}
      {generatedCode && (
        <div id="result-section" className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Landing Page Gerada</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={togglePreview}
              >
                {previewOpen ? "Fechar Visualização" : "Visualizar Landing Page"}
              </Button>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(generatedCode)}
              >
                Copiar HTML
              </Button>
              {separatedFiles && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(cssCode)}
                  >
                    Copiar CSS
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(jsCode)}
                  >
                    Copiar JS
                  </Button>
                  </>
                )}
            </div>
          </div>

          {/* Visualização da Landing Page */}
          {previewOpen && (
            <div className="mb-6 border shadow-md rounded-lg overflow-hidden">
              <div className="bg-gray-200 p-2 flex justify-between items-center">
                <span className="font-medium text-sm">Preview da Landing Page</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => window.open(URL.createObjectURL(new Blob([generatedCode], { type: 'text/html' })), '_blank')}
                >
                  Abrir em Nova Janela
              </Button>
            </div>
              <div className="w-full h-[600px] overflow-hidden">
                <iframe
                  ref={iframeRef}
                  srcDoc={generatedCode}
                  title="Landing Page Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                />
        </div>
            </div>
          )}

          <Card className="bg-white rounded-lg shadow-lg overflow-hidden">
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="w-full bg-gray-100 p-0 rounded-none flex">
                <TabsTrigger value="preview" className="flex-1 py-3 data-[state=active]:bg-white rounded-none gap-1">
                  <Eye size={14} />
                  <span>Preview</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="flex-1 py-3 data-[state=active]:bg-white rounded-none gap-1">
                  <Code size={14} />
                  <span>HTML</span>
                </TabsTrigger>
                {separatedFiles && (
                  <>
                    <TabsTrigger value="css" className="flex-1 py-3 data-[state=active]:bg-white rounded-none gap-1">
                      <Paintbrush size={14} />
                      <span>CSS</span>
                    </TabsTrigger>
                    <TabsTrigger value="js" className="flex-1 py-3 data-[state=active]:bg-white rounded-none gap-1">
                      <FileCog size={14} />
                      <span>JS</span>
                    </TabsTrigger>
                    <TabsTrigger value="download" className="flex-1 py-3 data-[state=active]:bg-white rounded-none gap-1">
                      <Download size={14} />
                      <span>Download</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="preview" className="p-0 m-0 h-[600px] overflow-hidden">
                <div className="flex justify-between items-center p-2 bg-gray-100 border-b">
                  <span className="text-xs font-medium">Preview da Landing Page</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === "desktop" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("desktop")}
                      className="h-7 gap-1"
                    >
                      <Monitor size={14} />
                      <span>Desktop</span>
                    </Button>
                    <Button
                      variant={viewMode === "mobile" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("mobile")}
                      className="h-7 gap-1"
                    >
                      <Smartphone size={14} />
                      <span>Mobile</span>
                    </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                      className="h-7 gap-1 ml-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                      onClick={() => {
                        // Criar blob URL e abrir em nova aba
                        const blob = new Blob([generatedCode || ""], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                        // Liberar URL após abrir
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      }}
                    >
                      <Eye size={14} />
                      <span>Abrir em Nova Aba</span>
                    </Button>
                  </div>
                </div>
                <div className={cn(
                  "flex justify-center bg-gray-50 h-[568px] overflow-auto transition-all duration-300 ease-in-out",
                  viewMode === "mobile" && "p-4"
                )}>
                  <iframe
                    srcDoc={generatedCode}
                    title="Landing Page Preview"
                    className={cn(
                      "border-0 bg-white transition-all duration-300 ease-in-out",
                      viewMode === "desktop" ? "w-full h-full" : "w-[375px] h-full rounded-lg shadow-md"
                    )}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    onLoad={(e) => {
                      console.log("iframe carregado");
                      // Garantir que o iframe esteja visível
                      const iframe = e.currentTarget;
                      if (iframe) {
                        iframe.style.display = "block";
                      }
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="code" className="p-0 m-0">
                <div className="flex justify-between items-center p-2 bg-gray-100 border-b">
                  <span className="text-xs font-medium">index.html</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 gap-1"
                    onClick={() => copyToClipboard(htmlCode)}
                  >
                    <Copy size={14} />
                    <span>Copiar</span>
                  </Button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 overflow-auto h-[568px] text-sm">
                  <code>{htmlCode}</code>
                </pre>
              </TabsContent>

              {separatedFiles && (
                <>
                  <TabsContent value="css" className="p-0 m-0">
                    <div className="flex justify-between items-center p-2 bg-gray-100 border-b">
                      <span className="text-xs font-medium">styles.css</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                        className="h-7 gap-1"
                        onClick={() => copyToClipboard(cssCode)}
                  >
                        <Copy size={14} />
                        <span>Copiar</span>
                  </Button>
                </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 overflow-auto h-[568px] text-sm">
                      <code>{cssCode}</code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="js" className="p-0 m-0">
                    <div className="flex justify-between items-center p-2 bg-gray-100 border-b">
                      <span className="text-xs font-medium">script.js</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                        className="h-7 gap-1"
                        onClick={() => copyToClipboard(jsCode)}
                  >
                        <Copy size={14} />
                        <span>Copiar</span>
                  </Button>
            </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 overflow-auto h-[568px] text-sm">
                      <code>{jsCode}</code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="download" className="p-0 m-0">
                    <div className="p-8 flex flex-col items-center justify-center h-[600px]">
                      <h3 className="text-xl font-semibold mb-6">Baixar Arquivos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 w-full max-w-lg">
                        <Button 
                          variant="outline" 
                          className="gap-2 py-6" 
                          onClick={() => downloadFile(htmlCode, "index.html")}
                        >
                          <Download size={18} />
                          <div className="text-left">
                            <div className="font-medium">HTML</div>
                            <div className="text-xs text-gray-500">index.html</div>
                          </div>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="gap-2 py-6" 
                          onClick={() => downloadFile(cssCode, "styles.css")}
                        >
                          <Download size={18} />
                          <div className="text-left">
                            <div className="font-medium">CSS</div>
                            <div className="text-xs text-gray-500">styles.css</div>
            </div>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="gap-2 py-6" 
                          onClick={() => downloadFile(jsCode, "script.js")}
                        >
                          <Download size={18} />
                          <div className="text-left">
                            <div className="font-medium">JavaScript</div>
                            <div className="text-xs text-gray-500">script.js</div>
          </div>
                        </Button>
                        
                        {zipDownloadUrl && (
                          <Button 
                            className="gap-2 py-6 bg-blue-600 hover:bg-blue-700" 
                            onClick={() => {
                              if (zipDownloadUrl) {
                                const a = document.createElement('a');
                                a.href = zipDownloadUrl;
                                a.download = "landing-page.zip";
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              }
                            }}
                          >
                            <Download size={18} />
                            <div className="text-left">
                              <div className="font-medium">Todos os Arquivos</div>
                              <div className="text-xs text-gray-200">landing-page.zip</div>
          </div>
                          </Button>
              )}
        </div>

                      <p className="text-sm text-gray-500 text-center max-w-md">
                        Baixe os arquivos individualmente ou todos de uma vez no formato ZIP para implementar sua landing page em qualquer servidor web.
                      </p>
      </div>
                  </TabsContent>
                </>
              )}
              </Tabs>
          </Card>
        </div>
      )}

      {loading && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6 text-center">
          <LoadingWithMessage message={loadingMessage + loadingDots} />
          <p className="text-sm text-gray-500 mt-4">
            A geração pode levar até 2 minutos dependendo da complexidade da landing page.
          </p>
        </div>
      )}
    </div>
  );
} 