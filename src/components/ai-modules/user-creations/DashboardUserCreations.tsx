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
  RefreshCw
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

// Interface para landing pages
interface LandingPage {
  _id: string;
  id?: string;
  title: string;
  description: string;
  html: string;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardUserCreationsProps {
  limit?: number;
  className?: string;
}

export function DashboardUserCreations({ limit = 5, className = "" }: DashboardUserCreationsProps) {
  const { data: session } = useSession();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar criações do usuário
  const fetchCreations = useCallback(async () => {
    console.log('DashboardUserCreations: Iniciando busca de criações');
    setError(null);
    
    try {
      setIsRefreshing(true);
      console.log('DashboardUserCreations: Fazendo requisição para /api/user-creations');
      
      // Primeiro, buscar todas as criações do usuário
      const response = await fetch('/api/user-creations');
      console.log('DashboardUserCreations: Status da resposta:', response.status);
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar criações: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('DashboardUserCreations: Dados recebidos, total de criações:', data.creations?.length || 0);
      
      let allCreations = data.creations || [];
      
      // Verificar se há landing pages nos dados
      const landingPagesInCreations = allCreations.filter((c: any) => c.type === 'landing-page') || [];
      console.log('DashboardUserCreations: Landing pages encontradas nas criações:', landingPagesInCreations.length);
      
      // Buscar landing pages diretamente, independente de já terem sido encontradas ou não
      console.log('DashboardUserCreations: Buscando landing pages diretamente do endpoint específico');
      try {
        const landingPagesResponse = await fetch('/api/landing-pages');
        
        if (landingPagesResponse.ok) {
          const landingPagesData = await landingPagesResponse.json();
          console.log('DashboardUserCreations: Landing pages encontradas no endpoint específico:', 
                      landingPagesData.landingPages?.length || 0);
          
          if (landingPagesData.landingPages?.length > 0) {
            // Converter landing pages para o formato de criações
            const landingPageCreations: Creation[] = landingPagesData.landingPages.map((lp: LandingPage) => {
              console.log('DashboardUserCreations: Convertendo landing page para formato de criação:', lp.title, 'ID:', lp._id || lp.id);
              console.log('DashboardUserCreations: HTML disponível:', Boolean(lp.html), 'Tamanho:', lp.html?.length || 0);
              
              return {
                _id: lp._id || lp.id || '',
                title: lp.title || 'Landing Page sem título',
                type: 'landing-page',
                content: {
                  result: lp.html || '',
                  description: lp.description || '',
                  tags: lp.tags || []
                },
                createdAt: lp.createdAt || new Date().toISOString(),
                updatedAt: lp.updatedAt || new Date().toISOString()
              };
            });
            
            // Verificar se já existem essas landing pages nas criações
            const existingLandingPageIds = new Set(landingPagesInCreations.map((lp: any) => lp._id));
            console.log('DashboardUserCreations: IDs de landing pages já existentes:', 
                      Array.from(existingLandingPageIds));
            
            // Adicionar apenas landing pages que ainda não existem nas criações
            const newLandingPages = landingPageCreations.filter(lp => !existingLandingPageIds.has(lp._id));
            console.log('DashboardUserCreations: Novas landing pages a serem adicionadas:', newLandingPages.length);
            
            if (newLandingPages.length > 0) {
              allCreations = [...allCreations, ...newLandingPages];
              console.log('DashboardUserCreations: Total de criações após adicionar landing pages:', allCreations.length);
            }
          }
        } else {
          console.warn('DashboardUserCreations: Falha ao buscar landing pages do endpoint específico');
        }
      } catch (landingPageError) {
        console.error('DashboardUserCreations: Erro ao buscar landing pages:', landingPageError);
        // Continuar mesmo se falhar a busca de landing pages
      }
      
      // Ordenar por data mais recente
      allCreations.sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      // Se houver limite, pegar apenas as N primeiras criações
      const filteredCreations = limit ? allCreations.slice(0, limit) : allCreations;
      setCreations(filteredCreations || []);
      
      if (allCreations.length > 0) {
        console.log('DashboardUserCreations: Tipos encontrados após combinação:', 
          allCreations.map((c: any) => c.type).reduce((acc: any, type: string) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {})
        );
      }
    } catch (error: any) {
      console.error('DashboardUserCreations: Erro ao carregar criações:', error);
      setError(error.message || 'Não foi possível carregar suas criações');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [limit]);

  // Função para forçar um refresh completo
  const forceRefresh = useCallback(() => {
    console.log('DashboardUserCreations: Forçando refresh completo');
    setIsLoading(true);
    
    // Pequeno atraso para garantir que o estado de loading seja exibido
    setTimeout(() => {
      fetchCreations();
    }, 100);
  }, [fetchCreations]);

  // Carregar criações quando o componente montar
  useEffect(() => {
    console.log('DashboardUserCreations: Componente montado, carregando criações');
    fetchCreations();
    
    // Atualizar a cada 15 segundos
    const intervalId = setInterval(() => {
      console.log('DashboardUserCreations: Atualizando automaticamente...');
      fetchCreations();
    }, 15000);
    
    return () => clearInterval(intervalId);
  }, [fetchCreations]);

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

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando suas criações...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Atividade Recente</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={forceRefresh}
            disabled={isRefreshing}
            title="Atualizar lista"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
          <Link href="/profile/my-creations">
            <Button variant="ghost" size="sm">Ver Todas</Button>
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="p-4 mb-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          <p>{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={fetchCreations}
          >
            Tentar novamente
          </Button>
        </div>
      )}
      
      {creations.length === 0 && !error ? (
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