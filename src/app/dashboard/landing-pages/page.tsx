"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PlusCircle, Search, FileCode, Calendar, Edit, Trash2 } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Buscar landing pages ao carregar a página
  useEffect(() => {
    fetchLandingPages();
  }, []);

  // Função para buscar landing pages
  const fetchLandingPages = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/landing-pages");
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      setLandingPages(data.landingPages);
    } catch (error) {
      console.error("Erro ao buscar landing pages:", error);
      toast.error("Ocorreu um erro ao carregar as landing pages");
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir landing page
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta landing page?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/landing-pages/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${await response.text()}`);
      }
      
      toast.success("Landing page excluída com sucesso");
      fetchLandingPages();
    } catch (error) {
      console.error("Erro ao excluir landing page:", error);
      toast.error("Ocorreu um erro ao excluir a landing page");
    }
  };

  // Filtrar landing pages pelo termo de busca
  const filteredLandingPages = landingPages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Landing Pages</h1>
          <p className="text-gray-500">
            Gerencie suas landing pages criadas com IA
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/landing-pages/deepsite")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Landing Page
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar landing pages..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-opacity-50 border-t-blue-500 rounded-full"></div>
        </div>
      ) : filteredLandingPages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLandingPages.map((page) => (
            <Card key={page.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{page.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {page.description || "Sem descrição"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Criado em {formatDate(page.createdAt)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/landing-pages/${page.id}`)}
                >
                  <FileCode className="mr-2 h-4 w-4" />
                  Visualizar
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/landing-pages/edit/${page.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(page.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FileCode className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Nenhuma landing page encontrada</h3>
          <p className="mt-2 text-gray-500">
            {searchQuery
              ? "Não encontramos landing pages correspondentes à sua busca."
              : "Você ainda não criou nenhuma landing page. Clique no botão acima para criar uma."}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSearchQuery("")}
            >
              Limpar busca
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 