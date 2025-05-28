"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Monitor, Smartphone, Save, Code } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LandingPage {
  id: string;
  title: string;
  description: string;
  html: string;
  createdAt: string;
  updatedAt: string;
}

export default function LandingPageEditPage({ params }: { params: { id: string } }) {
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [html, setHtml] = useState("");
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState('preview');
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Buscar dados da landing page
  useEffect(() => {
    const fetchLandingPage = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/landing-pages/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        setLandingPage(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setHtml(data.html);
      } catch (error) {
        console.error("Erro ao buscar landing page:", error);
        toast.error("Ocorreu um erro ao carregar a landing page");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLandingPage();
  }, [params.id]);

  // Atualizar o iframe quando o HTML mudar
  useEffect(() => {
    if (iframeRef.current && html) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
      }
    }
  }, [html, activeTab]);

  // Salvar alterações
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }
    
    if (!html.trim()) {
      toast.error("O HTML é obrigatório");
      return;
    }
    
    try {
      setSaving(true);
      
      const response = await fetch(`/api/landing-pages/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          html,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      toast.success("Landing page atualizada com sucesso");
      
      // Redirecionar para a página de visualização
      router.push(`/dashboard/landing-pages/${params.id}`);
    } catch (error) {
      console.error("Erro ao atualizar landing page:", error);
      toast.error("Ocorreu um erro ao atualizar a landing page");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push(`/dashboard/landing-pages/${params.id}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Visualização
      </Button>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-opacity-50 border-t-blue-500 rounded-full"></div>
        </div>
      ) : landingPage ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h1 className="text-2xl font-bold mb-6">Editar Landing Page</h1>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Título
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Digite o título da landing page"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Descrição (opcional)
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Digite uma descrição para a landing page"
                  />
                </div>
                
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div>
              <Card className="overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
                    <TabsList>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="code">Código HTML</TabsTrigger>
                    </TabsList>

                    {activeTab === "preview" && (
                      <div className="flex bg-gray-100 rounded-md p-1">
                        <button
                          onClick={() => setViewMode('desktop')}
                          className={`p-1 rounded ${viewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}
                        >
                          <Monitor className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('mobile')}
                          className={`p-1 rounded ${viewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                        >
                          <Smartphone className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <TabsContent value="preview" className="p-0 m-0">
                    <div 
                      className={`bg-gray-50 ${
                        viewMode === 'mobile' ? 'flex justify-center p-4' : ''
                      }`}
                    >
                      <div 
                        className={`bg-white ${
                          viewMode === 'mobile' 
                            ? 'w-[375px] h-[667px] shadow-md rounded-md overflow-hidden' 
                            : 'w-full h-[600px]'
                        }`}
                      >
                        <iframe
                          ref={iframeRef}
                          title={title}
                          className="w-full h-full border-0"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="code" className="p-0 m-0">
                    <Textarea
                      value={html}
                      onChange={(e) => setHtml(e.target.value)}
                      className="font-mono text-sm h-[600px] rounded-none"
                    />
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <h3 className="mt-4 text-lg font-medium">Landing page não encontrada</h3>
          <p className="mt-2 text-gray-500">
            A landing page solicitada não existe ou você não tem permissão para acessá-la.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/dashboard/landing-pages')}
          >
            Voltar para Landing Pages
          </Button>
        </div>
      )}
    </div>
  );
} 