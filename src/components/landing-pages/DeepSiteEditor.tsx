import React, { useState, useEffect, useRef } from 'react';
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { 
  Loader2, 
  Code, 
  Eye, 
  Send, 
  Save,
  Copy,
  Download,
  Wand2,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

interface DeepSiteEditorProps {
  sessionId: string;
  onBack: () => void;
  onSaveComplete: () => void;
}

export default function DeepSiteEditor({ 
  sessionId, 
  onBack, 
  onSaveComplete 
}: DeepSiteEditorProps) {
  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionData, setSessionData] = useState<{
    html: string;
    name: string;
    landingPageId: string | null;
  }>({
    html: '',
    name: '',
    landingPageId: null,
  });
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponses, setAiResponses] = useState<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }[]>([]);
  const [askingAi, setAskingAi] = useState(false);
  
  // Referências
  const previewRef = useRef<HTMLDivElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Carregar dados da sessão
  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);
  
  // Efeito para rolar para o fim das mensagens quando novas são adicionadas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiResponses]);
  
  // Efeito para renderizar o HTML quando o código muda ou a aba ativa é alterada
  useEffect(() => {
    if (sessionData.html && activeTab === "preview" && previewRef.current) {
      try {
        // Limpar qualquer conteúdo anterior
        previewRef.current.innerHTML = '';
        
        // Criar um iframe para isolar completamente o conteúdo
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '600px'; // Altura fixa para garantir visualização
        iframe.style.border = 'none';
        
        // Configurar o sandbox (forma segura)
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms');
        
        // Adicionar o iframe ao DOM
        previewRef.current.appendChild(iframe);
        
        // Definir o conteúdo do iframe diretamente
        setTimeout(() => {
          if (iframe.contentDocument) {
            iframe.contentDocument.open();
            iframe.contentDocument.write(sessionData.html);
            iframe.contentDocument.close();
            console.log('HTML renderizado no iframe');
          } else {
            console.error('Não foi possível acessar o documento do iframe');
          }
        }, 100);
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
  }, [sessionData.html, activeTab]);
  
  // Buscar dados da sessão
  const fetchSessionData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/landing-pages/deepsite/sessions?id=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados da sessão');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('Dados da sessão recebidos:', data.data);
        
        // Verificar se content existe (nome do campo na API)
        const htmlContent = data.data.content || data.data.html || '';
        
        if (!htmlContent || htmlContent.trim() === '') {
          console.error('HTML recebido está vazio!', data.data);
          toast.error('O conteúdo HTML da sessão está vazio. Tente recarregar a página.');
        }
        
        setSessionData({
          html: htmlContent,
          name: data.data.name || 'Sessão DeepSite',
          landingPageId: data.data.landingPageId || null,
        });
        
        // Buscar histórico de mensagens se existir
        if (data.data.messages && Array.isArray(data.data.messages)) {
          // Converter timestamps para formato de string ISO
          const formattedMessages = data.data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp instanceof Date 
              ? msg.timestamp.toISOString() 
              : (typeof msg.timestamp === 'string' ? msg.timestamp : new Date().toISOString())
          }));
          
          setAiResponses(formattedMessages);
        }
      } else {
        throw new Error(data.message || 'Erro ao carregar dados da sessão');
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      toast.error('Erro ao carregar dados da sessão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Atualizar o código HTML
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSessionData(prev => ({
      ...prev,
      html: e.target.value
    }));
  };
  
  // Abrir visualização em nova janela
  const openInNewWindow = () => {
    if (!sessionData.html) return;
    
    try {
      const newWindow = window.open('', '_blank');
      if (!newWindow) {
        toast.error("Não foi possível abrir uma nova janela. Verifique se o bloqueador de pop-ups está desativado.");
        return;
      }
      
      // Escreve o conteúdo HTML diretamente no novo documento
      newWindow.document.open();
      newWindow.document.write(sessionData.html);
      newWindow.document.close();
    } catch (error) {
      console.error('Erro ao abrir nova janela:', error);
      toast.error("Não foi possível abrir a visualização em uma nova janela.");
    }
  };
  
  // Copiar o código HTML
  const handleCopy = () => {
    navigator.clipboard.writeText(sessionData.html)
      .then(() => toast.success("Código copiado para a área de transferência"))
      .catch(() => toast.error("Erro ao copiar o código"));
  };
  
  // Download do código HTML
  const handleDownload = () => {
    try {
      const blob = new Blob([sessionData.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deepsite-${sessionId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Arquivo HTML baixado com sucesso!");
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast.error("Erro ao baixar o arquivo HTML.");
    }
  };
  
  // Enviar pergunta para a IA
  const handleAskAi = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Digite uma pergunta ou instrução para a IA");
      return;
    }
    
    // Verificar se o HTML existe
    if (!sessionData.html || sessionData.html.trim() === '') {
      toast.error("O código HTML da landing page está vazio. Adicione algum conteúdo antes de consultar a IA.");
      return;
    }
    
    // Verificar tamanho do HTML
    if (sessionData.html.length > 50000) {
      toast.warning("O HTML da landing page é muito grande. A IA analisará apenas uma parte do código.");
    }
    
    // Guardar a pergunta
    const question = aiPrompt.trim();
    
    // Adicionar pergunta ao histórico
    setAiResponses(prev => [
      ...prev, 
      { 
        role: 'user', 
        content: question,
        timestamp: new Date().toISOString()
      }
    ]);
    
    // Limpar input
    setAiPrompt('');
    
    try {
      setAskingAi(true);
      
      // Criar FormData para enviar
      const formData = new FormData();
      formData.append('message', question);
      formData.append('html', sessionData.html);
      formData.append('sessionId', sessionId);
      
      // Depurar o conteúdo do FormData
      console.log('Enviando requisição com dados:', {
        message: question,
        sessionId: sessionId,
        html: sessionData.html ? 'HTML existe (não exibindo por extensão)' : 'HTML vazio'
      });
      
      // Fazer requisição à API
      const response = await fetch('/api/landing-pages/deepsite/ask-ai', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        // Tentar extrair a mensagem de erro detalhada
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        } catch (jsonError) {
          // Se não conseguir extrair o JSON, usar mensagem genérica
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
      }
      
      // Verificar o tipo de conteúdo da resposta
      const contentType = response.headers.get('Content-Type');
      
      if (contentType && contentType.includes('text/event-stream')) {
        // Processar resposta em streaming
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let responseText = '';
        
        if (reader) {
          // Adicionar resposta inicial ao histórico
          setAiResponses(prev => [
            ...prev, 
            { 
              role: 'assistant', 
              content: '',
              timestamp: new Date().toISOString()
            }
          ]);
          
          // Ler stream de dados
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Decodificar chunk e adicionar ao texto de resposta
            const chunk = decoder.decode(value, { stream: true });
            responseText += chunk;
            
            // Atualizar a resposta na interface
            setAiResponses(prev => {
              const newResponses = [...prev];
              newResponses[newResponses.length - 1].content = responseText;
              return newResponses;
            });
          }
          
          console.log("Processando resposta completa da IA:", responseText);
          
          // Processar código HTML se houver
          const htmlPattern = /<<<<<<< SEARCH([\s\S]*?)=======([\s\S]*?)>>>>>>> REPLACE/g;
          let newHtml = sessionData.html;
          let match;
          let foundReplacements = false;
          
          while ((match = htmlPattern.exec(responseText)) !== null) {
            foundReplacements = true;
            const searchBlock = match[1].trim();
            const replaceBlock = match[2].trim();
            
            console.log("Encontrado padrão de substituição:");
            console.log("- Buscar:", searchBlock.substring(0, 100) + (searchBlock.length > 100 ? "..." : ""));
            console.log("- Substituir:", replaceBlock.substring(0, 100) + (replaceBlock.length > 100 ? "..." : ""));
            
            try {
              // Verificar se o bloco de busca existe no HTML
              if (newHtml.includes(searchBlock)) {
                // Substituir o código antigo pelo novo
                newHtml = newHtml.replace(searchBlock, replaceBlock);
                console.log("Substituição realizada com sucesso");
              } else {
                console.warn("Bloco de busca não encontrado no HTML. Tentando substring parcial...");
                
                // Tentar encontrar parte do texto de busca (pelo menos 30 caracteres)
                if (searchBlock.length > 30) {
                  const partialSearch = searchBlock.substring(0, 30);
                  if (newHtml.includes(partialSearch)) {
                    // Encontrar o índice e tentar substituir uma parte maior
                    const startIndex = newHtml.indexOf(partialSearch);
                    const endIndex = startIndex + searchBlock.length;
                    
                    // Verificar se temos espaço suficiente
                    if (endIndex <= newHtml.length) {
                      const actualSearchBlock = newHtml.substring(startIndex, endIndex);
                      newHtml = newHtml.replace(actualSearchBlock, replaceBlock);
                      console.log("Substituição parcial realizada");
                    }
                  }
                }
              }
            } catch (replaceError) {
              console.error("Erro ao substituir HTML:", replaceError);
            }
          }
          
          // Atualizar HTML se houve mudanças
          if (foundReplacements) {
            if (newHtml !== sessionData.html) {
              setSessionData(prev => ({
                ...prev,
                html: newHtml
              }));
              
              toast.success("O código HTML foi atualizado com as sugestões da IA!");
            } else {
              toast.info("A IA sugeriu alterações, mas não foi possível aplicá-las automaticamente. Verifique a resposta e aplique manualmente se necessário.");
            }
          }
        }
      } else {
        // Processar resposta JSON padrão
        const data = await response.json();
        
        if (data.success) {
          // Adicionar resposta ao histórico
          setAiResponses(prev => [
            ...prev, 
            { 
              role: 'assistant', 
              content: data.data.message,
              timestamp: new Date().toISOString()
            }
          ]);
          
          // Atualizar HTML se a IA sugeriu alterações
          if (data.data.html && data.data.html !== sessionData.html) {
            setSessionData(prev => ({
              ...prev,
              html: data.data.html
            }));
            
            toast.info("O código HTML foi atualizado com as sugestões da IA.");
          }
        } else {
          throw new Error(data.message || 'Erro ao processar solicitação');
        }
      }
    } catch (error) {
      console.error('Erro ao consultar IA:', error);
      
      // Adicionar erro como resposta da IA
      setAiResponses(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `Desculpe, ocorreu um erro ao processar sua solicitação: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Por favor, tente novamente em alguns instantes.`,
          timestamp: new Date().toISOString()
        }
      ]);
      
      // Mostrar toast com mensagem de erro mais detalhada
      toast.error(`Erro na comunicação com a IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setAskingAi(false);
    }
  };
  
  // Salvar as alterações
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Fazer requisição à API para salvar
      const response = await fetch(`/api/landing-pages/deepsite/sessions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          content: sessionData.html,
          messages: aiResponses
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar alterações');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Alterações salvas com sucesso!");
        
        // Se tem landingPageId, atualizar a landing page
        if (sessionData.landingPageId) {
          try {
            const updateResponse = await fetch(`/api/landing-pages/${sessionData.landingPageId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                html: sessionData.html
              }),
            });
            
            if (!updateResponse.ok) {
              throw new Error('Erro ao atualizar landing page');
            }
            
            const updateData = await updateResponse.json();
            
            if (updateData.success) {
              toast.success("Landing page atualizada com sucesso!");
              
              // Notificar que o salvamento foi concluído
              onSaveComplete();
            }
          } catch (updateError) {
            console.error('Erro ao atualizar landing page:', updateError);
            toast.error("Erro ao atualizar landing page. As alterações foram salvas na sessão.");
          }
        }
      } else {
        throw new Error(data.message || 'Erro ao salvar alterações');
      }
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
      toast.error(`Erro ao salvar alterações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Formatação do timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando sessão DeepSite...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          
          <h2 className="text-xl font-semibold">{sessionData.name}</h2>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Salvar Alterações</span>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-5">
        {/* Editor de código e visualização */}
        <div className="md:col-span-3 space-y-4">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "code" | "preview")}
            className="w-full"
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
            
            <TabsContent value="code" className="space-y-2">
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopy}
                  className="h-7 gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownload}
                  className="h-7 gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar</span>
                </Button>
              </div>
              
              <Textarea
                ref={codeEditorRef}
                value={sessionData.html}
                onChange={handleCodeChange}
                className="min-h-[600px] font-mono text-sm resize-none"
                placeholder="Código HTML da landing page"
              />
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-2">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInNewWindow}
                  className="h-7 gap-1"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Abrir em nova janela</span>
                </Button>
              </div>
              
              <div 
                ref={previewRef} 
                className="min-h-[600px] overflow-auto border rounded bg-white w-full"
              ></div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Assistente DeepSite */}
        <div className="md:col-span-2 border rounded-lg p-4 flex flex-col h-[680px]">
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Assistente DeepSite</h3>
          </div>
          
          <div className="flex-grow overflow-y-auto mb-4 p-2 border rounded bg-muted/30">
            {aiResponses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Faça uma pergunta ao assistente DeepSite.</p>
                <p className="text-xs mt-2">
                  Você pode pedir para modificar o código, otimizar SEO, melhorar o design, adicionar elementos e muito mais.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiResponses.map((msg, index) => (
                  <div 
                    key={index}
                    className={`flex flex-col p-2 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-primary/10 ml-6' 
                        : 'bg-muted mr-6'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={msg.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                        {msg.role === 'user' ? 'Você' : 'Assistente'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Faça uma pergunta ou peça ajuda com o código..."
              className="text-sm resize-none"
              rows={3}
              disabled={askingAi}
            />
            
            <Button
              className="self-end"
              disabled={!aiPrompt.trim() || askingAi}
              onClick={handleAskAi}
            >
              {askingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            <p>Exemplos: "Melhore a responsividade", "Adicione uma seção de FAQ", "Otimize para SEO"</p>
          </div>
        </div>
      </div>
    </div>
  );
} 