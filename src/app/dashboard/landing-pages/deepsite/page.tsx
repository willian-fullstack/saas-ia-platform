"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Smartphone, Monitor, Send, Image, Sparkles, Code, CheckCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

// Componente para exibir o código sendo gerado em tempo real
const CodeStream = ({ code, loading }: { code: string; loading: boolean }) => {
  const codeRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [code]);
  
  return (
    <div className="relative">
      <div 
        ref={codeRef}
        className="bg-zinc-950 text-zinc-200 p-4 rounded-md h-[400px] overflow-auto font-mono text-sm whitespace-pre-wrap"
      >
        {code || (loading ? "Aguardando resposta da IA..." : "O código gerado aparecerá aqui...")}
      </div>
      {loading && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-zinc-800 text-zinc-200 px-3 py-1 rounded-full text-xs">
          <div className="animate-pulse w-2 h-2 bg-emerald-400 rounded-full"></div>
          Gerando...
        </div>
      )}
    </div>
  );
};

// Componente para visualizar a landing page
const Preview = ({ html, device }: { html: string; device: 'desktop' | 'mobile' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
      }
    }
  }, [html]);
  
  return (
    <div className={`bg-white rounded-md shadow-sm overflow-hidden ${device === 'mobile' ? 'max-w-[375px] mx-auto h-[667px]' : 'w-full h-[600px]'}`}>
      <iframe 
        ref={iframeRef}
        className="w-full h-full border-0"
        title="Preview da Landing Page"
      />
    </div>
  );
};

