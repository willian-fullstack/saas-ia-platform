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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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

// Componente de loading com mensagem e animação
function LoadingWithMessage({ message, submessage }: { message: string; submessage?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-6">
        <div className="w-16 h-16">
          <Loading className="w-full h-full text-blue-500" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Paintbrush className="w-6 h-6 text-blue-700 animate-bounce" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{message}</h3>
      {submessage && (
        <p className="text-sm text-gray-600">{submessage}</p>
      )}
      <div className="mt-4 flex flex-col items-center">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse delay-150"></div>
          <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse delay-300"></div>
          <div className="h-2 w-2 rounded-full bg-blue-300 animate-pulse delay-500"></div>
        </div>
        <div className="text-xs text-gray-500 italic">
          Isso pode levar alguns instantes...
        </div>
      </div>
    </div>
  );
}

// Componente de dicas para cada campo
function FieldTip({ title, tips }: { title: string; tips: string[] }) {
  return (
    <div className="bg-blue-50 p-3 rounded-md mt-2">
      <h4 className="text-sm font-medium text-blue-700 mb-1">{title}</h4>
      <ul className="text-xs text-blue-800 space-y-1 pl-4 list-disc">
        {tips.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>
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
    const file = e.target?.files?.[0];
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
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const target = event.target;
      if (target && target.result) {
        setFormData(prev => ({
          ...prev,
          productImage: file,
          productImagePreview: target.result as string
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
    
    try {
      // Validação dos campos obrigatórios
      if (!formData.niche.trim() || !formData.product.trim()) {
        toast.error("Por favor, preencha o nicho e o nome do produto");
        setLoading(false);
      return;
    }
    
      // Verificar se pelo menos 3 benefícios foram preenchidos
      const validBenefits = formData.benefits.filter(b => b.trim().length > 0);
      if (validBenefits.length < 3) {
        toast.error("Por favor, adicione pelo menos 3 benefícios");
        setLoading(false);
        return;
      }
      
      // Sequência de mensagens de loading para feedback do usuário
    const loadingMessages = [
        { message: "Analisando informações do produto", submessage: "Processando dados sobre " + formData.product },
        { message: "Criando estrutura da página", submessage: "Definindo seções e componentes" },
        { message: "Aplicando estilo " + formData.style, submessage: "Ajustando cores, tipografia e layout" },
        { message: "Gerando conteúdo persuasivo", submessage: "Criando textos específicos para seu nicho" },
        { message: "Otimizando para conversão", submessage: "Implementando elementos de call-to-action" },
        { message: "Aplicando responsividade", submessage: "Garantindo compatibilidade com todos os dispositivos" },
        { message: "Finalizando sua landing page", submessage: "Últimos ajustes e otimizações" }
      ];
      
      // Execução das mensagens de loading em sequência
      let msgIndex = 0;
      const msgInterval = setInterval(() => {
        if (msgIndex < loadingMessages.length) {
          setLoadingMessage(loadingMessages[msgIndex].message);
          setLoadingDots(loadingMessages[msgIndex].submessage || "");
          msgIndex++;
        } else {
          clearInterval(msgInterval);
        }
      }, 3000);
      
      // Preparar dados para enviar à API
      const requestData = {
        niche: formData.niche,
        product: formData.product,
        benefits: formData.benefits.filter(b => b.trim().length > 0),
        targetAudience: formData.targetAudience,
        callToAction: formData.callToAction,
        pricing: formData.pricing,
        style: formData.style,
        testimonials: formData.testimonials,
        separateFiles: formData.separateFiles
      };
      
      // Enviar solicitação para a API
      const response = await fetch("/api/generate-landing-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      
      // Verificar resposta
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao gerar a landing page");
      }
      
      // Processar resposta da API
      const data = await response.json();
      
      // Verificar se a resposta contém os dados esperados
      if (data.html) {
        // Para arquivos separados
        if (formData.separateFiles) {
          setHtmlCode(data.html);
          setCssCode(data.css || "");
          setJsCode(data.js || "");
          setSeparatedFiles(true);
          
          // Criar versão combinada para preview
          setGeneratedCode(createCombinedHTML(data.html, data.css || "", data.js || ""));
          
          // Criar download ZIP
          createZipDownload(data.html, data.css || "", data.js || "");
        } else {
          // Para arquivo único HTML
          setHtmlCode(data.html);
          setGeneratedCode(data.html);
          setSeparatedFiles(false);
        }
        
        // Mostrar mensagem de sucesso
        toast.success("Landing page gerada com sucesso!");
      } else {
        throw new Error("Resposta da API não contém HTML válido");
      }
    } catch (error) {
      console.error("Erro ao gerar landing page:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar landing page");
    } finally {
      setLoading(false);
      setLoadingMessage("");
      setLoadingDots("");
    }
  };
  
  // Função para alternar visualização prévia
  const togglePreview = () => {
    setPreviewOpen(!previewOpen);
  };
  
  // Função para criar HTML combinado para preview
  const createCombinedHTML = (html: string, css: string, js: string) => {
    // Verificar se o HTML já contém as tags head e body
    if (html.includes("<head>") && html.includes("<body>")) {
      // Injetar CSS e JS nas tags apropriadas
      return html
        .replace("</head>", `<style>${css}</style></head>`)
        .replace("</body>", `<script>${js}</script></body>`);
    }
    
    // Caso contrário, criar uma estrutura HTML completa
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Landing Page Preview</title>
        <style>
          ${css}
        </style>
      </head>
      <body>
        ${html}
        <script>
          ${js}
        </script>
      </body>
      </html>
    `;
  };
  
  // Função para criar arquivo ZIP com todos os arquivos
  const createZipDownload = async (html: string, css: string, js: string) => {
    try {
      // Importar JSZip dinamicamente
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      
      // Adicionar arquivos ao ZIP
      zip.file("index.html", html);
      zip.file("styles.css", css);
      zip.file("script.js", js);
      
      // Gerar blob do ZIP
      const content = await zip.generateAsync({ type: "blob" });
      
      // Criar URL para download
      const url = URL.createObjectURL(content);
      setZipDownloadUrl(url);
    } catch (error) {
      console.error("Erro ao criar arquivo ZIP:", error);
      toast.error("Não foi possível criar o arquivo ZIP");
    }
  };
  
  // Função para copiar conteúdo para a área de transferência
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Código copiado para a área de transferência!");
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
              <div className="space-y-2">
                <Label htmlFor="niche">Nicho *</Label>
                <Input
                  id="niche"
                  name="niche"
                  placeholder="Ex: Fitness, Marketing Digital, Emagrecimento"
                  value={formData.niche}
                  onChange={handleChange}
                  required
                />
                <FieldTip 
                  title="Dicas para definir seu nicho:"
                  tips={[
                    "Seja específico (ex: 'yoga para gestantes' em vez de apenas 'yoga')",
                    "Escolha um nicho com demanda comprovada",
                    "Considere seu conhecimento e paixão pelo tema"
                  ]}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product">Nome do Produto/Serviço *</Label>
                <Input
                  id="product"
                  name="product"
                  placeholder="Ex: Curso Transformação Total, Consultoria Premium"
                  value={formData.product}
                  onChange={handleChange}
                  required
                />
                <FieldTip 
                  title="Dicas para o nome do produto:"
                  tips={[
                    "Use nomes que comuniquem benefícios",
                    "Evite nomes genéricos ou muito técnicos",
                    "Considere incluir palavras como 'método', 'sistema' ou 'fórmula'"
                  ]}
                />
              </div>

              {/* Adicionar mais campos do formulário e resto do componente aqui */}
              
              {/* ... */}
              
            </form>
          </Card>
        </div>
        
        {/* ... Restante do componente ... */}
      </div>
      
      {/* Exibir o componente de loading durante o processo de geração */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <LoadingWithMessage 
              message={loadingMessage} 
              submessage={loadingDots} 
            />
          </div>
        </div>
      )}
    </div>
  );
} 