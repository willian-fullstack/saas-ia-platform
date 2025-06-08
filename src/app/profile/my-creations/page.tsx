"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { 
  Edit, 
  Layout, 
  ArrowLeft, 
  MessageSquare, 
  Copy, 
  Trash, 
  Download, 
  Eye,
  Loader2,
  ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useRequireAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";

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

export default function MyCreationsPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { data: session } = useSession();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Carregar criações do usuário
  useEffect(() => {
    const fetchCreations = async () => {
      if (!session?.user) return;
      
      try {
        setIsLoading(true);
        console.log('Buscando criações...'); // Log para debug
        
        const response = await fetch('/api/user-creations');
        
        if (!response.ok) {
          const error = await response.json();
          console.error('Erro na resposta:', error); // Log para debug
          throw new Error(error.error || 'Erro ao carregar criações');
        }
        
        const data = await response.json();
        console.log('Criações carregadas:', data.creations?.length || 0); // Log para debug
        setCreations(data.creations || []);
      } catch (error) {
        console.error('Erro ao carregar criações:', error);
        toast.error('Não foi possível carregar suas criações');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session?.user && !authLoading) {
      fetchCreations();
    }
  }, [session, authLoading]);

  // Filtrar criações com base na aba selecionada
  const filteredCreations = activeTab === "all" 
    ? creations 
    : creations.filter(creation => creation.type === activeTab);

  // Excluir uma criação
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta criação?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/user-creations?id=${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir criação');
      }
      
      setCreations(prev => prev.filter(creation => creation._id !== id));
      toast.success('Criação excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir criação:', error);
      toast.error('Não foi possível excluir a criação');
    }
  };

  // Copiar conteúdo da criação
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => toast.success('Conteúdo copiado para a área de transferência'))
      .catch(() => toast.error('Erro ao copiar o conteúdo'));
  };

  // Download do conteúdo da criação (HTML para landing page, texto para copywriting)
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
        return <Copy className="h-5 w-5 text-blue-500" />;
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
    } catch (error: unknown) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <Link href="/profile" className="flex items-center gap-2 text-primary hover:text-primary/80">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Perfil</span>
          </Link>
          <h1 className="text-xl font-semibold">Minhas Criações</h1>
          <div className="w-20"></div> {/* Para centralizar o título */}
        </div>
      </header>
      
      <main className="container py-8">
        <div className="space-y-6">
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <div className="border-b">
              <TabsList className="mb-2">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="copywriting">Copywriting</TabsTrigger>
                <TabsTrigger value="landing-page">Landing Pages</TabsTrigger>
                <TabsTrigger value="offer">Ofertas</TabsTrigger>
                <TabsTrigger value="creative">Imagens</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="mt-6">
              {renderCreationsList(filteredCreations)}
            </TabsContent>
            
            <TabsContent value="copywriting" className="mt-6">
              {renderCreationsList(filteredCreations)}
            </TabsContent>
            
            <TabsContent value="landing-page" className="mt-6">
              {renderCreationsList(filteredCreations)}
            </TabsContent>
            
            <TabsContent value="offer" className="mt-6">
              {renderCreationsList(filteredCreations)}
            </TabsContent>
            
            <TabsContent value="creative" className="mt-6">
              {renderCreationsList(filteredCreations)}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );

  // Componente interno para renderizar a lista de criações
  function renderCreationsList(items: Creation[]) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando suas criações...</p>
        </div>
      );
    }
    
    if (items.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground mb-4">Você ainda não tem criações deste tipo.</p>
          <Link href="/dashboard">
            <Button>Ir para o Dashboard</Button>
          </Link>
        </div>
      );
    }
    
    return (
      <div className="grid gap-4">
        {items.map(creation => (
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
                
                {creation.type === 'landing-page' && creation.content?.result && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreview(creation.content?.result || '')}
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(creation._id)}
                  className="text-destructive hover:text-destructive"
                  title="Excluir"
                >
                  <Trash className="h-4 w-4" />
                </Button>
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
    );
  }
} 