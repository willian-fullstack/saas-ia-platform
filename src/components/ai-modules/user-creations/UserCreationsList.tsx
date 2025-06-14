import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { 
  Edit, 
  Layout, 
  MessageSquare, 
  Copy, 
  Download, 
  Eye,
  Loader2,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Interface para o tipo de criação
interface Creation {
  _id: string;
  title: string;
  type: string;
  content: {
    result: string;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

interface UserCreationsListProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export function UserCreationsList({ limit, showHeader = true, className = "" }: UserCreationsListProps) {
  const { data: session } = useSession();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [endpoint, setEndpoint] = useState('/api/user-creations');

  // Função para carregar criações do usuário
  const fetchCreations = useCallback(async () => {
    console.log('UserCreationsList: Iniciando busca de criações');
    setError(null);
    
    try {
      setIsLoading(true);
      console.log('UserCreationsList: Fazendo requisição para endpoint', endpoint);
      
      const response = await fetch(endpoint);
      console.log('UserCreationsList: Status da resposta:', response.status);
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar criações: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('UserCreationsList: Dados recebidos, total de criações:', data.creations?.length || 0);
      
      if (data.creations && Array.isArray(data.creations)) {
        console.log('UserCreationsList: Tipos de criações recebidas:', 
          data.creations.map((c: any) => c.type).reduce((acc: Record<string, number>, type: string) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {})
        );
        
        // Verificar a integridade dos dados de cada criação
        data.creations.forEach((creation: any, index: number) => {
          if (!creation.content) {
            console.warn(`UserCreationsList: Criação #${index} não tem conteúdo definido:`, creation);
          } else if (!creation.content.result && creation.type === 'landing-page') {
            console.warn(`UserCreationsList: Landing page #${index} não tem HTML definido:`, creation);
          }
        });
        
        // Ordenar por data mais recente
        const sortedCreations = [...data.creations].sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setCreations(sortedCreations);
      } else {
        console.warn('UserCreationsList: Dados recebidos não contêm um array de criações:', data);
        setCreations([]);
      }
    } catch (error: any) {
      console.error('UserCreationsList: Erro ao carregar criações:', error);
      setError(error.message || 'Não foi possível carregar suas criações');
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  // Carregar criações na inicialização
  useEffect(() => {
    console.log('UserCreationsList: Componente montado, carregando criações');
    if (isAutoRefresh) {
      fetchCreations();
      
      // Atualizar a cada 15 segundos
      const intervalId = setInterval(() => {
        console.log('UserCreationsList: Atualizando automaticamente...');
        fetchCreations();
      }, 15000);
      
      return () => clearInterval(intervalId);
    }
  }, [fetchCreations, isAutoRefresh]);

  // Configurar atualização periódica
  useEffect(() => {
    if (!session?.user) return;
    
    console.log('UserCreationsList: Configurando atualização periódica');
    // Atualizar a cada 30 segundos
    const intervalId = setInterval(() => {
      console.log('UserCreationsList: Atualizando criações automaticamente...');
      fetchCreations();
    }, 30000);
    
    return () => {
      console.log('UserCreationsList: Limpando intervalo de atualização');
      clearInterval(intervalId);
    };
  }, [session, fetchCreations]);

  // Copiar conteúdo da criação
  const handleCopy = (content: string | undefined) => {
    if (!content) {
      toast.error('Não há conteúdo disponível para copiar');
      return;
    }
    
    navigator.clipboard.writeText(content)
      .then(() => toast.success('Conteúdo copiado para a área de transferência'))
      .catch(() => toast.error('Erro ao copiar o conteúdo'));
  };

  // Download do conteúdo da criação
  const handleDownload = (creation: Creation) => {
    const content = creation.content?.result;
    
    if (!content) {
      toast.error('Não há conteúdo disponível para download');
      return;
    }
    
    const fileName = `${creation.title.toLowerCase().replace(/\s+/g, '-')}.${creation.type === 'landing-page' ? 'html' : 'txt'}`;
    const contentType = creation.type === 'landing-page' ? 'text/html' : 'text/plain';
    
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Arquivo baixado com sucesso');
  };

  // Visualizar landing page em nova aba
  const handlePreview = (content: string | undefined) => {
    if (!content) {
      toast.error('Não há conteúdo disponível para visualizar');
      return;
    }
    
    try {
      const newWindow = window.open('', '_blank');
      if (!newWindow) {
        toast.error("Não foi possível abrir uma nova janela. Verifique se o bloqueador de pop-ups está desativado.");
        return;
      }
      
      newWindow.document.open();
      newWindow.document.write(content);
      newWindow.document.close();
    } catch (error) {
      console.error('Erro ao abrir nova janela:', error);
      toast.error("Não foi possível abrir a visualização.");
    }
  };

  // Renderizar ícone com base no tipo de criação
  const renderIcon = (type: string) => {
    switch (type) {
      case 'copywriting':
        return <Edit className="h-5 w-5 text-blue-500" />;
      case 'landing-page':
        return <Layout className="h-5 w-5 text-green-500" />;
      case 'offer':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      default:
        return <Edit className="h-5 w-5 text-gray-500" />;
    }
  };

  // Formatar o tipo de criação para exibição
  const formatType = (type: string) => {
    switch (type) {
      case 'copywriting':
        return 'Copywriting';
      case 'landing-page':
        return 'Landing Page';
      case 'offer':
        return 'Oferta';
      case 'creative':
        return 'Criativo';
      case 'video':
        return 'Vídeo';
      case 'consultant':
        return 'Consulta IA';
      default:
        return type;
    }
  };

  // Formatação da data relativa
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };
  
  // Função para renderizar o link correto com base no tipo de criação
  const getCreationLink = (creation: Creation) => {
    switch (creation.type) {
      case 'landing-page':
        return `/dashboard/landing-pages/${creation._id}`;
      case 'copywriting':
        return `/dashboard/copywriting/${creation._id}`;
      case 'offer':
        return `/dashboard/offers/${creation._id}`;
      default:
        return `/profile/my-creations/${creation._id}`;
    }
  };

  // Função para forçar um refresh completo
  const forceRefresh = useCallback(() => {
    console.log('UserCreationsList: Forçando refresh completo');
    setIsLoading(true);
    
    // Pequeno atraso para garantir que o estado de loading seja exibido
    setTimeout(() => {
      fetchCreations();
    }, 100);
  }, [fetchCreations]);

  // Verifica se não há criações para mostrar
  const noCreations = !isLoading && creations.length === 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando suas criações...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Minhas Criações</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={forceRefresh}
              disabled={isLoading}
              title="Atualizar lista"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando suas criações...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
          <p className="text-destructive font-medium">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={forceRefresh}
            className="mt-4"
          >
            Tentar novamente
          </Button>
        </div>
      ) : noCreations ? (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground mb-4">Você ainda não tem criações.</p>
          <Link href="/dashboard">
            <Button>Começar a Criar</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {creations.map(creation => (
            <div key={creation._id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <Link href={getCreationLink(creation)} className="flex items-start gap-3 hover:underline">
                  <div className="mt-1 p-2 rounded-full bg-muted">
                    {renderIcon(creation.type)}
                  </div>
                  <div>
                    <h3 className="font-medium">{creation.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatType(creation.type)} • {formatDate(creation.createdAt)}
                    </p>
                  </div>
                </Link>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(creation.content?.result)}
                    title="Copiar conteúdo"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(creation)}
                    title="Baixar arquivo"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  {creation.type === 'landing-page' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(creation.content?.result)}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Prévia do conteúdo */}
              <div className="mt-4 p-3 bg-muted rounded text-sm overflow-hidden">
                {creation.type === 'copywriting' ? (
                  <div className="line-clamp-3 whitespace-pre-wrap">
                    {creation.content?.result || 'Sem conteúdo disponível'}
                  </div>
                ) : creation.type === 'landing-page' ? (
                  <div className="line-clamp-3 font-mono text-xs">
                    {creation.content?.result 
                      ? `${creation.content.result.substring(0, 200)}...`
                      : 'Conteúdo HTML não disponível'}
                  </div>
                ) : (
                  <div className="line-clamp-3">
                    {creation.content?.result || 'Sem conteúdo disponível'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 