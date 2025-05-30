"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  PlusCircle, 
  Pencil, 
  Eye, 
  Trash2,
  Image as ImageIcon,
  Code,
  LayoutGrid,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// Componentes principais da página
import LandingPageGenerator from "../../../components/landing-pages/LandingPageGenerator";
import LandingPagesList from "../../../components/landing-pages/LandingPagesList";
import DeepSiteEditor from "../../../components/landing-pages/DeepSiteEditor";
import CopyImporter from "../../../components/landing-pages/CopyImporter";

// Interface da LandingPage
interface LandingPage {
  _id: string;
  title: string;
  description: string;
  html: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Interface para sessões DeepSite
interface DeepSiteSession {
  sessionId: string;
  name: string;
  createdAt: string;
  lastActivity: string;
}

export default function LandingPagesPage() {
  // Estados principais
  const [activeTab, setActiveTab] = useState<string>("list");
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [sessions, setSessions] = useState<DeepSiteSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLandingPage, setSelectedLandingPage] = useState<LandingPage | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string>("");
  const [currentView, setCurrentView] = useState<string>("list");
  const [currentDeepSiteSessionId, setCurrentDeepSiteSessionId] = useState<string | null>(null);
  
  // Carregar landing pages ao iniciar
  useEffect(() => {
    fetchLandingPages();
    fetchDeepSiteSessions();
  }, []);
  
  // Buscar landing pages
  const fetchLandingPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/landing-pages');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar landing pages');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setLandingPages(data.data);
      } else {
        console.error('Resposta da API sem dados:', data);
        setLandingPages([]);
      }
    } catch (error) {
      console.error('Erro ao buscar landing pages:', error);
      toast.error('Erro ao carregar suas landing pages');
      setLandingPages([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Buscar sessões DeepSite
  const fetchDeepSiteSessions = async () => {
    try {
      const response = await fetch('/api/landing-pages/deepsite/sessions');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar sessões DeepSite');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setSessions(data.data);
      } else {
        console.error('Resposta da API de sessões sem dados:', data);
        setSessions([]);
      }
    } catch (error) {
      console.error('Erro ao buscar sessões DeepSite:', error);
      setSessions([]);
    }
  };
  
  // Visualizar uma landing page
  const handleViewLandingPage = (landingPage: LandingPage) => {
    // Abrir em nova janela
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(landingPage.html);
      newWindow.document.close();
    } else {
      toast.error('Não foi possível abrir a visualização. Verifique se o bloqueador de pop-ups está desativado.');
    }
  };
  
  // Função para editar uma landing page com o DeepSite
  const handleEditDeepSite = async (landingPage: LandingPage) => {
    try {
      setLoadingAction(landingPage._id);
      
      // Criar uma nova sessão DeepSite
      const response = await fetch('/api/landing-pages/deepsite/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          landingPageId: landingPage._id,
          sessionName: `Edição de ${landingPage.title}`,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar sessão DeepSite');
      }
      
      const data = await response.json();
      
      if (data.success && data.data.sessionId) {
        // Armazenar o ID da sessão e mudar para o editor
        setCurrentDeepSiteSessionId(data.data.sessionId);
        setCurrentView('deepsite-editor');
        toast.success('Sessão DeepSite iniciada!');
      } else {
        throw new Error(data.message || 'Erro ao iniciar sessão DeepSite');
      }
    } catch (error) {
      console.error('Erro ao iniciar DeepSite:', error);
      toast.error(`Erro ao iniciar editor DeepSite: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingAction('');
    }
  };
  
  // Função para voltar do editor DeepSite para a lista
  const handleBackFromDeepSite = () => {
    setCurrentView('list');
    // Atualizar lista de landing pages e sessões
    fetchLandingPages();
    fetchDeepSiteSessions();
  };
  
  // Excluir uma landing page
  const handleDeleteLandingPage = async (landingPage: LandingPage) => {
    if (!window.confirm(`Tem certeza que deseja excluir a landing page "${landingPage.title}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/landing-pages/${landingPage._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir landing page');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Atualizar lista após exclusão
        await fetchLandingPages();
        toast.success('Landing page excluída com sucesso');
      } else {
        throw new Error(data.message || 'Erro ao excluir landing page');
      }
    } catch (error) {
      console.error('Erro ao excluir landing page:', error);
      toast.error('Erro ao excluir landing page. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para continuar uma sessão DeepSite existente
  const handleContinueSession = (sessionId: string) => {
    setCurrentDeepSiteSessionId(sessionId);
    setCurrentView('deepsite-editor');
  };
  
  // Excluir uma sessão DeepSite
  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta sessão de edição?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/landing-pages/deepsite/sessions?id=${sessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir sessão');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Atualizar lista de sessões
        await fetchDeepSiteSessions();
        
        // Se a sessão excluída for a selecionada, limpar seleção
        if (selectedSessionId === sessionId) {
          setSelectedSessionId(null);
          setActiveTab('list');
        }
        
        toast.success('Sessão excluída com sucesso');
      } else {
        throw new Error(data.message || 'Erro ao excluir sessão');
      }
    } catch (error) {
      console.error('Erro ao excluir sessão:', error);
      toast.error('Erro ao excluir sessão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Callback para quando uma landing page é gerada com sucesso
  const handleLandingPageGenerated = (landingPageId: string) => {
    // Atualizar a lista de landing pages
    fetchLandingPages();
    
    // Voltar para a aba de listagem
    setActiveTab('list');
  };
  
  // Callback para quando uma edição é salva com sucesso
  const handleSaveComplete = () => {
    // Atualizar a lista de landing pages e sessões
    fetchLandingPages();
    fetchDeepSiteSessions();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Landing Pages Avançadas</h1>
        <div className="text-sm text-muted-foreground">
          Crie, edite e gerencie landing pages de alta conversão com assistência de IA.
        </div>
      </div>
      
      {currentView === 'list' && (
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-1">
              <LayoutGrid className="h-4 w-4" />
              <span>Minhas Landing Pages</span>
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              <span>Gerar Nova</span>
            </TabsTrigger>
            <TabsTrigger value="import-copy" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Importar Copy</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <LandingPagesList 
              landingPages={landingPages}
              sessions={sessions}
              onView={handleViewLandingPage}
              onEdit={handleEditDeepSite}
              onDelete={handleDeleteLandingPage}
              onContinueSession={handleContinueSession}
              onDeleteSession={handleDeleteSession}
              isLoading={loading}
            />
          </TabsContent>
          
          <TabsContent value="generator">
            <LandingPageGenerator onSuccess={handleLandingPageGenerated} />
          </TabsContent>
          
          <TabsContent value="import-copy">
            <CopyImporter onSuccess={handleLandingPageGenerated} />
          </TabsContent>
        </Tabs>
      )}
      
      {currentView === 'deepsite-editor' && currentDeepSiteSessionId && (
        <DeepSiteEditor 
          sessionId={currentDeepSiteSessionId} 
          onBack={handleBackFromDeepSite}
          onSaveComplete={() => {
            handleBackFromDeepSite();
            toast.success('Landing page salva com sucesso!');
          }}
        />
      )}
    </div>
  );
} 