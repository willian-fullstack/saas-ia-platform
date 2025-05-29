"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Edit, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

// Interface para os dados da landing page
interface LandingPage {
  id: string;
  title: string;
  description: string;
  html: string;
  createdAt: string;
  updatedAt: string;
}

export default function LandingPageViewPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados da landing page
  useEffect(() => {
    async function fetchLandingPage() {
      try {
        setLoading(true);
        const response = await fetch(`/api/landing-pages/${id}`);
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar landing page: ${response.status}`);
        }
        
        const data = await response.json();
        setLandingPage(data.landingPage);
      } catch (error) {
        console.error('Erro ao buscar landing page:', error);
        setError('Não foi possível carregar a landing page');
        toast.error('Erro ao carregar landing page');
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchLandingPage();
    }
  }, [id]);

  // Função para excluir a landing page
  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta landing page?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/landing-pages/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao excluir landing page: ${response.status}`);
      }
      
      toast.success('Landing page excluída com sucesso');
      router.push('/dashboard/landing-pages');
    } catch (error) {
      console.error('Erro ao excluir landing page:', error);
      toast.error('Erro ao excluir landing page');
    }
  };

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

  // Renderizar iframe com o conteúdo HTML da landing page
  const renderLandingPage = () => {
    if (!landingPage?.html) return null;
    
    return (
      <iframe
        srcDoc={landingPage.html}
        className="w-full border rounded-lg"
        style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
        title={landingPage.title}
      />
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Barra de navegação superior */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold ml-2">
            {loading ? 'Carregando...' : landingPage?.title || 'Landing Page'}
          </h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/landing-pages/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
            Excluir
          </Button>
          {landingPage && (
            <Button variant="default" size="sm" asChild>
              <Link href={`/landing-pages/${id}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Visualizar Publicada
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Detalhes da landing page */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-50 border-t-primary rounded-full"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/landing-pages')}>
            Voltar para a lista
          </Button>
        </div>
      ) : landingPage ? (
        <div>
          {/* Metadados da landing page */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700">Descrição</h3>
                <p className="text-gray-600">{landingPage.description || 'Sem descrição'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Datas</h3>
                <p className="text-gray-600">
                  <span className="block">Criada em: {formatDate(landingPage.createdAt)}</span>
                  <span className="block">Atualizada em: {formatDate(landingPage.updatedAt)}</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Visualização da landing page */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-2 border-b flex justify-between items-center">
              <span className="font-medium">Visualização</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/landing-pages/${id}`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir em nova aba
                </Link>
              </Button>
            </div>
            {renderLandingPage()}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
          Landing page não encontrada.
        </div>
      )}
    </div>
  );
} 