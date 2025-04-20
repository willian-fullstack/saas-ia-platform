"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Loader2,
  Send,
  User,
  Bot,
  MessageSquare,
  Settings,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ConsultantPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content: "Olá! Sou seu consultor IA 24h para marketing e copywriting. Como posso ajudar você hoje?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [expertiseArea, setExpertiseArea] = useState("marketing digital");
  const [showSettings, setShowSettings] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rolar para o final da conversa quando novas mensagens são adicionadas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  // Focar no textarea quando a página carrega
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Enviar mensagem
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!message.trim()) return;
    
    // Adicionar mensagem do usuário ao histórico
    const userMessageId = Date.now().toString();
    const userMessage: ChatMessage = {
      id: userMessageId,
      content: message,
      isUser: true,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setMessage("");
    setLoading(true);
    
    try {
      // Preparar histórico para enviar à API (apenas últimas 10 mensagens para contexto)
      const recentHistory = chatHistory.slice(-10).map(msg => ({
        content: msg.content,
        isUser: msg.isUser
      }));
      
      const response = await fetch('/api/consultant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: recentHistory,
          expertiseArea
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar solicitação");
      }
      
      // Adicionar resposta do assistente ao histórico
      const assistantMessage: ChatMessage = {
        id: data.messageId || Date.now().toString() + "-ai",
        content: data.result,
        isUser: false,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Falha ao obter resposta. Tente novamente.");
      
      // Adicionar mensagem de erro ao histórico
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + "-error",
        content: "Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.",
        isUser: false,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  // Lidar com tecla Enter para enviar (Shift+Enter para nova linha)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Formatar timestamp
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  // Limpar histórico
  const clearHistory = () => {
    setChatHistory([{
      id: "welcome-new",
      content: "Histórico limpo. Como posso ajudar você hoje?",
      isUser: false,
      timestamp: new Date()
    }]);
    setShowSettings(false);
  };
  
  return (
    <div className="grid gap-6 h-[calc(100vh-150px)]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultor IA 24h</h1>
          <p className="text-muted-foreground">
            Converse com uma IA especializada em marketing e copywriting para obter ideias e sugestões
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {showSettings && (
        <div className="rounded-lg border p-4 shadow-sm bg-muted/30">
          <h2 className="text-lg font-medium mb-2">Configurações</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="expertise" className="text-sm font-medium">
                Área de Especialidade da IA
              </label>
              <select
                id="expertise"
                value={expertiseArea}
                onChange={(e) => setExpertiseArea(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="marketing digital">Marketing Digital</option>
                <option value="copywriting">Copywriting</option>
                <option value="tráfego pago">Tráfego Pago</option>
                <option value="vendas">Vendas</option>
                <option value="lançamentos">Lançamentos Digitais</option>
                <option value="redes sociais">Redes Sociais</option>
                <option value="criação de conteúdo">Criação de Conteúdo</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={clearHistory}
              >
                Limpar Histórico de Conversa
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Área de chat */}
        <div className="flex-1 overflow-y-auto border rounded-t-lg p-4 bg-muted/10">
          <div className="space-y-4">
            {chatHistory.map((msg) => (
              <div 
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-[80%] rounded-lg p-3",
                  msg.isUser 
                    ? "ml-auto bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}
              >
                <div className={cn(
                  "rounded-full h-8 w-8 flex items-center justify-center shrink-0",
                  msg.isUser ? "bg-primary-foreground/20" : "bg-primary/20"
                )}>
                  {msg.isUser ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <Bot className="h-5 w-5" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium">
                      {msg.isUser ? "Você" : "Consultor IA"}
                    </span>
                    <span className="text-xs opacity-70">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                  <div className={`text-sm ${msg.isUser ? "text-primary-foreground" : ""}`}>
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-1" : ""}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Área de input */}
        <form onSubmit={handleSendMessage} className="border-t-0 border rounded-b-lg p-2 bg-background">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua pergunta sobre marketing, copy, tráfego..."
                className="min-h-[60px] resize-none pr-12 pt-2"
                disabled={loading}
              />
              <div className="absolute right-3 bottom-2 text-xs text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>24h</span>
              </div>
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={loading || !message.trim()}
              className="h-10 w-10"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-center">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </div>
        </form>
      </div>
    </div>
  );
} 