export default function DeepSitePage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingCode, setStreamingCode] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [html, setHtml] = useState<string>(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Landing Page</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    header {
      background-color: #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 20px 0;
    }
    .hero {
      padding: 80px 0;
      background-color: #f9f9f9;
      text-align: center;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
    }
    p {
      margin-bottom: 20px;
    }
    .btn {
      display: inline-block;
      background-color: #3182ce;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      transition: background-color 0.3s;
    }
    .btn:hover {
      background-color: #2c5282;
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h2>Minha Empresa</h2>
    </div>
  </header>
  <section class="hero">
    <div class="container">
      <h1>Bem-vindo à nossa Landing Page</h1>
      <p>Esta é uma landing page básica que você pode personalizar com a ajuda da IA.</p>
      <a href="#" class="btn">Saiba Mais</a>
    </div>
  </section>
</body>
</html>`);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState("editor");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [landingPageTitle, setLandingPageTitle] = useState("Nova Landing Page");
  const [landingPageDescription, setLandingPageDescription] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Carregar sessionId da URL se disponível
  useEffect(() => {
    const urlSessionId = searchParams.get('sessionId');
    if (urlSessionId) {
      setSessionId(urlSessionId);
      fetchSession(urlSessionId);
    }
  }, [searchParams]);
  
  // Buscar dados da sessão
  const fetchSession = async (id: string) => {
    try {
      const response = await fetch(`/api/landing-pages/deepsite/session/${id}`);
      if (response.ok) {
        const data = await response.json();
        setHtml(data.html);
        toast.success("Sessão carregada com sucesso");
      } else {
        toast.error("Erro ao carregar sessão");
      }
    } catch (error) {
      console.error("Erro ao buscar sessão:", error);
      toast.error("Erro ao carregar sessão");
    }
  };
  
  // Lidar com seleção de imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Remover imagem selecionada
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Enviar prompt para a API
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Por favor, digite um prompt");
      return;
    }
    
    setLoading(true);
    setStreamingCode("");
    let accumulatedCode = "";
    
    try {
      // Criar FormData para enviar dados e imagem
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('html', html);
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      
      // Iniciar request com streaming
      const response = await fetch('/api/landing-pages/deepsite/ask-ai', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${await response.text()}`);
      }
      
      // Processar stream de resposta
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Não foi possível ler a resposta");
      
      let fullResponse = "";
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Converter o chunk para texto
        const chunk = new TextDecoder().decode(value);
        fullResponse += chunk;
        
        // Atualizar o código em streaming
        setStreamingCode(prev => prev + chunk);
      }
      
      // Extrair blocos de diff
      const diffRegex = /<<<<<<< SEARCH[\s\S]*?>>>>>>> REPLACE/g;
      const diffMatches = fullResponse.match(diffRegex);
      
      if (diffMatches && diffMatches.length > 0) {
        // Aplicar diffs ao HTML
        const response = await fetch('/api/landing-pages/deepsite/apply-diffs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html,
            diffs: fullResponse,
            sessionId
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao aplicar diffs: ${await response.text()}`);
        }
        
        const result = await response.json();
        setHtml(result.html);
        
        if (result.sessionId && !sessionId) {
          setSessionId(result.sessionId);
          
          // Atualizar URL com sessionId
          const url = new URL(window.location.href);
          url.searchParams.set('sessionId', result.sessionId);
          window.history.pushState({}, '', url);
        }
        
        toast.success("Alterações aplicadas com sucesso!");
        setActiveTab("preview");
      } else {
        toast.warning("A IA não retornou alterações aplicáveis");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Ocorreu um erro ao processar sua solicitação");
    } finally {
      setLoading(false);
      handleRemoveImage(); // Limpar imagem após envio
    }
  };
  
  // Salvar a landing page
  const handleSaveLandingPage = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/landing-pages/deepsite/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: landingPageTitle,
          description: landingPageDescription,
          html,
          sessionId,
          tags: [],
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      
      toast.success("Landing page salva com sucesso!");
      setShowSaveModal(false);
      
      // Redirecionar para a lista de landing pages
      router.push('/dashboard/landing-pages');
    } catch (error) {
      console.error("Erro ao salvar landing page:", error);
      toast.error("Ocorreu um erro ao salvar a landing page");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Modal para salvar a landing page
  const SaveModal = () => {
    if (!showSaveModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium mb-4">Salvar Landing Page</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Título
              </label>
              <Input
                id="title"
                value={landingPageTitle}
                onChange={(e) => setLandingPageTitle(e.target.value)}
                placeholder="Digite o título da landing page"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Descrição (opcional)
              </label>
              <Textarea
                id="description"
                value={landingPageDescription}
                onChange={(e) => setLandingPageDescription(e.target.value)}
                placeholder="Digite uma descrição para a landing page"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowSaveModal(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveLandingPage}
              disabled={isSaving || !landingPageTitle.trim()}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full"></div>
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">DeepSite - Editor de Landing Page com IA</h1>
        <p className="text-gray-500">
          Descreva as alterações que deseja fazer na landing page e a IA irá implementá-las em tempo real.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium mb-1">
                  O que você deseja fazer nesta landing page?
                </label>
                <Textarea
                  id="prompt"
                  placeholder="Ex: Adicione uma seção de depoimentos com 3 clientes fictícios e suas avaliações"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px]"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Adicionar imagem de referência (opcional)
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-full"
                  >
                    <Image className="mr-2 h-4 w-4" />
                    Selecionar imagem
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-32 rounded-md object-contain bg-gray-100 p-2" 
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-sm"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleSubmit}
                disabled={loading || !prompt.trim()} 
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar com IA
                  </>
                )}
              </Button>
            </div>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Code className="mr-2 h-5 w-5" />
              Código sendo gerado
            </h3>
            <CodeStream code={streamingCode} loading={loading} />
          </Card>
        </div>
        
        <div>
          <Card className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="editor">Editor HTML</TabsTrigger>
                </TabsList>
                
                {activeTab === "preview" && (
                  <div className="flex bg-gray-100 rounded-md p-1">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <Monitor className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <Smartphone className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <TabsContent value="preview" className="mt-0">
                <Preview html={html} device={previewDevice} />
              </TabsContent>
              
              <TabsContent value="editor" className="mt-0">
                <Textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="font-mono text-sm h-[600px]"
                />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => router.push('/dashboard/landing-pages')}>
          Voltar para Landing Pages
        </Button>
        
        <Button 
          variant="default" 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setShowSaveModal(true)}
          disabled={isSaving}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Salvar Landing Page
        </Button>
      </div>
      
      <SaveModal />
    </div>
  );
} 