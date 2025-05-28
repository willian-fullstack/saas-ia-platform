"use client";

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Monitor, Smartphone, Code, Eye, RefreshCw, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EditorProps {
  params: {
    sessionId: string;
  };
}

export default function EditorPage({ params }: EditorProps) {
  const { sessionId } = params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [prompt, setPrompt] = useState('');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Carregar a sessão no início
  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(`/api/landing-pages/deepsite?id=${sessionId}`);
        
        if (!response.ok) {
          const error = await response.json();
          toast.error(error.message || 'Erro ao carregar sessão');
          return;
        }
        
        const data = await response.json();
        
        if (data.ok && data.session) {
          setTitle(data.session.title);
          setHtml(data.session.html);
        } else {
          toast.error('Sessão não encontrada');
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        toast.error('Erro ao carregar dados da sessão');
      } finally {
        setLoading(false);
      }
    }
    
    loadSession();
  }, [sessionId]);

  // Atualizar a preview quando o HTML mudar
  useEffect(() => {
    if (previewRef.current && html) {
      previewRef.current.innerHTML = html;
      
      // Executar scripts na preview
      const scripts = previewRef.current.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [html, activeTab]);

  // Função para alternar entre modos de visualização
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'desktop' ? 'mobile' : 'desktop');
  };

  // Função para salvar as alterações
  const saveChanges = async () => {
    if (!html) return;
    
    try {
      setSaving(true);
      
      const response = await fetch(`/api/landing-pages/deepsite/session/${sessionId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html,
          title,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar alterações');
      }
      
      toast.success('Alterações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  // Função para pedir melhorias ao DeepSite
  const askForImprovements = async () => {
    if (!html || !prompt) {
      toast.error('Por favor, insira uma solicitação de melhoria');
      return;
    }
    
    try {
      setGenerating(true);
      
      // Elemento para armazenar o conteúdo gerado
      let generatedContent = '';
      
      // Chamar a API em modo stream
      const response = await fetch('/api/landing-pages/deepsite/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html,
          prompt,
          previousPrompt: '', // Primeiro prompt, não tem histórico
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Erro ao gerar melhorias');
      }
      
      // Ler o stream de resposta
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decodificar e adicionar ao conteúdo
          const chunk = decoder.decode(value, { stream: true });
          generatedContent += chunk;
        }
      }
      
      // Aplicar as alterações (diffs) ao HTML atual
      const applyDiffsResponse = await fetch('/api/landing-pages/deepsite/apply-diffs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalHtml: html,
          aiResponseContent: generatedContent,
        }),
      });
      
      if (!applyDiffsResponse.ok) {
        const error = await applyDiffsResponse.json();
        throw new Error(error.message || 'Erro ao aplicar melhorias');
      }
      
      // Obter o HTML atualizado
      const updatedHtml = await applyDiffsResponse.text();
      setHtml(updatedHtml);
      
      toast.success('Melhorias aplicadas com sucesso!');
      setPrompt(''); // Limpar o prompt após sucesso
    } catch (error: any) {
      console.error('Erro ao gerar melhorias:', error);
      toast.error(`Erro: ${error.message || 'Falha ao gerar melhorias'}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra superior */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/landing-pages" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
          <span className="text-gray-300 mx-2">|</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-64 h-8"
            placeholder="Título da landing page"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={toggleViewMode}
            className="flex items-center"
          >
            {viewMode === 'desktop' ? (
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
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={saveChanges}
            className="flex items-center"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                <span>Salvar</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Área principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Painel lateral */}
        <div className="w-96 bg-white border-r overflow-y-auto p-4 flex flex-col">
          <h2 className="font-semibold mb-2">Solicitar Melhorias</h2>
          <p className="text-sm text-gray-500 mb-2">
            Descreva as melhorias que você deseja fazer na landing page.
          </p>
          
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Mude a cor do cabeçalho para azul, adicione mais um depoimento na seção de depoimentos, etc."
            className="mb-2 flex-1 min-h-[150px]"
          />
          
          <Button
            onClick={askForImprovements}
            disabled={generating || !prompt}
            className="w-full"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                <span>Gerando melhorias...</span>
              </>
            ) : (
              'Aplicar Melhorias'
            )}
          </Button>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Sugestões de Melhorias</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start" 
                onClick={() => setPrompt('Melhore a seção hero para torná-la mais impactante, com um título mais chamativo e um botão CTA mais destacado.')}
              >
                Melhorar Hero Section
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start" 
                onClick={() => setPrompt('Adicione uma seção de depoimentos com pelo menos 3 clientes fictícios com foto, nome e texto.')}
              >
                Adicionar Depoimentos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start" 
                onClick={() => setPrompt('Melhore as cores da página para um esquema mais moderno e profissional. Use gradientes sutis.')}
              >
                Melhorar Cores
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start" 
                onClick={() => setPrompt('Adicione animações AOS (Animate On Scroll) em pelo menos 5 elementos diferentes da página.')}
              >
                Adicionar Animações
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start" 
                onClick={() => setPrompt('Crie uma seção FAQ com pelo menos 5 perguntas frequentes usando um componente de acordeão.')}
              >
                Adicionar FAQ
              </Button>
            </div>
          </div>
        </div>
        
        {/* Área principal de edição/visualização */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'preview' | 'code')} className="h-full flex flex-col">
            <div className="border-b bg-white p-2">
              <TabsList className="grid grid-cols-2 w-64">
                <TabsTrigger value="preview" className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  Código
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="preview" className="flex-1 overflow-hidden p-0 m-0">
              <div 
                className={cn(
                  "bg-gray-100 h-full overflow-auto",
                  viewMode === 'mobile' ? 'flex justify-center p-4' : ''
                )}
              >
                <div 
                  className={cn(
                    "bg-white shadow-lg",
                    viewMode === 'mobile' ? 'w-[375px] h-[667px] overflow-auto' : 'w-full h-full'
                  )}
                  ref={previewRef}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="code" className="flex-1 overflow-hidden p-0 m-0">
              <Textarea
                ref={editorRef}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="font-mono text-sm h-full resize-none p-4"
                style={{ fontFamily: 'monospace' }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 