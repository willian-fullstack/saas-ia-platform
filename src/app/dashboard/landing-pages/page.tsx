"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PlusCircle, Search, FileCode, Calendar, Edit, Trash2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Interface para os dados da landing page
interface LandingPage {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function LandingPagesPage() {
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  // Efeito para buscar landing pages quando o componente é montado ou quando refreshKey muda
  useEffect(() => {
    fetchLandingPages();
    
    // Configurar um intervalo para verificar novas landing pages a cada 10 segundos
    const intervalId = setInterval(() => {
      fetchLandingPages(true);
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [refreshKey]);

  // Função para buscar landing pages
  const fetchLandingPages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      console.log('Buscando landing pages...');
      const response = await fetch(`/api/landing-pages?limit=100&offset=0&timestamp=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar landing pages: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Landing pages recebidas:', data.landingPages?.length || 0);
      
      if (data.landingPages) {
        // Verificar se há novas landing pages
        const currentIds = new Set(landingPages.map(lp => lp.id));
        const newLandingPages = data.landingPages.filter((lp: LandingPage) => !currentIds.has(lp.id));
        
        if (newLandingPages.length > 0 && landingPages.length > 0 && silent) {
          toast.success(`${newLandingPages.length} nova(s) landing page(s) encontrada(s)`);
        }
        
        setLandingPages(data.landingPages);
      } else {
        console.warn('Nenhuma landing page encontrada ou formato de resposta inválido');
        setLandingPages([]);
      }
    } catch (error) {
      console.error('Erro ao buscar landing pages:', error);
      if (!silent) toast.error('Erro ao buscar landing pages');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Função para excluir uma landing page
  const handleDeleteLandingPage = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta landing page?')) {
      try {
        const response = await fetch(`/api/landing-pages/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Landing page excluída com sucesso');
          // Atualizar a lista após excluir
          setLandingPages(landingPages.filter(lp => lp.id !== id));
        } else {
          toast.error('Erro ao excluir landing page');
        }
      } catch (error) {
        console.error('Erro ao excluir landing page:', error);
        toast.error('Erro ao excluir landing page');
      }
    }
  };

  // Filtrar landing pages com base no termo de pesquisa
  const filteredLandingPages = landingPages.filter(lp => 
    lp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    lp.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Função para forçar atualização da lista
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchLandingPages();
    toast.success("Lista de landing pages atualizada");
  };
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Landing Pages</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Link href="/dashboard/landing-pages/deepsite">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Landing Page
            </Button>
          </Link>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Pesquisar landing pages..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de landing pages */}
      {loading && landingPages.length === 0 ? (
        <div className="text-center py-10">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary rounded-full mb-4"></div>
          <p className="text-gray-500">Carregando landing pages...</p>
        </div>
      ) : filteredLandingPages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLandingPages.map((landingPage) => (
            <Card key={landingPage.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{landingPage.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {landingPage.description || "Sem descrição"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Criada em {formatDate(landingPage.createdAt)}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/landing-pages/${landingPage.id}`}>
                    <FileCode className="mr-2 h-4 w-4" />
                    Visualizar
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`/dashboard/landing-pages/${landingPage.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleDeleteLandingPage(landingPage.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-lg bg-gray-50">
          <div className="mb-4">
            <FileCode className="mx-auto h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">Nenhuma landing page encontrada</h3>
          <p className="text-gray-500 mt-2 mb-4">
            {searchTerm 
              ? "Nenhuma landing page corresponde à sua pesquisa." 
              : "Você ainda não criou nenhuma landing page."}
          </p>
          <Link href="/dashboard/landing-pages/deepsite">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Landing Page
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
} 