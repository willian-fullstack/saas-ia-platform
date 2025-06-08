import { useState, useEffect } from "react";
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
  ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";

// Interface para o tipo de criação
interface Creation {
  _id: string;
  title: string;
  type: string;
  content: {
    result?: string;
    imageUrl?: string;
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

  // Carregar criações do usuário
  useEffect(() => {
    const fetchCreations = async () => {
      if (!session?.user) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/user-creations');
        
        if (!response.ok) {
          throw new Error('Erro ao carregar criações');
        }
        
        const data = await response.json();
        // Se houver limite, pegar apenas as N primeiras criações
        const filteredCreations = limit ? data.creations.slice(0, limit) : data.creations;
        setCreations(filteredCreations || []);
      } catch (error) {
        console.error('Erro ao carregar criações:', error);
        toast.error('Não foi possível carregar suas criações');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session?.user) {
      fetchCreations();
    }
  }, [session, limit]);

  // Copiar conteúdo da criação
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => toast.success('Conteúdo copiado para a área de transferência'))
      .catch(() => toast.error('Erro ao copiar o conteúdo'));
  };

  // Download do conteúdo da criação
  const handleDownload = (creation: Creation) => {
    // Para imagens, baixar a imagem diretamente
    if (creation.type === 'creative' && creation.content?.imageUrl) {
      const link = document.createElement("a");
      link.href = creation.content.imageUrl as string;
      link.download = `${creation.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Imagem baixada com sucesso');
      return;
    }
    
    // Para outros tipos de conteúdo
    const content = creation.content?.result || '';
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
  const handlePreview = (content: string) => {
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
      case 'creative':
        return <ImageIcon className="h-5 w-5 text-yellow-500" />;
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando suas criações...</p>
      </div>
    );
  }

  if (creations.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-muted/30">
        <p className="text-muted-foreground mb-4">Você ainda não tem criações.</p>
        <Link href="/dashboard">
          <Button>Começar a Criar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Atividade Recente</h2>
          <Link href="/profile/my-creations">
            <Button variant="ghost">Ver Todas</Button>
          </Link>
        </div>
      )}
      
      <div className="grid gap-4">
        {creations.map(creation => (
          <div key={creation._id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-full bg-muted">
                  {renderIcon(creation.type)}
                </div>
                <div>
                  <h3 className="font-medium">{creation.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatType(creation.type)} • {formatDate(creation.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {(creation.type !== 'creative' || (creation.type === 'creative' && creation.content?.result)) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(creation.content?.result || '')}
                    title="Copiar conteúdo"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                
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
                    onClick={() => handlePreview(creation.content?.result || '')}
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
                  {creation.content?.result || ""}
                </div>
              ) : creation.type === 'landing-page' ? (
                <div className="line-clamp-3 font-mono text-xs">
                  {creation.content?.result ? `${creation.content.result.substring(0, 200)}...` : ""}
                </div>
              ) : creation.type === 'creative' && creation.content?.imageUrl ? (
                <div className="flex justify-center">
                  <Image 
                    src={creation.content.imageUrl as string} 
                    alt={creation.title} 
                    width={300} 
                    height={200} 
                    className="object-contain max-h-48"
                  />
                </div>
              ) : (
                <div className="line-clamp-3">
                  {creation.content?.result || ""}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 